import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import { User, IUser } from '@/modules/users/models/User';
import { AppError } from '@/common/errors/AppError';
import { TokenService } from './token.service';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export class AuthService {
  static async register(userData: Partial<IUser>) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('User already exists with this email', StatusCodes.CONFLICT);
    }

    const user = await User.create(userData);
    
    // Don't include password in response
    const userResponse = user.toObject();
    delete userResponse.password;

    const tokens = TokenService.generateTokens({ userId: user._id.toString(), role: user.role });
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    user.refreshToken = hashToken(tokens.refreshToken);
    user.emailVerificationToken = hashToken(emailVerificationToken);
    await user.save();

    return { user: userResponse, emailVerificationToken, ...tokens };
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
    }

    const tokens = TokenService.generateTokens({ userId: user._id.toString(), role: user.role });

    user.refreshToken = hashToken(tokens.refreshToken);
    user.lastLogin = new Date();
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return { user: userResponse, ...tokens };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = TokenService.verifyRefreshToken(token) as { userId: string; role: string };
      const user = await User.findById(decoded.userId).select('+refreshToken');

      if (!user || user.refreshToken !== hashToken(token)) {
        throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
      }

      const tokens = TokenService.generateTokens({ userId: user._id.toString(), role: user.role });
      
      user.refreshToken = hashToken(tokens.refreshToken);
      await user.save();

      return tokens;
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
    }
  }

  static async logout(refreshToken?: string) {
    if (!refreshToken) return;

    await User.findOneAndUpdate(
      { refreshToken: hashToken(refreshToken) },
      { refreshToken: null },
    ).select('+refreshToken');
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
    if (!user) return null;

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    return { resetToken };
  }

  static async resetPassword(token: string, password: string) {
    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) throw new AppError('Invalid or expired reset token', StatusCodes.BAD_REQUEST);

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;
    await user.save();
  }

  static async verifyEmail(token: string) {
    const user = await User.findOne({ emailVerificationToken: hashToken(token) }).select('+emailVerificationToken');
    if (!user) throw new AppError('Invalid verification token', StatusCodes.BAD_REQUEST);

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
  }
}

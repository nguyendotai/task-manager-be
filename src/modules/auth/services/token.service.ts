import jwt from 'jsonwebtoken';
import { env } from '@/configs/env';

export class TokenService {
  static generateTokens(payload: { userId: string; role: string }) {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  }

  static verifyRefreshToken(token: string) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  }
}

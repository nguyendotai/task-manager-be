import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { AuthService } from '../services/auth.service';
import { env } from '@/configs/env';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    
    // Set cookie for refresh token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendSuccess(res, 'User registered successfully', {
      user: result.user,
      accessToken: result.accessToken,
      emailVerificationToken: result.emailVerificationToken,
    }, StatusCodes.CREATED);
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendSuccess(res, 'Login successful', {
      user: result.user,
      accessToken: result.accessToken,
    });
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    const tokens = await AuthService.refreshToken(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, 'Token refreshed successfully', {
      accessToken: tokens.accessToken,
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    await AuthService.logout(refreshToken);
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
    });
    return sendSuccess(res, 'Logout successful');
  });

  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.forgotPassword(req.body.email);
    return sendSuccess(res, 'If the email exists, a reset token has been created', result);
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await AuthService.resetPassword(req.body.token, req.body.password);
    return sendSuccess(res, 'Password reset successfully');
  });

  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    await AuthService.verifyEmail(req.body.token);
    return sendSuccess(res, 'Email verified successfully');
  });
}

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '@/common/middlewares/validate';
import { rateLimit } from '@/common/middlewares/rateLimit';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../schemas/auth.schema';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh-token', authLimiter, validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/logout', AuthController.logout);

export default router;

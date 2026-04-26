import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const loginLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  max: config.rateLimit.loginMax,
  message: {
    error: { code: 'RATE_LIMITED', message: '登录请求过于频繁，请稍后再试' },
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' },
  },
});

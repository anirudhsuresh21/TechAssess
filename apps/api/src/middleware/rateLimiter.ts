import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes',
  },
});

export const attemptLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120, // allows frequent autosaves
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many submission requests. Please wait a moment.',
  },
});

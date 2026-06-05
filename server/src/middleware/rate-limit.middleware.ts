import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10_000 : 1_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export const aiParserRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 1_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI parser rate limit exceeded.' },
});

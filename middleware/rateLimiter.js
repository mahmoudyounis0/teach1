import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  // windowMs: 5 * 60 * 1000, // 5 minutes
  // max: 5, // limit each IP to 5 requests per windowMs
  // message: 'Too many attempts, please try again later',
  // skipSuccessfulRequests: false
});

export const verificationLimiter = rateLimit({
  // windowMs: 30 * 60 * 1000, // 0.5 hour
  // max: 3, // limit each IP to 3 verification attempts per hour
  // message: 'Too many verification attempts'
});
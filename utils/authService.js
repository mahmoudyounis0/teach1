import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token, isRefresh = false) => {
  try {
    return jwt.verify(
      token,
      isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET
    );
  } catch (error) {
    return null;
  }
};
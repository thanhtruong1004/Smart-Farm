import jwt from 'jwt-simple';
import dotenv from 'dotenv';

dotenv.config()


export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.decode(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  if (req.user.user_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};
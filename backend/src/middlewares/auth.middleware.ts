import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../shared/errors';
import { UserPayload } from '../shared/types/auth.types';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed authorization token');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret) as any;
    
    // Mapping from JWT fields (sub, client_id, role) to our internal payload
    req.user = {
      id: payload.sub as string,
      clientId: payload.client_id as string,
      role: payload.role as any
    };

    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

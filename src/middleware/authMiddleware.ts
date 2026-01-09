// src/middleware/authMiddleware.ts
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export const ALL_ROLES = ['admin', 'doctor', 'owner', 'creator'] as const;
export type UserRole = (typeof ALL_ROLES)[number];

type JwtPayload = {
  userId: number;
  role: string;
  ownerId?: number | null;
  doctorId?: number | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { role: UserRole };
    }
  }
}

function isUserRole(v: string): v is UserRole {
  return (ALL_ROLES as readonly string[]).includes(v);
}

export const authMiddleware = (allowedRoles: readonly UserRole[]): RequestHandler => {
  return (req, res, next) => {
    const raw = String(req.headers.authorization ?? '');
    const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: no token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      const roleRaw = String(decoded.role ?? '').toLowerCase();
      if (!isUserRole(roleRaw)) {
        return res.status(403).json({
          message: 'Forbidden: invalid role',
          role: roleRaw,
          allowed: allowedRoles,
        });
      }

      const allowed = allowedRoles.map((r) => r.toLowerCase());

      console.log('[AUTH]', { role: roleRaw, allowed, userId: decoded.userId });

      if (!allowed.includes(roleRaw)) {
        return res.status(403).json({
          message: 'Forbidden: role not allowed',
          role: roleRaw,
          allowed,
        });
      }

      req.user = { ...decoded, role: roleRaw };
      return next();
    } catch {
      return res.status(401).json({ message: 'Unauthorized: bad token' });
    }
  };
};

// src/routes/auth.routes.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import { getRepository } from 'typeorm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { UserAccount } from '../entities/userAccount.entity';
import type { UserRole } from '../middleware/authMiddleware';

const router = Router();

type JwtPayload = {
  userId: number;
  role: UserRole | string;
  ownerId?: number | null;
  doctorId?: number | null;
};

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function extractBearerToken(req: Request): string | null {
  const raw = String(req.headers.authorization ?? '');
  if (!raw) return null;
  if (!raw.toLowerCase().startsWith('bearer ')) return null;
  const t = raw.slice(7).trim();
  return t || null;
}

function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  return jwt.sign(
    {
      userId: payload.userId,
      role: String(payload.role).toLowerCase(),
      ownerId: payload.ownerId ?? null,
      doctorId: payload.doctorId ?? null,
    },
    secret,
    { expiresIn: '7d' },
  );
}

function toUserDto(u: UserAccount) {
  return {
    id: u.id,
    email: u.email,
    role: String((u as any).role ?? '').toLowerCase(),
    ownerId: (u as any).ownerId ?? null,
    doctorId: (u as any).doctorId ?? null,
    mustChangePassword: Boolean((u as any).mustChangePassword),
  };
}


router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!email) {
        res.status(400).json({ message: 'email is required' });
        return;
      }


      const userRepo = getRepository(UserAccount);
      const user = await userRepo.findOne({ where: { email } });

      if (!user) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const mustChangePassword = Boolean((user as any).mustChangePassword);
      const hash = (user as any).passwordHash as string | null;


      if (!hash) {
        if (!mustChangePassword) {

          (user as any).mustChangePassword = true;
          await userRepo.save(user);
        }

        const token = signToken({
          userId: user.id,
          role: (user as any).role,
          ownerId: (user as any).ownerId ?? null,
          doctorId: (user as any).doctorId ?? null,
        });

        res.json({
          token,
          user: toUserDto(user),
          mustChangePassword: true,
        });
        return;
      }


      const ok = await bcrypt.compare(password, hash);
      if (!ok) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const token = signToken({
        userId: user.id,
        role: (user as any).role,
        ownerId: (user as any).ownerId ?? null,
        doctorId: (user as any).doctorId ?? null,
      });

      res.json({
        token,
        user: toUserDto(user),
        mustChangePassword,
      });
      return;
    } catch (err) {
      next(err);
      return;
    }
  },
);


router.post(
  '/set-password',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newPassword =
        typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

      if (!newPassword || newPassword.trim().length < 6) {
        res.status(400).json({ message: 'newPassword must be at least 6 chars' });
        return;
      }


      const tokenFromHeader = extractBearerToken(req);
      const tokenFromBody = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
      const token = tokenFromHeader ?? (tokenFromBody || null);

      if (!token) {
        res.status(401).json({ message: 'Unauthorized: no token' });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ message: 'JWT_SECRET is not set' });
        return;
      }

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, secret) as JwtPayload;
      } catch {
        res.status(401).json({ message: 'Unauthorized: bad token' });
        return;
      }

      const userId = Number((decoded as any)?.userId ?? NaN);
      if (!Number.isFinite(userId) || userId <= 0) {
        res.status(400).json({ message: 'Bad token payload: userId missing' });
        return;
      }

      const userRepo = getRepository(UserAccount);
      const user = await userRepo.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }


      const hash = await bcrypt.hash(newPassword.trim(), 10);
      (user as any).passwordHash = hash;
      (user as any).mustChangePassword = false;

      await userRepo.save(user);


      const newToken = signToken({
        userId: user.id,
        role: (user as any).role,
        ownerId: (user as any).ownerId ?? null,
        doctorId: (user as any).doctorId ?? null,
      });

      res.json({
        token: newToken,
        user: toUserDto(user),
        mustChangePassword: false,
      });
      return;
    } catch (err) {
      next(err);
      return;
    }
  },
);

export default router;

import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error('Global error handler >>>', err);

  const rawStatus =
    (err && (err.statusCode ?? err.status ?? err.httpCode)) ?? 500;

  const status =
    typeof rawStatus === 'number' &&
    rawStatus >= 400 &&
    rawStatus <= 599
      ? rawStatus
      : 500;

  return res.status(status).json({
    message: err?.message ?? 'Internal Server Error',
  });
};

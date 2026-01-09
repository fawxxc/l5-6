// src/routes/employee.routes.ts
import { Router, type NextFunction, type Request, type Response } from 'express';
import { getRepository } from 'typeorm';
import { Employee } from '../entities/employee.entity';

const router = Router();

type CreateEmployeeBody = {
  fullName?: string;
  full_name?: string;

  phone?: string;

  address?: string | null;
  education?: string | null;

  email?: string;
  password?: string;

  role?: string;

  isactive?: boolean;
  isActive?: boolean;

  must_change_password?: boolean;
  mustChangePassword?: boolean;
};

async function hashPassword(password: string): Promise<string> {
  const rounds = 10;


  const bcryptjs = (() => {
    try {
      return require('bcryptjs');
    } catch {
      return null;
    }
  })();


  const bcrypt = bcryptjs ?? (() => {
    try {
      return require('bcrypt');
    } catch {
      return null;
    }
  })();

  if (!bcrypt) {
    throw new Error('bcryptjs/bcrypt не встановлено. Встанови npm i bcryptjs (або bcrypt).');
  }

  const fn: unknown = bcrypt.hash ?? bcrypt.default?.hash;
  if (typeof fn !== 'function') {
    throw new Error('Не знайдено bcrypt hash()');
  }

  return await (fn as (p: string, r: number) => Promise<string>)(password, rounds);
}


router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const repo = getRepository(Employee);

    const roleRaw = req.query.role;
    const role =
      typeof roleRaw === 'string'
        ? roleRaw.trim()
        : Array.isArray(roleRaw) && typeof roleRaw[0] === 'string'
          ? roleRaw[0].trim()
          : '';

    const employees = role ? await repo.find({ where: { role } }) : await repo.find();
    res.json(employees);
  } catch (err) {
    next(err);
  }
});


router.get('/doctors', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const repo = getRepository(Employee);
    const doctors = await repo.find({ where: { role: 'doctor' } });
    res.json(doctors);
  } catch (err) {
    next(err);
  }
});


router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = (req.body ?? {}) as CreateEmployeeBody;

    const fullName = String(body.fullName ?? body.full_name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    const address =
      typeof body.address === 'string' && body.address.trim() ? body.address.trim() : null;
    const education =
      typeof body.education === 'string' && body.education.trim() ? body.education.trim() : null;

    const role = String(body.role ?? 'doctor').trim() || 'doctor';

    const isactive =
      typeof body.isactive === 'boolean'
        ? body.isactive
        : typeof body.isActive === 'boolean'
          ? body.isActive
          : true;

    const mustChangePassword =
      typeof body.must_change_password === 'boolean'
        ? body.must_change_password
        : typeof body.mustChangePassword === 'boolean'
          ? body.mustChangePassword
          : false;

    if (!fullName) {
      res.status(400).json({ message: 'fullName is required' });
      return;
    }
    if (!phone) {
      res.status(400).json({ message: 'phone is required' });
      return;
    }
    if (!email) {
      res.status(400).json({ message: 'email is required' });
      return;
    }
    if (!password) {
      res.status(400).json({ message: 'password is required' });
      return;
    }

    const repo = getRepository(Employee);

    const created = await repo.manager.transaction(async (manager) => {

      const existing = await manager.query(
        'SELECT id FROM public.user_accounts WHERE email = $1 LIMIT 1',
        [email],
      );

      if (Array.isArray(existing) && existing.length > 0) {
        const err: any = new Error('Email already exists');
        err.status = 409;
        throw err;
      }


      const empRepo = manager.getRepository(Employee);

      const employee: Employee = empRepo.create({
        fullName,
        phone,
        address,
        education,
        role,
        isactive,
      });

      const savedEmployee: Employee = await empRepo.save(employee);


      const passwordHash = await hashPassword(password);

      const uaRows = await manager.query(
        `
        INSERT INTO public.user_accounts (email, password_hash, role, owner_id, doctor_id, must_change_password)
        VALUES ($1, $2, $3, NULL, $4, $5)
        RETURNING id, email, role, doctor_id, must_change_password
        `,
        [email, passwordHash, role, savedEmployee.id, mustChangePassword],
      );

      const account = Array.isArray(uaRows) && uaRows.length > 0 ? uaRows[0] : null;

      return { employee: savedEmployee, account };
    });

    res.status(201).json(created);
  } catch (err: any) {
    if (err?.status === 409) {
      res.status(409).json({ message: 'Такий email вже існує у user_accounts' });
      return;
    }
    next(err);
  }
});


router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Invalid employee id' });
      return;
    }

    const repo = getRepository(Employee);

    const existing = await repo.findOne({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    await repo.manager.transaction(async (manager) => {

      await manager.query('DELETE FROM public.user_accounts WHERE doctor_id = $1', [id]);


      const apptRows: Array<{ id: number }> = await manager.query(
        'SELECT id FROM public.appointments WHERE employee_id = $1',
        [id],
      );
      const apptIds = apptRows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n));


      if (apptIds.length > 0) {
        await manager.query(
          'DELETE FROM public.payments WHERE appointment_id = ANY($1::int[])',
          [apptIds],
        );
      }


      await manager.query('DELETE FROM public.appointments WHERE employee_id = $1', [id]);


      await manager.getRepository(Employee).delete(id);
    });

    res.status(204).send();
  } catch (err: any) {

    if (err?.code === '23503' || err?.driverError?.code === '23503') {
      res.status(409).json({
        message:
          'Не можна видалити doctor: залишилися пов’язані записи (FK). Перевір додаткові зв’язки у БД.',
      });
      return;
    }
    next(err);
  }
});

export default router;

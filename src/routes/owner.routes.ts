
import { Router, type Request, type Response, type NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { Owner } from '../entities/owner.entity';
import { UserAccount, type UserRole } from '../entities/userAccount.entity';

const router = Router();


router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerRepo = getRepository(Owner);
    const owners = await ownerRepo.find();
    res.json(owners);
  } catch (err) {
    next(err);
  }
});


router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, phone, address } = req.body as {
      fullName?: string;
      email?: string;
      phone?: string;
      address?: string;
    };

    const ownerRepo = getRepository(Owner);

    const owner = ownerRepo.create({
      full_name: fullName,
      email,
      phone,
      address,
    });

    const savedOwner = await ownerRepo.save(owner);

    const actorRole = String((req as any)?.user?.role ?? '').toLowerCase();
    const isCreator = actorRole === 'creator';

    if (email) {
      const userRepo = getRepository(UserAccount);
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await userRepo.findOne({
        where: { email: normalizedEmail },
      });

      if (!existingUser) {
        const newUser = userRepo.create({
          email: normalizedEmail,
          passwordHash: null,
          role: 'owner' as UserRole,
          ownerId: savedOwner.id,
          doctorId: null,
          mustChangePassword: isCreator ? true : true,
        });

        await userRepo.save(newUser);
      } else {
        let changed = false;

        if (existingUser.ownerId == null) {
          existingUser.ownerId = savedOwner.id;
          changed = true;
        }

        if (isCreator && existingUser.mustChangePassword !== true) {
          existingUser.mustChangePassword = true;
          changed = true;
        }

        if (changed) {
          await userRepo.save(existingUser);
        }
      }
    }

    res.status(201).json(savedOwner);
  } catch (err) {
    next(err);
  }
});


router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Invalid owner id' });
      return;
    }

    const ownerRepo = getRepository(Owner);

    const existing = await ownerRepo.findOne({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Owner not found' });
      return;
    }

    await ownerRepo.manager.transaction(async (manager) => {

      await manager.query('DELETE FROM public.user_accounts WHERE owner_id = $1', [id]);


      const petRows: Array<{ id: number }> = await manager.query(
        'SELECT id FROM public.pets WHERE owner_id = $1',
        [id],
      );
      const petIds = petRows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n));

      if (petIds.length > 0) {

        const apptRows: Array<{ id: number }> = await manager.query(
          'SELECT id FROM public.appointments WHERE pet_id = ANY($1::int[])',
          [petIds],
        );
        const apptIds = apptRows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n));


        if (apptIds.length > 0) {
          await manager.query(
            'DELETE FROM public.payments WHERE appointment_id = ANY($1::int[])',
            [apptIds],
          );


          await manager.query('DELETE FROM public.appointments WHERE id = ANY($1::int[])', [apptIds]);
        }


        const vaccRows: Array<{ id: number }> = await manager.query(
          'SELECT id FROM public.vaccinations WHERE animal_id = ANY($1::int[])',
          [petIds],
        );
        const vaccIds = vaccRows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n));


        if (vaccIds.length > 0) {
          await manager.query(
            'DELETE FROM public.animal_vaccination WHERE vaccination_id = ANY($1::int[])',
            [vaccIds],
          );
        }
        await manager.query('DELETE FROM public.animal_vaccination WHERE animal_id = ANY($1::int[])', [petIds]);


        await manager.query('DELETE FROM public.vaccinations WHERE animal_id = ANY($1::int[])', [petIds]);


        await manager.query('DELETE FROM public.pets WHERE id = ANY($1::int[])', [petIds]);
      }


      await manager.getRepository(Owner).delete(id);
    });

    res.status(204).send();
  } catch (err: any) {
    if (err?.code === '23503' || err?.driverError?.code === '23503') {
      res.status(409).json({
        message:
          'Не можна видалити owner: залишилися пов’язані записи (FK). Перевір додаткові зв’язки у БД.',
      });
      return;
    }
    next(err);
  }
});

export default router;

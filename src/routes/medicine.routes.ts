// src/routes/medicine.routes.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import { dbCreateConnection } from '../orm/dbCreateConnection';
import { Medicine } from '../entities/medicine.entity';
import { MedicineRequest } from '../entities/medicine-request.entity';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();


router.get(
  '/medicines',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conn = await dbCreateConnection();
      if (!conn) {
        res.status(500).json({ message: 'DB connection not available' });
        return;
      }

      const medicineRepo = conn.getRepository(Medicine);
      const meds = await medicineRepo.find();

      res.json(meds);
      return;
    } catch (err) {
      next(err as Error);
      return;
    }
  },
);


router.get(
  '/medicines/requests',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conn = await dbCreateConnection();
      if (!conn) {
        res.status(500).json({ message: 'DB connection not available' });
        return;
      }

      const requestRepo = conn.getRepository(MedicineRequest);
      const requests = await requestRepo.find({
        relations: ['medicine'],
        order: { createdAt: 'DESC' },
      });

      res.json(
        requests.map((r) => ({
          id: r.id,
          vaccineType: r.vaccineType,
          quantity: r.quantity,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
          deliveredQuantity: r.deliveredQuantity,
          isPaid: r.isPaid,
          medicine: r.medicine
            ? {
                id: r.medicine.id,
                name: r.medicine.name,
                stock: r.medicine.stock,
                unit: r.medicine.unit,
              }
            : null,
        })),
      );
      return;
    } catch (err) {
      next(err as Error);
      return;
    }
  },
);


router.delete(
  '/medicines/requests',
  authMiddleware(['admin', 'creator']),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conn = await dbCreateConnection();
      if (!conn) {
        res.status(500).json({ message: 'DB connection not available' });
        return;
      }

      const requestRepo = conn.getRepository(MedicineRequest);


      await requestRepo.createQueryBuilder().delete().from(MedicineRequest).execute();

      res.status(204).send();
      return;
    } catch (err) {
      next(err as Error);
      return;
    }
  },
);


router.post(
  '/medicines/requests',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vaccineType, quantity, reason } = req.body ?? {};

      if (
        !vaccineType ||
        typeof vaccineType !== 'string' ||
        quantity == null ||
        Number.isNaN(Number(quantity))
      ) {
        res.status(400).json({
          message: 'Поля vaccineType (рядок) і quantity (число) є обовʼязковими',
        });
        return;
      }

      const qty = Number(quantity);

      const conn = await dbCreateConnection();
      if (!conn) {
        res.status(500).json({ message: 'DB connection not available' });
        return;
      }

      const medicineRepo = conn.getRepository(Medicine);
      const requestRepo = conn.getRepository(MedicineRequest);


      let medicine = await medicineRepo.findOne({
        where: { name: vaccineType },
      });

      if (!medicine) {
        medicine = medicineRepo.create({
          name: vaccineType,
          stock: 0,
          unit: 'доза',
        });
        await medicineRepo.save(medicine);
      }

      const reqEntity = requestRepo.create({
        vaccineType,
        quantity: qty,
        reason: reason ?? '',
        status: 'pending',
        medicine,
      });

      await requestRepo.save(reqEntity);

      res.status(201).json({
        id: reqEntity.id,
        vaccineType: reqEntity.vaccineType,
        quantity: reqEntity.quantity,
        reason: reqEntity.reason,
        status: reqEntity.status,
        createdAt: reqEntity.createdAt,
        deliveredQuantity: reqEntity.deliveredQuantity,
        isPaid: reqEntity.isPaid,
        medicine: {
          id: medicine.id,
          name: medicine.name,
          stock: medicine.stock,
          unit: medicine.unit,
        },
      });
      return;
    } catch (err) {
      next(err as Error);
      return;
    }
  },
);


router.post(
  '/medicines/requests/:id/approve',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = Number(req.params.id);
      const deliveredQuantity = Number(req.body?.deliveredQuantity);

      if (Number.isNaN(requestId)) {
        res.status(400).json({ message: 'Некоректний id запиту' });
        return;
      }

      if (Number.isNaN(deliveredQuantity) || deliveredQuantity <= 0) {
        res.status(400).json({ message: 'Некоректна кількість поставки' });
        return;
      }

      const conn = await dbCreateConnection();
      if (!conn) {
        res.status(500).json({ message: 'DB connection not available' });
        return;
      }

      const requestRepo = conn.getRepository(MedicineRequest);
      const medicineRepo = conn.getRepository(Medicine);

      const reqEntity = await requestRepo.findOne({
        where: { id: requestId },
        relations: ['medicine'],
      });

      if (!reqEntity) {
        res.status(404).json({ message: 'Запит не знайдено' });
        return;
      }

      // страховка: якщо чомусь немає medicine
      if (!reqEntity.medicine) {
        let medicine = await medicineRepo.findOne({
          where: { name: reqEntity.vaccineType },
        });

        if (!medicine) {
          medicine = medicineRepo.create({
            name: reqEntity.vaccineType,
            stock: 0,
            unit: 'доза',
          });
          await medicineRepo.save(medicine);
        }

        reqEntity.medicine = medicine;
      }

      reqEntity.medicine.stock = (reqEntity.medicine.stock ?? 0) + deliveredQuantity;
      await medicineRepo.save(reqEntity.medicine);

      reqEntity.deliveredQuantity = deliveredQuantity;
      reqEntity.status = 'approved';
      await requestRepo.save(reqEntity);

      res.json({
        id: reqEntity.id,
        vaccineType: reqEntity.vaccineType,
        quantity: reqEntity.quantity,
        reason: reqEntity.reason,
        status: reqEntity.status,
        createdAt: reqEntity.createdAt,
        deliveredQuantity: reqEntity.deliveredQuantity,
        isPaid: reqEntity.isPaid,
        medicine: {
          id: reqEntity.medicine.id,
          name: reqEntity.medicine.name,
          stock: reqEntity.medicine.stock,
          unit: reqEntity.medicine.unit,
        },
      });
      return;
    } catch (err) {
      next(err as Error);
      return;
    }
  },
);


router.post(
  '/medicines/requests/:id/pay',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = Number(req.params.id);

      if (Number.isNaN(requestId)) {
        res.status(400).json({ message: 'Некоректний id запиту' });
        return;
      }

      const conn = await dbCreateConnection();
      if (!conn) {
        res.status(500).json({ message: 'DB connection not available' });
        return;
      }

      const requestRepo = conn.getRepository(MedicineRequest);

      const reqEntity = await requestRepo.findOne({
        where: { id: requestId },
        relations: ['medicine'],
      });

      if (!reqEntity) {
        res.status(404).json({ message: 'Запит не знайдено' });
        return;
      }

      reqEntity.status = 'paid';
      reqEntity.isPaid = true;
      await requestRepo.save(reqEntity);

      res.json({
        id: reqEntity.id,
        vaccineType: reqEntity.vaccineType,
        quantity: reqEntity.quantity,
        reason: reqEntity.reason,
        status: reqEntity.status,
        createdAt: reqEntity.createdAt,
        deliveredQuantity: reqEntity.deliveredQuantity,
        isPaid: reqEntity.isPaid,
        medicine: reqEntity.medicine
          ? {
              id: reqEntity.medicine.id,
              name: reqEntity.medicine.name,
              stock: reqEntity.medicine.stock,
              unit: reqEntity.medicine.unit,
            }
          : null,
      });
      return;
    } catch (err) {
      next(err as Error);
      return;
    }
  },
);

export default router;

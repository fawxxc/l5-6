// src/routes/vaccination.routes.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import { dbCreateConnection } from '../orm/dbCreateConnection';
import { Pet } from '../entities/pet.entity';
import { Vaccination } from '../entities/vaccination.entity';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();


router.delete(
  '/requests',
  authMiddleware(['admin', 'creator']),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const conn = await dbCreateConnection();


      await conn.query('TRUNCATE TABLE public.vaccinations RESTART IDENTITY CASCADE');

      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },
);


router.get('/animal/:animalId', async (req, res, next) => {
  try {
    const animalId = Number(req.params.animalId);

    if (Number.isNaN(animalId)) {
      return res.status(400).json({ message: 'Некоректний параметр animalId' });
    }

    const conn = await dbCreateConnection();
    const vaccinationRepo = conn.getRepository(Vaccination);

    const vaccinations = await vaccinationRepo.find({
      where: { animalId },
      order: { id: 'DESC' },
    });

    return res.json(vaccinations);
  } catch (err) {
    return next(err);
  }
});


router.post('/', async (req, res, next) => {
  try {
    const body = req.body as {
      petId?: number;
      vaccines?: {
        type?: string;
        date?: string;
        description?: string;
      }[];
    };

    const { petId, vaccines } = body;

    if (!petId || !Array.isArray(vaccines) || vaccines.length === 0) {
      return res.status(400).json({
        message: 'petId та масив vaccines є обовʼязковими',
      });
    }

    const conn = await dbCreateConnection();
    const petRepo = conn.getRepository(Pet);
    const vaccinationRepo = conn.getRepository(Vaccination);

    const pet = await petRepo.findOne({ where: { id: petId } });

    if (!pet) {
      return res.status(404).json({
        message: 'Тварину з таким petId не знайдено',
      });
    }

    const entities = vaccines
      .filter((v) => v.type)
      .map((v) =>
        vaccinationRepo.create({
          type: v.type!,
          description: v.date ?? v.description ?? null,
          animalId: pet.id,
          animal: pet,
        }),
      );

    if (entities.length === 0) {
      return res.status(400).json({
        message: 'Немає коректних записів щеплень для збереження',
      });
    }

    const saved = await vaccinationRepo.save(entities);

    return res.status(201).json(saved);
  } catch (err) {
    return next(err);
  }
});

export default router;

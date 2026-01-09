// src/routes/pet.routes.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { Pet } from '../entities/pet.entity';
import { UserAccount } from '../entities/userAccount.entity';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();


router.get(
  '/',
  authMiddleware(['admin', 'doctor', 'owner', 'creator']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petRepo = getRepository(Pet);

      const role = String(req.user?.role ?? '').toLowerCase();

      if (role !== 'owner') {
        const pets = await petRepo
          .createQueryBuilder('pet')
          .leftJoinAndSelect('pet.owner', 'owner')
          .getMany();

        res.json(pets);
        return;
      }


      const userId = Number((req.user as any)?.userId ?? NaN);
      let ownerId = Number((req.user as any)?.ownerId ?? NaN);


      if (!Number.isFinite(ownerId) || ownerId <= 0) {
        if (!Number.isFinite(userId) || userId <= 0) {
          res.status(403).json({ message: 'Forbidden: ownerId missing in token' });
          return;
        }

        const userRepo = getRepository(UserAccount);
        const u = await userRepo.findOne({ where: { id: userId } });

        ownerId = Number((u as any)?.ownerId ?? NaN);
      }

      if (!Number.isFinite(ownerId) || ownerId <= 0) {
        res.status(403).json({ message: 'Forbidden: ownerId missing (not linked to owner)' });
        return;
      }


      let pets = await petRepo
        .createQueryBuilder('pet')
        .leftJoinAndSelect('pet.owner', 'owner')
        .where('pet.owner_id = :ownerId', { ownerId })
        .getMany();


      if (
        pets.length === 0 &&
        Number.isFinite(userId) &&
        userId > 0 &&
        userId !== ownerId
      ) {
        const legacyPets = await petRepo
          .createQueryBuilder('pet')
          .where('pet.owner_id = :legacyOwnerId', { legacyOwnerId: userId })
          .getMany();

        if (legacyPets.length > 0) {

          await petRepo
            .createQueryBuilder()
            .update(Pet)
            .set({ ownerId })
            .where('owner_id = :legacyOwnerId', { legacyOwnerId: userId })
            .execute();


          pets = await petRepo
            .createQueryBuilder('pet')
            .leftJoinAndSelect('pet.owner', 'owner')
            .where('pet.owner_id = :ownerId', { ownerId })
            .getMany();
        }
      }

      res.json(pets);
      return;
    } catch (err) {
      next(err);
      return;
    }
  },
);


router.post(
  '/',
  authMiddleware(['admin', 'doctor', 'creator']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, age, weight, breed, gender, ownerId } = req.body ?? {};

      const safeName = typeof name === 'string' ? name.trim() : '';
      const safeOwnerId = Number(ownerId);

      if (!safeName) {
        res.status(400).json({ message: 'name is required' });
        return;
      }

      if (!Number.isFinite(safeOwnerId) || safeOwnerId <= 0) {
        res.status(400).json({ message: 'ownerId is required' });
        return;
      }


      const safeBreed =
        typeof breed === 'string' && breed.trim() ? breed.trim() : 'other';
      const safeGender =
        typeof gender === 'string' && gender.trim() ? gender.trim() : 'unknown';

      const nAge = age == null || age === '' ? NaN : Number(age);
      const nWeight = weight == null || weight === '' ? NaN : Number(weight);

      const safeAge = Number.isFinite(nAge) ? nAge : 0;
      const safeWeight = Number.isFinite(nWeight) ? nWeight : 0;

      const petRepo = getRepository(Pet);

      const pet = petRepo.create({
        name: safeName,
        age: safeAge,
        weight: safeWeight,
        breed: safeBreed,
        gender: safeGender,
        ownerId: safeOwnerId,
      });

      const saved = await petRepo.save(pet);
      res.status(201).json(saved);
      return;
    } catch (err) {
      next(err);
      return;
    }
  },
);

export default router;

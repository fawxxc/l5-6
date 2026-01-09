// src/routes/appointment.routes.ts
import { Router } from 'express';
import { getRepository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { Pet } from '../entities/pet.entity';
import { Employee } from '../entities/employee.entity';

const router = Router();


router.get('/doctors', async (_req, res, next) => {
  try {
    const employeeRepo = getRepository(Employee);

    const doctors = await employeeRepo.find({
      where: {
        role: 'doctor' as any,
        isactive: true as any,
      },
    });

    return res.json(doctors);
  } catch (err) {
    return next(err);
  }
});


router.post('/', async (req, res, next) => {
  try {
    const { petId, doctorId, date, time, visitType } = req.body;

    if (!petId || !doctorId || !date || !time) {
      return res.status(400).json({
        message: 'petId, doctorId, date і time є обовʼязковими',
      });
    }


    const dateTime = new Date(`${date}T${time}`);

    const petRepo = getRepository(Pet);
    const employeeRepo = getRepository(Employee);
    const appointmentRepo = getRepository(Appointment);

    const pet = await petRepo.findOne({ where: { id: petId } });
    if (!pet) {
      return res.status(404).json({ message: 'Тваринку не знайдено' });
    }

    if (pet.ownerId == null) {
      return res.status(400).json({
        message:
          'У тваринки не заповнений ownerId. Неможливо створити запис на прийом.',
      });
    }

    const doctor = await employeeRepo.findOne({ where: { id: doctorId } });
    if (!doctor) {
      return res.status(404).json({ message: 'Лікаря не знайдено' });
    }

    const appointmentData: Partial<Appointment> = {
      data: dateTime,
      owner_id: pet.ownerId,
      animal_id: pet.id,
      reason: visitType || 'Запис на прийом',
      status: 'заплановано',
      employee: doctor,
      pet,
    };

    const appointment = appointmentRepo.create(appointmentData);
    const saved = await appointmentRepo.save(appointment);

    return res.status(201).json(saved);
  } catch (err) {
    return next(err);
  }
});


router.get('/', async (_req, res, next): Promise<void> => {
  try {
    const appointmentRepo = getRepository(Appointment);

    const appointments = await appointmentRepo.find({
      relations: ['pet', 'employee'],
      order: { data: 'ASC' },
    });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});


router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Некоректний id' });
    }

    const { status, diagnosis } = req.body as {
      status?: string;
      diagnosis?: string | null;
    };

    const appointmentRepo = getRepository(Appointment);

    const appt = await appointmentRepo.findOne({
      where: { id },
      relations: ['pet', 'employee'],
    });

    if (!appt) {
      return res.status(404).json({ message: 'Запис не знайдено' });
    }


    if (typeof status !== 'undefined') {
      (appt as any).status = status;
    }

    if (typeof diagnosis !== 'undefined') {
      (appt as any).diagnosis = diagnosis;
    }

    const saved = await appointmentRepo.save(appt);

    return res.json(saved);
  } catch (err) {
    return next(err);
  }
});


router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Некоректний id' });
    }

    const appointmentRepo = getRepository(Appointment);

    const appt = await appointmentRepo.findOne({ where: { id } });
    if (!appt) {
      return res.status(404).json({ message: 'Запис не знайдено' });
    }

    await appointmentRepo.remove(appt);

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

export default router;

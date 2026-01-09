// src/index.ts
import 'dotenv/config';
import 'reflect-metadata';

import fs from 'fs';
import path from 'path';

import cors from 'cors';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import './utils/response/customSuccess';
import { errorHandler } from './middleware/errorHandler';
import { getLanguage } from './middleware/getLanguage';
import { dbCreateConnection } from './orm/dbCreateConnection';

import routes from './routes';
import ownerRouter from './routes/owner.routes';
import authRouter from './routes/auth.routes';
import petRouter from './routes/pet.routes';
import employeeRouter from './routes/employee.routes';
import appointmentRouter from './routes/appointment.routes';
import vaccinationRoutes from './routes/vaccination.routes';
import medicineRoutes from './routes/medicine.routes';

import { authMiddleware, type UserRole } from './middleware/authMiddleware';

import { Medicine } from './entities/medicine.entity';
import type { Connection } from 'typeorm';

export const app = express();


app.use(cors());
app.options('*', cors()); // ✅ preflight
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(getLanguage);


try {
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, '../log/access.log'),
    { flags: 'a' },
  );
  app.use(morgan('combined', { stream: accessLogStream }));
} catch (err) {
  console.log(err);
}
app.use(morgan('dev'));


app.use((req, _res, next) => {
  if (req.path.startsWith('/auth')) {
    console.log('AUTH REQUEST:', req.method, req.path, 'body =', req.body);
  }
  next();
});


app.use('/auth', authRouter);


const ownersAccess = (req: Request, res: Response, next: NextFunction) => {

  if (req.method === 'OPTIONS') return next();

  const roles: readonly UserRole[] =
    req.method === 'GET'
      ? ['admin', 'doctor', 'creator']
      : ['admin', 'creator'];

  return authMiddleware(roles)(req, res, next);
};

app.use('/owners', ownersAccess, ownerRouter);

app.use('/pets', authMiddleware(['admin', 'doctor', 'owner', 'creator']), petRouter);

app.use('/employees', employeeRouter);
app.use('/appointments', appointmentRouter);
app.use('/vaccinations', vaccinationRoutes);
app.use(medicineRoutes);
app.use('/', routes);


app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;


async function seedMedicines(conn: Connection): Promise<void> {
  const repo = conn.getRepository(Medicine);

  const count = await repo.count();
  if (count > 0) return;

  await repo.save([
    { name: 'Проти сказу', stock: 50, unit: 'доза' },
    { name: 'Комплексна', stock: 100, unit: 'доза' },
    { name: 'Проти чумки', stock: 40, unit: 'доза' },
  ]);

  console.log('✅ Seeded default medicines (vaccines) into DB');
}

(async () => {
  try {
    const conn = await dbCreateConnection();
    if (!conn) {
      console.error('Failed to connect to DB');
      process.exit(1);
    }

    console.log('DB connection established');

    await seedMedicines(conn);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
})();

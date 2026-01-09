// src/orm/config/ormconfig.ts
import type { ConnectionOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { AnimalVaccination } from '../../entities/animal-vaccination.entity';
import { Appointment } from '../../entities/appointment.entity';
import { Delivery } from '../../entities/delivery.entity';
import { Employee } from '../../entities/employee.entity';
import { Medicine } from '../../entities/medicine.entity';
import { Owner } from '../../entities/owner.entity';
import { Payment } from '../../entities/payment.entity';
import { Pet } from '../../entities/pet.entity';
import { Vaccination } from '../../entities/vaccination.entity';

import { MedicineRequest } from '../../entities/medicine-request.entity';
import { UserAccount } from '../../entities/userAccount.entity';

const config: ConnectionOptions = {
  type: 'postgres',
  name: 'default',
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'postgres',

  synchronize: true,
  logging: false,

  entities: [
    Owner,
    Pet,
    Employee,
    Appointment,
    Medicine,
    Delivery,
    Payment,
    Vaccination,
    AnimalVaccination,
    MedicineRequest,
    UserAccount,
  ],

  migrations: ['src/orm/migrations/**/*.ts'],
  subscribers: ['src/orm/subscriber/**/*.ts'],

  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/orm/migrations',
    subscribersDir: 'src/orm/subscriber',
  },

  namingStrategy: new SnakeNamingStrategy(),
};

export default config;

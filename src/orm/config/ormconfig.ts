import { ConnectionOptions } from 'typeorm';
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

const config: ConnectionOptions = {
  type: 'postgres',
  name: 'default',
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  logging: false,
  // ОСЬ ТУТ БУЛА ГОЛОВНА ПОМИЛКА:
  // Прибираємо лапки, це мають бути змінні класів
  entities: [Owner, Pet, Employee, Appointment, Medicine, Delivery, Payment, Vaccination, AnimalVaccination],
  migrations: ['src/orm/migrations/**/*.ts'],
  subscribers: ['src/orm/subscriber/**/*.ts'],
  cli: {
    entitiesDir: 'src/entities', // Виправив шлях до папки сутностей
    migrationsDir: 'src/orm/migrations',
    subscribersDir: 'src/orm/subscriber',
  },
  namingStrategy: new SnakeNamingStrategy(),
};

export = config;

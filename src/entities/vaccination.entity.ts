import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { AnimalVaccination } from './animal-vaccination.entity';
import { Appointment } from './appointment.entity';

@Entity('vaccinations')
export class Vaccination {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  type: string;
  @Column({ nullable: true })
  description: string;
  @Column({ nullable: true })
  animal_id: number;
  @OneToMany(() => Appointment, (appointment) => appointment.employee)
  appointments: Appointment[];
  @OneToMany(() => AnimalVaccination, (av) => av.vaccination)
  animalVaccinations: AnimalVaccination[];
}

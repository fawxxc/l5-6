import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { Employee } from './employee.entity';
import { Pet } from './pet.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  owner_id: number;
  @Column()
  animal_id: number;
  @Column({ type: 'timestamp', nullable: true })
  data: Date;
  @Column()
  reason: string;
  @Column()
  status: string;
  @Column({ nullable: true })
  diagnose: string;

  @ManyToOne(() => Employee, (employee) => employee.appointments)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Pet, (pet) => pet.appointments)
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;
}

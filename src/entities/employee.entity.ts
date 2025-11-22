import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Appointment } from './appointment.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  fullName: string;
  @Column()
  phone: string;
  @Column({ nullable: true })
  address: string;
  @Column({ nullable: true })
  education: string;
  @Column()
  role: string;
  @Column()
  isactive: boolean;
  @OneToMany(() => Appointment, (appointment) => appointment.employee)
  appointments: Appointment[];
}

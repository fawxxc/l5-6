import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  education: string | null;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ name: 'isactive', type: 'boolean' })
  isactive: boolean;

  @OneToMany(() => Appointment, (appointment) => appointment.employee)
  appointments: Appointment[];
}

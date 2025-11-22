import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';

import { Appointment } from './appointment.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  ownerId: number;
  @Column()
  appointmentId: number;
  @Column()
  paymentMethod: string;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paymentDate: Date;
  @Column()
  status: string;
  @OneToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;
}

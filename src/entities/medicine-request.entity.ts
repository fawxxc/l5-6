// src/entities/medicine-request.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Medicine } from './medicine.entity';

@Entity('medicine_request')
export class MedicineRequest {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ name: 'vaccine_type' })
  vaccineType: string;


  @Column('int')
  quantity: number;


  @Column('text')
  reason: string;


  @Column({ default: 'pending' })
  status: string;


  @Column({ type: 'int', nullable: true })
  deliveredQuantity: number | null;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Medicine, (medicine) => medicine.requests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'medicine_id' })
  medicine: Medicine | null;
}

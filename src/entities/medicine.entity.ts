// src/entities/medicine.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { MedicineRequest } from './medicine-request.entity';
import { Delivery } from './delivery.entity';

@Entity('medicine')
export class Medicine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;


  @Column({ default: 'доза' })
  unit: string;


  @Column({ type: 'int', default: 0 })
  stock: number;


  @OneToMany(() => MedicineRequest, (req) => req.medicine)
  requests: MedicineRequest[];


  @OneToMany(() => Delivery, (delivery) => delivery.medicine)
  deliveries: Delivery[];
}

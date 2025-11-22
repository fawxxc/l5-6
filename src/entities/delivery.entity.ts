import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { Medicine } from './medicine.entity';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  medicationId: number;
  @Column()
  employeeId: number;
  @Column()
  deliverId: number;
  @Column({ type: 'int' })
  quantity: number;
  @Column({ nullable: true })
  supplier: number;
  @ManyToOne(() => Medicine, (medicine) => medicine.deliveries)
  @JoinColumn({ name: 'medicine_id' })
  medicine: Medicine;
}

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Delivery } from './delivery.entity';

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 100 })
  name: string;
  @Column()
  min_stock: number;
  @Column()
  status: string;
  @OneToMany(() => Delivery, (delivery) => delivery.medicine)
  deliveries: Delivery[];
}

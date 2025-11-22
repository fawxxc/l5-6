import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Pet } from './pet.entity';

@Entity('owners')
export class Owner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', length: 100 })
  full_name: string;
  @Column({ name: 'phone', length: 30})
  phone: string;
  @Column({ name: 'email' })
  email: string;
  @Column({ name: 'address', nullable: true })
  address: string;

  @OneToMany((type) => Pet, (pet) => pet.owner)
  pets: Pet[];
}

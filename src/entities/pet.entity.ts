import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import { AnimalVaccination } from './animal-vaccination.entity';
import { Appointment } from './appointment.entity';
import { Owner } from './owner.entity';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  age: number;
  @Column()
  breed: string;
  @Column()
  gender: string;
  @Column()
  weight: number;
  @Column()
  ownerId: number;

  @ManyToOne(() => Owner, (owner) => owner.pets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;
  @OneToMany(() => Appointment, (appointment) => appointment.pet)
  appointments: Appointment[];
  @OneToMany(() => AnimalVaccination, (av) => av.pet)
  vaccinations: AnimalVaccination[];
}

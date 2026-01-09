// src/entities/animal-vaccination.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';

import { Pet } from './pet.entity';
import { Vaccination } from './vaccination.entity';

@Entity('animal_vaccination')
export class AnimalVaccination {
  @PrimaryGeneratedColumn()
  id: number;


  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  pet: Pet;


  @ManyToOne(() => Vaccination, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vaccination_id' })
  vaccination: Vaccination;


  @Column({ type: 'date', name: 'vaccination_date', nullable: true })
  vaccinationDate?: Date;
}

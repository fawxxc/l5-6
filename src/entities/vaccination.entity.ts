import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pet } from './pet.entity';

@Entity('vaccinations')
export class Vaccination {
  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  type: string;


  @Column({ nullable: true })
  description?: string;


  @Column({ name: 'animal_id' })
  animalId: number;

  @ManyToOne(() => Pet, (pet) => pet.vaccinations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'animal_id' })
  animal: Pet;
}

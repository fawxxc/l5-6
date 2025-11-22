import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { Pet } from './pet.entity';
import { Vaccination } from './vaccination.entity';

@Entity('animal-vaccinations')
export class AnimalVaccination {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  animal_id: number;
  @Column()
  vaccine_id: number;
  @Column()
  vet_id: number;
  @Column()
  vaccinate_date: Date;
  @Column()
  status: string;

  @ManyToOne(() => Pet, (pet) => pet.vaccinations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Vaccination, (vaccination) => vaccination.animalVaccinations)
  @JoinColumn({ name: 'vaccination_id' })
  vaccination: Vaccination;
}

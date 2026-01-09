// src/entities/userAccount.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type UserRole = 'owner' | 'doctor' | 'admin';

@Entity('user_accounts')
export class UserAccount {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'varchar', length: 20 })
  role!: UserRole;

  @Column({ name: 'owner_id', type: 'int', nullable: true })
  ownerId!: number | null;

  @Column({ name: 'doctor_id', type: 'int', nullable: true })
  doctorId!: number | null;

  @Column({ name: 'must_change_password', type: 'boolean', default: false })
  mustChangePassword!: boolean;
}

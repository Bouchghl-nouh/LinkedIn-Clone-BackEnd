import { Exclude } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  firstName!: string;
  @Column()
  lastName!: string;
  @Column({ unique: true })
  email!: string;
  @Exclude()
  @Column()
  password!: string;
  @Column({ default: false })
  isVerified!: boolean;
  @Column({ nullable: true })
  avatarUrl?: string;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
  @DeleteDateColumn()
  deletedAt?: Date;
}

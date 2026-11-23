import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from "typeorm";
import { User } from "../../../users/entities/user.entity.js";

@Entity("password_tokens")
@Index(["userId"])
export class PasswordToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  tokenHash!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  expiresAt!: Date;
}

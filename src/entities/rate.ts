import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"
import { RateSourceEnum } from "./types"

@Entity("rates")
export class Rate {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ nullable: false, type: "decimal" })
  value!: string

  @Column({ type: "numeric" })
  sourceValue!: number

  @Index()
  @Column({ nullable: false, type: "enum", enum: RateSourceEnum })
  source!: RateSourceEnum

  @Index()
  @Column({ nullable: false, type: "timestamp with time zone" })
  rateAt!: Date

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}

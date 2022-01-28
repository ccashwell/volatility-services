import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("fleek_transactions")
export class FleekTransaction {
  @PrimaryColumn({ nullable: false })
  hash!: string

  @Column({ nullable: false })
  key!: string

  @Column({ nullable: false, type: "jsonb" })
  metadata!: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}

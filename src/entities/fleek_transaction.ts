import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("fleek_transactions")
export class FleekTransaction {
  @Index("hash-idx")
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

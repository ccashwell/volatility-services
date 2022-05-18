import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique } from "typeorm"
import { BaseCurrencyEnum, MethodologyExchangeEnum } from "."

@Entity("mfiv_indices")
@Index(["timestamp", "asset", "exchange", "timePeriod"])
@Unique(["timestamp", "asset", "exchange", "timePeriod"])
export class MfivIndex {
  @Column({ nullable: false })
  @Index()
  @PrimaryColumn()
  timestamp!: Date

  @Column({ nullable: false, type: "decimal" })
  value!: string

  @Column({ nullable: false, type: "decimal" })
  invValue!: string

  @Column({ nullable: false })
  @PrimaryColumn()
  timePeriod!: string

  @Column({ nullable: false, type: "enum", enum: BaseCurrencyEnum })
  @PrimaryColumn()
  asset!: BaseCurrencyEnum

  @Column({ nullable: false, type: "enum", enum: MethodologyExchangeEnum })
  @PrimaryColumn()
  exchange!: MethodologyExchangeEnum

  @Column({ nullable: false, type: "timestamp with time zone" })
  nearExpiry!: Date

  @Column({ nullable: false, type: "timestamp with time zone" })
  nextExpiry!: Date

  @Column({ nullable: true, type: "jsonb" })
  extra!: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date
}

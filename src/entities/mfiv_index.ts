import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique } from "typeorm"
import { BaseCurrencyEnum, MethodologyEnum, MethodologyExchangeEnum, SymbolTypeEnum } from "."

@Entity("mfiv_indices")
@Index(["methodology", "timePeriod", "asset", "exchange", "symbolType"])
@Unique(["timestamp", "methodology", "interval", "asset", "symbolType"])
export class MfivIndex {
  @Column({ nullable: false })
  @Index()
  @PrimaryColumn()
  timestamp!: Date

  @Column({ nullable: false, type: "decimal" })
  value!: string

  @Column({ nullable: false, type: "decimal" })
  ivalue!: string

  @Column({ nullable: false, type: "enum", enum: MethodologyEnum })
  @PrimaryColumn()
  methodology!: MethodologyEnum

  @Column({ nullable: false })
  @PrimaryColumn()
  timePeriod!: string

  @Column({ nullable: false, type: "enum", enum: BaseCurrencyEnum })
  @PrimaryColumn()
  asset!: BaseCurrencyEnum

  @Column({ nullable: false, type: "enum", enum: MethodologyExchangeEnum })
  exchange!: MethodologyExchangeEnum

  @Column({ nullable: false, type: "enum", enum: SymbolTypeEnum })
  symbolType!: SymbolTypeEnum

  @Column({ nullable: false, type: "timestamp with time zone" })
  at!: Date

  @Column({ nullable: false, type: "timestamp with time zone" })
  nearExpiry!: Date

  @Column({ nullable: false, type: "timestamp with time zone" })
  nextExpiry!: Date

  @Column({ nullable: true, type: "jsonb" })
  extra!: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date
}

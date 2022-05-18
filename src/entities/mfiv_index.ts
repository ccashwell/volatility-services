import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique } from "typeorm"
import { BaseCurrencyEnum, MethodologyExchangeEnum } from "."

export interface MfivIndexExtra {
  type: "idx"
  rate: { src: string; ts: Date; val: number }
}

@Entity("mfiv_indices")
@Index(["timestamp", "exchange", "timePeriod", "asset"])
@Unique(["timestamp", "exchange", "timePeriod", "asset"])
export class MfivIndex {
  @Column({ nullable: false })
  @PrimaryColumn({ nullable: false, type: "timestamptz" })
  timestamp!: Date

  @Column({ nullable: false, type: "enum", enum: MethodologyExchangeEnum })
  @PrimaryColumn()
  exchange!: MethodologyExchangeEnum

  @Column({ nullable: false })
  @PrimaryColumn()
  timePeriod!: string

  @Column({ nullable: false, type: "enum", enum: BaseCurrencyEnum })
  @PrimaryColumn()
  asset!: BaseCurrencyEnum

  @Column({ nullable: false, type: "decimal", name: "value" })
  dVol!: string

  @Column({ nullable: false, type: "decimal", name: "invValue" })
  invdVol!: string

  @Column({ nullable: false, type: "decimal" })
  underlyingPrice!: string

  @Column({ nullable: false, type: "timestamptz" })
  nearExpiry!: Date

  @Column({ nullable: false, type: "timestamptz" })
  nextExpiry!: Date

  @Column({ nullable: true, type: "jsonb" })
  extra!: MfivIndexExtra

  @CreateDateColumn()
  createdAt!: Date
}

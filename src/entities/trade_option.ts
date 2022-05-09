import { BaseCurrencyEnum } from "@entities/types"
import { Exchange, EXCHANGES } from "tardis-dev"
import { Column, Entity, Index, PrimaryColumn } from "typeorm"

@Entity("trade_options")
export class TradeOption {
  @Index()
  @PrimaryColumn({ nullable: false, type: "timestamptz" })
  timestamp!: Date

  @Index()
  @PrimaryColumn({ nullable: false, type: "enum", enum: EXCHANGES })
  exchange!: Exchange

  @Index()
  @PrimaryColumn({ nullable: false, type: "enum", enum: BaseCurrencyEnum })
  asset!: BaseCurrencyEnum

  @Index()
  @PrimaryColumn({ nullable: false })
  symbol!: string

  @Column({ nullable: false, type: "decimal" })
  price!: string

  @Column({ nullable: false, type: "integer" })
  strikePrice!: number

  // @Column({ nullable: false, type: "decimal" })
  // amount!: string

  // @Column({ nullable: true, name: "transactionId" })
  // id?: string

  @Column({ nullable: false, type: "timestamptz" })
  expirationDate!: Date

  @Column({ nullable: true, type: "timestamptz" })
  localTimestamp!: Date
}

import { BaseCurrencyEnum, OptionTypeEnum } from "@entities/types"
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
  underlyingPrice!: string

  @Column({ nullable: false, type: "integer" })
  strikePrice!: number

  @Column({ nullable: false, type: "decimal" })
  price!: string

  // @Column({ nullable: false, type: "decimal" })
  // amount!: string

  // @Column({ nullable: true, name: "transactionId" })
  // id?: string
  @Column({ nullable: false, enum: OptionTypeEnum })
  optionType!: OptionTypeEnum

  @Column({ nullable: true, type: "decimal" })
  markIV!: string

  @Column({ nullable: true, type: "decimal" })
  delta!: string

  @Column({ nullable: false, type: "timestamptz" })
  expirationDate!: Date

  @Column({ nullable: true, type: "timestamptz" })
  localTimestamp!: Date
}

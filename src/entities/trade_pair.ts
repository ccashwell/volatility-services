import { SYMBOLS, TradePairSymbol } from "@lib/types"
import { Exchange, EXCHANGES } from "tardis-dev"
import { Column, Entity, Index, PrimaryColumn } from "typeorm"

@Entity("trade_pairs")
export class TradePair {
  @Index()
  @PrimaryColumn({ nullable: false, type: "timestamptz" })
  timestamp!: Date

  @Index()
  @PrimaryColumn({ nullable: false, type: "enum", enum: EXCHANGES })
  exchange!: Exchange

  @Index()
  @PrimaryColumn({ nullable: false, type: "enum", enum: SYMBOLS })
  symbol!: TradePairSymbol

  @Column({ nullable: false, type: "decimal" })
  price!: string

  // @Column({ nullable: false, type: "decimal" })
  // amount!: string

  @Column({ nullable: true, name: "transactionId" })
  id?: string

  @Column({ nullable: true, type: "timestamptz" })
  localTimestamp!: Date
}

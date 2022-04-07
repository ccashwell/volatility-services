import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique } from "typeorm"
import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyWindowEnum,
  SymbolTypeEnum
} from "./types"

@Entity("methodology_indices")
@Index(["methodology", "timePeriod", "asset", "exchange", "symbolType"])
@Unique(["timestamp", "methodology", "timePeriod", "asset", "symbolType"])
export class MethodologyIndex {
  // @PrimaryColumn({ nullable: false })
  // hash!: string

  @Column({ nullable: false })
  @Index()
  @PrimaryColumn()
  timestamp!: Date

  @Column({ nullable: false, type: "decimal" })
  value!: string

  @Column({ nullable: false, type: "enum", enum: MethodologyEnum })
  @PrimaryColumn()
  methodology!: MethodologyEnum

  @Column({ nullable: false, type: "enum", enum: MethodologyWindowEnum })
  @PrimaryColumn()
  timePeriod!: MethodologyWindowEnum

  @Column({ nullable: false, type: "enum", enum: BaseCurrencyEnum })
  @PrimaryColumn()
  asset!: BaseCurrencyEnum

  @Column({ nullable: false, type: "enum", enum: MethodologyExchangeEnum })
  exchange!: MethodologyExchangeEnum

  @Column({ nullable: false, type: "enum", enum: SymbolTypeEnum })
  symbolType!: SymbolTypeEnum

  @Column({ nullable: true, type: "jsonb" })
  extra!: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date
}

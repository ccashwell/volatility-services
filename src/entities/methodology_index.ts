import { Entity, Column, CreateDateColumn, Index, PrimaryColumn, Unique } from "typeorm"

export enum BaseCurrencyEnum {
  ETH = "ETH"
}

export enum MethodologyExchangeEnum {
  Deribit = "deribit"
}

export enum SymbolTypeEnum {
  Option = "option"
}

export enum MethodologyEnum {
  MFIV = "mfiv"
}

export enum MethodologyWindowEnum {
  Day14 = "14d"
}

export enum MethodologyExpiryEnum {
  FridayT08 = "FridayT08:00:00Z"
}

@Entity("methodology_indices")
@Index(["methodology", "interval", "baseCurrency", "exchange", "symbolType"])
@Unique(["timestamp", "methodology", "interval", "baseCurrency", "symbolType"])
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
  interval!: MethodologyWindowEnum

  @Column({ nullable: false, type: "enum", enum: BaseCurrencyEnum })
  @PrimaryColumn()
  baseCurrency!: BaseCurrencyEnum

  @Column({ nullable: false, type: "enum", enum: MethodologyExchangeEnum })
  exchange!: MethodologyExchangeEnum

  @Column({ nullable: false, type: "enum", enum: SymbolTypeEnum })
  symbolType!: SymbolTypeEnum

  @Column({ nullable: true, type: "jsonb" })
  extra!: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date
}

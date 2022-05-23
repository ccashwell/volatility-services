import { MigrationInterface, QueryRunner } from "typeorm"

export class AddSolAsset1653318939508 implements MigrationInterface {
  name = "AddSolAsset1653318939508"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."trade_options_asset_enum" RENAME TO "trade_options_asset_enum_old"`)
    await queryRunner.query(`CREATE TYPE "public"."trade_options_asset_enum" AS ENUM('ETH', 'BTC', 'SOL')`)
    await queryRunner.query(
      `ALTER TABLE "trade_options" ALTER COLUMN "asset" TYPE "public"."trade_options_asset_enum" USING "asset"::"text"::"public"."trade_options_asset_enum"`
    )
    await queryRunner.query(`DROP TYPE "public"."trade_options_asset_enum_old"`)
    await queryRunner.query(`ALTER TYPE "public"."trade_pairs_symbol_enum" RENAME TO "trade_pairs_symbol_enum_old"`)
    await queryRunner.query(
      `CREATE TYPE "public"."trade_pairs_symbol_enum" AS ENUM('ETHUSDT', 'ETHUSD', 'ETH/USD', 'ETH/USDC', 'ETH/USDT', 'ETH-USD', 'BTCUSDT', 'BTCUSD', 'BTC/USD', 'BTC/USDC', 'BTC/USDT', 'BTC-USD', 'SOLUSDT', 'SOLUSD', 'SOL/USD', 'SOL/USDC', 'SOL/USDT', 'SOL-USD')`
    )
    await queryRunner.query(
      `ALTER TABLE "trade_pairs" ALTER COLUMN "symbol" TYPE "public"."trade_pairs_symbol_enum" USING "symbol"::"text"::"public"."trade_pairs_symbol_enum"`
    )
    await queryRunner.query(`DROP TYPE "public"."trade_pairs_symbol_enum_old"`)
    await queryRunner.query(
      `ALTER TABLE "mfiv_indices" ADD CONSTRAINT "UQ_0eb4a2e6e99a906095e43c32f29" UNIQUE ("timestamp", "exchange", "timePeriod", "asset")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "mfiv_indices" DROP CONSTRAINT "UQ_0eb4a2e6e99a906095e43c32f29"`)
    await queryRunner.query(
      `CREATE TYPE "public"."trade_pairs_symbol_enum_old" AS ENUM('ETHUSDT', 'ETHUSD', 'ETH/USD', 'ETH/USDC', 'ETH/USDT', 'ETH-USD', 'BTCUSDT', 'BTCUSD', 'BTC/USD', 'BTC/USDC', 'BTC/USDT', 'BTC-USD')`
    )
    await queryRunner.query(
      `ALTER TABLE "trade_pairs" ALTER COLUMN "symbol" TYPE "public"."trade_pairs_symbol_enum_old" USING "symbol"::"text"::"public"."trade_pairs_symbol_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."trade_pairs_symbol_enum"`)
    await queryRunner.query(`ALTER TYPE "public"."trade_pairs_symbol_enum_old" RENAME TO "trade_pairs_symbol_enum"`)
    await queryRunner.query(`CREATE TYPE "public"."trade_options_asset_enum_old" AS ENUM('ETH', 'BTC')`)
    await queryRunner.query(
      `ALTER TABLE "trade_options" ALTER COLUMN "asset" TYPE "public"."trade_options_asset_enum_old" USING "asset"::"text"::"public"."trade_options_asset_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."trade_options_asset_enum"`)
    await queryRunner.query(`ALTER TYPE "public"."trade_options_asset_enum_old" RENAME TO "trade_options_asset_enum"`)
  }
}

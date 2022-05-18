import { MigrationInterface, QueryRunner } from "typeorm"

export class AddRisklessRate1652888585060 implements MigrationInterface {
  name = "AddRisklessRate1652888585060"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "mfiv_indices" ("timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "exchange" character varying NOT NULL, "timePeriod" character varying NOT NULL, "asset" character varying NOT NULL, "value" numeric NOT NULL, "invValue" numeric NOT NULL, "underlyingPrice" numeric NOT NULL, "nearExpiry" TIMESTAMP WITH TIME ZONE NOT NULL, "nextExpiry" TIMESTAMP WITH TIME ZONE NOT NULL, "extra" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_0eb4a2e6e99a906095e43c32f29" UNIQUE ("timestamp", "exchange", "timePeriod", "asset"), CONSTRAINT "PK_0eb4a2e6e99a906095e43c32f29" PRIMARY KEY ("timestamp", "exchange", "timePeriod", "asset"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_0eb4a2e6e99a906095e43c32f2" ON "mfiv_indices" USING BRIN ("timestamp", "exchange", "timePeriod", "asset")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_0eb4a2e6e99a906095e43c32f2"`)
    await queryRunner.query(`DROP TABLE "mfiv_indices"`)
  }
}

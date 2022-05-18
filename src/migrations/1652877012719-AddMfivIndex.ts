import { MigrationInterface, QueryRunner } from "typeorm"

export class AddMfivIndex1652877012719 implements MigrationInterface {
  name = "AddMfivIndex1652877012719"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "mfiv_indices" ("timestamp" TIMESTAMP NOT NULL, "value" numeric NOT NULL, "invValue" numeric NOT NULL, "timePeriod" character varying NOT NULL, "asset" character varying NOT NULL, "exchange" character varying NOT NULL, "nearExpiry" TIMESTAMP WITH TIME ZONE NOT NULL, "nextExpiry" TIMESTAMP WITH TIME ZONE NOT NULL, "extra" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0eb4a2e6e99a906095e43c32f29" UNIQUE ("timestamp", "asset", "exchange", "timePeriod"), CONSTRAINT "PK_0eb4a2e6e99a906095e43c32f29" PRIMARY KEY ("timestamp", "exchange", "timePeriod", "asset"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_b86ca2aacb6efee9f83e6d86b8" ON "mfiv_indices" using BRIN ("timestamp") `)
    await queryRunner.query(
      `CREATE INDEX "IDX_0eb4a2e6e99a906095e43c32f2" ON "mfiv_indices" ("timestamp", "asset", "exchange", "timePeriod") `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_0eb4a2e6e99a906095e43c32f2"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_b86ca2aacb6efee9f83e6d86b8"`)
    await queryRunner.query(`DROP TABLE "mfiv_indices"`)
  }
}

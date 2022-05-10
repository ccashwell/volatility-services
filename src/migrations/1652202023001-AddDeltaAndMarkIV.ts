import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeltaAndMarkIV1652202023001 implements MigrationInterface {
    name = 'AddDeltaAndMarkIV1652202023001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade_options" ADD "markIV" numeric`);
        await queryRunner.query(`ALTER TABLE "trade_options" ADD "delta" numeric`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade_options" DROP COLUMN "delta"`);
        await queryRunner.query(`ALTER TABLE "trade_options" DROP COLUMN "markIV"`);
    }

}

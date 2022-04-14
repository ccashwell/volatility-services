import { MigrationInterface, QueryRunner } from "typeorm"

export class addPgPartman1649224322264 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE SCHEMA partman;
            CREATE EXTENSION pg_partman WITH SCHEMA partman;`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP EXTENSION pg_partman WITH SCHEMA partman;
                DROP SCHEMA partman;`
    )
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordTokenTable1795375627462 implements MigrationInterface {
  name = "AddPasswordTokenTable1795375627462";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "password_tokens" ("id" SERIAL NOT NULL, "tokenHash" character varying NOT NULL, "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP NOT NULL, CONSTRAINT "UQ_68b34bae802df324900ebf9c745" UNIQUE ("tokenHash"), CONSTRAINT "PK_816120c39410c02dabd34b8672b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_874c7469306420fa3fa4ebf1b0" ON "password_tokens"  ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "password_tokens" ADD CONSTRAINT "FK_874c7469306420fa3fa4ebf1b02" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_tokens" DROP CONSTRAINT "FK_874c7469306420fa3fa4ebf1b02"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_874c7469306420fa3fa4ebf1b0"`);
    await queryRunner.query(`DROP TABLE "password_tokens"`);
  }
}

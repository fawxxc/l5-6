import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitDatabase1763799463724 implements MigrationInterface {
  name = 'InitDatabase1763799463724';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "employees" (
                "id" SERIAL NOT NULL,
                "full_name" character varying NOT NULL,
                "phone" character varying NOT NULL,
                "address" character varying,
                "education" character varying,
                "role" character varying NOT NULL,
                "isactive" boolean NOT NULL,
                CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "appointments" (
                "id" SERIAL NOT NULL,
                "owner_id" integer NOT NULL,
                "animal_id" integer NOT NULL,
                "data" TIMESTAMP,
                "reason" character varying NOT NULL,
                "status" character varying NOT NULL,
                "diagnose" character varying,
                "employee_id" integer,
                "pet_id" integer,
                CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "owners" (
                "id" SERIAL NOT NULL,
                "full_name" character varying(100) NOT NULL,
                "phone" character varying(30) NOT NULL,
                "email" character varying NOT NULL,
                "address" character varying,
                CONSTRAINT "PK_42838282f2e6b216301a70b02d6" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "pets" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "age" integer NOT NULL,
                "breed" character varying NOT NULL,
                "gender" character varying NOT NULL,
                "weight" integer NOT NULL,
                "owner_id" integer NOT NULL,
                CONSTRAINT "PK_d01e9e7b4ada753c826720bee8b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "vaccinations" (
                "id" SERIAL NOT NULL,
                "type" character varying NOT NULL,
                "description" character varying,
                "animal_id" integer,
                CONSTRAINT "PK_99719c8d5726027cd5f7a7cbb1a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "animal-vaccinations" (
                "id" SERIAL NOT NULL,
                "animal_id" integer NOT NULL,
                "vaccine_id" integer NOT NULL,
                "vet_id" integer NOT NULL,
                "vaccinate_date" TIMESTAMP NOT NULL,
                "status" character varying NOT NULL,
                "pet_id" integer,
                "vaccination_id" integer,
                CONSTRAINT "PK_a0cc757c2d0a1c7b734d926a793" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "medicines" (
                "id" SERIAL NOT NULL,
                "name" character varying(100) NOT NULL,
                "min_stock" integer NOT NULL,
                "status" character varying NOT NULL,
                CONSTRAINT "PK_77b93851766f7ab93f71f44b18b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "deliveries" (
                "id" SERIAL NOT NULL,
                "medication_id" integer NOT NULL,
                "employee_id" integer NOT NULL,
                "deliver_id" integer NOT NULL,
                "quantity" integer NOT NULL,
                "supplier" integer,
                "medicine_id" integer,
                CONSTRAINT "PK_a6ef225c5c5f0974e503bfb731f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" SERIAL NOT NULL,
                "owner_id" integer NOT NULL,
                "appointment_id" integer NOT NULL,
                "payment_method" character varying NOT NULL,
                "amount" numeric(10, 2) NOT NULL,
                "payment_date" TIMESTAMP NOT NULL DEFAULT now(),
                "status" character varying NOT NULL,
                CONSTRAINT "REL_9f49987820da519f855d04c82b" UNIQUE ("appointment_id"),
                CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_f4e3a19c74dac65a223368fa9a0" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_47439f4739409e7e27f2e5444d5" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "pets"
            ADD CONSTRAINT "FK_d6c565fded8031d4cdd54fe1043" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "animal-vaccinations"
            ADD CONSTRAINT "FK_9ffadc5644edf0f75d7e323f725" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "animal-vaccinations"
            ADD CONSTRAINT "FK_8b50065cfe662895482584b121d" FOREIGN KEY ("vaccination_id") REFERENCES "vaccinations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "deliveries"
            ADD CONSTRAINT "FK_030b4904a6218053e25c86b3ef6" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_9f49987820da519f855d04c82bd" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_9f49987820da519f855d04c82bd"
        `);
    await queryRunner.query(`
            ALTER TABLE "deliveries" DROP CONSTRAINT "FK_030b4904a6218053e25c86b3ef6"
        `);
    await queryRunner.query(`
            ALTER TABLE "animal-vaccinations" DROP CONSTRAINT "FK_8b50065cfe662895482584b121d"
        `);
    await queryRunner.query(`
            ALTER TABLE "animal-vaccinations" DROP CONSTRAINT "FK_9ffadc5644edf0f75d7e323f725"
        `);
    await queryRunner.query(`
            ALTER TABLE "pets" DROP CONSTRAINT "FK_d6c565fded8031d4cdd54fe1043"
        `);
    await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_47439f4739409e7e27f2e5444d5"
        `);
    await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_f4e3a19c74dac65a223368fa9a0"
        `);
    await queryRunner.query(`
            DROP TABLE "payments"
        `);
    await queryRunner.query(`
            DROP TABLE "deliveries"
        `);
    await queryRunner.query(`
            DROP TABLE "medicines"
        `);
    await queryRunner.query(`
            DROP TABLE "animal-vaccinations"
        `);
    await queryRunner.query(`
            DROP TABLE "vaccinations"
        `);
    await queryRunner.query(`
            DROP TABLE "pets"
        `);
    await queryRunner.query(`
            DROP TABLE "owners"
        `);
    await queryRunner.query(`
            DROP TABLE "appointments"
        `);
    await queryRunner.query(`
            DROP TABLE "employees"
        `);
  }
}

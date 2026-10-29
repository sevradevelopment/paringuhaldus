/**
 * Additive, non-destructive InquiryStatus migration:
 * PAKKUMINE -> OOTEL, VOIDETUD -> LOPETATUD, KAOTATUD -> TYHISTATUD
 * Then recreate enum with PART 10 values and add new inquiry columns/tables.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Migrating Inquiry schema/status…");

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Inquiry' AND column_name = 'status'
      ) THEN
        ALTER TABLE "Inquiry" ALTER COLUMN "status" DROP DEFAULT;
        ALTER TABLE "Inquiry" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "Inquiry" SET "status" = 'OOTEL' WHERE "status" = 'PAKKUMINE';
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "Inquiry" SET "status" = 'LOPETATUD' WHERE "status" = 'VOIDETUD';
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "Inquiry" SET "status" = 'TYHISTATUD' WHERE "status" = 'KAOTATUD';
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InquiryStatus') THEN
        DROP TYPE "InquiryStatus";
      END IF;
      CREATE TYPE "InquiryStatus" AS ENUM ('UUS', 'TOOS', 'OOTEL', 'LOPETATUD', 'TYHISTATUD');
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Inquiry' AND column_name = 'status'
      ) THEN
        ALTER TABLE "Inquiry"
          ALTER COLUMN "status" TYPE "InquiryStatus"
          USING "status"::"InquiryStatus";
        ALTER TABLE "Inquiry"
          ALTER COLUMN "status" SET DEFAULT 'UUS'::"InquiryStatus";
      END IF;
    END $$;
  `);

  console.log("Status enum remapped.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

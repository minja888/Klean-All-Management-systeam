-- Capital / loan / drawing tracking
CREATE TYPE "CapitalType" AS ENUM ('CAPITAL', 'LOAN', 'LOAN_REPAYMENT', 'DRAWING');

CREATE TABLE "CapitalEntry" (
    "id" TEXT NOT NULL,
    "type" "CapitalType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "description" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CapitalEntry_type_idx" ON "CapitalEntry"("type");
CREATE INDEX "CapitalEntry_entryDate_idx" ON "CapitalEntry"("entryDate");

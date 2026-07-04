-- Lender / party details on capital entries
ALTER TABLE "CapitalEntry" ADD COLUMN "partyName" TEXT;
ALTER TABLE "CapitalEntry" ADD COLUMN "partyInfo" TEXT;

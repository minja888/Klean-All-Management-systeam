-- Add job title + forced password change flag to users
ALTER TABLE "User" ADD COLUMN "position" TEXT;
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Car` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Car_price_idx";

-- DropIndex
DROP INDEX "Car_title_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Car_title_key" ON "Car"("title");

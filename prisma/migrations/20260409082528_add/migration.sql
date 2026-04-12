/*
  Warnings:

  - Added the required column `carConditation` to the `Car` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CarCondition" AS ENUM ('NEW', 'USED', 'CERTIFIED');

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "carConditation" "CarCondition" NOT NULL;

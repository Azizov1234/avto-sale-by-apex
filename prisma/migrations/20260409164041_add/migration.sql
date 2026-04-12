/*
  Warnings:

  - Added the required column `engine` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transmission` to the `Car` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('AUTOMATIC', 'MANUAL');

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "engine" TEXT NOT NULL,
ADD COLUMN     "transmission" "Transmission" NOT NULL;

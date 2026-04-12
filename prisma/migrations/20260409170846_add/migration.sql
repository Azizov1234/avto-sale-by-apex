/*
  Warnings:

  - Changed the type of `engine` on the `Car` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EngineType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID');

-- AlterTable
ALTER TABLE "Car" DROP COLUMN "engine",
ADD COLUMN     "engine" "EngineType" NOT NULL;

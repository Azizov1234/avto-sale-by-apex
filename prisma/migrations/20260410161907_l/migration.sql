/*
  Warnings:

  - You are about to drop the column `months` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `statusPay` on the `Order` table. All the data in the column will be lost.
  - Added the required column `orderType` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('FULL_PAYMENT', 'INSTALLMENT', 'TRADE_IN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_planId_fkey";

-- DropIndex
DROP INDEX "Order_planId_idx";

-- DropIndex
DROP INDEX "Order_status_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "months",
DROP COLUMN "status",
DROP COLUMN "statusPay",
ADD COLUMN     "orderType" "OrderType" NOT NULL,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "discount" SET DEFAULT 0,
ALTER COLUMN "interest" SET DEFAULT 0,
ALTER COLUMN "monthlyPay" DROP NOT NULL,
ALTER COLUMN "planId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

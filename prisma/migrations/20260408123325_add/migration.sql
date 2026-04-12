/*
  Warnings:

  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'deleted', 'blocked');

-- AlterTable
ALTER TABLE "AdminActionLog" ADD COLUMN     "status" "Status" DEFAULT 'active';

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "status" "Status" DEFAULT 'active';

-- AlterTable
ALTER TABLE "CarCategory" ADD COLUMN     "status" "Status" DEFAULT 'active';

-- AlterTable
ALTER TABLE "DiscountCampaign" ADD COLUMN     "status" "Status" DEFAULT 'active';

-- AlterTable
ALTER TABLE "InstallmentPlan" ADD COLUMN     "status" "Status" DEFAULT 'active';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "statusPay" "OrderStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "status",
ADD COLUMN     "status" "Status" DEFAULT 'active';

-- AlterTable
ALTER TABLE "PaymentHistory" ADD COLUMN     "status" "Status" DEFAULT 'active';

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "status" "Status" DEFAULT 'active';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "Status" DEFAULT 'active';

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

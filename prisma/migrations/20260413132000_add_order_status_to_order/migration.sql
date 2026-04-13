ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS "Order_orderStatus_idx" ON "Order"("orderStatus");

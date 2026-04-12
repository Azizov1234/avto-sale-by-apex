import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { CarModule } from './modules/car/car.module';
import { InstallmentPlanModule } from './modules/installment-plan/installment-plan.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReviewModule } from './modules/review/review.module';
import { StatsCacheModule } from './modules/stats-cache/stats-cache.module';
import { AdminActionLogModule } from './modules/admin-action-log/admin-action-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { SecurityModule } from './common/utils/security.module';
import { CloudinaryModule } from './core/cloudinary copy/cloudinary.module';
import { CarsCategoryModule } from './modules/cars-category/cars-category.module';
import { DiscountCampaignModule } from './modules/discount-campaign/discount-campaign.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CloudinaryModule,
    SecurityModule,
    AuthModule,
    AdminActionLogModule,
    UserModule,
    CarsCategoryModule,
    CarModule,
    InstallmentPlanModule,
    DiscountCampaignModule,
    OrderModule,
    PaymentModule,
    ReviewModule,
    StatsCacheModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { InstallmentPlanService } from './installment-plan.service';
import { InstallmentPlanController } from './installment-plan.controller';

@Module({
  controllers: [InstallmentPlanController],
  providers: [InstallmentPlanService],
})
export class InstallmentPlanModule {}

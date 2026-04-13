import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { AdminActionLogModule } from '../admin-action-log/admin-action-log.module';

@Module({
  imports: [AdminActionLogModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}

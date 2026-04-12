import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AdminActionLogModule } from '../admin-action-log/admin-action-log.module';

@Module({
  imports: [AdminActionLogModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}

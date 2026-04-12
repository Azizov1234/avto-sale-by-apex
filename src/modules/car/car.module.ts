import { Module } from '@nestjs/common';
import { CarsController } from './car.controller';
import { CarsService } from './car.service';
import { AdminActionLogModule } from '../admin-action-log/admin-action-log.module';

@Module({
  imports: [AdminActionLogModule],
  controllers: [CarsController],
  providers: [CarsService],
})
export class CarModule {}

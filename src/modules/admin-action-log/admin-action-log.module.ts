import { Module } from '@nestjs/common';
import { AdminActionLogController } from './admin-action-log.controller';
import { AdminActionLogService } from './admin-action-log.service';

@Module({
  controllers: [AdminActionLogController],
  providers: [AdminActionLogService],
  exports: [AdminActionLogService],
})
export class AdminActionLogModule {}

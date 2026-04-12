import { Module } from '@nestjs/common';
import { StatsCacheService } from './stats-cache.service';
import { StatsCacheController } from './stats-cache.controller';
import { AdminActionLogModule } from '../admin-action-log/admin-action-log.module';

@Module({
  imports: [AdminActionLogModule],
  controllers: [StatsCacheController],
  providers: [StatsCacheService],
})
export class StatsCacheModule {}

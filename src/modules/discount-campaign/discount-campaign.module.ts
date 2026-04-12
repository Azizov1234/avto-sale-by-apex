import { Module } from '@nestjs/common';
import { AdminActionLogModule } from '../admin-action-log/admin-action-log.module';
import { DiscountCampaignController } from './discount-campaign.controller';
import { DiscountCampaignService } from './discount-campaign.service';

@Module({
  imports: [AdminActionLogModule],
  controllers: [DiscountCampaignController],
  providers: [DiscountCampaignService],
})
export class DiscountCampaignModule {}

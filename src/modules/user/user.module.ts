import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdminActionLogModule } from '../admin-action-log/admin-action-log.module';

@Module({
  imports: [AdminActionLogModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

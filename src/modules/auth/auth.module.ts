import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SuperadminBootstrapService } from './superadmin-bootstrap.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SuperadminBootstrapService],
})
export class AuthModule {}

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtUtilsService } from './jwt.service';
import { BcryptUtilsService } from './bcrypt.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.getOrThrow<string>('JWT_SECRET_KEY');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '90m');

        return {
          secret: secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  providers: [JwtUtilsService, BcryptUtilsService],
  exports: [JwtUtilsService, BcryptUtilsService],
})
export class SecurityModule {}

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Status, UserRole } from '@prisma/client';
import { BcryptUtilsService } from 'src/common/utils/bcrypt.service';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class SuperadminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperadminBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly bcryptService: BcryptUtilsService,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureSuperadmin();
  }

  private async ensureSuperadmin() {
    const name = this.configService.get<string>('SUPERADMIN_NAME')?.trim();
    const phone = this.configService.get<string>('SUPERADMIN_PHONE')?.trim();
    const email = this.configService.get<string>('SUPERADMIN_EMAIL')?.trim();
    const password =
      this.configService.get<string>('SUPERADMIN_PASSWORD')?.trim();
    const avatarUrl =
      this.configService.get<string>('SUPERADMIN_AVATAR_URL')?.trim() || null;

    if (!name || !phone || !email || !password) {
      this.logger.warn(
        'SUPERADMIN credentials are not fully configured in .env. Bootstrap skipped.',
      );
      return;
    }

    const [existingByPhone, existingByEmail] = await Promise.all([
      this.prisma.user.findUnique({
        where: { phone },
      }),
      this.prisma.user.findUnique({
        where: { email },
      }),
    ]);

    if (
      existingByPhone &&
      existingByEmail &&
      existingByPhone.id !== existingByEmail.id
    ) {
      this.logger.error(
        'SUPERADMIN phone and email belong to different users. Resolve the conflict before bootstrapping.',
      );
      return;
    }

    const hashedPassword = await this.bcryptService.generateHashPass(password);
    const existingUser = existingByPhone ?? existingByEmail;

    if (existingUser) {
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          phone,
          email,
          password: hashedPassword,
          role: UserRole.SUPERADMIN,
          status: Status.active,
          avatarUrl,
        },
      });

      this.logger.log(`Superadmin is ready: ${phone}`);
      return;
    }

    await this.prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        role: UserRole.SUPERADMIN,
        status: Status.active,
        avatarUrl,
      },
    });

    this.logger.log(`Superadmin created successfully: ${phone}`);
  }
}

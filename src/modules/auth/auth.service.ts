import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Status } from '@prisma/client';
import { UserLoginDto, UserRegisterDto } from './dto/create-auth.dto';
import { JwtUtilsService } from 'src/common/utils/jwt.service';
import { BcryptUtilsService } from 'src/common/utils/bcrypt.service';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtUtilsService,
    private readonly bcrypt: BcryptUtilsService,
  ) {}
  async register(payload: UserRegisterDto) {
    const existPhone = await this.prisma.user.findFirst({
      where: { phone: payload.phone },
    });
    if (existPhone)
      throw new ConflictException('User with this phone already exists');

    const existEmail = await this.prisma.user.findFirst({
      where: { email: payload.email },
    });
    if (existEmail)
      throw new ConflictException('User with this email already exists');

    const hashPass = await this.bcrypt.generateHashPass(payload.password);
    const user = await this.prisma.user.create({
      data: {
        ...payload,
        password: hashPass,
      },
    });
    return {
      message: 'Successfully created ',
      status: 200,
      user: this.serializeUser(user),
      accessToken: this.jwt.generateToken({
        id: user.id,
        phone: user.phone,
        role: user.role,
      }),
    };
  }

  async login(payload: UserLoginDto) {
    const existUser = await this.prisma.user.findFirst({
      where: {
        phone: payload.phone,
        status: Status.active,
      },
    });
    if (!existUser) throw new BadRequestException('Password or Phone is wrong');

    const isMatch = await this.bcrypt.comparePasswords(
      payload.password,
      existUser.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Password or Phone is wrong');
    }
    return {
      status: 200,
      message: 'Successfully login',
      accessToken: this.jwt.generateToken(existUser),
      user: this.serializeUser(existUser),
    };
  }

  private serializeUser(user: {
    id: number;
    name: string;
    phone: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
    createdAt?: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }
}

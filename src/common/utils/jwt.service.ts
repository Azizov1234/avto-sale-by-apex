import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface IJwtPayload {
  id: number;
  phone: string;
  role: string;
}

@Injectable()
export class JwtUtilsService {
  constructor(private readonly jwt: JwtService) {}

  generateToken(payload: IJwtPayload): string {
    return this.jwt.sign({
      id: payload.id,
      phone: payload.phone,
      role: payload.role,
    });
  }

  verifyToken(token: string) {
    try {
      return this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException("Yaroqsiz yoki muddati o'tgan token");
    }
  }
}

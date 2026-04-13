import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtUtilsService } from '../utils/jwt.service';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtUtilsService) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    let token = req.headers.authorization;

    if (!token) {
      throw new UnauthorizedException('Token topilmadi');
    }

    if (!token.startsWith('Bearer ')) {
      throw new UnauthorizedException("Token formati noto'g'ri");
    }

    token = token.split(' ')[1];
    const user = this.jwt.verifyToken(token);
    req['user'] = user;

    return true;
  }
}

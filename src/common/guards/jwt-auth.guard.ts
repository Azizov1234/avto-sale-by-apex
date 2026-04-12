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
    try {
      const req = context.switchToHttp().getRequest();
      let token = req.headers.authorization;
      if (!token) throw new UnauthorizedException('Token is mising');
      if (!token.startsWith('Bearer '))
        throw new UnauthorizedException('Invalid token format');
      token = token.split(' ')[1];
      const user = this.jwt.verifyToken(token);
      req['user'] = user;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

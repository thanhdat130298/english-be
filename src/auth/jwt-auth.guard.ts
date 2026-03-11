import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_JWT_STRATEGY } from './auth.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard(AUTH_JWT_STRATEGY) {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ headers?: { authorization?: string } }>();
    const header = request.headers?.authorization ?? '';
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }
    return super.canActivate(context);
  }
}

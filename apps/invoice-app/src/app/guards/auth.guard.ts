import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { AppLogger } from '../logger/logger';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new AppLogger(JwtAuthGuard.name);

  override canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context); // allow Passport strategy to run
  }

  override handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error('Unauthorized access attempt', err);
      throw err || new UnauthorizedException('Invalid token');
    }

    this.logger.log(`User authenticated: ${user}`);
    return user;
  }
}

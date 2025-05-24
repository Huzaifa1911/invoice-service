// common/guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/common.decorator';
import { CustomRequestType } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler()
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest<CustomRequestType>();
    return requiredRoles.includes(user?.role);
  }
}

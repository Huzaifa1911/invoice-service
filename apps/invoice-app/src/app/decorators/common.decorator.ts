import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

import { CustomRequestType, RequestScopeType } from '../types/common.types';
import { Role } from '../../../generated/prisma';

export const UserInfo = createParamDecorator(
  (data: keyof CustomRequestType['user'], ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<CustomRequestType>();
    const user = request.user;
    return data ? user?.[data] : user;
  }
);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * @Scoped() injects a dynamic `where` filter based on role:
 * - ADMIN: no filter (access all)
 * - USER: only own records
 */
export const RequestScope = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestScopeType => {
    const request = ctx.switchToHttp().getRequest<CustomRequestType>();
    const user = request.user;

    return user?.role === Role.ADMIN ? {} : { userId: user?.id };
  }
);

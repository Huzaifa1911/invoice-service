import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CustomRequestType } from '../types/common.types';

export const UserInfo = createParamDecorator(
  (data: keyof CustomRequestType['user'], ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<CustomRequestType>();
    const user = request.user;
    return data ? user?.[data] : user;
  }
);

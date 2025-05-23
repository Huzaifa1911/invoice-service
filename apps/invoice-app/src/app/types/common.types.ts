import { Request } from 'express';

import { Role } from '../../../generated/prisma';

export type CustomRequestType = Request & {
  user: {
    id: string;
    email: string;
    role: Role;
  };
};

export type RequestScopeType = Record<string, any>;

export type JWTDecodedPayload = {
  id: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
};

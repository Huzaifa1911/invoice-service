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

export type SalesReportMeta = {
  date: string;
  amount: number;
  profit: number;
  items: SalesReportItem[];
};

export type SalesReportItem = {
  sku: string;
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
};

export type ExportAttachment = {
  attachment: Buffer;
  filename: string;
};

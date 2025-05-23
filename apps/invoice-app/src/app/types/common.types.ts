import { Request } from 'express';

export type CustomRequestType = Request & {
  user: {
    id: string;
  };
};

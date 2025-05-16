import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

import { AppLogger } from '../logger/logger';

/**
 * Middleware function to log HTTP requests and responses.
 * @param req - The incoming request object.
 * @param res - The outgoing response object.
 * @param next - The next function to be called in the middleware chain.
 */
@Injectable()
export class AppLoggingMiddleware implements NestMiddleware {
  private readonly logger = new AppLogger('routing-middleware');
  use(req: Request, res: Response, next: () => void): void {
    const { method, originalUrl: url } = req;

    res.on('close', () => {
      const { statusCode } = res;
      this.logger.log(`${method} ${url} ${statusCode}`);
    });

    res.on('error', (err) => {
      const { statusCode } = res;
      this.logger.error(`${method} ${url} ${statusCode}`, JSON.stringify(err));
    });
    next();
  }
}

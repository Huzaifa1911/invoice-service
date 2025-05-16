import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

import { AppLogger } from '../logger/logger';

/**
 * Custom exception filter for Invoice Service.
 * This filter catches HttpException and sends a formatted error response.
 */
@Catch(HttpException)
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new AppLogger('exception-filter');

  /**
   * Catches the HttpException and sends a formatted error response.
   * @param exception - The HttpException object.
   * @param host - The ArgumentsHost object.
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      message: exceptionResponse['message'] || exception.message,
      error: exceptionResponse['error'] || 'Http Exception',
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `${status} - ${errorResponse.message} - ${JSON.stringify(
        exceptionResponse
      )}`
    );

    response.status(status).send(errorResponse);
  }
}

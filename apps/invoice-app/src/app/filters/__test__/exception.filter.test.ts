import { HttpException, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { AppExceptionFilter } from '../exception.filter';

describe('AppExceptionFilter (instance‐based logger spy)', () => {
  let filter: AppExceptionFilter;
  let mockLoggerError: jest.Mock;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AppExceptionFilter();

    const loggerInstance = (filter as any).logger;
    // Now override its `error` method:
    loggerInstance.error = jest.fn();
    mockLoggerError = loggerInstance.error as jest.Mock;
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ send: sendMock });

    mockResponse = {
      status: statusMock,
      send: sendMock,
    };

    // ─── Step 4: Stub out ArgumentsHost so that switchToHttp().getResponse() returns mockResponse ──
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse as Response,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send a formatted error response and log the error when exception.getResponse() is an object', () => {
    // Arrange: an HttpException whose getResponse() returns { message, error }
    const exception = new HttpException(
      { message: 'Test error occurred', error: 'BadRequest' },
      400
    );

    // Act: call the filter
    filter.catch(exception, mockArgumentsHost);

    // Assert: status(400) was called once
    expect(statusMock).toHaveBeenCalledTimes(1);
    expect(statusMock).toHaveBeenCalledWith(400);

    // Assert: send(...) was called with the correctly formatted object
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Test error occurred', // comes from exceptionResponse.message
        error: 'BadRequest', // comes from exceptionResponse.error
        timestamp: expect.any(String), // ISO string
      })
    );

    // Assert: logger.error(...) was called once, and contains "400 - Test error occurred"
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringMatching(/^400 - Test error occurred/)
    );
  });

  it('should default to exception.message and "Http Exception" when exception.getResponse() is a string', () => {
    // Arrange: an HttpException whose getResponse() returns a plain string
    const exception = new HttpException('Simple string error', 500);

    // Act
    filter.catch(exception, mockArgumentsHost);

    // Assert: status(500) was called
    expect(statusMock).toHaveBeenCalledWith(500);

    // Assert: send(...) was called with fallback fields
    //   • message → exception.message
    //   • error → 'Http Exception'
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: exception.message, // because exceptionResponse['message'] is undefined
        error: 'Http Exception', // fallback value
        timestamp: expect.any(String),
      })
    );

    // Assert: logger.error(...) was still called exactly once
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });
});

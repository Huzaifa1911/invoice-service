import { EventEmitter } from 'events';
import { AppLoggingMiddleware } from '../logger.middleware';
import { Request, Response } from 'express';

describe('AppLoggingMiddleware', () => {
  let middleware: AppLoggingMiddleware;
  let mockLoggerLog: jest.Mock;
  let mockLoggerError: jest.Mock;
  let req: Partial<Request>;
  let res: EventEmitter & Partial<Response>;
  let nextFn: jest.Mock;

  beforeEach(() => {
    // Instantiate the middleware
    middleware = new AppLoggingMiddleware();

    // Override its private logger methods
    const loggerInstance = (middleware as any).logger;
    loggerInstance.log = jest.fn();
    loggerInstance.error = jest.fn();
    mockLoggerLog = loggerInstance.log as jest.Mock;
    mockLoggerError = loggerInstance.error as jest.Mock;

    // Create a fake request
    req = {
      method: 'GET',
      originalUrl: '/test-url',
    };

    // Create a fake response as an EventEmitter with a statusCode property
    res = new EventEmitter() as EventEmitter & Partial<Response>;
    res.statusCode = 200;

    // Provide an `on` alias to EventEmitter.on to satisfy Express typings
    res.on = res.addListener.bind(res);

    nextFn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() exactly once and log on "close" and "error" events', () => {
    // Act: bind the middleware
    middleware.use(req as Request, res as Response, nextFn);

    // next() should have been called once during `.use(...)`
    expect(nextFn).toHaveBeenCalledTimes(1);

    // Simulate the 'close' event
    res.statusCode = 201;
    res.emit('close');

    // logger.log should have been called once with "GET /test-url 201"
    expect(mockLoggerLog).toHaveBeenCalledTimes(1);
    expect(mockLoggerLog).toHaveBeenCalledWith('GET /test-url 201');

    // Reset the mock counts
    mockLoggerLog.mockClear();
    mockLoggerError.mockClear();

    // Simulate the 'error' event
    const fakeError = { message: 'Something bad happened' };
    res.statusCode = 500;
    res.emit('error', fakeError);

    // logger.error should have been called once with:
    // • message "GET /test-url 500"
    // • JSON.stringify(fakeError)
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      'GET /test-url 500',
      JSON.stringify(fakeError)
    );

    // logger.log should not have been called again
    expect(mockLoggerLog).not.toHaveBeenCalled();
  });
});

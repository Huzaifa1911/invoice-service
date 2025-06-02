import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockLoggerError: jest.Mock;
  let mockLoggerLog: jest.Mock;

  beforeEach(() => {
    guard = new JwtAuthGuard();

    // Override the private `logger` property on the guard instance
    // so we can spy on its error(...) and log(...) methods.
    const loggerInstance = (guard as any).logger;
    loggerInstance.error = jest.fn();
    loggerInstance.log = jest.fn();

    mockLoggerError = loggerInstance.error as jest.Mock;
    mockLoggerLog = loggerInstance.log as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleRequest', () => {
    const dummyContext = {} as ExecutionContext;

    it('should call logger.error and rethrow `err` when err is truthy', () => {
      const fakeError = new Error('Something went wrong');
      const user = { id: 'user1' };
      const info = {};

      expect(() => guard.handleRequest(fakeError, user, info)).toThrow(
        fakeError
      );

      // logger.error called once with message and the error object
      expect(mockLoggerError).toHaveBeenCalledTimes(1);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Unauthorized access attempt',
        fakeError
      );
    });

    it('should call logger.error and throw UnauthorizedException when user is falsy and err is falsy', () => {
      const err = null;
      const user = null;
      const info = {};

      expect(() => guard.handleRequest(err, user, info)).toThrowError(
        new UnauthorizedException('Invalid token')
      );

      // logger.error called once with message and null
      expect(mockLoggerError).toHaveBeenCalledTimes(1);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Unauthorized access attempt',
        null
      );
    });

    it('should call logger.log and return user when err is falsy and user is truthy', () => {
      const err = null;
      const user = { id: 'user123', email: 'a@b.com' };
      const info = {};

      const result = guard.handleRequest(err, user, info);

      // Should not throw
      expect(result).toEqual(user);

      // logger.log called once with the message containing the user object
      expect(mockLoggerLog).toHaveBeenCalledTimes(1);
      expect(mockLoggerLog).toHaveBeenCalledWith(`User authenticated: ${user}`);
    });
  });

  describe('canActivate', () => {
    it('should delegate to super.canActivate (default behavior)', async () => {
      // Since JwtAuthGuard extends AuthGuard('jwt'), super.canActivate returns either a boolean
      // or a Promise<boolean>. We can spy on the parent implementation by temporarily patching it.

      // Capture the original parent method
      const parentProto = Object.getPrototypeOf(JwtAuthGuard.prototype);
      const originalCanActivate = parentProto.canActivate;

      // Mock parent canActivate to return `true`
      parentProto.canActivate = jest.fn().mockReturnValue(true);

      const dummyContext = {
        switchToHttp: () => ({ getRequest: () => ({}) }),
      } as any;

      const result = guard.canActivate(dummyContext as ExecutionContext);

      expect(result).toBe(true);
      expect(parentProto.canActivate).toHaveBeenCalledWith(dummyContext);

      // Restore the original implementation
      parentProto.canActivate = originalCanActivate;
    });
  });
});

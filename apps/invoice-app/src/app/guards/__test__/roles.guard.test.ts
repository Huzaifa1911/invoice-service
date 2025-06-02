import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../roles.guard';
import { ROLES_KEY } from '../../decorators/common.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    // Create a Reflector instance and spy on its get() method
    reflector = new Reflector();
    jest.spyOn(reflector, 'get');

    // Instantiate the guard with the mocked Reflector
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should allow access when no roles metadata is set', () => {
    // Arrange: Reflector.get returns undefined (no metadata)
    (reflector.get as jest.Mock).mockReturnValue(undefined);

    // Build a fake ExecutionContext where switchToHttp().getRequest() returns some request
    const context = {
      getHandler: () => ({}),
      switchToHttp: () =>
        ({
          getRequest: () => ({
            user: { role: 'anyrole' },
          }),
          // Cast to any so TypeScript won't complain about missing methods
        } as any),
    } as unknown as ExecutionContext;

    // Act
    const canActivate = guard.canActivate(context);

    // Assert
    expect(reflector.get).toHaveBeenCalledWith(ROLES_KEY, context.getHandler());
    expect(canActivate).toBe(true);
  });

  it('should allow access when user.role is included in requiredRoles', () => {
    // Arrange: Reflector.get returns ['admin']
    (reflector.get as jest.Mock).mockReturnValue(['admin']);

    // Fake request where user.role === 'admin'
    const context = {
      getHandler: () => ({}),
      switchToHttp: () =>
        ({
          getRequest: () => ({
            user: { role: 'admin' },
          }),
        } as any),
    } as unknown as ExecutionContext;

    // Act
    const canActivate = guard.canActivate(context);

    // Assert
    expect(reflector.get).toHaveBeenCalledWith(ROLES_KEY, context.getHandler());
    expect(canActivate).toBe(true);
  });

  it('should deny access when user.role is not included in requiredRoles', () => {
    // Arrange: Reflector.get returns ['admin']
    (reflector.get as jest.Mock).mockReturnValue(['admin']);

    // Fake request where user.role === 'user'
    const context = {
      getHandler: () => ({}),
      switchToHttp: () =>
        ({
          getRequest: () => ({
            user: { role: 'user' },
          }),
        } as any),
    } as unknown as ExecutionContext;

    // Act
    const canActivate = guard.canActivate(context);

    // Assert
    expect(reflector.get).toHaveBeenCalledWith(ROLES_KEY, context.getHandler());
    expect(canActivate).toBe(false);
  });

  it('should deny access when no user is present', () => {
    // Arrange: Reflector.get returns ['admin']
    (reflector.get as jest.Mock).mockReturnValue(['admin']);

    // Fake request where user is undefined
    const context = {
      getHandler: () => ({}),
      switchToHttp: () =>
        ({
          getRequest: () => ({
            // no user property
          }),
        } as any),
    } as unknown as ExecutionContext;

    // Act
    const canActivate = guard.canActivate(context);

    // Assert
    expect(reflector.get).toHaveBeenCalledWith(ROLES_KEY, context.getHandler());
    expect(canActivate).toBe(false);
  });
});

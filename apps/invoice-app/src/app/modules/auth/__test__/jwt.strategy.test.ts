/**
 * jwt.strategy.spec.ts
 *
 * Jest test suite for JwtStrategy.
 * Mocks ConfigService to verify:
 *  - The constructor calls getOrThrow('JWT_SECRET') to retrieve the secret.
 *  - The validate() method returns the correct user object based on the JWT payload.
 */

import { JwtStrategy } from '../jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockConfigService: { getOrThrow: jest.Mock };

  beforeEach(() => {
    // Mock ConfigService.getOrThrow to return a fixed secret
    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
    };

    // Instantiate JwtStrategy with the mocked ConfigService
    strategy = new JwtStrategy(mockConfigService as unknown as ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should call getOrThrow with "JWT_SECRET" in the constructor', () => {
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('validate() should return a user object matching the payload', async () => {
    const payload = {
      id: 'user-123',
      email: 'user@example.com',
      role: 'admin',
    };

    const result = await strategy.validate(payload as any);
    expect(result).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      role: 'admin',
    });
  });
});

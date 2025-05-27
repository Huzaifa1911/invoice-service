import { ConfigService } from '@nestjs/config';
import { ExtractJwt } from 'passport-jwt';

import { JwtStrategy } from '../jwt.strategy';
import { JWTDecodedPayload } from '../../../types';

jest.mock('@nestjs/config');

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;

  const JWT_SECRET = 'test-secret';

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue(JWT_SECRET),
    } as unknown as jest.Mocked<ConfigService>;

    jwtStrategy = new JwtStrategy(configService);
  });

  it('should call ConfigService.getOrThrow with JWT_SECRET', () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('should extract token from Authorization header correctly', () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer abc.def.ghi',
      },
    };

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(mockReq);
    expect(token).toBe('abc.def.ghi');
  });

  describe('validate', () => {
    it('should return the user object from JWT payload', async () => {
      const payload: JWTDecodedPayload = {
        id: 'user123',
        email: 'user@example.com',
        role: 'ADMIN',
        iat: 100,
        exp: 200,
      };

      const result = await jwtStrategy.validate(payload);
      expect(result).toEqual({
        id: 'user123',
        email: 'user@example.com',
        role: 'ADMIN',
      });
    });

    it('should handle missing fields in payload', async () => {
      const payload: Partial<JWTDecodedPayload> = {
        id: 'user123',
      };

      const result = await jwtStrategy.validate(payload as any);
      expect(result).toEqual({
        id: 'user123',
        email: undefined,
        role: undefined,
      });
    });
  });
});

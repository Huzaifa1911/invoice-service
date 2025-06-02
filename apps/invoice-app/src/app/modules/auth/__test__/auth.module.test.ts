import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { JwtStrategy } from '../jwt.strategy';
import { PrismaModule } from '../../prisma/prisma.module';

describe('AuthModule', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let authController: AuthController;
  let jwtStrategy: JwtStrategy;
  let jwtService: JwtService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        // Ensure ConfigService is available for JwtModule.registerAsync
        ConfigModule.forRoot({ isGlobal: true }),

        // Import PassportModule so JwtStrategy can extend it
        PassportModule,

        // Finally import the AuthModule
        AuthModule,
        PrismaModule,
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    authController = moduleRef.get<AuthController>(AuthController);
    jwtStrategy = moduleRef.get<JwtStrategy>(JwtStrategy);
    jwtService = moduleRef.get<JwtService>(JwtService);
  });

  it('should compile AuthModule', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should have AuthService defined', () => {
    expect(authService).toBeDefined();
  });

  it('should have AuthController defined', () => {
    expect(authController).toBeDefined();
  });

  it('should have JwtStrategy defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  it('should have JwtService defined (JwtModule imported)', () => {
    expect(jwtService).toBeDefined();
  });

  it('should return the same AuthService instance when requested again', () => {
    const exportedService = moduleRef.get<AuthService>(AuthService);
    expect(exportedService).toBe(authService);
  });
});

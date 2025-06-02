import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma.module';
import { PrismaService } from '../prisma.service';

// Mock the generated PrismaClient so no real DB connection is made.
// The mock stores the constructor arguments on `this.__constructOpts`.
jest.mock('../../../../../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(function (this: any, opts: any) {
    this.__constructOpts = opts;
  }),
}));

import { PrismaClient } from '../../../../../generated/prisma';

describe('PrismaModule', () => {
  let moduleRef: TestingModule;
  let prismaService: PrismaService;
  let configService: ConfigService;

  beforeAll(async () => {
    // Set a known DATABASE_URL for testing
    process.env.DATABASE_URL =
      'postgresql://test_user:test_pass@localhost:5432/testdb';

    moduleRef = await Test.createTestingModule({
      imports: [
        // Provide ConfigService with the DATABASE_URL from env
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
      ],
    }).compile();

    prismaService = moduleRef.get<PrismaService>(PrismaService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  it('should compile PrismaModule', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should have PrismaService defined', () => {
    expect(prismaService).toBeDefined();
    expect(prismaService).toBeInstanceOf(PrismaService);
  });

  it('should use ConfigService to pass DATABASE_URL to PrismaClient', () => {
    // The mocked PrismaClient stores constructor options in "__constructOpts"
    const constructedOpts = (prismaService as any).__constructOpts;
    expect(PrismaClient).toHaveBeenCalledTimes(1);

    // The ConfigService.get('DATABASE_URL') should match our process.env setting
    const expectedUrl = configService.get<string>('DATABASE_URL');
    expect(expectedUrl).toBe(
      'postgresql://test_user:test_pass@localhost:5432/testdb'
    );

    expect(constructedOpts).toHaveProperty('datasources.db.url', expectedUrl);
    expect(constructedOpts).toHaveProperty('log', ['query', 'error', 'warn']);
  });

  it('should return the same PrismaService instance when requested again', () => {
    const again = moduleRef.get<PrismaService>(PrismaService);
    expect(again).toBe(prismaService);
  });
});

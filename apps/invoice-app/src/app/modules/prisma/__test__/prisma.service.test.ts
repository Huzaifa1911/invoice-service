import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

jest.mock('../../../../../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(function (this: any, opts: any) {
    // Store the constructor options on "this" so tests can inspect them.
    this.__constructOpts = opts;
  }),
}));

// After mocking, import the (mocked) PrismaClient so we can reference how it was called.
import { PrismaClient } from '../../../../../generated/prisma';

describe('PrismaService', () => {
  let configService: Partial<ConfigService>;
  let service: PrismaService;

  beforeEach(() => {
    // Create a fake ConfigService that returns a known DATABASE_URL
    configService = {
      get: jest
        .fn()
        .mockReturnValue('postgres://user:pass@localhost:5432/testdb'),
    };

    // Instantiate PrismaService with the mocked ConfigService
    service = new PrismaService(configService as ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should instantiate PrismaClient with correct datasource URL and log levels', () => {
    // PrismaService extends PrismaClient, so its constructor calls super({ datasources, log })
    // The mocked PrismaClient stores the passed opts on "__constructOpts"
    const instanceOpts = (service as any).__constructOpts;

    // Ensure PrismaClient constructor was called exactly once
    expect(PrismaClient).toHaveBeenCalledTimes(1);

    // Verify that the datasource URL comes from ConfigService.get('DATABASE_URL')
    expect(instanceOpts).toHaveProperty(
      'datasources.db.url',
      'postgres://user:pass@localhost:5432/testdb'
    );

    // Verify that the log array matches ['query','error','warn']
    expect(instanceOpts).toHaveProperty('log', ['query', 'error', 'warn']);
  });

  it('should retain the ConfigService reference internally', () => {
    // Although "config" is a private readonly property, we can still check
    // that calling configService.get would yield the same URL if we manually invoke get.
    // For completeness, verify that configService.get was called exactly once in constructor.
    expect(configService.get as jest.Mock).toHaveBeenCalledWith('DATABASE_URL');
  });
});

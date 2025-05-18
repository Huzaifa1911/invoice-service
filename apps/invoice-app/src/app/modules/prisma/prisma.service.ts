import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaClient } from '../../../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly config: ConfigService) {
    // Enable the accelerate extension
    super({
      datasources: { db: { url: config.get('DATABASE_URL') } },
      log: ['query', 'error', 'warn'],
    });
  }
}

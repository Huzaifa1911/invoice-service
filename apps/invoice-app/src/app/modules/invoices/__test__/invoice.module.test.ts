// src/app/invoice/__tests__/invoice.module.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { InvoiceModule } from '../invoice.module';
import { InvoiceService } from '../invoice.service';
import { InvoiceController } from '../invoice.controller';

// Import the GLOBAL modules (they export PrismaService and RabbitMQService)
import { PrismaModule } from '../../prisma/prisma.module';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';

describe('InvoiceModule', () => {
  let moduleRef: TestingModule;
  let invoiceService: InvoiceService;
  let invoiceController: InvoiceController;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        // Ensure ConfigService is registered globally so PrismaService can inject it
        ConfigModule.forRoot({ isGlobal: true }),

        // Import global modules so that PrismaService and RabbitMQService are available
        PrismaModule,
        RabbitMQModule,

        // Then import the InvoiceModule under test
        InvoiceModule,
      ],
    }).compile();

    invoiceService = moduleRef.get<InvoiceService>(InvoiceService);
    invoiceController = moduleRef.get<InvoiceController>(InvoiceController);
  });

  it('should compile InvoiceModule', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should have InvoiceService defined', () => {
    expect(invoiceService).toBeDefined();
  });

  it('should have InvoiceController defined', () => {
    expect(invoiceController).toBeDefined();
  });

  it('should return the same InvoiceService instance when requested again', () => {
    const exportedService = moduleRef.get<InvoiceService>(InvoiceService);
    expect(exportedService).toBe(invoiceService);
  });
});

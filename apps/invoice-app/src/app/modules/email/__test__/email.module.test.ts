// src/app/email/__tests__/email.module.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

import { EmailModule } from '../email.module';
import { EmailService } from '../email.service';
import { EmailController } from '../email.controller';
import { InvoiceService } from '../../invoices/invoice.service';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { PrismaModule } from '../../prisma/prisma.module';

describe('EmailModule', () => {
  let moduleRef: TestingModule;
  let emailService: EmailService;
  let emailController: EmailController;
  let invoiceService: InvoiceService;
  let mailerService: MailerService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        // Provide ConfigService globally
        ConfigModule.forRoot({ isGlobal: true }),

        // Import the global RabbitMQModule so that RabbitMQService is available
        RabbitMQModule,

        // Finally import the EmailModule itself
        EmailModule,
        PrismaModule,
      ],
    }).compile();

    emailService = moduleRef.get<EmailService>(EmailService);
    emailController = moduleRef.get<EmailController>(EmailController);
    invoiceService = moduleRef.get<InvoiceService>(InvoiceService);
    mailerService = moduleRef.get<MailerService>(MailerService);
  });

  it('should compile EmailModule', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should have EmailService defined', () => {
    expect(emailService).toBeDefined();
  });

  it('should have EmailController defined', () => {
    expect(emailController).toBeDefined();
  });

  it('should have InvoiceService defined', () => {
    expect(invoiceService).toBeDefined();
  });

  it('should have MailerService defined (MailerModule imported)', () => {
    expect(mailerService).toBeDefined();
  });

  it('should return the same EmailService instance when requested again', () => {
    const exportedService = moduleRef.get<EmailService>(EmailService);
    expect(exportedService).toBe(emailService);
  });
});

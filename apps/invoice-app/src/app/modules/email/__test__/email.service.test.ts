import { EmailService } from '../email.service';
import { MailerService } from '@nestjs-modules/mailer';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { InvoiceService } from '../../invoices/invoice.service';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../../../logger/logger';
import { DAILY_SALES_REPORT_QUEUE } from '../../../utils';
import { ExportAttachment } from '../../../types';

describe('EmailService', () => {
  let service: EmailService;
  let mockMailer: Partial<MailerService>;
  let mockQueue: Partial<RabbitMQService>;
  let mockInvoice: Partial<InvoiceService>;
  let mockConfig: Partial<ConfigService>;
  let mockLoggerLog: jest.Mock;
  let mockLoggerError: jest.Mock;

  beforeEach(() => {
    // Create mocks for dependencies
    mockMailer = {
      sendMail: jest.fn(),
    };
    mockQueue = {
      consume: jest.fn(),
    } as any;
    mockInvoice = {
      generateSalesReport: jest.fn(),
    };
    mockConfig = {
      get: jest.fn(),
    };

    service = new EmailService(
      mockMailer as MailerService,
      mockQueue as RabbitMQService,
      mockInvoice as InvoiceService,
      mockConfig as ConfigService
    );

    // Override private logger methods
    const loggerInstance = (service as any).logger as AppLogger;
    loggerInstance.log = jest.fn();
    loggerInstance.error = jest.fn();
    mockLoggerLog = loggerInstance.log as jest.Mock;
    mockLoggerError = loggerInstance.error as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should register a consumer on initialization', () => {
      // Act
      service.onModuleInit();

      // Assert: queue.consume called with correct queue name and a function callback
      expect(mockQueue.consume).toHaveBeenCalledTimes(1);
      expect(mockQueue.consume).toHaveBeenCalledWith(
        DAILY_SALES_REPORT_QUEUE,
        expect.any(Function)
      );
    });

    it('should process queue message: missing ADMIN_EMAIL', async () => {
      // Arrange
      (mockConfig.get as jest.Mock).mockReturnValue(undefined);
      service.onModuleInit();
      // Retrieve the callback passed to consume
      const callback = (mockQueue.consume as jest.Mock).mock.calls[0][1];

      // Create a fake ExportAttachment
      const fakeReport: ExportAttachment = {
        filename: 'r.pdf',
        attachment: Buffer.from('data'),
      };

      // Act: invoke callback
      await callback(fakeReport);

      // Assert: since ADMIN_EMAIL is undefined, logger.error called and no sendMail
      expect(mockConfig.get).toHaveBeenCalledWith('ADMIN_EMAIL');
      expect(mockLoggerError).toHaveBeenCalledWith(
        'ADMIN_EMAIL is not defined in the environment variables.'
      );
      expect(mockMailer.sendMail).not.toHaveBeenCalled();
    });

    it('should process queue message: successful send', async () => {
      // Arrange
      (mockConfig.get as jest.Mock).mockReturnValue('admin@example.com');
      // Spy on private sendEmail to avoid nested logic
      const sendEmailSpy = jest
        .spyOn<any, any>(service as any, 'sendEmail')
        .mockResolvedValue({});

      service.onModuleInit();
      const callback = (mockQueue.consume as jest.Mock).mock.calls[0][1];
      const fakeReport: ExportAttachment = {
        filename: 'r.pdf',
        attachment: Buffer.from('data'),
      };

      // Act
      await callback(fakeReport);

      // Assert: sendEmail called with correct params and logger.log
      expect(sendEmailSpy).toHaveBeenCalledWith(
        'admin@example.com',
        expect.any(String),
        [fakeReport]
      );
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Report successfully emailed to admin: admin@example.com`
      );
    });

    it('should catch errors during processing and log error', async () => {
      // Arrange: ADMIN_EMAIL defined
      (mockConfig.get as jest.Mock).mockReturnValue('admin@example.com');
      // Make sendEmail throw
      const error = new Error('fail send');
      jest
        .spyOn<any, any>(service as any, 'sendEmail')
        .mockRejectedValue(error);

      service.onModuleInit();
      const callback = (mockQueue.consume as jest.Mock).mock.calls[0][1];
      const fakeReport: ExportAttachment = {
        filename: 'r.pdf',
        attachment: Buffer.from('data'),
      };

      // Act
      await callback(fakeReport);

      // Assert: logger.error called with message and error
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to process queue message for sales report.',
        error
      );
    });
  });

  describe('sendEmailToRecipent', () => {
    const recipient = 'user@example.com';
    const fakeAttachment: ExportAttachment = {
      filename: 'sales.pdf',
      attachment: Buffer.from('pdfbytes'),
    };

    it('should send email when report is generated', async () => {
      // Arrange: generateSalesReport returns attachment
      (mockInvoice.generateSalesReport as jest.Mock).mockResolvedValue(
        fakeAttachment
      );

      // Spy on private sendEmail
      const sendEmailSpy = jest
        .spyOn<any, any>(service as any, 'sendEmail')
        .mockResolvedValue({});

      // Act
      await service.sendEmailToRecipent(recipient);

      // Assert: logger.log called, generateSalesReport called, sendEmail called, logger.log called again
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Preparing to send sales report to ${recipient}`
      );
      expect(mockInvoice.generateSalesReport).toHaveBeenCalled();
      expect(sendEmailSpy).toHaveBeenCalledWith(recipient, expect.any(String), [
        fakeAttachment,
      ]);
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Sales report sent to ${recipient}`
      );
    });

    it('should throw error and log when no attachment generated', async () => {
      // Arrange: generateSalesReport returns null
      (mockInvoice.generateSalesReport as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.sendEmailToRecipent(recipient)).rejects.toThrow(
        `Failed to send email to ${recipient}: No attachment generated for the sales report.`
      );

      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Preparing to send sales report to ${recipient}`
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        `Failed to send email to ${recipient}`,
        expect.any(Error)
      );
    });

    it('should throw error and log when generateSalesReport throws', async () => {
      // Arrange: generateSalesReport throws
      const genError = new Error('DB error');
      (mockInvoice.generateSalesReport as jest.Mock).mockRejectedValue(
        genError
      );

      // Act & Assert
      await expect(service.sendEmailToRecipent(recipient)).rejects.toThrow(
        `Failed to send email to ${recipient}: ${genError.message}`
      );

      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Preparing to send sales report to ${recipient}`
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        `Failed to send email to ${recipient}`,
        genError
      );
    });
  });
});

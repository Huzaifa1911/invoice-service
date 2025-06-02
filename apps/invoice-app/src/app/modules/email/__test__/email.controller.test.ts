import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { EmailController } from '../email.controller';
import { EmailService } from '../email.service';
import { EmailInvoiceReportDto } from '../dto/email.dto';

describe('EmailController', () => {
  let controller: EmailController;
  let mockEmailService: Partial<EmailService>;
  let mockLoggerLog: jest.Mock;
  let mockLoggerError: jest.Mock;

  beforeEach(() => {
    // Create a mock EmailService with sendEmailToRecipent method
    mockEmailService = {
      sendEmailToRecipent: jest.fn(),
    };

    controller = new EmailController(mockEmailService as EmailService);

    // Override the private logger methods to jest.fn()
    const loggerInstance = (controller as any).logger as Logger;
    loggerInstance.log = jest.fn();
    loggerInstance.error = jest.fn();
    mockLoggerLog = loggerInstance.log as jest.Mock;
    mockLoggerError = loggerInstance.error as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendReportToRecipient', () => {
    const dto: EmailInvoiceReportDto = { to: 'recipient@example.com' };

    it('should return success message when EmailService.sendEmailToRecipent resolves', async () => {
      // Arrange: mock sendEmailToRecipent to resolve
      (mockEmailService.sendEmailToRecipent as jest.Mock).mockResolvedValue(
        undefined
      );

      // Act
      const result = await controller.sendReportToRecipient(dto);

      // Assert
      expect(mockEmailService.sendEmailToRecipent).toHaveBeenCalledWith(dto.to);
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Attempting to send report to ${dto.to}`
      );
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Email sent successfully to ${dto.to}`
      );
      expect(result).toEqual({ message: 'Email sent successfully' });
    });

    it('should throw HttpException with INTERNAL_SERVER_ERROR when EmailService.sendEmailToRecipent rejects', async () => {
      // Arrange: mock sendEmailToRecipent to reject
      const serviceError = new Error('SMTP failure');
      (mockEmailService.sendEmailToRecipent as jest.Mock).mockRejectedValue(
        serviceError
      );

      // Act & Assert
      await expect(controller.sendReportToRecipient(dto)).rejects.toEqual(
        new HttpException(
          'Failed to send email. Please try again later.',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      );

      expect(mockEmailService.sendEmailToRecipent).toHaveBeenCalledWith(dto.to);
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Attempting to send report to ${dto.to}`
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        `Failed to send email to ${dto.to}`,
        serviceError
      );
    });
  });
});

import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { DAILY_SALES_REPORT_QUEUE } from '../../utils';
import { ExportAttachment } from '../../types';
import { InvoiceService } from '../invoices/invoice.service';
import { AppLogger } from '../../logger/logger';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new AppLogger(EmailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly queueService: RabbitMQService,
    private readonly invoiceService: InvoiceService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Subscribes to the RabbitMQ queue for daily sales reports
   * and sends an email to the admin with the generated report.
   */
  onModuleInit(): void {
    this.queueService.consume(
      DAILY_SALES_REPORT_QUEUE,
      async (report: ExportAttachment) => {
        try {
          const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
          if (!adminEmail) {
            this.logger.error(
              'ADMIN_EMAIL is not defined in the environment variables.'
            );
            return;
          }

          await this.sendEmail(adminEmail, this.getEmailTemplate(), [report]);
          this.logger.log(
            `Report successfully emailed to admin: ${adminEmail}`
          );
        } catch (error) {
          this.logger.error(
            'Failed to process queue message for sales report.',
            error as any
          );
        }
      }
    );
  }

  /**
   * Sends the latest generated sales report to a given recipient.
   * @param to - Email address of the recipient
   * @throws Error if attachment generation or sending fails
   */
  async sendEmailToRecipent(to: string): Promise<void> {
    this.logger.log(`Preparing to send sales report to ${to}`);
    try {
      const attachment = await this.invoiceService.generateSalesReport();

      if (!attachment) {
        this.logger.error('No attachment generated for the sales report.');
        throw new Error('No attachment generated for the sales report.');
      }

      await this.sendEmail(to, this.getEmailTemplate(), [attachment]);
      this.logger.log(`Sales report sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error as any);
      throw new Error(
        `Failed to send email to ${to}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Internal method to send an email with optional HTML body and attachments.
   * @param to - Email recipient
   * @param body - HTML content of the email
   * @param attachments - Optional list of files to attach
   */
  private async sendEmail(
    to: string,
    body?: string,
    attachments?: ExportAttachment[]
  ): Promise<void> {
    try {
      await this.mailer.sendMail({
        to,
        subject: '📊 Daily Sales Report',
        html: body ?? '<b>This is the default HTML body</b>',
        attachments: attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: Buffer.isBuffer(attachment.attachment)
            ? attachment.attachment
            : Buffer.from(attachment.attachment, 'base64'),
        })),
      });
    } catch (error) {
      this.logger.error(`Failed to send mail to ${to}`, error as any);
      throw error;
    }
  }

  /**
   * Generates the default HTML template for the daily report email.
   * @returns A string containing HTML content.
   */
  private getEmailTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2>📊 Daily Sales Report</h2>
        <p><strong>Report Date:</strong> ${new Date().toLocaleString()}</p>
        <br />
        <p>The detailed sales report is attached as a PDF document.</p>
        <p>Regards,<br/>Sales Automation System</p>
      </div>
    `;
  }
}

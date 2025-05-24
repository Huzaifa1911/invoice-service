// src/email/email.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { DAILY_SALES_REPORT_QUEUE } from '../../utils';
import { ExportAttachment } from '../../types';

@Injectable()
export class EmailService implements OnModuleInit {
  constructor(
    private readonly mailer: MailerService,
    private readonly queueService: RabbitMQService,
    private readonly configService: ConfigService
  ) {}

  // Simple text or HTML email
  async sendTestEmail(to: string) {
    await this.mailer.sendMail({
      to,
      subject: 'Hello from NestJS!',
      text: 'This is a plain-text body',
      html: '<b>This is HTML body</b>',
    });
  }

  // Simple text or HTML email
  private async sendEmail(
    to: string,
    body?: string,
    attachements?: ExportAttachment[]
  ) {
    await this.mailer.sendMail({
      to,
      subject: 'Daily Sales Report',
      html: body ?? '<b>This is HTML body</b>',
      attachments: attachements?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.isBuffer(attachment.attachment)
          ? attachment.attachment
          : Buffer.from(attachment.attachment, 'base64'),
      })),
    });
  }

  private getEmailTemplate(): string {
    return `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2>📊 Daily Sales Report</h2>
      <p><strong>Report Date:</strong> ${new Date().toLocaleString()}</p>
      <br />
      <p>The detailed sales report is attached as a PDF document.</p>
      <p>Regards,<br/>Sales Automation System</p>
    </div>`;
  }

  onModuleInit() {
    this.queueService.consume(
      DAILY_SALES_REPORT_QUEUE,
      async (report: ExportAttachment) => {
        this.sendEmail(
          String(this.configService.get('ADMIN_EMAIL')),
          this.getEmailTemplate(),
          [report]
        );
      }
    );
  }
}

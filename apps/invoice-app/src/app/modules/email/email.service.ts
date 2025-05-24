// src/email/email.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class EmailService implements OnModuleInit {
  constructor(
    private readonly mailer: MailerService,
    private readonly queueService: RabbitMQService
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
  private async sendEmail(to: string, body?: string) {
    await this.mailer.sendMail({
      to,
      subject: 'Hello from NestJS!',
      text: 'This is a plain-text body',
      html: body ?? '<b>This is HTML body</b>',
    });
  }

  private getEmailTemplate(report: any) {
    return `
    <div>
        <h1>Daily Sales Report</h1>
        <p>Total Amount: ${report?.totalAmount}</p>
        <p>Total Invoices: ${report?.totalItems}</p>
        <p>Generated At: ${new Date().toLocaleString()}</p>
      </div>`;
  }

  onModuleInit() {
    // Register RabbitMQ consumer for email tasks
    this.queueService.consume('daily_sales_report', async (report) => {
      this.sendEmail('ali.zaib@emumba.com', this.getEmailTemplate(report));
    });
  }
}

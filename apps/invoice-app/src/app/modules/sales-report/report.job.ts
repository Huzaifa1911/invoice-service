import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InvoiceService } from '../invoices/invoice.services';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class SalesReportJob {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly invoiceService: InvoiceService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async handleReport() {
    const report = await this.invoiceService.generateDailyReport();
    await this.rabbitMQService.publish('daily_sales_report', report);
  }
}

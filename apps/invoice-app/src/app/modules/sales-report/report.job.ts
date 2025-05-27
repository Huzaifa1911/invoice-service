import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InvoiceService } from '../invoices/invoice.services';
import { endOfDay, startOfDay } from 'date-fns';
import { AppLogger } from '../../logger/logger';

@Injectable()
export class SalesReportJob {
  private readonly logger = new AppLogger(SalesReportJob.name);
  constructor(private readonly invoiceService: InvoiceService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async handleReport() {
    this.logger.log('Generating daily sales report...');
    this.invoiceService.generateSalesReport(
      startOfDay(new Date()).toDateString(),
      endOfDay(new Date()).toDateString(),
      true // set to true to publish the report to MQ
    );
  }
}

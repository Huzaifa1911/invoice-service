import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InvoiceService } from '../invoices/invoice.service';
import { endOfDay, startOfDay } from 'date-fns';
import { AppLogger } from '../../logger/logger';

@Injectable()
export class SalesReportJob {
  private readonly logger = new AppLogger(SalesReportJob.name);
  constructor(private readonly invoiceService: InvoiceService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async handleReport() {
    try {
      this.logger.log('Generating daily sales report...');
      this.invoiceService.generateSalesReport(
        startOfDay(new Date()).toDateString(),
        endOfDay(new Date()).toDateString(),
        true // set to true to publish the report to MQ
      );
    } catch (error) {
      this.logger.error(
        'Failed to generate daily sales report. Details: ',
        error as any
      );
      throw new Error('Failed to generate daily sales report', error as any);
    }
  }
}

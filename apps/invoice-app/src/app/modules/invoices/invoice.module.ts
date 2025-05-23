import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.services';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}

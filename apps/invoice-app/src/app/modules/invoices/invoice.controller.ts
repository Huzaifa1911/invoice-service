import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { InvoiceService } from './invoice.services';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { UserInfo } from '../../decorators/user.decorator';
import { ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('/')
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering invoices',
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering invoices',
    type: String,
    example: '2024-12-31',
  })
  async getInvoices(
    @UserInfo('id') userId: string,
    @Res() res: Response,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const invoices = await this.invoiceService.getInvoices(
      userId,
      page,
      limit,
      startDate,
      endDate
    );
    res.status(200).send({
      message: 'Invoices fetched successfully',
      data: invoices,
    });
  }

  @Get('/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Invoice ID',
    type: String,
    example: '1fc75fe9-3974-4e52-a920-2fae34726b51',
  })
  async getInvoiceById(
    @Param('id') id: string,
    @UserInfo('id') userId: string,
    @Res() res: Response
  ) {
    const invoice = await this.invoiceService.getInvoiceById(id, userId);

    res.status(200).send({
      message: 'Invoice fetched successfully',
      data: invoice,
    });
  }

  @Post('/')
  async createInvoice(
    @Body() invoice: CreateInvoiceDto,
    @UserInfo('id') userId: string,
    @Res() res: Response
  ) {
    const createdInvoice = await this.invoiceService.createInvoice(
      invoice,
      userId
    );

    res.status(201).send({
      message: 'Invoice created successfully',
      data: createdInvoice,
    });
  }
}

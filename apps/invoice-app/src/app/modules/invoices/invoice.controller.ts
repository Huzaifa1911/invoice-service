import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiParam, ApiQuery } from '@nestjs/swagger';

import { InvoiceService } from './invoice.services';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import {
  Roles,
  RequestScope,
  UserInfo,
} from '../../decorators/common.decorator';

import { JwtAuthGuard } from '../../guards/auth.guard';
import type { RequestScopeType } from '../../types';
import { RolesGuard } from '../../guards/roles.guard';
import { Role } from '../../../../generated/prisma';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('/')
  @Roles(Role.ADMIN, Role.USER)
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
    @RequestScope() requestScope: RequestScopeType,
    @Res() res: Response,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const invoices = await this.invoiceService.getInvoices(
      page,
      limit,
      startDate,
      endDate,
      requestScope
    );
    res.status(200).send({
      message: 'Invoices fetched successfully',
      data: invoices,
    });
  }

  @Post('/')
  @Roles(Role.ADMIN, Role.USER)
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

  @Roles(Role.ADMIN)
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
  @Get('/report')
  async getSalesReport(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const exportInformation = await this.invoiceService.generateSalesReport(
      startDate,
      endDate
    );
    if (!exportInformation) {
      res.status(404).send('Export information not found');
      return;
    }
    const { attachment, filename } = exportInformation;
    const encodedFilename = encodeURIComponent(filename);

    res.header(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFilename}`
    );
    res.header('Content-Type', 'application/pdf');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(attachment);
  }

  @Get('/:id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Invoice ID',
    type: String,
    example: '1fc75fe9-3974-4e52-a920-2fae34726b51',
  })
  async getInvoiceById(
    @Param('id') id: string,
    @RequestScope() requestScope: RequestScopeType,
    @Res() res: Response
  ) {
    const invoice = await this.invoiceService.getInvoiceById(id, requestScope);

    res.status(200).send({
      message: 'Invoice fetched successfully',
      data: invoice,
    });
  }
}

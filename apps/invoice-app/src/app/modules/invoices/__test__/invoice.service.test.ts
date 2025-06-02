/**
 * invoice.service.spec.ts
 *
 * Jest test suite for InvoiceService.
 *
 * Mocks dependencies (PrismaService, RabbitMQService, utility functions) to verify:
 *  - getInvoices: success (returns data + meta) and error path.
 *  - getInvoiceById: found, not found, and unexpected error.
 *  - createInvoice: success, item not found, insufficient stock, and unexpected error.
 *  - generateSalesReport: success with PDF, success with publish to MQ, NotFoundException when no data, and unexpected error.
 *
 * Adjust import paths if your project structure differs. In this example:
 *   service:    src/app/invoice/invoice.service.ts
 *   utils:      src/app/utils/index.ts
 *   dtos/types: src/app/types
 *   prisma:     src/generated/prisma
 */

import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceService } from '../invoice.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { Invoice } from '../../../../../generated/prisma';

// Mock utility functions from '../../utils'
jest.mock('../../../utils', () => ({
  getPaginationParams: jest.fn().mockReturnValue({ skip: 0, take: 10 }),
  sanitizeSalesReportFileName: jest.fn().mockReturnValue('report.pdf'),
  generateSalesReportPDF: jest.fn().mockResolvedValue(Buffer.from('PDF_BYTES')),
}));

// Import mocked utilities
import {
  getPaginationParams,
  generateSalesReportPDF,
  sanitizeSalesReportFileName,
} from '../../../utils';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockPrisma: Partial<PrismaService>;
  let mockRabbitMQ: Partial<RabbitMQService>;

  beforeEach(() => {
    // Create a basic mock for PrismaService
    mockPrisma = {
      $transaction: jest.fn(),
      invoice: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        // In createInvoice, inside transaction: tx.invoice.count, tx.invoice.create
        create: jest.fn(),
      } as any,
      invoiceItem: {
        findMany: jest.fn(),
      } as any,
      item: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      } as any,
    };

    // Mock RabbitMQService
    mockRabbitMQ = {
      publish: jest.fn(),
    };

    // Instantiate InvoiceService with mocked dependencies
    service = new InvoiceService(
      mockPrisma as PrismaService,
      mockRabbitMQ as RabbitMQService
    );

    // Override logger methods to no-op
    (service as any).logger.log = jest.fn();
    (service as any).logger.error = jest.fn();
    (service as any).logger.warn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInvoices', () => {
    it('should return data and meta when successful', async () => {
      const fakeInvoices: Invoice[] = [
        {
          id: '1',
          customer: 'Alice',
          reference: 'INV-202501-0001',
          amount: 100,
          date: new Date(),
          userId: 'u1',
        } as any,
      ];
      const totalCount = 1;

      // Mock prisma.$transaction to resolve [invoices, total]
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([
        fakeInvoices,
        totalCount,
      ]);

      const result = await service.getInvoices(1, 10, undefined, undefined, {
        userId: 'u1',
      });

      expect(getPaginationParams).toHaveBeenCalledWith(1, 10);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        data: fakeInvoices,
        meta: {
          total: totalCount,
          limit: 10,
          currentPage: 1,
          nextPage: null,
          totalPages: 1,
        },
      });
    });

    it('should throw InternalServerErrorException when prisma throws', async () => {
      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      await expect(service.getInvoices()).rejects.toBeInstanceOf(
        InternalServerErrorException
      );
      expect((service as any).logger.error).toHaveBeenCalled();
    });
  });

  describe('getInvoiceById', () => {
    it('should return the invoice when found', async () => {
      const fakeInvoice: Invoice = {
        id: 'inv123',
        customer: 'Bob',
        reference: 'INV-202501-0002',
        amount: 200,
        date: new Date(),
        userId: 'u2',
      } as any;

      ((mockPrisma.invoice as any)?.findUnique as jest.Mock).mockResolvedValue(
        fakeInvoice
      );

      const result = await service.getInvoiceById('inv123', { userId: 'u2' });

      expect(mockPrisma.invoice?.findUnique).toHaveBeenCalledWith({
        where: { id: 'inv123', userId: 'u2' },
        include: { items: true, user: true },
      });
      expect(result).toEqual(fakeInvoice);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      ((mockPrisma.invoice as any)?.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      await expect(
        service.getInvoiceById('notExist', { userId: 'u3' })
      ).rejects.toBeInstanceOf(NotFoundException);
      expect((service as any).logger.warn).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      ((mockPrisma.invoice as any)?.findUnique as jest.Mock).mockRejectedValue(
        new Error('DB down')
      );

      await expect(service.getInvoiceById('id1')).rejects.toBeInstanceOf(
        InternalServerErrorException
      );
      expect((service as any).logger.error).toHaveBeenCalled();
    });
  });

  describe('createInvoice', () => {
    const userId = 'user-10';
    const createDto = {
      customer: 'Charlie',
      items: [
        { itemId: 'i1', quantity: 2 },
        { itemId: 'i2', quantity: 1 },
      ],
    };

    it('should create invoice when stock is sufficient', async () => {
      // Prepare fake items from DB
      const dbItems = [
        { id: 'i1', name: 'Item1', quantity: 5, sale_price: 10, unit_price: 6 },
        {
          id: 'i2',
          name: 'Item2',
          quantity: 3,
          sale_price: 20,
          unit_price: 12,
        },
      ];
      // Mock transaction steps
      const txMock: any = {
        item: {
          findMany: jest.fn().mockResolvedValue(dbItems),
          updateMany: jest.fn().mockResolvedValue(null),
        },
        invoice: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockResolvedValue({
            id: 'new-inv',
            ...createDto,
            amount: 40,
            date: new Date(),
            userId,
          } as any),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return await cb(txMock);
      });

      const result = await service.createInvoice(createDto as any, userId);

      // Should calculate total: (10*2) + (20*1) = 40
      expect(txMock.invoice.count).toHaveBeenCalled();
      expect(txMock.invoice.create).toHaveBeenCalled();
      expect(txMock.item.updateMany).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({ id: 'new-inv', amount: 40 })
      );
    });

    it('should throw BadRequestException if an item is not found', async () => {
      const txMock: any = {
        item: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: 'i1', quantity: 5, sale_price: 10, unit_price: 6 },
            ]),
          updateMany: jest.fn(),
        },
        invoice: { count: jest.fn(), create: jest.fn() },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return await cb(txMock);
      });

      await expect(
        service.createInvoice(createDto as any, userId)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      // Only one item has insufficient quantity
      const dbItems = [
        { id: 'i1', name: 'Item1', quantity: 1, sale_price: 10, unit_price: 6 },
        {
          id: 'i2',
          name: 'Item2',
          quantity: 3,
          sale_price: 20,
          unit_price: 12,
        },
      ];
      const txMock: any = {
        item: {
          findMany: jest.fn().mockResolvedValue(dbItems),
          updateMany: jest.fn(),
        },
        invoice: { count: jest.fn(), create: jest.fn() },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return await cb(txMock);
      });

      await expect(
        service.createInvoice(createDto as any, userId)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      // Simulate transaction throwing generic error
      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(
        new Error('Tx fail')
      );
      await expect(
        service.createInvoice(createDto as any, userId)
      ).rejects.toBeInstanceOf(InternalServerErrorException);
      expect((service as any).logger.error).toHaveBeenCalled();
    });
  });

  describe('generateSalesReport', () => {
    const todayItems = [
      {
        quantity: 2,
        Item: { sku: 'SKU1', name: 'Prod1', sale_price: 50, unit_price: 30 },
      },
      {
        quantity: 1,
        Item: { sku: 'SKU1', name: 'Prod1', sale_price: 50, unit_price: 30 },
      },
      {
        quantity: 3,
        Item: { sku: 'SKU2', name: 'Prod2', sale_price: 100, unit_price: 80 },
      },
    ];

    it('should generate and return PDF when items exist', async () => {
      // Mock prisma.invoiceItem.findMany to return items
      (mockPrisma.invoiceItem!.findMany as jest.Mock).mockResolvedValue(
        todayItems
      );

      const result = await service.generateSalesReport(
        '2025-01-01',
        '2025-01-31',
        false
      );

      expect(mockPrisma.invoiceItem?.findMany).toHaveBeenCalledWith({
        where: {
          Invoice: { date: { gte: expect.any(Date), lte: expect.any(Date) } },
        },
        include: { Item: true },
      });
      expect(generateSalesReportPDF).toHaveBeenCalled();
      expect(sanitizeSalesReportFileName).toHaveBeenCalledWith({
        date: { gte: expect.any(Object), lte: expect.any(Object) },
      });
      expect(result).toEqual({
        attachment: Buffer.from('PDF_BYTES'),
        filename: 'report.pdf',
      });
    });

    it('should publish to MQ and return null when shouldPublishToMQ is true', async () => {
      (mockPrisma.invoiceItem?.findMany as jest.Mock).mockResolvedValue(
        todayItems
      );

      const result = await service.generateSalesReport(
        undefined,
        undefined,
        true
      );

      expect(mockPrisma.invoiceItem?.findMany).toHaveBeenCalledWith({
        where: {
          Invoice: {},
        },
        include: { Item: true },
      });
      expect(mockRabbitMQ.publish).toHaveBeenCalledWith('daily_sales_report', {
        attachment: Buffer.from('PDF_BYTES'),
        filename: 'report.pdf',
      });
      expect(result).toBeNull();
    });

    it('should throw NotFoundException if no items are found', async () => {
      (mockPrisma.invoiceItem?.findMany as jest.Mock).mockResolvedValue([]);

      await expect(service.generateSalesReport()).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect((service as any).logger.error).toHaveBeenCalled(); // NotFound is thrown before generic catch
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      (mockPrisma.invoiceItem?.findMany as jest.Mock).mockRejectedValue(
        new Error('DB down')
      );

      await expect(service.generateSalesReport()).rejects.toBeInstanceOf(
        InternalServerErrorException
      );
      expect((service as any).logger.error).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      (mockPrisma.invoiceItem?.findMany as jest.Mock).mockRejectedValue(
        new Error('DB down')
      );

      await expect(service.generateSalesReport()).rejects.toBeInstanceOf(
        InternalServerErrorException
      );
      expect((service as any).logger.error).toHaveBeenCalled();
    });
  });
});

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../../logger/logger';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { getPaginationParams } from '../../utils';
import { Invoice } from '../../../../generated/prisma';
import { RequestScopeType } from '../../types';

@Injectable()
/**
 * Service responsible for managing invoice operations such as creation,
 * retrieval with pagination, and lookup by invoice ID.
 */
export class InvoiceService {
  private readonly logger = new AppLogger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves a paginated and optionally filtered list of invoices.
   * Admins can see all invoices. Users only see their own.
   *
   * @param page - Page number (default: 1)
   * @param limit - Number of records per page (default: 10)
   * @param startDate - Optional start date filter (ISO string)
   * @param endDate - Optional end date filter (ISO string)
   * @param requestScopeFilter - Optional role-based filter (e.g. { userId })
   * @returns A paginated response with invoice data and metadata
   * @throws InternalServerErrorException if retrieval fails
   */
  async getInvoices(
    page = 1,
    limit = 10,
    startDate?: string,
    endDate?: string,
    requestScopeFilter?: RequestScopeType
  ) {
    try {
      this.logger.log(`Fetching invoices from db`);
      const { skip, take } = getPaginationParams(page, limit);

      const whereClause = { ...requestScopeFilter };

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date.gte = new Date(startDate);
        if (endDate) whereClause.date.lte = new Date(endDate);
      }

      const [invoices, total] = await this.prisma.$transaction([
        this.prisma.invoice.findMany({
          where: whereClause,
          skip,
          take,
          include: {
            items: { include: { Item: true } },
            user: { omit: { password: true } },
          },
          orderBy: { date: 'desc' },
        }),
        this.prisma.invoice.count({ where: whereClause }),
      ]);

      return {
        data: invoices,
        meta: {
          total,
          limit,
          currentPage: page,
          nextPage: page * limit < total ? page + 1 : null,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      this.logger.error('Error fetching invoices:', error);
      throw new InternalServerErrorException('Could not fetch invoices');
    }
  }

  /**
   * Retrieves a single invoice by its ID.
   * Users can only access their own invoices. Admins can access all.
   *
   * @param id - ID of the invoice
   * @param requestScopeFilter - Optional scope filter (e.g. { userId })
   * @returns The matched invoice with user and item details
   * @throws NotFoundException if invoice is not found
   * @throws InternalServerErrorException if retrieval fails
   */
  async getInvoiceById(id: string, requestScopeFilter?: RequestScopeType) {
    try {
      this.logger.log(`Fetching invoice with ID: ${id}`);
      const invoice = await this.prisma.invoice.findUnique({
        where: { id, ...requestScopeFilter },
        include: { items: true, user: true },
      });

      if (!invoice) {
        this.logger.warn(`Invoice with ID ${id} not found`);
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      return invoice;
    } catch (error: any) {
      this.logger.error(
        `Error fetching invoice with ID ${id}`,
        error?.stack || error?.message
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch invoice');
    }
  }

  /**
   * Creates a new invoice and updates item stock accordingly.
   * Performs validation to ensure item existence and sufficient stock.
   * Reference format: INV-YYYYMM-XXXX
   *
   * @param payload - CreateInvoiceDto containing customer and items
   * @param userId - ID of the user creating the invoice
   * @returns The newly created invoice
   * @throws BadRequestException if stock is insufficient or items are missing
   * @throws InternalServerErrorException if invoice creation fails
   */
  async createInvoice(
    payload: CreateInvoiceDto,
    userId: string
  ): Promise<Invoice> {
    const { customer, items } = payload;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Validate items and stock
      const itemIds = items.map((i) => i.itemId);
      const dbItems = await tx.item.findMany({
        where: { id: { in: itemIds } },
      });

      const itemMap = new Map(dbItems.map((item) => [item.id, item]));
      let totalAmount = 0;

      for (const { itemId, quantity } of items) {
        const dbItem = itemMap.get(itemId);
        if (!dbItem) {
          throw new BadRequestException(`Item ID ${itemId} not found`);
        }
        if ((dbItem.quantity ?? 0) < quantity) {
          throw new BadRequestException(
            `Insufficient stock for item '${dbItem.name}'. Requested: ${quantity}, Available: ${dbItem.quantity}`
          );
        }

        totalAmount += (dbItem.sale_price ?? 0) * quantity;
      }

      // 2. Generate unique reference
      const now = new Date();
      const monthStr = `${now.getFullYear()}${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      const invoiceCount = await tx.invoice.count();
      const reference = `INV-${monthStr}-${(invoiceCount + 1)
        .toString()
        .padStart(4, '0')}`;

      // 3. Create invoice
      const invoice = await tx.invoice.create({
        data: {
          customer,
          reference,
          amount: Math.round(totalAmount * 100) / 100,
          date: now,
          userId,
          items: {
            createMany: {
              data: items.map(({ itemId, quantity }) => ({ itemId, quantity })),
            },
          },
        },
      });

      // 4. Update stock using updateMany (if supported per itemId)
      await Promise.all(
        items.map(({ itemId, quantity }) =>
          tx.item.update({
            where: { id: itemId },
            data: {
              quantity: {
                decrement: quantity,
              },
            },
          })
        )
      );

      return invoice;
    });
  }

  async generateDailyReport(
    startDate?: string,
    endDate?: string
  ): Promise<Buffer> {
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    return Buffer.from('dummy report');
  }
}

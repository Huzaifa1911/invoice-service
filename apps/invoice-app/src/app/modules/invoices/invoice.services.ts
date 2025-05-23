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
   *
   * @param userId - (Optional) ID of the user whose invoices to fetch.
   * @param page - (Optional) Page number for pagination (default: 1).
   * @param limit - (Optional) Number of records per page (default: 10).
   * @param startDate - (Optional) Start date (inclusive) to filter invoices by creation time (ISO 8601 format).
   * @param endDate - (Optional) End date (inclusive) to filter invoices by creation time (ISO 8601 format).
   * @returns An object containing:
   *   - `data`: The list of flattened invoice records.
   *   - `meta`: Pagination metadata including total, currentPage, nextPage, and totalPages.
   * @throws InternalServerErrorException if the fetch fails.
   */
  async getInvoices(
    userId?: string,
    page = 1,
    limit = 10,
    startDate?: string,
    endDate?: string
  ) {
    try {
      this.logger.log(`Fetching invoices for user ID: ${userId}`);
      const { skip, take } = getPaginationParams(page, limit);

      const whereClause: any = {};

      if (userId) whereClause.userId = userId;
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
   * Retrieves a single invoice by its ID and (optionally) the user ID.
   *
   * @param id - ID of the invoice to retrieve.
   * @param userId - (Optional) ID of the user to validate ownership.
   * @returns The invoice object if found.
   * @throws NotFoundException if the invoice is not found.
   * @throws InternalServerErrorException if an unknown error occurs.
   */
  async getInvoiceById(id: string, userId?: string) {
    try {
      this.logger.log(`Fetching invoice with ID: ${id}`);
      const invoice = await this.prisma.invoice.findUnique({
        where: { id, userId },
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
   * Creates a new invoice and updates the item stock accordingly.
   * Performs validation to ensure sufficient stock is available for each item.
   * All operations are executed inside a single transaction.
   *
   * @param payload - The invoice creation payload including items and meta info.
   * @param userId - The ID of the user creating the invoice.
   * @returns The newly created invoice object.
   * @throws BadRequestException if userId is missing or stock is insufficient.
   * @throws InternalServerErrorException if invoice creation fails.
   */
  async createInvoice(payload: CreateInvoiceDto, userId: string): Promise<any> {
    try {
      this.logger.log(`Creating invoice for user ID: ${userId}`);

      if (!userId) {
        this.logger.error('User ID is required to create an invoice');
        throw new BadRequestException('User ID is required');
      }

      const { items: invoiceItems, ...invoice } = payload;

      return await this.prisma.$transaction(async (tx) => {
        const itemIds = invoiceItems.map((item) => item.itemId);
        const itemsInDb = await tx.item.findMany({
          where: { id: { in: itemIds } },
        });

        const itemStockMap = new Map(
          itemsInDb.map((item) => [item.id, item.quantity])
        );

        for (const item of invoiceItems) {
          const stock = itemStockMap.get(item.itemId);
          if (stock === undefined) {
            throw new BadRequestException(`Item ID ${item.itemId} not found.`);
          }
          if (item.quantity > stock) {
            throw new BadRequestException(
              `Insufficient stock for item ID ${item.itemId}. Requested: ${item.quantity}, Available: ${stock}`
            );
          }
        }

        const createdInvoice = await tx.invoice.create({
          data: {
            ...invoice,
            userId,
            items: {
              create: invoiceItems.map((item) => ({
                itemId: item.itemId,
                quantity: item.quantity,
              })),
            },
          },
          include: { items: true, user: { omit: { password: true } } },
        });

        for (const item of invoiceItems) {
          await tx.item.update({
            where: { id: item.itemId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        this.logger.log(
          `Invoice created successfully with ID: ${createdInvoice.id}`
        );
        return createdInvoice;
      });
    } catch (error: any) {
      this.logger.error(
        `Error creating invoice for user ID ${userId}. Please see the server logs`,
        error
      );

      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        'Failed to create invoice. Please check the server logs for more details.'
      );
    }
  }
}

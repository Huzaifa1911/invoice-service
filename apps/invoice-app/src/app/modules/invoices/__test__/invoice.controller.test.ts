import { Test, TestingModule } from '@nestjs/testing';

import { InvoiceController } from '../invoice.controller';
import { InvoiceService } from '../invoice.service';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let service: jest.Mocked<InvoiceService>;

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.header = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useValue: {
            getInvoices: jest.fn(),
            createInvoice: jest.fn(),
            generateSalesReport: jest.fn(),
            getInvoiceById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
    service = module.get(InvoiceService);
  });

  describe('getInvoices', () => {
    it('should return list of invoices', async () => {
      const res = mockResponse();
      const mockInvoices = [{ id: 'inv-1' }];
      service.getInvoices.mockResolvedValue(mockInvoices as any);

      await controller.getInvoices({ tenantId: 'abc' }, res, 1, 10);

      expect(service.getInvoices).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        { tenantId: 'abc' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Invoices fetched successfully',
        data: mockInvoices,
      });
    });
  });

  describe('createInvoice', () => {
    it('should create and return invoice', async () => {
      const res = mockResponse();
      const dto = {
        customer: 'cus-1',
        items: [],
      } as any;
      const mockInvoice = { id: 'inv-1' };

      service.createInvoice.mockResolvedValue(mockInvoice as any);

      await controller.createInvoice(dto, 'user-1', res);

      expect(service.createInvoice).toHaveBeenCalledWith(dto, 'user-1');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Invoice created successfully',
        data: mockInvoice,
      });
    });
  });

  describe('getSalesReport', () => {
    it('should send PDF file if report is available', async () => {
      const res = mockResponse();
      const mockReport = {
        filename: 'sales-report.pdf',
        attachment: Buffer.from('PDF_DATA'),
      };

      service.generateSalesReport.mockResolvedValue(mockReport);

      await controller.getSalesReport(res, '2024-01-01', '2024-12-31');

      expect(service.generateSalesReport).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-12-31'
      );
      expect(res.header).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename*=UTF-8''sales-report.pdf`
      );
      expect(res.header).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf'
      );
      expect(res.send).toHaveBeenCalledWith(mockReport.attachment);
    });

    it('should return 404 if no report found', async () => {
      const res = mockResponse();
      service.generateSalesReport.mockResolvedValue(null as any);

      await controller.getSalesReport(res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Export information not found');
    });
  });

  describe('getInvoiceById', () => {
    it('should return invoice by ID', async () => {
      const res = mockResponse();
      const mockInvoice = { id: 'inv-1' };

      service.getInvoiceById.mockResolvedValue(mockInvoice as any);

      await controller.getInvoiceById('inv-1', { tenantId: 'abc' }, res);

      expect(service.getInvoiceById).toHaveBeenCalledWith('inv-1', {
        tenantId: 'abc',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Invoice fetched successfully',
        data: mockInvoice,
      });
    });
  });
});

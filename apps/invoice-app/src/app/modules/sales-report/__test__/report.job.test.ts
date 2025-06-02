// src/app/modules/sales-report/__tests__/report.job.spec.ts

import { SalesReportJob } from '../report.job';
import { InvoiceService } from '../../invoices/invoice.service';
import { AppLogger } from '../../../logger/logger';
import { startOfDay, endOfDay } from 'date-fns';

describe('SalesReportJob', () => {
  let job: SalesReportJob;
  let mockInvoiceService: Partial<InvoiceService>;
  let mockLoggerLog: jest.Mock;
  let mockLoggerError: jest.Mock;

  beforeAll(() => {
    // Freeze time at a known instant so date‐strings are predictable
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2025-01-01T12:00:00Z').getTime());
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockInvoiceService = {
      generateSalesReport: jest.fn(),
    };

    job = new SalesReportJob(mockInvoiceService as InvoiceService);

    // Spy on the internal logger
    const loggerInstance = (job as any).logger as AppLogger;
    loggerInstance.log = jest.fn();
    loggerInstance.error = jest.fn();
    mockLoggerLog = loggerInstance.log as jest.Mock;
    mockLoggerError = loggerInstance.error as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call generateSalesReport with today’s start/end dates and publish=true', async () => {
    // Arrange: compute expected "toDateString" values
    const now = new Date();
    const startStr = startOfDay(now).toDateString();
    const endStr = endOfDay(now).toDateString();

    // Act
    await job.handleReport();

    // Assert that logger.log("Generating daily sales report...") happened
    expect(mockLoggerLog).toHaveBeenCalledWith(
      'Generating daily sales report...'
    );

    // Assert generateSalesReport called with (startStr, endStr, true)
    expect(mockInvoiceService.generateSalesReport).toHaveBeenCalledWith(
      startStr,
      endStr,
      true
    );
  });

  it('should catch synchronous exceptions from generateSalesReport, log them, and rethrow', async () => {
    // Arrange: make generateSalesReport throw synchronously
    (mockInvoiceService.generateSalesReport as jest.Mock).mockImplementation(
      () => {
        throw new Error('DB failure');
      }
    );

    // Act & Assert
    await expect(job.handleReport()).rejects.toThrow(
      'Failed to generate daily sales report'
    );

    // The internal logger.error should have been called with the caught error
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to generate daily sales report. Details: ',
      expect.any(Error) // specifically the "DB failure" error
    );
  });
});

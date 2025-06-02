import {
  getPaginationParams,
  sanitizeSalesReportFileName,
  generateSalesReportPDF,
} from '../index';
import { SalesReportMeta, SalesReportItem } from '../../types';

describe('getPaginationParams', () => {
  it('should return skip and take based on page and limit', () => {
    // page = 1, limit = 10 → skip = 0, take = 10
    expect(getPaginationParams(1, 10)).toEqual({ skip: 0, take: 10 });

    // page = 2, limit = 5 → skip = (2 - 1) * 5 = 5, take = 5
    expect(getPaginationParams(2, 5)).toEqual({ skip: 5, take: 5 });
  });

  it('should handle page < 1 or limit < 1 by defaulting to 1', () => {
    // page = 0 → Math.max(0, 1) = 1 → skip = 0
    expect(getPaginationParams(0, 10)).toEqual({ skip: 0, take: 10 });

    // limit = 0 → Math.max(0, 1) = 1 → take = 1
    expect(getPaginationParams(2, 0)).toEqual({ skip: (2 - 1) * 1, take: 1 });
  });

  it('should default page and limit if not provided', () => {
    // no args → skip = 0, take = 10 (default limit)
    expect(getPaginationParams()).toEqual({ skip: 0, take: 10 });
  });
});

describe('sanitizeSalesReportFileName', () => {
  it('returns "sales-report.pdf" when no date filter is provided', () => {
    expect(sanitizeSalesReportFileName({})).toBe('sales-report.pdf');
    expect(sanitizeSalesReportFileName({ date: {} })).toBe('sales-report.pdf');
  });

  it('returns filename with only start date when only gte is provided', () => {
    const startDate = new Date('2025-01-01');
    expect(sanitizeSalesReportFileName({ date: { gte: startDate } })).toBe(
      `sales-report-2025-01-01.pdf`
    );
  });

  it('returns filename with only end date when only lte is provided', () => {
    const endDate = new Date('2025-02-28');
    expect(sanitizeSalesReportFileName({ date: { lte: endDate } })).toBe(
      `sales-report-2025-02-28.pdf`
    );
  });

  it('returns filename with range when both gte and lte are provided', () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');
    expect(
      sanitizeSalesReportFileName({ date: { gte: startDate, lte: endDate } })
    ).toBe(`sales-report-2025-01-01_2025-01-31.pdf`);
  });
});

describe('generateSalesReportPDF', () => {
  // Construct a minimal SalesReportMeta object
  const sampleItems: SalesReportItem[] = [
    {
      sku: 'SKU1',
      name: 'Product 1',
      quantity: 2,
      revenue: 100.0,
      unitPrice: 40.0,
      salePrice: 50.0,
      profit: 20.0,
    },
    {
      sku: 'SKU2',
      name: 'Product 2',
      quantity: 1,
      revenue: 200.0,
      unitPrice: 150.0,
      salePrice: 200.0,
      profit: 50.0,
    },
  ];

  const reportMeta: SalesReportMeta = {
    date: new Date('2025-01-01').toISOString(),
    amount: 300.0,
    profit: 70.0,
    items: sampleItems,
  };

  it('should return a Buffer containing a valid PDF (starting with "%PDF")', async () => {
    const pdfBuffer = await generateSalesReportPDF(reportMeta);

    // The output should be a Node Buffer
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);

    // Convert to string and check for PDF header
    const header = pdfBuffer.toString('utf8', 0, 4);
    expect(header).toBe('%PDF');
  });

  it('should include all items in the PDF content', async () => {
    const pdfBuffer = await generateSalesReportPDF(reportMeta);
    const pdfString = pdfBuffer.toString('utf8');

    // Check that SKU and product names appear in the raw PDF string
    expect(pdfString).toContain('SKU1');
    expect(pdfString).toContain('Product 1');
    expect(pdfString).toContain('SKU2');
    expect(pdfString).toContain('Product 2');

    // Check that total amounts appear (formatted as strings)
    expect(pdfString).toContain('300.00');
    expect(pdfString).toContain('70.00');
  });

  it('should handle an empty items array by throwing or producing a minimal PDF', async () => {
    const minimalReport: SalesReportMeta = {
      date: new Date().toISOString(),
      amount: 0,
      profit: 0,
      items: [],
    };

    // Depending on implementation, might produce a PDF with header and no rows
    const pdfBuffer = await generateSalesReportPDF(minimalReport);
    const header = pdfBuffer.toString('utf8', 0, 4);
    expect(header).toBe('%PDF');
  });
});

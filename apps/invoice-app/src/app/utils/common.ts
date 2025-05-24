import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { SalesReportMeta } from '../types';

export function getPaginationParams(page = 1, limit = 10) {
  const take = Math.max(limit, 1);
  const skip = (Math.max(page, 1) - 1) * take;
  return { skip, take };
}

/**
 * Generates a structured daily sales report PDF using jsPDF.
 * @param {Object} report - The sales report metadata
 * @returns {Buffer} - PDF buffer
 */
export async function generateSalesReportPDF(
  report: SalesReportMeta
): Promise<Buffer> {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Daily Sales Report', 105, 15, { align: 'center' });

  // Summary Section
  doc.setFontSize(12);
  const summaryY = 30;
  doc.text(`Date: ${new Date(report.date).toLocaleString()}`, 14, summaryY);
  doc.text(`Total Sales: $${report.amount.toFixed(2)}`, 14, summaryY + 8);
  doc.text(`Total Profit: $${report.profit.toFixed(2)}`, 14, summaryY + 16);

  // Table Section
  autoTable(doc, {
    startY: summaryY + 30,
    head: [['SKU', 'Name', 'Qty', 'Revenue ($)', 'Profit ($)']],
    body: report.items.map((item) => [
      item.sku,
      item.name,
      item.quantity.toString(),
      item.revenue.toFixed(2),
      item.profit.toFixed(2),
    ]),
    styles: { fontSize: 10, halign: 'center' },
    headStyles: { fillColor: [230, 230, 230], textColor: 0 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Output as Buffer (Node.js only)
  const pdfBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfBuffer);
}

/**
 * Generates a filename based on the provided date range.
 * If no date range is provided, returns "sales-report.pdf".
 *
 * @param datefilter - An object with optional `gte` and `lte` dates.
 * @returns Filename string.
 */
export function sanitizeSalesReportFileName(dateFilter: {
  date?: { gte?: Date; lte?: Date };
}): string {
  const { date } = dateFilter;

  if (!date || (!date.gte && !date.lte)) {
    return 'sales-report.pdf';
  }

  const start = date.gte ? formatDate(date.gte) : '';
  const end = date.lte ? formatDate(date.lte) : '';
  const range = [start, end].filter(Boolean).join('_');

  return `sales-report-${range}.pdf`;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

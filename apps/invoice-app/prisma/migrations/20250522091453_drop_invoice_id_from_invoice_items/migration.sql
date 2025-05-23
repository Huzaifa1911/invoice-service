/*
  Warnings:

  - You are about to drop the column `invoiceId` on the `invoice_items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_invoiceId_fkey";

-- AlterTable
ALTER TABLE "invoice_items" DROP COLUMN "invoiceId";

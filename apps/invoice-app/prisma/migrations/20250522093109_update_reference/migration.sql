/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Invoice_reference_key" ON "Invoice"("reference");

-- CreateIndex
CREATE INDEX "idx_invoices_user_id" ON "Invoice"("userId");

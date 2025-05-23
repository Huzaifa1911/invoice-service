/*
  Warnings:

  - You are about to drop the column `is_super` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_super",
ADD COLUMN     "role" "Role" DEFAULT 'USER';

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER,
    "unit_price" DOUBLE PRECISION,
    "sale_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_reference_key" ON "invoices"("reference");

-- CreateIndex
CREATE INDEX "idx_invoices_user_id" ON "invoices"("userId");

-- CreateIndex
CREATE INDEX "idx_invoices_reference" ON "invoices"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "items_sku_key" ON "items"("sku");

-- CreateIndex
CREATE INDEX "idx_invoice_items_sku" ON "items"("sku");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

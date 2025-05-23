import {
  PrismaClient,
  Role,
  User,
  Item,
  Invoice,
} from '../../generated/prisma';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const NUM_USERS = 5;
const INVOICES_PER_USER = 10;
const MIN_ITEMS = 2;
const MAX_ITEMS = 5;

interface SeedItemInput {
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  sale_price: number;
}

interface InvoiceItemInput {
  itemId: string;
  quantity: number;
}

// Utility: Generate a random past date within N days
function getRandomDateWithinLastDays(days: number): Date {
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - Math.floor(Math.random() * days));
  return past;
}

// Utility: Generate fake item catalog entries
function generateFakeItems(min: number, max: number): SeedItemInput[] {
  const count: number = faker.number.int({ min, max });
  const items: SeedItemInput[] = [];

  for (let i = 0; i < count; i++) {
    const unit_price: number = parseFloat(
      faker.commerce.price({ min: 100, max: 1000 })
    );
    const sale_price: number =
      unit_price + parseFloat(faker.commerce.price({ min: 10, max: 200 }));

    items.push({
      name: faker.commerce.productName(),
      sku: `${faker.string.alphanumeric(5).toUpperCase()}-${faker.number.int({
        min: 1000,
        max: 9999,
      })}`,
      quantity: faker.number.int({ min: 5, max: 50 }),
      unit_price,
      sale_price,
    });
  }

  return items;
}

async function main(): Promise<void> {
  console.log('🌱 Seeding users, items, and invoices...');

  const passwordHash: string = await bcrypt.hash('Password@123', 10);
  const users: User[] = [];

  // 1. Create users with appropriate roles
  for (let u = 0; u < NUM_USERS; u++) {
    const isAdmin: boolean = u === 0;
    const fullName: string = isAdmin ? 'Admin User' : faker.person.fullName();
    const email: string = isAdmin
      ? 'admin@example.com'
      : faker.internet.email({ firstName: fullName.split(' ')[0] });

    const user: User = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        full_name: fullName,
        email,
        password: passwordHash,
        is_active: true,
        role: isAdmin ? Role.ADMIN : Role.USER,
      },
    });

    users.push(user);
  }

  // 2. Generate global catalog items
  const itemInputs: SeedItemInput[] = generateFakeItems(15, 20);
  const catalogItems: Item[] = await Promise.all(
    itemInputs.map((item) =>
      prisma.item.create({
        data: {
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          sale_price: item.sale_price,
        },
      })
    )
  );

  // 3. Generate invoices for each user with offset-based reference numbers
  const now: Date = new Date();
  const monthStr = `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;

  for (const [u, user] of users.entries()) {
    for (let i = 0; i < INVOICES_PER_USER; i++) {
      const selectedItems: Item[] = faker.helpers.arrayElements(
        catalogItems,
        faker.number.int({ min: MIN_ITEMS, max: MAX_ITEMS })
      );

      const invoiceItems: InvoiceItemInput[] = [];
      let totalAmount = 0;

      for (const item of selectedItems) {
        const quantity: number = faker.number.int({ min: 1, max: 5 });
        totalAmount += (item.sale_price ?? 0) * quantity;
        invoiceItems.push({ itemId: item.id, quantity });
      }

      const sequence: string = (u * INVOICES_PER_USER + i + 1)
        .toString()
        .padStart(4, '0');
      const reference = `INV-${monthStr}-${sequence}`;

      const invoice: Invoice = await prisma.invoice.create({
        data: {
          customer: faker.company.name(),
          reference,
          date: getRandomDateWithinLastDays(7),
          amount: Math.round(totalAmount * 100) / 100,
          userId: user.id,
          items: {
            create: invoiceItems.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
            })),
          },
        },
      });

      console.log(
        `🧾 Created invoice ${reference} | User: ${user.email} | Total: ${invoice.amount}`
      );
    }
  }

  console.log('✅ Seeding complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error('❌ Seed error:', error);
    prisma.$disconnect();
    process.exit(1);
  });

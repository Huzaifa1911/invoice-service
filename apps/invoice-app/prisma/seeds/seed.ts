import { PrismaClient, User, Item } from '../../generated/prisma';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const NUM_USERS = 5;
const INVOICES_PER_USER = 10;
const MIN_ITEMS = 2;
const MAX_ITEMS = 5;

type SeedItemInput = {
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
};

type InvoiceItemInput = {
  itemId: string;
  quantity: number;
};

function getRandomDateWithinLastDays(days: number): Date {
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - Math.floor(Math.random() * days));
  return past;
}

function generateFakeItems(min: number, max: number): SeedItemInput[] {
  const count = faker.number.int({ min, max });
  const items: SeedItemInput[] = [];

  for (let i = 0; i < count; i++) {
    items.push({
      name: faker.commerce.productName(),
      sku: `${faker.string.alphanumeric(5).toUpperCase()}-${faker.number.int({
        min: 1000,
        max: 9999,
      })}`,
      quantity: faker.number.int({ min: 5, max: 50 }), // stock quantity
      unit_price: parseFloat(faker.commerce.price({ min: 100, max: 1000 })),
    });
  }

  return items;
}

async function main(): Promise<void> {
  console.log('🌱 Seeding users, items, and invoices...');

  const passwordHash: string = await bcrypt.hash('Password@123', 10);

  const users: User[] = [];

  // Create users
  for (let u = 0; u < NUM_USERS; u++) {
    const isSuper = u === 0;
    const fullName = isSuper ? 'Admin User' : faker.person.fullName();
    const email = isSuper
      ? 'admin@example.com'
      : faker.internet.email({ firstName: fullName.split(' ')[0] });

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        full_name: fullName,
        email,
        password: passwordHash,
        is_super: isSuper,
        is_active: true,
      },
    });

    users.push(user);
  }

  // Create global catalog items
  const itemInputs: SeedItemInput[] = generateFakeItems(15, 20);
  const catalogItems: Item[] = await Promise.all(
    itemInputs.map((item) => prisma.item.create({ data: item }))
  );

  // Create invoices for each user
  for (const user of users) {
    for (let i = 0; i < INVOICES_PER_USER; i++) {
      const selectedItems = faker.helpers.arrayElements(
        catalogItems,
        faker.number.int({ min: MIN_ITEMS, max: MAX_ITEMS })
      );

      const invoiceItems: InvoiceItemInput[] = [];
      let totalAmount = 0;

      for (const item of selectedItems) {
        const quantity = faker.number.int({ min: 1, max: 5 });
        invoiceItems.push({ itemId: item.id, quantity });
        totalAmount += item.unit_price * quantity;
      }

      const invoice = await prisma.invoice.create({
        data: {
          customer: faker.company.name(),
          reference: `INV-${user.id.slice(0, 5)}-${i + 1}-${Date.now()}`,
          date: getRandomDateWithinLastDays(7),
          amount: Math.round(totalAmount * 100) / 100,
          userId: user.id,
          items: {
            create: invoiceItems,
          },
        },
      });

      console.log(
        `🧾 Created invoice ${invoice.reference} | Total: ${invoice.amount}`
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

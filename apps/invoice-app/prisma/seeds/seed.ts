import { PrismaClient } from '../../generated/prisma';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const NUM_USERS = 5;
const INVOICES_PER_USER = 10;
const MIN_ITEMS = 2;
const MAX_ITEMS = 5;

function getRandomDateWithinLastDays(days: number): Date {
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - Math.floor(Math.random() * days));
  return past;
}

function generateFakeItems(min: number, max: number) {
  const count = faker.number.int({ min, max });
  const items: any[] = [];

  for (let i = 0; i < count; i++) {
    const name = faker.commerce.productName();
    const sku = `${faker.string
      .alphanumeric(5)
      .toUpperCase()}-${faker.number.int({ min: 1000, max: 9999 })}`;
    const quantity = faker.number.int({ min: 1, max: 10 });
    const unit_price = parseFloat(
      faker.commerce.price({ min: 100, max: 1000 })
    );

    items.push({ name, sku, quantity, unit_price });
  }

  return items;
}

async function main() {
  console.log('🌱 Seeding with Faker + prices...');

  const password = await bcrypt.hash('Password@123', 10);

  for (let u = 0; u < NUM_USERS; u++) {
    const isSuper = u === 0;
    const fullName = isSuper ? 'Admin User' : faker.person.fullName();
    const email = isSuper
      ? 'admin@example.com'
      : faker.internet.email({ firstName: fullName.split(' ')[0] });

    const user = await prisma.user.create({
      data: {
        full_name: fullName,
        email,
        password,
        is_super: isSuper,
        is_active: true,
      },
    });

    for (let i = 0; i < INVOICES_PER_USER; i++) {
      const items = generateFakeItems(MIN_ITEMS, MAX_ITEMS);
      const amount = items.reduce(
        (total, item) => total + item.unit_price * item.quantity,
        0
      );

      const invoice = await prisma.invoice.create({
        data: {
          customer: faker.company.name(),
          reference: `INV-${u + 1}-${i + 1}-${Date.now()}`,
          date: getRandomDateWithinLastDays(7),
          amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
          userId: user.id,
          items: {
            create: items,
          },
        },
      });

      console.log(
        `🧾 Created invoice ${invoice.reference} | Amount: ${invoice.amount}`
      );
    }
  }

  console.log('✅ Seeding complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Seed error:', e);
    prisma.$disconnect();
    process.exit(1);
  });

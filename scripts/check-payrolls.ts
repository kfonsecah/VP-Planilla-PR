import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const payrolls = await prisma.vpg_payrolls.findMany({
    where: { payrolls_status: 'PAGADA' },
    select: { payrolls_id: true, payrolls_period_start: true, payrolls_period_end: true }
  });
  console.log(JSON.stringify(payrolls, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

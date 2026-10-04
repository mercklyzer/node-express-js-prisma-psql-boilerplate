var prisma = require('../db');

async function main() {
  await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice' },
  });
  await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob' },
  });
}

main()
  .catch(function(e) {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(function() {
    return prisma.$disconnect();
  });

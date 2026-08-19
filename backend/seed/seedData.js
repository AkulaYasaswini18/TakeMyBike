const seedAdmin = require('./seedAdmin');

async function seed() {
  console.log('--- Starting BikeShare Seed ---');
  await seedAdmin();
  console.log('--- Seeding finished successfully ---');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = seed;

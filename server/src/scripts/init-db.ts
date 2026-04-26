import { initDb, seedDb, closeDb } from '../models/database';

console.log('Initializing database...');
initDb();
console.log('Seeding data...');
try {
  seedDb();
  console.log('Database initialized and seeded successfully.');
} catch (err: any) {
  if (err.message?.includes('UNIQUE')) {
    console.log('Seed data already exists, skipping.');
  } else {
    console.error('Seed error:', err.message);
  }
}
closeDb();

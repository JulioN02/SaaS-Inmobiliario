import path from 'path';
import dotenv from 'dotenv';

// Load test env if present (backend/.env.test)
const envPath = path.join(__dirname, '../../.env.test');
dotenv.config({ path: envPath });

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Import after loading env
import { resetDatabase, disconnectPrisma } from './helpers/db';

// Reset DB before each test to keep tests isolated. If this is too slow,
// change to beforeAll and design tests accordingly.
beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await disconnectPrisma();
});

export {};

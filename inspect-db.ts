import { db, poolConnect } from './src/db/index';
import { users } from './src/db/schema';
import 'dotenv/config';

async function inspectDb() {
  await poolConnect;
  console.log('db keys:', Object.keys(db));
  try {
    const result = await db.select().from(users);
    console.log('Select result:', result);
  } catch (e) {
    console.error('Select failed:', e);
  }
  process.exit(0);
}

inspectDb();

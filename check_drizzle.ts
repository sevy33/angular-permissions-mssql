import { drizzle } from 'drizzle-orm/node-mssql';
import { mssqlTable, int } from 'drizzle-orm/mssql-core';
import sql from 'mssql';

const users = mssqlTable('users', {
  id: int('id').primaryKey(),
});

const db = drizzle({} as any); // Mock client

const qb = db.select().from(users);
console.log(Object.keys(qb));
console.log('limit' in qb);
console.log('top' in qb);

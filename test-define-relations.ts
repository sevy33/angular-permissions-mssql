import { defineRelations } from 'drizzle-orm';
import { mssqlTable, int } from 'drizzle-orm/mssql-core';

const users = mssqlTable('users', { id: int('id').primaryKey() });
const posts = mssqlTable('posts', { id: int('id').primaryKey(), userId: int('user_id') });

const tables = { users, posts };

const result = defineRelations(tables, (helpers) => {
  console.log('Type of helpers.many.users:', typeof helpers.many.users);
  return {};
});

console.log('Result keys:', Object.keys(result));
console.log('Result users:', result.users);

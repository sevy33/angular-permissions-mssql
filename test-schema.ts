import { mssqlTable, int } from 'drizzle-orm/mssql-core';
export const users = mssqlTable('users', {
  id: int('id').primaryKey(),
});

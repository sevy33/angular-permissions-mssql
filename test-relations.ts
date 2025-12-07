import { defineRelations } from 'drizzle-orm';
import { mssqlTable, int } from 'drizzle-orm/mssql-core';

const users = mssqlTable('users', { id: int('id').primaryKey() });

try {
  defineRelations(users, (helpers) => {
    console.log('Type of many:', typeof helpers.many);
    console.log('Type of one:', typeof helpers.one);
    // console.log('Helpers:', helpers);
    return {};
  });
} catch (e) {
  console.error('Error:', e);
}

import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: './drizzle-test',
  schema: './test-schema.ts',
  dialect: 'mssql',
  dbCredentials: {
    url: 'sqlserver://localhost:1433;database=test;user=sa;password=Password123!',
  },
});

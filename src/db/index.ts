import { drizzle } from 'drizzle-orm/node-mssql';
import sql from 'mssql';
import { schema } from './schema';
import 'dotenv/config';

const connectionString = process.env['DATABASE_URL'];

let pool: sql.ConnectionPool;
if (connectionString) {
  try {
    // Try to parse connection string if it's in JDBC-like format
    if (connectionString.startsWith('sqlserver://')) {
      const parts = connectionString.split(';');
      const serverPart = parts[0].replace('sqlserver://', '');
      const [server, port] = serverPart.split(':');
      
      const config: any = {
        server,
        port: port ? parseInt(port) : 1433,
        options: { encrypt: false, trustServerCertificate: true }
      };

      for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].split('=');
        if (key && value) {
          if (key.toLowerCase() === 'user') config.user = value;
          if (key.toLowerCase() === 'password') config.password = value;
          if (key.toLowerCase() === 'database') config.database = value;
        }
      }
      pool = new sql.ConnectionPool(config);
    } else {
      pool = new sql.ConnectionPool(connectionString);
    }
  } catch (e) {
    console.warn('Failed to connect with connection string, using dummy config', e);
    pool = new sql.ConnectionPool({
      server: 'localhost',
      user: 'sa',
      password: 'Password123!',
      database: 'temp',
      options: { encrypt: false, trustServerCertificate: true }
    });
  }
} else {
  console.warn('DATABASE_URL is not set. Using dummy config.');
  pool = new sql.ConnectionPool({
    server: 'localhost',
    user: 'sa',
    password: 'Password123!',
    database: 'temp',
    options: { encrypt: false, trustServerCertificate: true }
  });
}
export const poolConnect = pool.connect().catch(err => {
  console.warn('Failed to connect to DB:', err.message);
});

export const db = drizzle({ client: pool as any, schema }) as any;


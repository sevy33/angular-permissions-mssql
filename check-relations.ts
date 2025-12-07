import * as drizzleOrm from 'drizzle-orm';

console.log('drizzle-orm keys:', Object.keys(drizzleOrm));
console.log('relations:', (drizzleOrm as any).relations);

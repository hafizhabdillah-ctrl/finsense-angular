const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let prismaInstance;

function getPrismaClient() {
  if (!prismaInstance) {
    console.log('[Debug prisma] Creating PrismaClient instance with pg adapter...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({ adapter });
  }
  return prismaInstance;
}

module.exports = new Proxy(
  {},
  {
    get(target, prop) {
      return getPrismaClient()[prop];
    },
  }
);
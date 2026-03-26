import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'query' }]
});

// Cuenta queries
let queryCount = 0;

prisma.$on('query', (e) => {
  queryCount++;
  console.log(`[QUERY ${queryCount}] ${e.query.substring(0, 100)}...`);
});

// Expón el contador
export const getQueryCount = () => queryCount;
export const resetQueryCount = () => { queryCount = 0; };

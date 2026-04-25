import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'query' }]
    : []
});

let queryCount = 0;

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    queryCount++;
    console.log(`[QUERY ${queryCount}] ${e.query.substring(0, 100)}...`);
  });
}

export const getQueryCount = () => queryCount;
export const resetQueryCount = () => { queryCount = 0; };

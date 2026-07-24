// =========================================================================
// AI Tech Interview - Prisma Client
// SQLite with Prisma 6 (native support, no adapters needed)
// =========================================================================

import { PrismaClient } from '@/generated/prisma/client';

let cachedClient: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return cachedClient;
}

export const prisma = getPrismaClient();

export default prisma;

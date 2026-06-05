import { PrismaClient } from '@prisma/client';

let instance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!instance) {
    instance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return instance;
}

export const prisma = getPrisma();

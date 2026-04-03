// Prisma client singleton (lazy-initialized)
// Prisma 7: client generated to @/generated/prisma (configured in prisma/schema.prisma)
// Singleton pattern prevents multiple PrismaClient instances during Next.js dev hot-reload
// In production (Vercel), each serverless function invocation reuses the module-level instance

import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    })
  }
  return globalForPrisma.prisma
}

/** Lazy proxy so existing `import { prisma }` still works */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

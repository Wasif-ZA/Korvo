// Prisma client singleton
// Prisma 7: client generated to ../generated/prisma (configured in prisma/schema.prisma)
// Singleton pattern prevents multiple PrismaClient instances during Next.js dev hot-reload
// In production (Vercel), each serverless function invocation reuses the module-level instance

import { PrismaClient } from '../../generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

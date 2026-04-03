// Prisma 7 configuration
// Requires local prisma package: npm install --save-dev prisma
//
// Dual-connection pattern for Supabase (FOUND-05):
// - DATABASE_URL: pooler port 6543, runtime queries (Vercel serverless)
//   Format: postgres://postgres.[ref]:[password]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
// - DIRECT_URL: direct port 5432, prisma migrate dev/deploy only
//   Format: postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres
//
// In Prisma 7, connection URLs moved out of schema.prisma into this file.
// schema.prisma datasource block only specifies provider = "postgresql".
// This config is used by CLI commands (migrate, introspect) — use direct connection.
// Runtime PrismaClient reads DATABASE_URL from env automatically.
//
// See: .planning/phases/01-foundation/01-RESEARCH.md Pattern 1
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // CLI uses direct connection (port 5432) for migrations; falls back to pooler URL
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});

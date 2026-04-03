// Worker uses the same Prisma client as the Next.js app.
// The @/ path alias is resolved by tsx using tsconfig.json paths.
export { prisma } from "@/lib/db/prisma";

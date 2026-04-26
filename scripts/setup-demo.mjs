import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const src = resolve(root, ".env.demo");
const dest = resolve(root, ".env.local");

if (!existsSync(src)) {
  console.error(`[demo] .env.demo not found at ${src}`);
  process.exit(1);
}

copyFileSync(src, dest);
console.log("[demo] Seeded .env.local from .env.demo (NEXT_PUBLIC_DEMO_MODE=true)");

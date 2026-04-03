import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg?.split("=")[1] ?? "runtime";

const sharedRequired = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const requiredByMode: Record<string, string[]> = {
  dev: [...sharedRequired],
  build: [...sharedRequired],
  runtime: [
    ...sharedRequired,
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
    "ANTHROPIC_API_KEY",
    "REDIS_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
  ],
};

const requiredEitherByMode: Record<string, string[][]> = {
  dev: [["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_BASE_URL"]],
  build: [["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_BASE_URL"]],
  runtime: [
    ["DIRECT_URL", "DIRECT_DATABASE_URL"],
    ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_BASE_URL"],
  ],
};

const optionalByMode: Record<string, string[]> = {
  dev: [],
  build: ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  runtime: ["APOLLO_API_KEY", "HUNTER_API_KEY", "CRON_SECRET"],
};

if (!requiredByMode[mode]) {
  console.error(`Unknown env check mode: ${mode}`);
  process.exit(1);
}

const required = requiredByMode[mode];
const requiredEither = requiredEitherByMode[mode];
const optional = optionalByMode[mode];

const missing = required.filter((key) => !process.env[key]);
const missingEither = requiredEither.filter(
  (group) => !group.some((key) => process.env[key]),
);
const missingOptional = optional.filter((key) => !process.env[key]);

if (missing.length > 0 || missingEither.length > 0) {
  console.error(`Missing required environment variables (mode=${mode}):`);
  missing.forEach((key) => console.error(`  - ${key}`));
  missingEither.forEach((group) =>
    console.error(`  - one of: ${group.join(" | ")}`),
  );
  process.exit(1);
}

if (missingOptional.length > 0) {
  console.warn(`Missing optional environment variables (mode=${mode}):`);
  missingOptional.forEach((key) => console.warn(`  - ${key}`));
}

console.log(`All required environment variables are set (mode=${mode}).`);

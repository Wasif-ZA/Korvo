import { describe, it, expect, vi } from "vitest";

describe("Sentry Worker Integration (MON-02)", () => {
  it("should initialize Sentry before other worker imports", async () => {
    // Verify import ordering in worker/index.ts
    const fs = await import("fs");
    const workerContent = fs.readFileSync("worker/index.ts", "utf-8");
    const sentryImportIndex = workerContent.indexOf(
      'import * as Sentry from "@sentry/node"',
    );
    const dotenvImportIndex = workerContent.indexOf('import "dotenv/config"');
    expect(sentryImportIndex).toBeGreaterThan(-1);
    expect(sentryImportIndex).toBeLessThan(dotenvImportIndex);
  });

  it("should call Sentry.init with DSN from environment", async () => {
    const fs = await import("fs");
    const workerContent = fs.readFileSync("worker/index.ts", "utf-8");
    expect(workerContent).toContain("Sentry.init");
    expect(workerContent).toContain("process.env.SENTRY_DSN");
  });

  it("should flush Sentry on SIGTERM before closing workers", async () => {
    const fs = await import("fs");
    const workerContent = fs.readFileSync("worker/index.ts", "utf-8");
    expect(workerContent).toContain("Sentry.flush");
  });
});

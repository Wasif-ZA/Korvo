import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn() utility", () => {
  it("merges conflicting Tailwind classes (last wins)", () => {
    const result = cn("p-4", "p-6");
    expect(result).toBe("p-6");
  });

  it("handles conditional classes (falsy values are excluded)", () => {
    const result = cn("base", false && "hidden");
    expect(result).toBe("base");
  });

  it("handles array of classes", () => {
    const result = cn(["p-4", "mt-2"]);
    expect(result).toBe("p-4 mt-2");
  });

  it("merges multiple conflicting utility classes correctly", () => {
    const result = cn("text-sm text-red-600", "text-base");
    expect(result).toBe("text-red-600 text-base");
  });

  it("handles undefined and null values gracefully", () => {
    const result = cn("base", undefined, null, "extra");
    expect(result).toBe("base extra");
  });
});

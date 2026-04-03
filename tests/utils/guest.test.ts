import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearGuestSearchCount,
  clearGuestSessionId,
  getGuestSearchCount,
  getGuestSessionId,
  getOrCreateGuestSessionId,
  incrementGuestSearchCount,
  setGuestSessionId,
} from "@/lib/guest";

describe("guest storage utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("creates and persists a guest session id when missing", () => {
    const id = getOrCreateGuestSessionId();
    expect(id).toBeTruthy();
    expect(getGuestSessionId()).toBe(id);
  });

  it("increments guest search count", () => {
    expect(getGuestSearchCount()).toBe(0);
    expect(incrementGuestSearchCount()).toBe(1);
    expect(incrementGuestSearchCount()).toBe(2);
  });

  it("allows explicit session set/clear operations", () => {
    setGuestSessionId("guest-123");
    expect(getGuestSessionId()).toBe("guest-123");
    clearGuestSessionId();
    expect(getGuestSessionId()).toBeNull();
  });

  it("clears guest search count", () => {
    incrementGuestSearchCount();
    clearGuestSearchCount();
    expect(getGuestSearchCount()).toBe(0);
  });
});

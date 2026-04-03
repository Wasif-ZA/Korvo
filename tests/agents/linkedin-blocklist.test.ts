/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  isBlockedUrl,
  filterBlockedUrls,
} from "../../worker/lib/linkedin-blocklist";

describe("isBlockedUrl", () => {
  it("blocks linkedin.com/in/ profile URLs", () => {
    expect(isBlockedUrl("https://linkedin.com/in/someone")).toBe(true);
  });

  it("blocks www.linkedin.com company URLs", () => {
    expect(isBlockedUrl("https://www.linkedin.com/company/x")).toBe(true);
  });

  it("blocks lnkd.in short links", () => {
    expect(isBlockedUrl("https://lnkd.in/abc")).toBe(true);
  });

  it("blocks http scheme linkedin.com", () => {
    expect(isBlockedUrl("http://linkedin.com/jobs/1234")).toBe(true);
  });

  it("does not block google.com", () => {
    expect(isBlockedUrl("https://google.com")).toBe(false);
  });

  it("does not block company career pages", () => {
    expect(isBlockedUrl("https://company.com/team")).toBe(false);
  });

  it("does not block github.com", () => {
    expect(isBlockedUrl("https://github.com/user/repo")).toBe(false);
  });

  it("returns false for invalid URLs (not parseable)", () => {
    expect(isBlockedUrl("not-a-url")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isBlockedUrl("")).toBe(false);
  });

  it("does not block a domain that merely contains linkedin as a substring", () => {
    expect(isBlockedUrl("https://notlinkedin.com/page")).toBe(false);
  });
});

describe("filterBlockedUrls", () => {
  it("replaces a LinkedIn URL in text with blocked notice", () => {
    const input =
      "Check out https://www.linkedin.com/in/john-doe for more info";
    const result = filterBlockedUrls(input);
    expect(result).not.toContain("linkedin.com");
    expect(result).toContain(
      "[blocked: LinkedIn URL removed per legal policy]",
    );
  });

  it("replaces lnkd.in short URLs", () => {
    const input = "See this profile: https://lnkd.in/abc123";
    const result = filterBlockedUrls(input);
    expect(result).not.toContain("lnkd.in");
    expect(result).toContain(
      "[blocked: LinkedIn URL removed per legal policy]",
    );
  });

  it("preserves non-LinkedIn URLs in the same text", () => {
    const input =
      "Profile: https://linkedin.com/in/jane and repo: https://github.com/jane/project";
    const result = filterBlockedUrls(input);
    expect(result).toContain("https://github.com/jane/project");
    expect(result).not.toContain("linkedin.com");
  });

  it("handles text with no LinkedIn URLs unchanged (except format)", () => {
    const input = "Visit https://company.com/careers for jobs";
    const result = filterBlockedUrls(input);
    expect(result).toBe(input);
  });

  it("replaces multiple LinkedIn URLs in one text", () => {
    const input =
      "Profiles: https://linkedin.com/in/alice and https://www.linkedin.com/in/bob";
    const result = filterBlockedUrls(input);
    expect(result).not.toContain("linkedin.com");
    const matches = result.match(
      /\[blocked: LinkedIn URL removed per legal policy\]/g,
    );
    expect(matches).toHaveLength(2);
  });
});

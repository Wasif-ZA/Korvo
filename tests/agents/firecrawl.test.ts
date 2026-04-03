/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoist mock references so they are available inside vi.mock factories
const { mockCrawlUrl, mockFindFirst, mockUpsert, mockBreakerFire } = vi.hoisted(
  () => ({
    mockCrawlUrl: vi.fn(),
    mockFindFirst: vi.fn(),
    mockUpsert: vi.fn(),
    mockBreakerFire: vi.fn(),
  }),
);

// Mock @mendable/firecrawl-js — must use a class (constructor-compatible)
vi.mock("@mendable/firecrawl-js", () => ({
  default: class MockFirecrawlApp {
    crawlUrl = mockCrawlUrl;
  },
}));

// Mock prisma client
vi.mock("../../worker/lib/prisma", () => ({
  prisma: {
    companyEnrichment: {
      findFirst: mockFindFirst,
      upsert: mockUpsert,
    },
  },
}));

// Mock circuit breaker — return a simple wrapper that calls the underlying fn directly
vi.mock("../../worker/lib/circuit-breaker", () => ({
  createCircuitBreaker: vi.fn().mockImplementation((fn: unknown) => ({
    fire: mockBreakerFire.mockImplementation((...args: unknown[]) =>
      (fn as (...a: unknown[]) => unknown)(...args),
    ),
  })),
}));

// Import after mocks
import {
  getCompanyEnrichment,
  extractEnrichmentFromPages,
} from "../../worker/lib/firecrawl";

const SAMPLE_PAGES = [
  {
    markdown:
      "# About Us\n## Our Team\nWe use React, TypeScript, and AWS in our stack.\nWe believe in transparency and collaboration.\nWe have 500 employees.\nSenior Software Engineer positions open.",
  },
  {
    markdown:
      "## Careers\n### Backend Developer\n### Frontend Engineer\nWe are committed to building great products.",
  },
];

const SAMPLE_ENRICHMENT = {
  techStack: ["React", "TypeScript", "AWS"],
  recentNews: ["About Us", "Our Team"],
  companyValues: ["We believe in transparency and collaboration"],
  hiringRoles: [
    "Senior Software Engineer",
    "Backend Developer",
    "Frontend Engineer",
  ],
  teamSize: "500",
  scrapedPages: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no cache hit
  mockFindFirst.mockResolvedValue(null);
  mockUpsert.mockResolvedValue({});
  // Re-wire the circuit breaker mock so it always uses the current scrapeCompanyRaw
  // (which reads FIRECRAWL_API_KEY at call time, not at module load time)
  mockBreakerFire.mockImplementation(async (domain: string) => {
    const { default: FirecrawlApp } = await import("@mendable/firecrawl-js");
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error("Firecrawl not configured");
    }
    const client = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    const result = await client.crawlUrl(`https://${domain}`, {
      limit: 10,
      includePaths: ["/about*", "/careers*", "/blog*", "/team*", "/jobs*"],
      excludePaths: ["/login*", "/signup*", "/privacy*", "/terms*"],
      scrapeOptions: { formats: ["markdown"] },
    });
    const { extractEnrichmentFromPages } =
      await import("../../worker/lib/firecrawl");
    return extractEnrichmentFromPages(result.data ?? []);
  });
});

afterEach(() => {
  // Reset FIRECRAWL_API_KEY env var
  delete process.env.FIRECRAWL_API_KEY;
});

describe("getCompanyEnrichment", () => {
  it("returns enrichment from Firecrawl and caches it when no cache exists", async () => {
    process.env.FIRECRAWL_API_KEY = "fc-test-key";
    mockCrawlUrl.mockResolvedValue({ data: SAMPLE_PAGES });

    const result = await getCompanyEnrichment("atlassian.com");

    expect(result).not.toBeNull();
    expect(result!.techStack).toContain("React");
    expect(result!.techStack).toContain("TypeScript");
    expect(result!.scrapedPages).toBe(2);

    // Should have called upsert to cache the result
    expect(mockUpsert).toHaveBeenCalledOnce();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { domain: "atlassian.com" },
        create: expect.objectContaining({ domain: "atlassian.com" }),
        update: expect.objectContaining({ cachedAt: expect.any(Date) }),
      }),
    );
  });

  it("returns cached data without calling Firecrawl when valid cache exists", async () => {
    process.env.FIRECRAWL_API_KEY = "fc-test-key";
    // Simulate a cache hit
    mockFindFirst.mockResolvedValue({ data: SAMPLE_ENRICHMENT });

    const result = await getCompanyEnrichment("atlassian.com");

    expect(result).toEqual(SAMPLE_ENRICHMENT);
    // Firecrawl crawlUrl should NOT have been called
    expect(mockCrawlUrl).not.toHaveBeenCalled();
    // Upsert should NOT have been called
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns null when Firecrawl throws (D-06 — never fails pipeline)", async () => {
    process.env.FIRECRAWL_API_KEY = "fc-test-key";
    mockCrawlUrl.mockRejectedValue(new Error("Firecrawl rate limit exceeded"));

    const result = await getCompanyEnrichment("failingdomain.com");

    expect(result).toBeNull();
    // Upsert should NOT have been called on failure
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns null gracefully when FIRECRAWL_API_KEY is not set", async () => {
    // No env var — Firecrawl client is null, scrapeCompanyRaw throws "not configured"
    delete process.env.FIRECRAWL_API_KEY;

    const result = await getCompanyEnrichment("somecompany.com");

    expect(result).toBeNull();
    expect(mockCrawlUrl).not.toHaveBeenCalled();
  });
});

describe("extractEnrichmentFromPages", () => {
  it("extracts tech stack from markdown content", () => {
    const pages = [
      { markdown: "We use React, TypeScript, Node.js, and PostgreSQL." },
    ];
    const result = extractEnrichmentFromPages(pages);

    expect(result.techStack).toContain("React");
    expect(result.techStack).toContain("TypeScript");
    expect(result.techStack).toContain("Node.js");
    expect(result.techStack).toContain("PostgreSQL");
  });

  it("extracts hiring roles from markdown content", () => {
    const pages = [
      {
        markdown:
          "# Careers\nWe are hiring:\n- Senior Software Engineer\n- Frontend Developer\n- Backend Engineer\n- Data Scientist",
      },
    ];
    const result = extractEnrichmentFromPages(pages);

    expect(result.hiringRoles.length).toBeGreaterThan(0);
    expect(
      result.hiringRoles.some(
        (r) =>
          r.toLowerCase().includes("engineer") ||
          r.toLowerCase().includes("developer") ||
          r.toLowerCase().includes("scientist"),
      ),
    ).toBe(true);
  });

  it("returns scrapedPages count matching input array length", () => {
    const pages = [
      { markdown: "page 1" },
      { markdown: "page 2" },
      { markdown: "page 3" },
    ];
    const result = extractEnrichmentFromPages(pages);
    expect(result.scrapedPages).toBe(3);
  });

  it("handles empty pages array gracefully", () => {
    const result = extractEnrichmentFromPages([]);
    expect(result.techStack).toEqual([]);
    expect(result.recentNews).toEqual([]);
    expect(result.companyValues).toEqual([]);
    expect(result.hiringRoles).toEqual([]);
    expect(result.teamSize).toBeNull();
    expect(result.scrapedPages).toBe(0);
  });

  it("extracts team size from text mentioning employees", () => {
    const pages = [{ markdown: "We have 1,200 employees worldwide." }];
    const result = extractEnrichmentFromPages(pages);
    expect(result.teamSize).toBe("1,200");
  });
});

import FirecrawlApp from "@mendable/firecrawl-js";
import { prisma } from "./prisma";
import type { CompanyEnrichmentData } from "@/shared/types/agents";
import { createCircuitBreaker } from "./circuit-breaker";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_PAGES = 10;

let firecrawlClient: FirecrawlApp | null = null;

function getFirecrawlClient(): FirecrawlApp | null {
  if (!process.env.FIRECRAWL_API_KEY) return null;
  if (!firecrawlClient) {
    firecrawlClient = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });
  }
  return firecrawlClient;
}

async function scrapeCompanyRaw(
  domain: string,
): Promise<CompanyEnrichmentData> {
  const client = getFirecrawlClient();
  if (!client) throw new Error("Firecrawl not configured");

  const result = await client.crawlUrl(`https://${domain}`, {
    limit: MAX_PAGES,
    includePaths: ["/about*", "/careers*", "/blog*", "/team*", "/jobs*"],
    excludePaths: ["/login*", "/signup*", "/privacy*", "/terms*"],
    scrapeOptions: { formats: ["markdown"] },
  });

  return extractEnrichmentFromPages(result.data ?? []);
}

// Circuit breaker wrapping Firecrawl (AGENT-08)
const firecrawlBreaker = createCircuitBreaker(scrapeCompanyRaw, "firecrawl", {
  timeout: 30000, // 30s for crawl
  errorThresholdPercentage: 50,
  resetTimeout: 60000,
});

export async function getCompanyEnrichment(
  domain: string,
): Promise<CompanyEnrichmentData | null> {
  // 1. Check cache (30-day TTL per D-05)
  const cached = await prisma.companyEnrichment.findFirst({
    where: {
      domain,
      cachedAt: { gte: new Date(Date.now() - THIRTY_DAYS_MS) },
    },
  });
  if (cached) return cached.data as CompanyEnrichmentData;

  // 2. Scrape via Firecrawl with circuit breaker
  try {
    const enrichment = (await firecrawlBreaker.fire(
      domain,
    )) as CompanyEnrichmentData;

    // 3. Cache result
    await prisma.companyEnrichment.upsert({
      where: { domain },
      create: { domain, data: enrichment as object, cachedAt: new Date() },
      update: { data: enrichment as object, cachedAt: new Date() },
    });

    return enrichment;
  } catch (err) {
    // D-06: Never fail pipeline due to Firecrawl
    console.warn(`[firecrawl] Failed for ${domain}:`, err);
    return null;
  }
}

export function extractEnrichmentFromPages(
  pages: Array<{ markdown?: string }>,
): CompanyEnrichmentData {
  const allText = pages.map((p) => p.markdown ?? "").join("\n");

  return {
    techStack: extractTechStack(allText),
    recentNews: extractRecentNews(allText),
    companyValues: extractValues(allText),
    hiringRoles: extractHiringRoles(allText),
    teamSize: extractTeamSize(allText),
    scrapedPages: pages.length,
  };
}

// Helper extraction functions — use keyword matching on markdown content
function extractTechStack(text: string): string[] {
  const techs = [
    "React",
    "Python",
    "Java",
    "Go",
    "Rust",
    "TypeScript",
    "Node.js",
    "AWS",
    "GCP",
    "Azure",
    "Kubernetes",
    "Docker",
    "PostgreSQL",
    "MongoDB",
    "Redis",
  ];
  return techs.filter((t) => text.toLowerCase().includes(t.toLowerCase()));
}

function extractRecentNews(text: string): string[] {
  // Extract first 3 heading-like lines that look like news/blog titles
  const lines = text
    .split("\n")
    .filter((l) => l.startsWith("# ") || l.startsWith("## "));
  return lines.slice(0, 3).map((l) => l.replace(/^#+\s*/, ""));
}

function extractValues(text: string): string[] {
  const valueKeywords = [
    "mission",
    "values",
    "culture",
    "believe",
    "committed",
  ];
  const sentences = text
    .split(/[.!]\s/)
    .filter((s) => valueKeywords.some((k) => s.toLowerCase().includes(k)));
  return sentences.slice(0, 3).map((s) => s.trim().substring(0, 200));
}

function extractHiringRoles(text: string): string[] {
  // Look for job title patterns in careers/jobs pages
  const rolePattern =
    /(?:Senior |Lead |Staff |Junior |Principal )?(?:Software|Frontend|Backend|Full[- ]?Stack|DevOps|Data|ML|AI|Product|Design)\s+(?:Engineer|Developer|Manager|Analyst|Scientist)/gi;
  const matches = text.match(rolePattern) ?? [];
  return [...new Set(matches)].slice(0, 10);
}

function extractTeamSize(text: string): string | null {
  const sizePattern = /(\d+[,+]?\d*)\s*(?:employees|team members|people)/i;
  const match = text.match(sizePattern);
  return match ? match[1] : null;
}

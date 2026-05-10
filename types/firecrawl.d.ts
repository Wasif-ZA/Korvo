declare module "@mendable/firecrawl-js" {
  export interface FirecrawlOptions {
    apiKey: string;
  }

  export interface CrawlOptions {
    limit?: number;
    includePaths?: string[];
    excludePaths?: string[];
    scrapeOptions?: {
      formats?: string[];
    };
  }

  export interface CrawlResult {
    data?: Array<{
      markdown?: string;
    }>;
  }

  export default class FirecrawlApp {
    constructor(options: FirecrawlOptions);
    crawlUrl(url: string, options?: CrawlOptions): Promise<CrawlResult>;
  }
}

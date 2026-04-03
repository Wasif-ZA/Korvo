const BLOCKED_DOMAINS = ["linkedin.com", "www.linkedin.com", "lnkd.in"];

export function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return BLOCKED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith("." + d),
    );
  } catch {
    return false;
  }
}

export function filterBlockedUrls(text: string): string {
  // Replace LinkedIn URLs in search results with blocked notice
  return text.replace(
    /https?:\/\/(www\.)?(linkedin\.com|lnkd\.in)[^\s")']*/gi,
    "[blocked: LinkedIn URL removed per legal policy]",
  );
}

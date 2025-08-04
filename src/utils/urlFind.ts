// URL Detection Utilities for LogSeq Block Content
// These functions analyze block content to find formatted and unformatted URLs

export interface URLLocation {
  url: string;
  start: number;
  end: number;
  title?: string; // For formatted URLs, the link text
}

/**
 * Finds all already-formatted markdown URLs in block content
 * Detects patterns like [title](url) and ![alt](url)
 * @param content - The block content to analyze
 * @returns Array of URLLocation objects for formatted URLs
 */
export function findFormattedURLs(content: string): URLLocation[] {
  const results: URLLocation[] = [];

  // Regex for markdown links: [text](url) or ![alt](url)
  const markdownLinkRegex = /(!?)\[([^\]]*)\]\(([^)]+)\)/g;

  let match;
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const [fullMatch, , title, url] = match;
    const start = match.index;
    const end = start + fullMatch.length;

    results.push({
      url,
      start,
      end,
      title: title || undefined,
    });
  }

  return results;
}

/**
 * Finds all raw, unformatted URLs in block content
 * Detects http(s) URLs that are not already part of markdown formatting
 * @param content - The block content to analyze
 * @returns Array of URLLocation objects for raw URLs
 */
export function findRawURLs(content: string): URLLocation[] {
  const results: URLLocation[] = [];

  // First, find all formatted URLs to exclude them
  const formattedURLs = findFormattedURLs(content);
  const formattedRanges = formattedURLs.map((url) => ({
    start: url.start,
    end: url.end,
  }));

  // Regex for URLs - more precise to avoid trailing punctuation
  const urlRegex = /https?:\/\/[^\s\])]+/g;

  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    let url = match[0];
    let start = match.index;
    let end = start + url.length;

    // Remove common trailing punctuation that's likely not part of the URL
    const trailingPunctuation = /[.,;:!?]+$/;
    const trimmed = url.replace(trailingPunctuation, "");

    if (trimmed !== url) {
      url = trimmed;
      end = start + url.length;
    }

    // Check if this URL is already part of a formatted link
    const isAlreadyFormatted = formattedRanges.some(
      (range) => start >= range.start && end <= range.end
    );

    if (!isAlreadyFormatted) {
      results.push({
        url,
        start,
        end,
      });
    }
  }

  return results;
}

/**
 * Comprehensive analysis of all URLs in block content
 * @param content - The block content to analyze
 * @returns Object with formatted and raw URL arrays
 */
export function analyzeBlockURLs(content: string) {
  return {
    formatted: findFormattedURLs(content),
    raw: findRawURLs(content),
  };
}

// Default export for easy importing
export default {
  findFormattedURLs,
  findRawURLs,
  analyzeBlockURLs,
};

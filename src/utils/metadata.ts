// URL Metadata Utilities for LogSeq Block Content
// These functions fetch metadata (title, icon, etc.) from URLs

import {analyzeBlockURLs} from "./urlFind";

// Plugin settings interface
export interface PluginSettings {
  enableFavicons: boolean;
  faviconSize: number;
  faviconPosition: "before" | "after";
}

// Options for URL processing functions (subset of PluginSettings with optional fields)
export interface URLProcessingOptions {
  includeFavicon?: boolean;
  faviconSize?: number;
  faviconPosition?: "before" | "after";
}

export interface URLMetadata {
  title: string | null;
  icon?: string;
  hasIcon?: boolean;
  note?: string;
}

/**
 * Fetches page title and metadata from a URL using microlink.io API
 * @param url - The URL to fetch metadata for
 * @returns Promise with title and optional icon
 */
export async function fetchPageTitle(url: string): Promise<URLMetadata> {
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data?.status === "success" && data?.data) {
      const title = data.data.title || null; // Return null if title is empty/undefined
      const hasIcon = !!(data.data.logo || data.data.image?.url);
      return {title, hasIcon};
    } else {
      throw new Error("Invalid API response format");
    }
  } catch (error) {
    // Fallback when API fails (intentionally broad catch)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _error = error; // Acknowledge we're catching all errors
    return {
      title: null, // No title available when API fails
      hasIcon: false,
      note: "API may be rate-limited or unavailable",
    };
  }
}

/**
 * Validates if a string is a valid URL
 * @param str - The string to validate
 * @returns boolean indicating if the string is a valid URL
 */
export function isValidURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches favicon markdown for a URL
 * @param url - The URL to get favicon for
 * @param options - Favicon options
 * @returns Promise with favicon markdown string
 */
export async function fetchFaviconMarkdown(
  url: string,
  options: {
    size?: number;
    altTextTemplate?: (hostname: string) => string;
  } = {}
): Promise<string> {
  const {size = 16, altTextTemplate = (hostname) => `${hostname}-favicon`} =
    options;

  try {
    const {hostname} = new URL(url);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
    const altText = altTextTemplate(hostname);
    return `![${altText}](${faviconUrl})`;
  } catch (error) {
    console.warn("Invalid URL for favicon:", url, error);
    return "";
  }
}

/**
 * Helper function to validate title result from Promise.allSettled or direct call
 * @param titleResult - Either a PromiseSettledResult or direct URLMetadata
 * @returns title string or null
 */
function extractValidTitle(
  titleResult: PromiseSettledResult<URLMetadata> | URLMetadata
): string | null {
  // Handle Promise.allSettled result
  if ("status" in titleResult) {
    return titleResult.status === "rejected" || !titleResult.value.title
      ? null
      : titleResult.value.title;
  }
  // Handle direct URLMetadata result
  return titleResult.title;
}

/**
 * Processes a URL to create markdown with title
 * @param url - The URL to process
 * @param options - Options for markdown generation
 * @returns Promise with markdown string or null if invalid URL
 */
export async function processURLToMarkdown(
  url: string,
  options: URLProcessingOptions = {}
): Promise<string | null> {
  console.log(`🔗 Processing URL: ${url}`);

  if (!isValidURL(url)) {
    console.log(`❌ Invalid URL: ${url}`);
    return null;
  }

  // Fetch title and favicon in parallel when favicon is enabled
  if (options.includeFavicon) {
    console.log(`🌐 Fetching title and favicon for: ${url}`);

    const [titleResult, faviconResult] = await Promise.allSettled([
      fetchPageTitle(url),
      fetchFaviconMarkdown(url, {size: options.faviconSize}),
    ]);

    // Handle title result
    const title = extractValidTitle(titleResult);
    if (!title) {
      console.log(`⚠️ No title found for ${url}`);
      return null;
    }

    // Create basic markdown
    let markdown = `[${title}](${url})`;
    console.log(`✨ Generated basic markdown: ${markdown}`);

    // Add favicon if successfully fetched
    if (faviconResult.status === "fulfilled" && faviconResult.value) {
      const position = options.faviconPosition || "before";
      markdown =
        position === "before"
          ? `${faviconResult.value}  ${markdown}`
          : `${markdown}  ${faviconResult.value}`;
      console.log(`🎨 Enhanced with favicon: ${markdown}`);
    } else if (faviconResult.status === "rejected") {
      console.warn(
        `⚠️ Failed to fetch favicon for ${url}:`,
        faviconResult.reason
      );
    }

    return markdown;
  } else {
    // Favicon not enabled - just fetch title
    console.log(`🌐 Fetching title for: ${url}`);
    const titleResult = await fetchPageTitle(url);

    // Handle title result (same formula as parallel case)
    const title = extractValidTitle(titleResult);
    if (!title) {
      console.log(`⚠️ No title found for ${url}`);
      return null;
    }

    // Create basic markdown without favicon
    const markdown = `[${title}](${url})`;
    console.log(`✨ Generated basic markdown: ${markdown}`);
    return markdown;
  }
}

/**
 * Processes block content to convert all raw URLs to markdown
 * @param content - The original block content
 * @param options - Options for markdown generation
 * @returns Promise with updated content or original content if no processing needed
 */
export async function processBlockContentForURLs(
  content: string,
  options: URLProcessingOptions = {}
): Promise<string> {
  // Analyze URLs in the content using urlFind
  const urlAnalysis = analyzeBlockURLs(content);

  // Check if there are any raw URLs to process
  if (urlAnalysis.raw.length === 0) {
    return content; // Return unchanged content
  }

  console.log(`🔗 Found ${urlAnalysis.raw.length} raw URL(s) to process`);

  // Process URLs backwards to avoid coordinate shifting issues
  // When we replace URLs from last to first, the coordinates of earlier URLs remain valid
  let updatedContent = content;
  const reversedURLs = [...urlAnalysis.raw].reverse();

  for (const rawURL of reversedURLs) {
    const {url} = rawURL;

    // Process URL to markdown
    const markdown = await processURLToMarkdown(url, options);
    if (markdown) {
      // Replace the URL with markdown using precise coordinates
      updatedContent =
        updatedContent.substring(0, rawURL.start) +
        markdown +
        updatedContent.substring(rawURL.end);

      console.log(`✅ Processed URL: ${url}`);
    } else {
      console.log(`⚠️ Skipped invalid URL: ${url}`);
    }
  }

  return updatedContent;
}

// Default export for easy importing
export default {
  fetchPageTitle,
  isValidURL,
  processURLToMarkdown,
  processBlockContentForURLs,
  fetchFaviconMarkdown,
};

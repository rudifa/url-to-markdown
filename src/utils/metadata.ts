// URL Metadata Utilities for LogSeq Block Content
// These functions fetch metadata (title, icon, etc.) from URLs

import {analyzeBlockURLs} from "./urlFind";

// Plugin settings interface
export interface PluginSettings {
  enableFavicons: boolean;
  faviconSize: number;
  faviconPosition: "before" | "after";
}

export interface URLProcessingOptions {
  includeFavicon?: boolean;
  faviconSize?: number;
  faviconPosition?: "before" | "after";
}

// ============================================================================
// ENTRY POINT - Main processing function
// ============================================================================

/**
 * Processes block content to convert all raw URLs to markdown
 * Uses current plugin settings for URL processing options
 * @param content - The original block content
 * @returns Promise with updated content or original content if no processing needed
 */
export async function processBlockContentForURLs(
  content: string
): Promise<string> {
  // Analyze URLs in the content using urlFind
  const urlAnalysis = analyzeBlockURLs(content);

  // Check if there are any raw URLs to process
  if (urlAnalysis.raw.length === 0) {
    return content; // Return unchanged content
  }

  console.log(`🔗 Found ${urlAnalysis.raw.length} raw URL(s) to process`);

  // Process URL list backwards to avoid coordinate shifting issues
  // When we replace URLs from last to first, the coordinates of earlier URLs remain valid
  let updatedContent = content;
  const reversedURLs = [...urlAnalysis.raw].reverse();

  for (const rawURL of reversedURLs) {
    // Process URL to markdown
    const markdown = await processURLToMarkdown(rawURL.url);
    if (markdown) {
      // Replace the URL with markdown using precise coordinates
      updatedContent =
        updatedContent.substring(0, rawURL.start) +
        markdown +
        updatedContent.substring(rawURL.end);

      console.log(`✅ Processed URL: ${rawURL.url}`);
    } else {
      console.log(`⚠️ Skipped invalid URL: ${rawURL.url}`);
    }
  }

  return updatedContent;
}

// ============================================================================
// URL PROCESSING - Functions called by processBlockContentForURLs
// ============================================================================

/**
 * Processes a URL to create markdown with title and optional favicon
 * Uses current plugin settings to determine favicon behavior
 * @param url - The URL to process
 * @returns Promise with markdown string or null if invalid URL
 */
export async function processURLToMarkdown(
  url: string
): Promise<string | null> {
  console.log(`🔗 Processing URL: ${url}`);

  // Get current plugin options
  const options = getFaviconOptions();

  // Fetch title and favicon in parallel when favicon is enabled
  if (options.includeFavicon) {
    console.log(`🌐 Fetching title and favicon for: ${url}`);

    const [titleResult, faviconResult] = await Promise.allSettled([
      fetchPageTitle(url),
      fetchFaviconMarkdown(url, {size: options.faviconSize}),
    ]);

    // Handle title result
    const title = titleResult.status === "fulfilled" ? titleResult.value : null;
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
    const title = await fetchPageTitle(url);

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

// ============================================================================
// METADATA FETCHING - Functions called by processURLToMarkdown
// ============================================================================

/**
 * Fetches page title from a URL using microlink.io API
 * @param url - The URL to fetch title for
 * @returns Promise with title string or null if unavailable
 */
export async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data?.status === "success" && data?.data) {
      const title = data.data.title || null; // Return null if title is empty/undefined
      return title;
    } else {
      throw new Error("Invalid API response format");
    }
  } catch (error) {
    // Fallback when API fails (intentionally broad catch)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _error = error; // Acknowledge we're catching all errors
    return null; // No title available when API fails
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

// ============================================================================
// HELPER FUNCTIONS - Utilities called by the above functions
// ============================================================================

/**
 * Helper function to get favicon options with fallbacks to default settings
 * Extracts plugin settings and provides safe defaults for all options
 * @returns URLProcessingOptions object with favicon settings
 */
function getFaviconOptions(): URLProcessingOptions {
  // Access logseq settings from the global logseq object
  const settings = (globalThis as any).logseq
    ?.settings as unknown as PluginSettings;
  return {
    includeFavicon: settings?.enableFavicons ?? true,
    faviconSize: settings?.faviconSize ?? 16,
    faviconPosition: settings?.faviconPosition ?? "before",
  };
}

// Default export for easy importing
export default {
  fetchPageTitle,
  processURLToMarkdown,
  processBlockContentForURLs,
  fetchFaviconMarkdown,
};

// URL Metadata Utilities for LogSeq Block Content
// These functions fetch metadata (title, icon, etc.) from URLs

import {analyzeBlockURLs} from "./urlFind";

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
  // Only enable verbose logging in test environments (Node.js), not in browser/LogSeq
  const isVerbose =
    typeof process !== "undefined" && process.env?.VERBOSE_METADATA === "true";

  if (isVerbose) {
    console.log(`🔍 Starting metadata fetch for: ${url}`);
  }

  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
    if (isVerbose) {
      console.log(`📡 API URL: ${apiUrl}`);
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      if (isVerbose) {
        console.log(
          `❌ Response not ok: ${response.status} ${response.statusText}`
        );
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (isVerbose) {
      console.log(`🔗 Fetched metadata for ${url}:`, data);
    }

    if (data?.status === "success" && data?.data) {
      const title = data.data.title || null; // Return null if title is empty/undefined
      const hasIcon = !!(data.data.logo || data.data.image?.url);
      const result = {title, hasIcon};

      if (isVerbose) {
        console.log(`✅ Processed result:`, result);
        console.log(`🏷️  Title: "${title}"`);
        console.log(
          `🎨 Has icon: ${hasIcon} (logo: ${!!data.data.logo}, image: ${!!data
            .data.image?.url})`
        );
      }

      return result;
    } else {
      if (isVerbose) {
        console.log(`⚠️  Invalid API response format:`, data);
      }
      throw new Error("Invalid API response format");
    }
  } catch (error) {
    if (isVerbose) {
      console.log(`💥 API error for ${url}:`, error);
    }
    // Fallback when API fails (intentionally broad catch)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _error = error; // Acknowledge we're catching all errors
    const fallbackResult = {
      title: null, // No title available when API fails
      hasIcon: false,
      note: "API may be rate-limited or unavailable",
    };

    if (isVerbose) {
      console.log(`🔄 Fallback result:`, fallbackResult);
    }

    return fallbackResult;
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
    console.warn("Invalid URL for favicon:", url);
    return "";
  }
}

/**
 * Processes a URL to create markdown with title
 * @param url - The URL to process
 * @param options - Options for markdown generation
 * @returns Promise with markdown string or null if invalid URL
 */
export async function processURLToMarkdown(
  url: string,
  options: {
    includeFavicon?: boolean;
    faviconSize?: number;
    faviconPosition?: "before" | "after";
  } = {}
): Promise<string | null> {
  console.log(`🔗 Processing URL: ${url}`);

  if (!isValidURL(url)) {
    console.log(`❌ Invalid URL: ${url}`);
    return null;
  }

  // Launch both fetches in parallel when favicon is enabled
  if (options.includeFavicon) {
    console.log(`🌐 Fetching title and favicon for: ${url}`);

    try {
      const [titleResult, faviconMarkdown] = await Promise.allSettled([
        fetchPageTitle(url),
        fetchFaviconMarkdown(url, {size: options.faviconSize}),
      ]);

      // Handle title result
      let title = null; // fallback
      if (titleResult.status === "fulfilled") {
        title = titleResult.value.title;
      } else {
        console.warn(
          `⚠️ Failed to fetch title for ${url}:`,
          titleResult.reason
        );
        return null;
      }

      if (!title) {
        console.log(`⚠️ No title found for ${url}`);
        return null;
      }

      // Create basic markdown
      let markdown = `[${title}](${url})`;
      console.log(`✨ Generated basic markdown: ${markdown}`);

      // Handle favicon result
      if (faviconMarkdown.status === "fulfilled" && faviconMarkdown.value) {
        const position = options.faviconPosition || "before";
        markdown =
          position === "before"
            ? `${faviconMarkdown.value}  ${markdown}`
            : `${markdown}  ${faviconMarkdown.value}`;
        console.log(`🎨 Enhanced with favicon: ${markdown}`);
      } else if (faviconMarkdown.status === "rejected") {
        console.warn(
          `⚠️ Failed to fetch favicon for ${url}:`,
          faviconMarkdown.reason
        );
      }

      return markdown;
    } catch (error) {
      console.error(`💥 Unexpected error processing ${url}:`, error);
      return null; // Don't attempt fallback processing
    }
  } else {
    // Favicon not enabled - just fetch title
    console.log(`🌐 Fetching title for: ${url}`);
    const {title} = await fetchPageTitle(url);

    if (!title) {
      console.log(`⚠️ Failed to fetch title for ${url}`);
      return null;
    }

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
  options: {
    includeFavicon?: boolean;
    faviconSize?: number;
    faviconPosition?: "before" | "after";
  } = {}
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

  for (let i = urlAnalysis.raw.length - 1; i >= 0; i--) {
    const rawURL = urlAnalysis.raw[i];
    const {url} = rawURL;

    // Process URL to markdown
    const markdown = await processURLToMarkdown(url, options);
    if (markdown) {
      // Replace the URL with markdown using precise coordinates
      updatedContent =
        updatedContent.substring(0, rawURL.start) +
        markdown +
        updatedContent.substring(rawURL.end);

      console.log(
        `✅ Processed URL ${i + 1}/${urlAnalysis.raw.length}: ${url}`
      );
    } else {
      console.log(
        `⚠️ Skipped invalid URL ${i + 1}/${urlAnalysis.raw.length}: ${url}`
      );
    }
  }

  return updatedContent;
}

export async function addFaviconToMarkdownLink(
  markdownLink: string,
  options: {
    size?: number;
    position?: "before" | "after";
    altTextTemplate?: (hostname: string) => string;
  } = {}
): Promise<string> {
  const {
    size = 16,
    position = "before",
    altTextTemplate = (hostname) => `${hostname}-favicon`,
  } = options;

  const markdownRegex = /\[([^\]]*)\]\(([^)]+)\)/;
  const match = markdownLink.match(markdownRegex);

  if (!match) return markdownLink;

  const [fullMatch, title, url] = match;

  try {
    const {hostname} = new URL(url);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
    const altText = altTextTemplate(hostname);
    const faviconMarkdown = `![${altText}](${faviconUrl})`;

    return position === "before"
      ? `${faviconMarkdown} ${markdownLink}`
      : `${markdownLink} ${faviconMarkdown}`;
  } catch (error) {
    console.warn("Invalid URL in markdown link:", url);
    return markdownLink;
  }
}

// Default export for easy importing
export default {
  fetchPageTitle,
  isValidURL,
  processURLToMarkdown,
  processBlockContentForURLs,
  addFaviconToMarkdownLink,
  fetchFaviconMarkdown,
};

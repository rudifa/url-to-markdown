// URL Metadata Utilities for LogSeq Block Content
// These functions fetch metadata (title, icon, etc.) from URLs

import {analyzeBlockURLs} from "./urlFind";

export interface URLMetadata {
  title: string;
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
      //   console.log(`📦 Raw API response:`, JSON.stringify(data, null, 2));
      // } else {
      console.log(`🔗 Fetched metadata for ${url}:`, data);
    }

    if (data?.status === "success" && data?.data) {
      const title = data.data.title || url; // Fallback to URL if title is null/empty
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
    // Fallback to URL when API fails (intentionally broad catch)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _error = error; // Acknowledge we're catching all errors
    const fallbackResult = {
      title: url,
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
      let title = url; // fallback
      if (titleResult.status === "fulfilled") {
        title = titleResult.value.title;
      } else {
        console.warn(
          `⚠️ Failed to fetch title for ${url}:`,
          titleResult.reason
        );
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
      // Fallback to basic processing
      const {title} = await fetchPageTitle(url);
      return `[${title}](${url})`;
    }
  } else {
    // Favicon not enabled - just fetch title
    console.log(`🌐 Fetching title for: ${url}`);
    const {title} = await fetchPageTitle(url);

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

// Compare fetchPageTitle function to the one in urlFind.ts

async function fetchPageTitle2(url: string): Promise<URLMetadata> {
  console.log("📥 fetchPageTitle2 called with url:", url);
  try {
    const htmlTitleTag = /<title(\s[^>]+)*>([^<]*)<\/title>/;

    const response = await fetch(url);
    const responseText = await response.text();
    const matches = responseText.match(htmlTitleTag);
    if (matches !== null && matches.length > 1 && matches[2] !== null) {
      const title = decodeHTML(matches[2].trim());
      console.log("📥 Title found:", title);
      return {
        title,
        hasIcon: false, // fetchPageTitle2 doesn't handle icons
        note: "Fetched with fetchPageTitle2 (regex parsing)",
      };
    } else {
      console.log("📥 No <title> tag found in response");
      return {
        title: url,
        hasIcon: false,
        note: "No title found - using URL as fallback",
      };
    }
  } catch (e) {
    console.error("📥 Error fetching title:", e);
    return {
      title: url,
      hasIcon: false,
      note: `Error fetching title: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }
}

function decodeHTML(input: string): string {
  if (!input) {
    return "";
  }

  // Check if we're in a browser environment
  if (typeof window !== "undefined" && window.DOMParser) {
    const doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent || "";
  }

  // Node.js fallback: basic HTML entity decoding
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_match: string, dec: string) =>
      String.fromCharCode(parseInt(dec, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match: string, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    );
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
  fetchPageTitle2, // Added for comparison
  addFaviconToMarkdownLink, // Added for favicon functionality
  fetchFaviconMarkdown, // Added for cleaner favicon handling
};

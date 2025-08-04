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
 * Processes a URL to create markdown with title
 * @param url - The URL to process
 * @returns Promise with markdown string or null if invalid URL
 */
export async function processURLToMarkdown(
  url: string
): Promise<string | null> {
  console.log(`🔗 Processing URL: ${url}`);

  if (!isValidURL(url)) {
    console.log(`❌ Invalid URL: ${url}`);
    return null;
  }

  // Fetch page title and create markdown
  console.log(`🌐 Fetching title for: ${url}`);
  const {title} = await fetchPageTitle(url);

  // Create markdown - just use the title for clean formatting
  const markdown = `[${title}](${url})`;
  console.log(`✨ Generated markdown: ${markdown}`);

  return markdown;
}

/**
 * Processes block content to convert all raw URLs to markdown
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

  // Process URLs backwards to avoid coordinate shifting issues
  // When we replace URLs from last to first, the coordinates of earlier URLs remain valid
  let updatedContent = content;

  for (let i = urlAnalysis.raw.length - 1; i >= 0; i--) {
    const rawURL = urlAnalysis.raw[i];
    const {url} = rawURL;

    // Process URL to markdown
    const markdown = await processURLToMarkdown(url);
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

// Default export for easy importing
export default {
  fetchPageTitle,
  isValidURL,
  processURLToMarkdown,
  processBlockContentForURLs,
};

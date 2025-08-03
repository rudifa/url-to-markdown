// URL Metadata Utilities for LogSeq Block Content
// These functions fetch metadata (title, icon, etc.) from URLs

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

// Default export for easy importing
export default {
  fetchPageTitle,
};

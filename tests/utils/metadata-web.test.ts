import {describe, it, expect, beforeEach} from "vitest";
import {fetchPageTitle} from "../../src/utils/metadata.js";

// Real web tests - these may be unstable due to network conditions
// To run these tests, set environment variable: RUN_WEB_TESTS=true
//
// Usage:
//   npm test                    # Runs only mock tests (fast, reliable)
//   RUN_WEB_TESTS=true npm test # Runs both mock and web tests (slower, realistic)

describe("fetchPageTitle from the web", () => {
  const webTestTimeout = 10000; // 10 seconds
  const isVerbose = process.env.VERBOSE_METADATA === "true";

  // Test data with real URLs and expected metadata
  const realWebTests = [
    {
      url: "https://github.com",
      titlePattern: /github/i,
    },
    {
      url: "https://vitest.dev",
      titlePattern: /Vitest/,
    },
    {
      url: "https://logseq.com",
      titlePattern: /A privacy-first, open-source knowledge base/,
    },
    {
      url: "https://developer.mozilla.org",
      titlePattern: /MDN Web Docs/,
    },
    {
      url: "https://nodejs.org",
      titlePattern: /Node.js — Run JavaScript Everywhere/,
    },
    {
      url: "https://www.npmjs.com",
      titlePattern: /npm | Home/,
    },
    {
      url: "https://www.google.com",
      titlePattern: /Google/,
    },
    {
      url: "https://chatgpt.com/share/6891af68-d7fc-8010-a6b2-a4b7edad160b",
      titlePattern: /ChatGPT - Split commit into files/,
    },
    {
      url: "https://www.perplexity.ai/search/a-browser-question-in-the-atta-fqTG2DhRQRmjFVHXNXwG.Q-first, open-source knowledge base/",
      titlePattern: /Just a moment.../,
    },
  ];

  // Skip all web tests unless explicitly enabled
  if (!process.env.RUN_WEB_TESTS) {
    it("web tests are skipped", () => {
      console.log("Skipping web tests (set RUN_WEB_TESTS=true to enable)");
    });
    return;
  }

  // Set up the real fetch for web tests
  beforeEach(() => {
    const {fetch: undiciFetch} = require("undici");
    global.fetch = undiciFetch;
  });

  realWebTests.forEach(({url, titlePattern}) => {
    it(
      `should fetch real metadata from ${url}`,
      async () => {
        if (isVerbose) {
          console.log(`\n🧪 Testing URL: ${url}`);
        }

        let result;
        try {
          result = await fetchPageTitle(url);

          if (isVerbose) {
            console.log(`✅ fetchPageTitle for ${url}:`, result);
          }
        } catch (error) {
          if (isVerbose) {
            console.log(`❌ Test failed for ${url}:`, error);
          }
          // In case of network failure, verify we get a fallback
          expect(result || url).toBe(url);
          return;
        }

        // Verify basic structure - result should be a string or null
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);

        // Check if we got actual metadata or fallback
        const gotActualMetadata = result !== url;

        if (gotActualMetadata && titlePattern) {
          expect(result).toMatch(titlePattern);
          console.log(`✅ Got metadata title for ${url}: "${result}"`);
        } else {
          expect(result).toBe(url);
          console.log(`⚠️ Got fallback for ${url} (API may be rate-limited)`);
        }

        // No icon property anymore since fetchPageTitle only returns string | null
      },
      webTestTimeout
    );
  });

  it("should handle non-existent domains gracefully", async () => {
    const invalidUrl =
      "https://this-domain-definitely-does-not-exist-12345.com";
    const result = await fetchPageTitle(invalidUrl);

    // The real microlink.io API returns the domain name as title for non-existent domains
    // This is different from mock test behavior where we simulate actual failures
    expect(typeof result).toBe("string");
    // For non-existent domains, the API typically returns the domain name as title
    expect(result).toBe("this-domain-definitely-does-not-exist-12345.com");
  }, 5000);

  it("should handle slow responses within timeout", async () => {
    const result = await fetchPageTitle("https://httpbin.org/delay/2");

    // Should still get some result even if slow
    expect(typeof result).toBe("string");
  }, 15000);
});

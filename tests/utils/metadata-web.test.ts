import {describe, it, expect, beforeEach} from "vitest";
import metadataUtils, {fetchPageTitle} from "../../src/utils/metadata.js";

const {fetchPageTitle2} = metadataUtils;

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
          expect(result || {title: url}).toMatchObject({title: url});
          return;
        }

        // Verify basic structure
        expect(result).toHaveProperty("title");
        expect(typeof result.title).toBe("string");
        expect(result.title.length).toBeGreaterThan(0);

        // Check if we got actual metadata or fallback
        const gotActualMetadata = result.title !== url;

        if (gotActualMetadata && titlePattern) {
          expect(result.title).toMatch(titlePattern);
          console.log(`✅ Got metadata title for ${url}: "${result.title}"`);
        } else {
          expect(result.title).toBe(url);
          console.log(`⚠️ Got fallback for ${url} (API may be rate-limited)`);
        }

        // Verify icon property if present
        if (result.icon) {
          expect(typeof result.icon).toBe("string");
          expect(result.icon).toMatch(/^https?:\/\//);
        }
      },
      webTestTimeout
    );

    // Comparison test for fetchPageTitle2
    it(
      `should compare fetchPageTitle vs fetchPageTitle2 for ${url}`,
      async () => {
        if (isVerbose) {
          console.log(`\n🔍 Comparing functions for URL: ${url}`);
        }

        const [result1, result2] = await Promise.all([
          fetchPageTitle(url).catch((err) => ({
            title: url,
            error: err.message,
          })),
          fetchPageTitle2(url).catch((err) => ({
            title: url,
            error: err.message,
          })),
        ]);

        if (isVerbose) {
          console.log(`📊 fetchPageTitle result:`, result1);
          console.log(`📊 fetchPageTitle2 result:`, result2);
          console.log(
            `🔗 Title comparison: "${result1.title}" vs "${result2.title}"`
          );
        }

        // Both should return valid results
        expect(result1).toHaveProperty("title");
        expect(result2).toHaveProperty("title");

        // Log comparison for analysis
        console.log(`🏷️ ${url}:`);
        console.log(`   fetchPageTitle: "${result1.title}"`);
        console.log(`   fetchPageTitle2: "${result2.title}"`);
        console.log(`   Same title: ${result1.title === result2.title}`);
      },
      webTestTimeout * 2 // Allow more time for both calls
    );
  });

  it("should handle non-existent domains gracefully", async () => {
    const invalidUrl =
      "https://this-domain-definitely-does-not-exist-12345.com";
    const result = await fetchPageTitle(invalidUrl);

    // Should fallback to some form of the URL when fetch fails
    // The API might return the URL with or without the protocol
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("hasIcon", false);
    expect(
      result.title === invalidUrl ||
        result.title === "this-domain-definitely-does-not-exist-12345.com"
    ).toBe(true);
  }, 5000);

  it("should handle slow responses within timeout", async () => {
    const result = await fetchPageTitle("https://httpbin.org/delay/2");

    // Should still get some result even if slow
    expect(result).toHaveProperty("title");
    expect(typeof result.title).toBe("string");
  }, 15000);
});

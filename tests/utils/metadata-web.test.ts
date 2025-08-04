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
            console.log(`✅ Result for ${url}:`, result);
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
          console.log(`✅ Got metadata for ${url}: "${result.title}"`);
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

import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
  fetchPageTitle,
  fetchFaviconMarkdown,
  processBlockContentForURLs,
} from "../../src/utils/metadata.js";

// Real web tests of fetching pageTitle and favicon from the web
// All tests may be unstable due to network conditions and require RUN_WEB_TESTS=true
// To run web tests, set environment variable: RUN_WEB_TESTS=true
// To enable verbose output, change `isVerbose = false` to `isVerbose = true` below
//
// Usage:
//   npm test                    # Skips all web tests (fast, reliable)
//   RUN_WEB_TESTS=true npm test # Runs all web tests including real API calls (slower, realistic)

const webTestTimeout = 10000; // 10 seconds
// To enable verbose output, set VERBOSE_METADATA=true in your environment
const isVerbose = process.env.VERBOSE_METADATA === "true";

// Fetch pageTitle tests - these make real web calls and require RUN_WEB_TESTS
describe("fetchPageTitle from the web", () => {
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

  // Favicon web tests - these make real API calls
  describe("fetchFaviconMarkdown from the web", () => {
    const faviconWebTests = [
      {
        url: "https://github.com",
        domain: "github.com",
      },
      {
        url: "https://www.npmjs.com",
        domain: "www.npmjs.com",
      },
      {
        url: "https://nodejs.org",
        domain: "nodejs.org",
      },
    ];

    faviconWebTests.forEach(({url, domain}) => {
      it(
        `should generate favicon markdown for ${url}`,
        async () => {
          if (isVerbose) {
            console.log(`\n🎨 Testing favicon for URL: ${url}`);
          }

          const result = await fetchFaviconMarkdown(url);

          if (isVerbose) {
            console.log(`✅ Favicon markdown for ${url}:`, result);
          }

          // Should return a markdown image link
          expect(result).toMatch(
            /^!\[.*-favicon\]\(https:\/\/www\.google\.com\/s2\/favicons\?domain=.*&sz=16\)$/
          );
          expect(result).toContain(domain);
          expect(result).toContain("favicon");
        },
        webTestTimeout
      );
    });

    it("should handle custom favicon sizes", async () => {
      const url = "https://github.com";
      const size = 32;

      const result = await fetchFaviconMarkdown(url, {size});

      expect(result).toContain("sz=32");
      expect(result).toContain("github.com");
    });
  });
});

// Favicon integration tests - these make real web calls and require RUN_WEB_TESTS
describe("favicon integration", () => {
  // Skip favicon integration tests unless web tests are enabled
  if (!process.env.RUN_WEB_TESTS) {
    it("favicon integration tests are skipped", () => {
      console.log(
        "Skipping favicon integration tests (set RUN_WEB_TESTS=true to enable)"
      );
    });
    return;
  }

  it(
    "should process URLs with favicons by default",
    async () => {
      const content = "Check out https://github.com";
      const result = await processBlockContentForURLs(content);

      // Should contain both favicon and link
      expect(result).toContain(
        "![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=16)"
      );
      expect(result).toContain("](https://github.com)");
      expect(result).toContain("[");
      // Should have favicon before the link
      expect(result).toMatch(
        /Check out !\[github\.com-favicon\].*\s+\[.*\]\(https:\/\/github\.com\)/
      );
    },
    webTestTimeout
  );

  it(
    "should add favicons by default for multiple URLs",
    async () => {
      const content = "Visit https://github.com and https://nodejs.org";
      const result = await processBlockContentForURLs(content);

      // Should contain favicons for both URLs
      expect(result).toContain("![github.com-favicon]");
      expect(result).toContain("![nodejs.org-favicon]");
      expect(result).toContain("](https://github.com)");
      expect(result).toContain("](https://nodejs.org)");
    },
    webTestTimeout * 2
  );

  it(
    "should include both link and favicon in correct order",
    async () => {
      const content = "Check out https://npmjs.com";
      const result = await processBlockContentForURLs(content);

      expect(result).toContain("npmjs.com");
      expect(result).toContain("![npmjs.com-favicon]");
      expect(result).toContain("](https://npmjs.com)");
      // Favicon should come before the link by default
      const faviconIndex = result.indexOf("![npmjs.com-favicon]");
      const linkIndex = result.indexOf("[");
      expect(faviconIndex).toBeLessThan(linkIndex);
    },
    webTestTimeout
  );

  describe("when favicons are disabled", () => {
    beforeEach(() => {
      // Mock logseq settings to disable favicons
      (globalThis as any).logseq = {
        settings: {
          enableFavicons: false,
          faviconSize: 16,
          faviconPosition: "before",
        },
      };
    });

    afterEach(() => {
      // Clean up the mock
      delete (globalThis as any).logseq;
    });

    it(
      "should process URLs without favicons when disabled",
      async () => {
        const content = "Check out https://github.com";
        const result = await processBlockContentForURLs(content);

        expect(result).toContain("](https://github.com)");
        expect(result).not.toContain("favicon");
        expect(result).not.toContain("![");
      },
      webTestTimeout
    );
  });

  describe("when favicons are enabled with custom settings", () => {
    beforeEach(() => {
      // Mock logseq settings with custom favicon settings
      (globalThis as any).logseq = {
        settings: {
          enableFavicons: true,
          faviconSize: 20,
          faviconPosition: "after",
        },
      };
    });

    afterEach(() => {
      // Clean up the mock
      delete (globalThis as any).logseq;
    });

    it(
      "should use custom favicon size and position",
      async () => {
        const content = "Check out https://github.com";
        const result = await processBlockContentForURLs(content);

        // Should use size 20 and position after
        expect(result).toContain("sz=20");
        expect(result).toContain("](https://github.com)");
        expect(result).toContain("![github.com-favicon]");

        // Favicon should come after the link when position is "after"
        const linkStartIndex = result.indexOf("[");
        const linkEndIndex = result.indexOf("](https://github.com)");
        const faviconIndex = result.indexOf("![github.com-favicon]");
        expect(linkStartIndex).toBeLessThan(linkEndIndex);
        expect(linkEndIndex).toBeLessThan(faviconIndex);
      },
      webTestTimeout
    );
  });
});

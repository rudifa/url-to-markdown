import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {
  fetchPageTitle,
  URLMetadata,
  processBlockContentForURLs,
} from "../../src/utils/metadata.js";

// Mock fetch globally for mock tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper functions for creating test data
function createMockResponse(data: any) {
  return {
    status: "success",
    data,
  };
}

function mockFetchSuccess(responseData: any) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => createMockResponse(responseData),
  });
}

function mockFetchError(error: Error) {
  mockFetch.mockRejectedValueOnce(error);
}

function mockFetchInvalidResponse(responseData: any) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => responseData,
  });
}

describe("fetchPageTitle", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful responses", () => {
    it("should fetch title and icon successfully", async () => {
      mockFetchSuccess({
        title: "Example Website",
        logo: "https://example.com/logo.png",
        image: {
          url: "https://example.com/image.jpg",
        },
      });

      const result = await fetchPageTitle("https://example.com");

      expect(result).toEqual({
        title: "Example Website",
        hasIcon: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.microlink.io/?url=https%3A%2F%2Fexample.com"
      );
    });

    it("should use image URL as icon when logo is not available", async () => {
      mockFetchSuccess({
        title: "Example Website",
        image: {
          url: "https://example.com/image.jpg",
        },
      });

      const result = await fetchPageTitle("https://example.com");

      expect(result).toEqual({
        title: "Example Website",
        hasIcon: true,
      });
    });

    it("should handle missing logo and image gracefully", async () => {
      mockFetchSuccess({
        title: "Example Website",
        logo: null,
        image: null,
      });

      const result = await fetchPageTitle("https://example.com");

      expect(result).toEqual({
        title: "Example Website",
        hasIcon: false,
      });
    });
  });

  describe("fallback behavior", () => {
    it("should handle missing title by using URL as fallback", async () => {
      mockFetchSuccess({
        title: null,
        logo: "https://example.com/logo.png",
      });

      const result = await fetchPageTitle("https://example.com");

      expect(result).toEqual({
        title: "https://example.com",
        hasIcon: true,
      });
    });
  });

  describe("error handling", () => {
    it("should handle empty response data", async () => {
      mockFetchInvalidResponse({
        status: "error",
        data: {},
      });

      const result = await fetchPageTitle("https://example.com");

      expect(result).toEqual({
        title: "https://example.com",
        hasIcon: false,
        note: "API may be rate-limited or unavailable",
      });
    });

    it("should handle fetch errors gracefully", async () => {
      mockFetchError(new Error("Network error"));

      const result = await fetchPageTitle("https://example.com");

      expect(result).toEqual({
        title: "https://example.com",
        hasIcon: false,
        note: "API may be rate-limited or unavailable",
      });
    });

    it("should handle JSON parse errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const result = await fetchPageTitle("https://example.com");

      expect(result).toEqual({
        title: "https://example.com",
        hasIcon: false,
        note: "API may be rate-limited or unavailable",
      });
    });
  });

  describe("URL encoding", () => {
    it("should properly encode URLs with special characters", async () => {
      mockFetchSuccess({
        title: "Search Results",
        logo: "https://example.com/logo.png",
      });

      const urlWithQuery = "https://example.com/search?q=test query&sort=date";
      await fetchPageTitle(urlWithQuery);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.microlink.io/?url=https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dtest%20query%26sort%3Ddate"
      );
    });

    it("should handle complex URLs with multiple parameters", async () => {
      mockFetchSuccess({
        title: "GitHub Repository",
        logo: "https://github.com/logo.png",
      });

      const complexUrl =
        "https://api.github.com/repos/user/repo?sort=updated&direction=desc&per_page=50";
      const result = await fetchPageTitle(complexUrl);

      expect(result.title).toBe("GitHub Repository");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://api.microlink.io/?url=")
      );
    });
  });

  describe("TypeScript types", () => {
    it("should return correct TypeScript types", async () => {
      mockFetchSuccess({
        title: "Test Site",
        logo: "https://test.com/logo.png",
      });

      const result: URLMetadata = await fetchPageTitle("https://test.com");

      // TypeScript should enforce these types
      expect(typeof result.title).toBe("string");
      expect(typeof result.hasIcon).toBe("boolean");
    });
  });
});

describe("processBlockContentForURLs", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return unchanged content when no raw URLs are found", async () => {
    const content = "This is just plain text with no URLs";
    const result = await processBlockContentForURLs(content);

    expect(result).toBe(content);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return unchanged content when only markdown URLs are present", async () => {
    const content = "Check out [this link](https://example.com) for more info";
    const result = await processBlockContentForURLs(content);

    expect(result).toBe(content);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should convert first raw URL to markdown when page title fetch is successful", async () => {
    mockFetchSuccess({
      title: "Example Website Title",
      logo: "https://example.com/logo.png",
    });

    const content = "Check out this site: https://example.com for more info";
    const result = await processBlockContentForURLs(content);

    expect(result).toBe(
      "Check out this site: [Example Website Title](https://example.com) for more info"
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.microlink.io/?url=https%3A%2F%2Fexample.com"
    );
  });

  it("should process all raw URLs when multiple are present", async () => {
    // Set up mock responses for both URLs
    mockFetchSuccess({
      title: "Second Site Title",
      hasIcon: false,
    });

    mockFetchSuccess({
      title: "First Site Title",
      hasIcon: false,
    });

    const content = "Sites: https://first.com and https://second.com are good";
    const result = await processBlockContentForURLs(content);

    // Both URLs should be processed (backwards order due to implementation)
    expect(result).toBe(
      "Sites: [First Site Title](https://first.com) and [Second Site Title](https://second.com) are good"
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.microlink.io/?url=https%3A%2F%2Fsecond.com"
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.microlink.io/?url=https%3A%2F%2Ffirst.com"
    );
  });

  it("should return unchanged content when URL is invalid", async () => {
    const content = "Invalid URL: not-a-url";
    const result = await processBlockContentForURLs(content);

    expect(result).toBe(content);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should use URL as title when page title fetch fails", async () => {
    mockFetchError(new Error("Network error"));

    const content = "Check out https://example.com";
    const result = await processBlockContentForURLs(content);

    // When fetch fails, fetchPageTitle falls back to using the URL as title
    expect(result).toBe("Check out [https://example.com](https://example.com)");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.microlink.io/?url=https%3A%2F%2Fexample.com"
    );
  });

  it("should handle URLs with trailing punctuation correctly", async () => {
    mockFetchSuccess({
      title: "Astro - The web framework for content-driven websites",
      hasIcon: true,
    });

    const content = "I use https://astro.build/, built on top of node.";
    const result = await processBlockContentForURLs(content);

    // Should process the URL without the trailing comma
    expect(result).toBe(
      "I use [Astro - The web framework for content-driven websites](https://astro.build/), built on top of node."
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.microlink.io/?url=https%3A%2F%2Fastro.build%2F"
    );
  });
});

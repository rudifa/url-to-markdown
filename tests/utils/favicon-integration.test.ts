import {describe, it, expect, vi} from "vitest";
import {processBlockContentForURLs} from "../../src/utils/metadata";

// Mock fetch for predictable testing
global.fetch = vi.fn();

describe("favicon integration", () => {
  it("should process URLs without favicons by default", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          data: {title: "GitHub"},
        }),
    } as Response);

    const content = "Check out https://github.com";
    const result = await processBlockContentForURLs(content);

    expect(result).toBe("Check out [GitHub](https://github.com)");
  });

  it("should add favicons when includeFavicon is true", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          data: {title: "GitHub"},
        }),
    } as Response);

    const content = "Check out https://github.com";
    const result = await processBlockContentForURLs(content, {
      includeFavicon: true,
      faviconSize: 16,
      faviconPosition: "before",
    });

    expect(result).toContain(
      "![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=16)"
    );
    expect(result).toContain("[GitHub](https://github.com)");
  });

  it("should position favicons after the link when specified", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          data: {title: "GitHub"},
        }),
    } as Response);

    const content = "Check out https://github.com";
    const result = await processBlockContentForURLs(content, {
      includeFavicon: true,
      faviconSize: 20,
      faviconPosition: "after",
    });

    expect(result).toContain("[GitHub](https://github.com)");
    expect(result).toContain(
      "![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=20)"
    );
    expect(result.indexOf("[GitHub]")).toBeLessThan(
      result.indexOf("![github.com-favicon]")
    );
  });
});

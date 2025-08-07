import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {processBlockContentForURLs} from "../../src/utils/metadata";

// Mock fetch for predictable testing
global.fetch = vi.fn();

describe("favicon integration", () => {
  it("should process URLs with favicons by default", async () => {
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

    expect(result).toBe(
      "Check out ![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=16)  [GitHub](https://github.com)"
    );
  });

  it("should add favicons by default", async () => {
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

    expect(result).toContain(
      "![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=16)"
    );
    expect(result).toContain("[GitHub](https://github.com)");
  });

  it("should include both link and favicon in output", async () => {
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

    expect(result).toContain("[GitHub](https://github.com)");
    expect(result).toContain(
      "![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=16)"
    );
  });

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

    it("should process URLs without favicons when disabled", async () => {
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
      expect(result).not.toContain("favicon");
    });
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

    it("should use custom favicon size and position", async () => {
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

      // Should use size 20 and position after
      expect(result).toContain("sz=20");
      expect(result).toBe(
        "Check out [GitHub](https://github.com)  ![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=20)"
      );
    });
  });
});

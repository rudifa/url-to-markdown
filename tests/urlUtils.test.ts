import {describe, it, expect} from "vitest";
import {
  findFormattedURLs,
  findRawURLs,
  analyzeBlockURLs,
} from "../src/urlUtils";

// Test data - simplified
const testCasesSimple = {
  emptyContent: "",
  singleFormattedURL:
    "Check out [Example Site](https://example.com) for more info",
  singleRawURL: "Check out https://github.com for more info",
  singleRawURLAtEnd: "This block ends with https://github.com",
  rawURLWithQuery: "Search on https://example.com?q=logseq&page=1 for results",
  rawURLWithComplexQuery:
    "Visit https://api.github.com/repos/logseq/logseq?sort=updated&direction=desc&per_page=50 to see data",
};

// Test data - combined
const testCasesCombined = {
  emptyContent: "",
  multipleFormattedURLs:
    "Check out [Example Site](https://example.com) and [Another Site](https://another.com) for more info",
  multipleRawURLs:
    "Visit https://github.com and also check https://stackoverflow.com for help",
  multipleRawAndFormattedURLs:
    "Start with https://raw-first.com then [Formatted Link](https://formatted.com) and end with https://raw-last.com",
};

// Test runner
describe("findFormattedURLs in simple testCases", () => {
  it("should return empty array for empty content", () => {
    expect(findFormattedURLs(testCasesSimple.emptyContent)).toEqual([]);
  });

  it("should find single formatted URL", () => {
    const result = findFormattedURLs(testCasesSimple.singleFormattedURL);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://example.com");
    expect(result[0].title).toBe("Example Site");
    expect(result[0].start).toBe(10);
    expect(result[0].end).toBe(45);
  });

  it("should find single raw URL", () => {
    const result = findRawURLs(testCasesSimple.singleRawURL);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://github.com");
    expect(result[0].start).toBe(10);
    expect(result[0].end).toBe(28);
  });

  it("should find single raw URL at end", () => {
    const result = findRawURLs(testCasesSimple.singleRawURLAtEnd);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://github.com");
    expect(result[0].start).toBe(21);
    expect(result[0].end).toBe(39);
  });

  it("should find raw URL with query parameters", () => {
    const result = findRawURLs(testCasesSimple.rawURLWithQuery);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://example.com?q=logseq&page=1");
    expect(result[0].start).toBe(10);
    expect(result[0].end).toBe(45);
  });

  it("should find raw URL with complex query parameters", () => {
    const result = findRawURLs(testCasesSimple.rawURLWithComplexQuery);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe(
      "https://api.github.com/repos/logseq/logseq?sort=updated&direction=desc&per_page=50"
    );
    expect(result[0].start).toBe(6);
    expect(result[0].end).toBe(88);
  });

  it("should analyze block URLs in singleFormattedURL", () => {
    const result = analyzeBlockURLs(testCasesSimple.singleFormattedURL);
    expect(result.formatted).toHaveLength(1);
    expect(result.raw).toHaveLength(0);
  });

  it("should analyze block URLs in singleRawURL", () => {
    const result = analyzeBlockURLs(testCasesSimple.singleRawURL);
    expect(result.formatted).toHaveLength(0);
    expect(result.raw).toHaveLength(1);
  });
});

describe("findFormattedURLs in combined testCases", () => {
  it("should return empty array for empty content", () => {
    expect(findFormattedURLs(testCasesCombined.emptyContent)).toEqual([]);
  });

  it("should find multiple formatted URLs", () => {
    const result = findFormattedURLs(testCasesCombined.multipleFormattedURLs);
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe("https://example.com");
    expect(result[0].title).toBe("Example Site");
    expect(result[0].start).toBe(10);
    expect(result[0].end).toBe(45);
    expect(result[1].url).toBe("https://another.com");
    expect(result[1].title).toBe("Another Site");
    expect(result[1].start).toBe(50);
    expect(result[1].end).toBe(85);
  });

  it("should find multiple raw URLs", () => {
    const result = findRawURLs(testCasesCombined.multipleRawURLs);
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe("https://github.com");
    expect(result[0].start).toBe(6);
    expect(result[0].end).toBe(24);
    expect(result[1].url).toBe("https://stackoverflow.com");
    expect(result[1].start).toBe(40);
    expect(result[1].end).toBe(65);
  });

  it("should find multiple raw and formatted URLs", () => {
    const formattedResult = findFormattedURLs(
      testCasesCombined.multipleRawAndFormattedURLs
    );
    expect(formattedResult).toHaveLength(1);
    expect(formattedResult[0].url).toBe("https://formatted.com");
    expect(formattedResult[0].title).toBe("Formatted Link");
    expect(formattedResult[0].start).toBe(38);
    expect(formattedResult[0].end).toBe(77);

    const rawResult = findRawURLs(
      testCasesCombined.multipleRawAndFormattedURLs
    );
    expect(rawResult).toHaveLength(2);
    expect(rawResult[0].url).toBe("https://raw-first.com");
    expect(rawResult[0].start).toBe(11);
    expect(rawResult[0].end).toBe(32);
    expect(rawResult[1].url).toBe("https://raw-last.com");
    expect(rawResult[1].start).toBe(91);
    expect(rawResult[1].end).toBe(111);
  });

  it("should analyze combined URLs correctly", () => {
    const result = analyzeBlockURLs(
      testCasesCombined.multipleRawAndFormattedURLs
    );
    expect(result.formatted).toHaveLength(1);
    expect(result.raw).toHaveLength(2);
  });
});

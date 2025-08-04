// Visual Test Runner Entry Point
// This file imports the actual production code and sets up the visual test interface

import { findFormattedURLs, findRawURLs } from './utils/urlFind';
import { fetchPageTitle } from './utils/metadata';

// Re-export utilities for testing
export { findFormattedURLs, findRawURLs, fetchPageTitle };

// Helper function for combined URL analysis
export function analyzeBlockURLs(content: string) {
  return {
    formatted: findFormattedURLs(content),
    raw: findRawURLs(content),
  };
}

// Test Data
const urlTestCases = {
  empty: "",
  rawURL: "Check out https://github.com for more info",
  rawURLAtEnd: "This block ends with https://www.npmjs.com/package/vitest",
  formattedURL: "Check out [GitHub](https://github.com) for more info",
  mixedURLs: "Raw URL https://vitest.dev and [NPM](https://www.npmjs.com) link",
  complexMixed:
    "Start https://developer.mozilla.org then [Vitest](https://vitest.dev) and end with https://nodejs.org",
};

const metadataTestUrls = [
  "https://github.com",
  "https://www.npmjs.com",
  "https://vitest.dev",
  "https://developer.mozilla.org",
  "https://nodejs.org",
  "https://invalid-url-that-does-not-exist-12345.com",
];

// Visual Test Functions
function runURLDetectionTest() {
  console.log("🔗 Running URL Detection Tests...");

  let html = '<div class="url-detection-results">';

  Object.entries(urlTestCases).forEach(([name, content]) => {
    const analysis = analyzeBlockURLs(content);

    const formattedResults =
      analysis.formatted.length > 0
        ? analysis.formatted
            .map((url: any) => {
              const title = url.title ? `[${url.title}]` : "[link]";
              return `<div>• ${title}(${url.url})</div>`;
            })
            .join("")
        : "<div><em>None found</em></div>";

    const rawResults =
      analysis.raw.length > 0
        ? analysis.raw.map((url: any) => `<div>• ${url.url}</div>`).join("")
        : "<div><em>None found</em></div>";

    html += `
      <div class="test-case">
        <h4>📝 ${name}</h4>
        <div class="test-case-content">"${content}"</div>
        <div class="test-results">
          <div class="result-group">
            <h5>🔗 Formatted URLs (${analysis.formatted.length})</h5>
            ${formattedResults}
          </div>
          <div class="result-group">
            <h5>🌐 Raw URLs (${analysis.raw.length})</h5>
            ${rawResults}
          </div>
        </div>
      </div>
    `;
  });

  html += "</div>";
  document.getElementById("urlDetectionResults")!.innerHTML = html;
}

async function runMetadataTest() {
  console.log("🌐 Running Metadata Tests...");

  const btn = document.getElementById("metadataBtn") as HTMLButtonElement;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span>Testing...';

  // Create table structure
  let html = `
    <table class="metadata-table">
      <thead>
        <tr>
          <th>URL</th>
          <th>Icon</th>
          <th>Title</th>
          <th>Note</th>
          <th>Status</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody id="metadataTableBody">
  `;

  // Add loading rows
  metadataTestUrls.forEach((url) => {
    const rowId = btoa(url).replace(/[^a-zA-Z0-9]/g, "");
    html += `
      <tr id="row-${rowId}">
        <td class="url-cell"><a href="${url}" target="_blank" class="url-link">${url}</a></td>
        <td><div class="loading-spinner"></div></td>
        <td class="status-loading">Loading...</td>
        <td class="status-loading">Loading...</td>
        <td class="status-loading">⏳ Fetching</td>
        <td class="timing">-</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  document.getElementById("metadataResults")!.innerHTML = html;

  // Fetch metadata for each URL
  for (const url of metadataTestUrls) {
    const rowId = `row-${btoa(url).replace(/[^a-zA-Z0-9]/g, "")}`;
    const row = document.getElementById(rowId)!;

    try {
      const startTime = Date.now();
      const result = await fetchPageTitle(url);
      const duration = Date.now() - startTime;

      // Handle icon display
      const iconCell = result.hasIcon
        ? '<div class="icon-placeholder">✅</div>'
        : '<div class="icon-placeholder">❌</div>';

      const titleCell = result.title || "No title";
      const noteCell = result.note || "No note";

      row.innerHTML = `
        <td class="url-cell"><a href="${url}" target="_blank" class="url-link">${url}</a></td>
        <td>${iconCell}</td>
        <td class="title-cell">${titleCell}</td>
        <td>${noteCell}</td>
        <td><span class="status-success">✅ Success</span></td>
        <td class="timing">${duration}ms</td>
      `;

      console.log(`✅ ${url}: ${result.title}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      row.innerHTML = `
        <td class="url-cell"><a href="${url}" target="_blank" class="url-link">${url}</a></td>
        <td><div class="icon-placeholder">❌</div></td>
        <td class="status-error">Error</td>
        <td class="status-error">${errorMessage}</td>
        <td class="status-error">❌ Failed</td>
        <td class="timing">-</td>
      `;
      console.log(`💥 ${url}: ${errorMessage}`);
    }
  }

  btn.disabled = false;
  btn.innerHTML = "🌐 Test Metadata Fetching";
  console.log("✅ Metadata tests completed!");
}

async function runAllTests() {
  console.log("🚀 Running All Tests...");
  runURLDetectionTest();
  await runMetadataTest();
  console.log("🎉 All tests completed!");
}

// Expose functions globally for browser access
declare global {
  interface Window {
    findFormattedURLs: typeof findFormattedURLs;
    findRawURLs: typeof findRawURLs;
    analyzeBlockURLs: typeof analyzeBlockURLs;
    fetchPageTitle: typeof fetchPageTitle;
    runURLDetectionTest: typeof runURLDetectionTest;
    runMetadataTest: typeof runMetadataTest;
    runAllTests: typeof runAllTests;
  }
}

// Set up global functions and auto-run
window.findFormattedURLs = findFormattedURLs;
window.findRawURLs = findRawURLs;
window.analyzeBlockURLs = analyzeBlockURLs;
window.fetchPageTitle = fetchPageTitle;
window.runURLDetectionTest = runURLDetectionTest;
window.runMetadataTest = runMetadataTest;
window.runAllTests = runAllTests;

// Auto-run on page load
console.log("🚀 Visual Test Runner loaded with REAL production code!");
console.log("📦 Using actual metadata.ts and urlFind.ts modules");

// Automatically run URL detection on load
setTimeout(() => {
  runURLDetectionTest();
}, 500);

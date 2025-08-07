// Visual Test Runner Entry Point
// This file imports the actual production code and sets up the visual test interface

import {findFormattedURLs, findRawURLs} from "./utils/urlFind";
import {
  fetchPageTitle,
  fetchFaviconMarkdown,
  processBlockContentForURLs,
} from "./utils/metadata";

// Re-export utilities for testing
export {
  findFormattedURLs,
  findRawURLs,
  fetchPageTitle,
  fetchFaviconMarkdown,
  processBlockContentForURLs,
};

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

      // Test both title fetching and full processing with favicons
      const title = await fetchPageTitle(url);
      const faviconMarkdown = await fetchFaviconMarkdown(url);
      const fullProcessing = await processBlockContentForURLs(
        `Check out ${url}`
      );

      const duration = Date.now() - startTime;

      // Check if favicon was generated and extract the image URL
      const hasIcon = faviconMarkdown && faviconMarkdown.trim().length > 0;
      let iconCell;

      if (hasIcon) {
        // Extract the image URL from the markdown: ![alt](url)
        const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
        const imgMatch = imgRegex.exec(faviconMarkdown);
        if (imgMatch) {
          const [, altText, imgUrl] = imgMatch;
          iconCell = `<div class="icon-display"><img src="${imgUrl}" alt="${altText}" style="width: 16px; height: 16px; display: inline-block;" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><span style="display: none;">❌</span></div>`;
        } else {
          iconCell = `<div class="icon-placeholder">✅ (markdown: ${faviconMarkdown})</div>`;
        }
      } else {
        iconCell = '<div class="icon-placeholder">❌</div>';
      }

      const titleCell = title || "No title";
      const noteCell = `Full: ${fullProcessing}`;

      row.innerHTML = `
        <td class="url-cell"><a href="${url}" target="_blank" class="url-link">${url}</a></td>
        <td>${iconCell}</td>
        <td class="title-cell">${titleCell}</td>
        <td class="note-cell">${noteCell}</td>
        <td><span class="status-success">✅ Success</span></td>
        <td class="timing">${duration}ms</td>
      `;

      console.log(`✅ ${url}: Title="${title}", Favicon="${faviconMarkdown}"`);
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

async function runFaviconMarkdownTest() {
  console.log("🎨 Running Favicon Markdown Generation Tests...");

  const btn = document.getElementById("faviconBtn") as HTMLButtonElement;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span>Generating...';

  // URLs for favicon testing
  const faviconTestUrls = [
    "https://github.com",
    "https://www.npmjs.com",
    "https://vitest.dev",
    "https://developer.mozilla.org",
    "https://nodejs.org",
    "https://stackoverflow.com",
  ];

  // Create results container
  let html = `
    <div class="favicon-results">
      <div class="url-input-section">
        <h4>🔗 Add Custom URL</h4>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <input type="url" id="customUrlInput" placeholder="Enter URL (e.g., https://example.com)"
                 style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <button onclick="addCustomUrl()" class="btn" style="margin: 0;">➕ Add URL</button>
        </div>
      </div>

      <div class="favicon-output">
        <h4>📝 Generated Markdown with Favicons</h4>
        <div class="markdown-results" id="markdownResults">
  `;

  // Add loading rows for default URLs
  faviconTestUrls.forEach((url, index) => {
    html += `
      <div class="markdown-item" id="favicon-item-${index}">
        <div class="loading-spinner"></div>
        <span class="status-loading">Generating markdown for ${url}...</span>
      </div>
    `;
  });

  html += `
        </div>

        <div class="copy-section" style="margin-top: 20px;">
          <h4>📋 Copy All Results</h4>
          <textarea id="allMarkdownResults" readonly
                    style="width: 100%; height: 150px; font-family: monospace; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
                    placeholder="Generated markdown will appear here..."></textarea>
          <button onclick="copyAllResults()" class="btn" style="margin-top: 10px;">📋 Copy to Clipboard</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("faviconResults")!.innerHTML = html;

  // Generate markdown for each URL
  const allResults: string[] = [];

  for (let i = 0; i < faviconTestUrls.length; i++) {
    const url = faviconTestUrls[i];
    const itemElement = document.getElementById(`favicon-item-${i}`)!;

    try {
      // Fetch metadata for title
      const metadata = await fetchPageTitle(url);
      const title = metadata !== url ? metadata : new URL(url).hostname;

      // Create basic markdown link
      const basicMarkdown = `[${title}](${url})`;

      // Add favicon to markdown
      const faviconImg = await fetchFaviconMarkdown(url);
      const faviconMarkdown = faviconImg
        ? `${faviconImg} ${basicMarkdown}`
        : basicMarkdown;

      // Display result
      itemElement.innerHTML = `
        <div class="markdown-preview">
          <div class="markdown-source">
            <strong>Markdown:</strong> <code>${faviconMarkdown}</code>
          </div>
          <div class="markdown-rendered">
            <strong>Rendered:</strong> ${faviconMarkdown}
          </div>
        </div>
      `;

      allResults.push(faviconMarkdown);
      console.log(`✅ Generated favicon markdown for ${url}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      itemElement.innerHTML = `
        <div class="error-message">
          <span class="status-error">❌ Failed to generate for ${url}: ${errorMessage}</span>
        </div>
      `;
      console.log(
        `💥 Failed to generate favicon markdown for ${url}: ${errorMessage}`
      );
    }
  }

  // Update the textarea with all results
  const textarea = document.getElementById(
    "allMarkdownResults"
  ) as HTMLTextAreaElement;
  textarea.value = allResults.join("\n\n");

  btn.disabled = false;
  btn.innerHTML = "🎨 Generate Favicon Markdown";
  console.log("✅ Favicon markdown generation completed!");
}

// Helper function to add custom URLs
async function addCustomUrl() {
  const input = document.getElementById("customUrlInput") as HTMLInputElement;
  const url = input.value.trim();

  if (!url) {
    alert("Please enter a URL");
    return;
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    alert("Please enter a valid URL starting with http:// or https://");
    return;
  }

  const markdownResults = document.getElementById("markdownResults")!;
  const customIndex = Date.now(); // Use timestamp as unique ID

  // Add loading item
  const loadingItem = document.createElement("div");
  loadingItem.className = "markdown-item";
  loadingItem.id = `favicon-item-${customIndex}`;
  loadingItem.innerHTML = `
    <div class="loading-spinner"></div>
    <span class="status-loading">Generating markdown for ${url}...</span>
  `;
  markdownResults.appendChild(loadingItem);

  try {
    // Generate markdown with favicon
    const metadata = await fetchPageTitle(url);
    const title = metadata !== url ? metadata : new URL(url).hostname;
    const basicMarkdown = `[${title}](${url})`;
    const faviconImg = await fetchFaviconMarkdown(url);
    const faviconMarkdown = faviconImg
      ? `${faviconImg} ${basicMarkdown}`
      : basicMarkdown;

    // Update display
    loadingItem.innerHTML = `
      <div class="markdown-preview">
        <div class="markdown-source">
          <strong>Markdown:</strong> <code>${faviconMarkdown}</code>
        </div>
        <div class="markdown-rendered">
          <strong>Rendered:</strong> ${faviconMarkdown}
        </div>
      </div>
    `;

    // Add to textarea
    const textarea = document.getElementById(
      "allMarkdownResults"
    ) as HTMLTextAreaElement;
    textarea.value += (textarea.value ? "\n\n" : "") + faviconMarkdown;

    console.log(`✅ Added custom URL: ${url}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    loadingItem.innerHTML = `
      <div class="error-message">
        <span class="status-error">❌ Failed to generate for ${url}: ${errorMessage}</span>
      </div>
    `;
    console.log(
      `💥 Failed to generate favicon markdown for custom URL ${url}: ${errorMessage}`
    );
  }

  // Clear input
  input.value = "";
}

// Helper function to copy all results
async function copyAllResults() {
  const textarea = document.getElementById(
    "allMarkdownResults"
  ) as HTMLTextAreaElement;

  try {
    await navigator.clipboard.writeText(textarea.value);

    // Show feedback
    const button = document.querySelector(
      'button[onclick="copyAllResults()"]'
    ) as HTMLButtonElement;
    const originalText = button.innerHTML;
    button.innerHTML = "✅ Copied!";
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  } catch (err) {
    // Fallback for older browsers - handle the exception properly
    console.warn("Failed to copy to clipboard:", err);
    try {
      textarea.select();
      // Using deprecated method as fallback, suppress warning
      // eslint-disable-next-line deprecation/deprecation
      document.execCommand("copy");
      console.log("Fallback copy method used");
    } catch (fallbackErr) {
      console.error("All copy methods failed:", fallbackErr);
    }
  }
}

async function runAllTests() {
  console.log("🚀 Running All Tests...");
  runURLDetectionTest();
  await runMetadataTest();
  await runFaviconMarkdownTest();
  console.log("🎉 All tests completed!");
}

// Expose functions globally for browser access
declare global {
  interface Window {
    findFormattedURLs: typeof findFormattedURLs;
    findRawURLs: typeof findRawURLs;
    analyzeBlockURLs: typeof analyzeBlockURLs;
    fetchPageTitle: typeof fetchPageTitle;
    fetchFaviconMarkdown: typeof fetchFaviconMarkdown;
    runURLDetectionTest: typeof runURLDetectionTest;
    runMetadataTest: typeof runMetadataTest;
    runFaviconMarkdownTest: typeof runFaviconMarkdownTest;
    addCustomUrl: typeof addCustomUrl;
    copyAllResults: typeof copyAllResults;
    runAllTests: typeof runAllTests;
  }
}

// Set up global functions and auto-run
window.findFormattedURLs = findFormattedURLs;
window.findRawURLs = findRawURLs;
window.analyzeBlockURLs = analyzeBlockURLs;
window.fetchPageTitle = fetchPageTitle;
window.fetchFaviconMarkdown = fetchFaviconMarkdown;
window.runURLDetectionTest = runURLDetectionTest;
window.runMetadataTest = runMetadataTest;
window.runFaviconMarkdownTest = runFaviconMarkdownTest;
window.addCustomUrl = addCustomUrl;
window.copyAllResults = copyAllResults;
window.runAllTests = runAllTests;

// Auto-run on page load
console.log("🚀 Visual Test Runner loaded with REAL production code!");
console.log("📦 Using actual metadata.ts and urlFind.ts modules");

// Automatically run URL detection on load
setTimeout(() => {
  runURLDetectionTest();
}, 500);

// Simple browser-based test runner for URL utilities
// Copy and paste this into browser console to run tests

// URL Detection Utilities (inline for browser testing)
function findFormattedURLs(content) {
  const results = [];
  const markdownLinkRegex = /(!?)\[([^\]]*)\]\(([^)]+)\)/g;

  let match;
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const [fullMatch, , title, url] = match;
    const start = match.index;
    const end = start + fullMatch.length;

    results.push({
      url,
      start,
      end,
      title: title || undefined
    });
  }

  return results;
}

function findRawURLs(content) {
  const results = [];
  const formattedURLs = findFormattedURLs(content);
  const formattedRanges = formattedURLs.map(url => ({ start: url.start, end: url.end }));

  const urlRegex = /https?:\/\/[^\s\])]+/g;

  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[0];
    const start = match.index;
    const end = start + url.length;

    const isAlreadyFormatted = formattedRanges.some(range =>
      start >= range.start && end <= range.end
    );

    if (!isAlreadyFormatted) {
      results.push({
        url,
        start,
        end
      });
    }
  }

  return results;
}

// Test cases
const testCases = {
  empty: '',
  rawURL: 'Check out https://example.com for more info',
  rawURLAtEnd: 'This block ends with https://github.com/logseq/logseq',
  formattedURL: 'Check out [Example Site](https://example.com) for more info',
  mixedURLs: 'Raw URL https://raw.com and [Formatted](https://formatted.com) link',
  complexMixed: 'Start https://start.com then [Middle](https://middle.com) and end with https://end.com'
};

// Run tests
function runBrowserTests() {
  console.log('🧪 Running URL Utils Browser Tests');
  console.log('=====================================\n');

  Object.entries(testCases).forEach(([name, content]) => {
    console.log(`📝 Testing: ${name}`);
    console.log(`   Content: "${content}"`);

    const formatted = findFormattedURLs(content);
    const raw = findRawURLs(content);

    console.log(`   📊 Results:`);
    console.log(`     Formatted URLs: ${formatted.length}`, formatted);
    console.log(`     Raw URLs: ${raw.length}`, raw);
    console.log('');
  });

  console.log('✅ Browser tests completed!');
  console.log('\n🔍 To test specific content, use:');
  console.log('findFormattedURLs("your content here")');
  console.log('findRawURLs("your content here")');
}

// Auto-run tests and expose functions globally
window.findFormattedURLs = findFormattedURLs;
window.findRawURLs = findRawURLs;
window.runBrowserTests = runBrowserTests;

// Run automatically
runBrowserTests();

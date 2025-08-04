// Debug script to get actual results for fixing tests
import { findFormattedURLs, findRawURLs } from '../src/utils/urlFind.js';

const testCases = {
  singleFormattedURL: "Check out [Example Site](https://example.com) for more info",
  imageLink: "Here is an image: ![Logo](https://example.com/logo.png)",
  multipleFormattedURLs: "Visit [Example](https://example.com) and [GitHub](https://github.com)",
  rawURLAtEnd: "This is a block with URL at the end https://github.com/logseq/logseq",
  nestedBrackets: "Complex [link with [nested] brackets](https://example.com)",
  complexMixed: "Start https://start.com then [Middle](https://middle.com) and end with https://end.com"
};

console.log('=== DEBUG RESULTS ===\n');

Object.entries(testCases).forEach(([name, content]) => {
  console.log(`${name}:`);
  console.log(`  Content: "${content}"`);
  console.log(`  Formatted:`, JSON.stringify(findFormattedURLs(content), null, 2));
  console.log(`  Raw:`, JSON.stringify(findRawURLs(content), null, 2));
  console.log(`  RawAtEnd:`, JSON.stringify(findRawURLsAtEnd(content), null, 2));
  console.log('');
});

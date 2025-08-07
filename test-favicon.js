#!/usr/bin/env node

// Simple test script for favicon functionality using fetchFaviconMarkdown
import { fetchFaviconMarkdown } from './src/utils/metadata.js';

// Helper function to simulate addFaviconToMarkdownLink behavior
async function addFaviconToMarkdownLink(markdownLink, options = {}) {
  const { size = 16, position = "before" } = options;

  const markdownRegex = /\[([^\]]*)\]\(([^)]+)\)/;
  const match = markdownLink.match(markdownRegex);

  if (!match) return markdownLink;

  const [, , url] = match;

  try {
    const faviconMarkdown = await fetchFaviconMarkdown(url, { size });
    return position === "before"
      ? `${faviconMarkdown} ${markdownLink}`
      : `${markdownLink} ${faviconMarkdown}`;
  } catch (error) {
    console.warn("Invalid URL in markdown link:", url, error);
    return markdownLink;
  }
}

async function testFaviconFunction() {
  console.log('🧪 Testing favicon functionality with fetchFaviconMarkdown\n');

  const testCases = [
    {
      name: 'Basic GitHub link',
      input: '[GitHub](https://github.com)',
    },
    {
      name: 'Custom size',
      input: '[GitHub](https://github.com)',
      options: { size: 32 },
    },
    {
      name: 'Position after',
      input: '[GitHub](https://github.com)',
      options: { position: 'after' },
    },
    {
      name: 'Custom alt text',
      input: '[NPM](https://www.npmjs.com)',
      options: {
        altTextTemplate: (hostname) => `🔗 ${hostname}`
      },
    },
    {
      name: 'Complex URL with path',
      input: '[Vitest Package](https://www.npmjs.com/package/vitest)',
    },
  ];

  for (const testCase of testCases) {
    console.log(`📝 ${testCase.name}:`);
    console.log(`   Input:  ${testCase.input}`);

    const result = await addFaviconToMarkdownLink(testCase.input, testCase.options);
    console.log(`   Output: ${result}`);
    console.log('');
  }

  console.log('✅ All tests completed!');
}

testFaviconFunction().catch(console.error);

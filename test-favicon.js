#!/usr/bin/env node

// Simple test script for the addFaviconToMarkdownLink function
import { addFaviconToMarkdownLink } from './src/utils/metadata.js';

async function testFaviconFunction() {
  console.log('🧪 Testing addFaviconToMarkdownLink function\n');

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

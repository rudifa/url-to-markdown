import "@logseq/libs";
import {processBlockContentForURLs} from "./utils/metadata";

// Use an async IIFE to run the main function after Logseq is ready.
(async () => {
  await logseq.ready();
  main().catch(console.error);
})();

// Main function
async function main() {
  console.log("main url-to-markdown 3.2.2");

  // Listen to block changes and process each changed block
  logseq.DB.onChanged(async (e: any) => {
    console.log("📥 DB.onChanged event:", e);
    if (e.blocks && Array.isArray(e.blocks)) {
      for (const block of e.blocks) {
        if (block?.uuid) {
          await processBlockForURLs(block.uuid);
        }
      }
    }
  });
}

async function processBlockForURLs(blockUuid: string) {
  try {
    console.log(`🔍 Processing block: ${blockUuid}`);

    // Get the block content
    const block = await logseq.Editor.getBlock(blockUuid);
    if (!block?.content) {
      //   console.warn(`No block content found for ${blockUuid}`);
      return;
    }

    const content = block.content;
    // console.log(`📝 Block ${blockUuid} content (input): ${content}`);

    // Process block content for URLs
    const updatedContent = await processBlockContentForURLs(content);

    // Only update the block if content actually changed
    if (updatedContent !== content) {
      // Update the block
      await logseq.Editor.updateBlock(blockUuid, updatedContent);
      console.log(
        `✅ Block ${blockUuid} content (updated):\n${updatedContent}\n`
      );
    }
  } catch (error) {
    console.error(`❌ Error processing block ${blockUuid}:`, error);
  }
}

function attachToCurrentEditor() {
  // This function is no longer needed with the new approach
  console.log("attachToCurrentEditor - not needed with block-based approach");
}

function debounce(fn: (...args: any[]) => void, delay = 300) {
  // Debounce function kept for potential future use
  let timer: number | undefined;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

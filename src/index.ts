import "@logseq/libs";
import {processBlockContentForURLs} from "./utils/metadata";

// Main function
async function main() {
  console.log(`main url-to-markdown ${__PKG_VERSION__}`);

  // Register plugin settings
  logseq.useSettingsSchema([
    {
      key: "enableFavicons",
      type: "boolean",
      title: "Enable Favicons",
      description: "Add favicons to markdown links",
      default: true,
    },
    {
      key: "faviconSize",
      type: "number",
      title: "Favicon Size",
      description: "Size of favicons in pixels",
      default: 16,
    },
    {
      key: "faviconPosition",
      type: "enum",
      title: "Favicon Position",
      description: "Position of favicon relative to link text",
      default: "before",
      enumChoices: ["before", "after"],
      enumPicker: "radio",
    },
  ]);

  // Listen to block changes and process each changed block
  logseq.DB.onChanged(async (e: any) => {
    console.log(
      `📥 DB.onChanged event: ${e}, e.txMeta?.outlinerOp: ${e.txMeta?.outlinerOp}`
    );
    if (e.blocks && Array.isArray(e.blocks)) {
      for (const block of e.blocks) {
        if (block?.uuid) {
          await processBlockForURLs(block.uuid);
        }
      }
    }
  });

  // Listen to page changes and process each changed page
  logseq.App.onRouteChanged(async (e) => {
    console.log("Route changed:", e);

    // Extract page name from the route parameters
    const pageName = e.parameters?.path?.name;
    if (pageName && e.template === "/page/:name") {
      console.log(`📄 Processing page: ${pageName}`);

      // Get all blocks from the page as a flat list
      const blocks = await getPageBlocks(pageName);

      // Process each block (same pattern as DB.onChanged)
      for (const block of blocks) {
        if (block?.uuid) {
          await processBlockForURLs(block.uuid);
        }
      }
    }
  });
}

/**
 * Gets all blocks from a page as a flat list (including nested blocks)
 * @param pageName - The name of the page to get blocks from
 * @returns Promise with array of block objects, or empty array if page not found
 */
async function getPageBlocks(pageName: string): Promise<any[]> {
  try {
    console.log(`🔍 Getting blocks for page: ${pageName}`);

    // Get the page entity
    const page = await logseq.Editor.getPage(pageName);
    if (!page) {
      console.log(`❌ Page not found: ${pageName}`);
      return [];
    }

    // Get all blocks from the page
    const pageBlocks = await logseq.Editor.getPageBlocksTree(pageName);
    if (!pageBlocks || pageBlocks.length === 0) {
      console.log(`📄 No blocks found on page: ${pageName}`);
      return [];
    }

    console.log(
      `📄 Found ${pageBlocks.length} top-level blocks on page: ${pageName}`
    );

    // Flatten the block tree into a flat list
    const flatBlocks: any[] = [];
    flattenBlocks(pageBlocks, flatBlocks);

    console.log(`📄 Total blocks (including nested): ${flatBlocks.length}`);
    return flatBlocks;
  } catch (error) {
    console.error(`❌ Error getting page blocks for ${pageName}:`, error);
    return [];
  }
}

/**
 * Recursively flattens blocks and their children into a flat array
 * @param blocks - Array of block objects to flatten
 * @param flatBlocks - Array to accumulate flattened blocks
 */
function flattenBlocks(blocks: any[], flatBlocks: any[]): void {
  for (const block of blocks) {
    flatBlocks.push(block);

    // Recursively flatten child blocks
    if (block.children && block.children.length > 0) {
      flattenBlocks(block.children, flatBlocks);
    }
  }
}

/**
 * Processes a single block to convert raw URLs to markdown with titles and optional favicons
 * @param blockUuid - The UUID of the block to process
 * @returns Promise that resolves when block processing is complete
 */
async function processBlockForURLs(blockUuid: string) {
  try {
    console.log(`🔍 Processing block: ${blockUuid}`);

    // Get the block content
    const block = await logseq.Editor.getBlock(blockUuid);
    if (!block?.content) {
      return;
    }

    const content = block.content;

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

// Initialize the plugin
logseq.ready(main).catch(console.error);

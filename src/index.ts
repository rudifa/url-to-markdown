import "@logseq/libs";
import {processBlockContentForURLs, PluginSettings} from "./utils/metadata";

// Main function
async function main() {
  console.log("main url-to-markdown 3.9.1");

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
      `📥 DB.onChanged event: ${e}, e.txMeta.outlinerOp: ${e.txMeta.outlinerOp}`
    );
    if (e.blocks && Array.isArray(e.blocks)) {
      for (const block of e.blocks) {
        if (block?.uuid) {
          await processBlockForURLs(block.uuid);
        }
      }
    }
  });

  logseq.App.onRouteChanged(async (e) => {
    console.log("Route changed:", e);

    // Extract page name from the route parameters
    const pageName = e.parameters?.path?.name;
    if (pageName && e.template === "/page/:name") {
      console.log(`📄 Processing page: ${pageName}`);
      await processPageBlocks(pageName);
    }
  });
}

async function processBlockForURLs(blockUuid: string) {
  try {
    console.log(`🔍 Processing block: ${blockUuid}`);

    // Get the block content
    const block = await logseq.Editor.getBlock(blockUuid);
    if (!block?.content) {
      return;
    }

    const content = block.content;

    // Get favicon options with default fallbacks
    const faviconOptions = getFaviconOptions();

    // Process block content for URLs
    const updatedContent = await processBlockContentForURLs(
      content,
      faviconOptions
    );

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

async function processPageBlocks(pageName: string) {
  try {
    console.log(`🔍 Getting blocks for page: ${pageName}`);

    // Get the page entity
    const page = await logseq.Editor.getPage(pageName);
    if (!page) {
      console.log(`❌ Page not found: ${pageName}`);
      return;
    }

    // Get all blocks from the page
    const pageBlocks = await logseq.Editor.getPageBlocksTree(pageName);
    if (!pageBlocks || pageBlocks.length === 0) {
      console.log(`📄 No blocks found on page: ${pageName}`);
      return;
    }

    console.log(
      `📄 Found ${pageBlocks.length} top-level blocks on page: ${pageName}`
    );

    // Process each block (including nested blocks)
    await processBlocksRecursively(pageBlocks);
  } catch (error) {
    console.error(`❌ Error processing page blocks for ${pageName}:`, error);
  }
}

async function processBlocksRecursively(blocks: any[]) {
  for (const block of blocks) {
    if (block?.uuid) {
      await processBlockForURLs(block.uuid);
    }

    // Process child blocks if they exist
    if (block.children && block.children.length > 0) {
      await processBlocksRecursively(block.children);
    }
  }
}

// Helper function to get favicon options with fallbacks to default settings
function getFaviconOptions() {
  const settings = logseq.settings as unknown as PluginSettings;
  return {
    includeFavicon: settings?.enableFavicons ?? true,
    faviconSize: settings?.faviconSize ?? 16,
    faviconPosition: settings?.faviconPosition ?? "before",
  };
}

// Initialize the plugin
logseq.ready(main).catch(console.error);

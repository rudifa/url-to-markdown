import '@logseq/libs';

async function fetchMetadata(url: string): Promise<{ title: string; icon?: string }> {
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    return {
      title: data.data.title || url,
      icon: data.data.logo || data.data.image?.url || ''
    };
  } catch {
    return { title: url };
  }
}

function isValidURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

async function replaceURLWithMarkdown(e: InputEvent) {
  const textarea = e.target as HTMLTextAreaElement;
  const text = textarea.value;
  const selectionStart = textarea.selectionStart;
  const selectionEnd = textarea.selectionEnd;

  const urlMatch = text.slice(0, selectionEnd).match(/(https?:\/\/[^\s]+)$/);
  if (!urlMatch) return;

  const url = urlMatch[1];
  if (!isValidURL(url)) return;

  const { title, icon } = await fetchMetadata(url);
  const markdown = icon
    ? `![icon](${icon}) [${title}](${url})`
    : `[${title}](${url})`;

  const newText =
    text.slice(0, selectionEnd - url.length) + markdown + text.slice(selectionEnd);

  textarea.value = newText;

  // Simulate input event so Logseq detects changes
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function main() {
  logseq.App.onMacroRendererSlotted(async () => {
    setTimeout(() => {
      const editor = document.querySelector('textarea');
      if (editor) {
        editor.addEventListener('input', debounce(replaceURLWithMarkdown, 500));
      }
    }, 1000);
  });
}

function debounce(fn: (...args: any[]) => void, delay = 300) {
  let timer: number | undefined;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

logseq.ready(main).catch(console.error);

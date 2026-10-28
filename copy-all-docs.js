async function loadAllDocsMarkdown() {
  const response = await fetch('/docs/llms-full.txt', {
    cache: 'no-cache',
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error('documentation export unavailable');

  const markdown = await response.text();
  if (!markdown.trimStart().startsWith('# ')) {
    throw new Error('invalid documentation export');
  }

  return markdown;
}

async function loadAllDocsBlob() {
  return new Blob([await loadAllDocsMarkdown()], { type: 'text/plain' });
}

function resetCopyAllDocsButton(button) {
  button.querySelector('[data-copy-all-label]').textContent = 'Copy all docs';
  button.title = 'Copy every documentation page as Markdown';
}

async function copyAllDocs(event) {
  const button = event.currentTarget;
  const label = button.querySelector('[data-copy-all-label]');
  button.disabled = true;
  label.textContent = 'Copying…';

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': loadAllDocsBlob() }),
      ]);
    } else {
      await navigator.clipboard.writeText(await loadAllDocsMarkdown());
    }

    label.textContent = 'Copied all docs';
    window.setTimeout(resetCopyAllDocsButton, 2500, button);
  } catch {
    label.textContent = 'Retry copy';
    button.title = 'Could not copy the docs. Click to try again.';
  } finally {
    button.disabled = false;
  }
}

function addCopyAllDocsButton() {
  const menu = document.getElementById('page-context-menu');
  const pageButton = document.getElementById('page-context-menu-button');
  if (!menu || !pageButton || document.getElementById('copy-all-docs-button')) return;

  const button = document.createElement('button');
  button.id = 'copy-all-docs-button';
  button.type = 'button';
  button.className = pageButton.className;
  button.style.borderRadius = '0';
  button.style.borderRightWidth = '1px';
  button.style.marginLeft = '8px';
  button.style.minWidth = '144px';
  button.style.whiteSpace = 'nowrap';
  button.setAttribute('aria-label', 'Copy all docs');
  button.title = 'Copy every documentation page as Markdown';

  const content = document.createElement('span');
  content.className = 'flex items-center justify-center gap-2 text-sm font-medium';
  const icon = pageButton.querySelector('svg');
  if (icon) content.append(icon.cloneNode(true));

  const label = document.createElement('span');
  label.dataset.copyAllLabel = '';
  label.setAttribute('aria-live', 'polite');
  label.textContent = 'Copy all docs';
  content.append(label);
  button.append(content);
  button.addEventListener('click', copyAllDocs);
  menu.append(button);
}

addCopyAllDocsButton();
window.addEventListener('mintlify:navigate', addCopyAllDocsButton);

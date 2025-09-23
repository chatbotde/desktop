import { dom } from './dom.js';

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return (tmp.textContent || tmp.innerText || '').trim();
}

function rtfToText(rtf) {
  if (!rtf) return '';
  try {
    // Very lightweight RTF -> text: remove control words and braces
    return rtf
      .replace(/\\'[0-9a-fA-F]{2}/g, ' ') // hex escaped chars -> space
      .replace(/\\[^\s]+ ?/g, '') // control words
      .replace(/[{}]/g, '') // braces
      .replace(/\n|\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return rtf;
  }
}

function appendToInput(content) {
  const input = dom.messageInput;
  if (!input) return;
  const hadText = input.value.length > 0;

  const prompt = document.querySelector('.prompt-input');
  const isCollapsed = prompt && !prompt.classList.contains('expanded');

  let incoming = String(content ?? '');
  if (isCollapsed) {
    incoming = incoming.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    input.value = (input.value.trim() + (hadText ? ' ' : '') + incoming).trim();
  } else {
    input.value += (hadText ? '\n' : '') + incoming;
  }

  if (isCollapsed) {
    input.style.setProperty('height', '44px', 'important');
    input.style.setProperty('max-height', '44px', 'important');
    input.style.setProperty('white-space', 'nowrap', 'important');
    input.style.setProperty('overflow', 'hidden', 'important');
    input.style.setProperty('text-overflow', 'ellipsis', 'important');
    input.value = input.value.replace(/[\r\n]+/g, ' ');
  }

  import('./expand-collapse.js').then(({ autoResize, updateSendButton }) => {
    autoResize();
    updateSendButton();
  });
}

export function initializeClipboardInjection(options = {}) {
  const { autoFocus = true } = options;
  if (!window.chatInputAPI || !window.chatInputAPI.onClipboardChanged) return;

  let lastSignature = '';

  window.chatInputAPI.onClipboardChanged((payload) => {
    if (!payload || !payload.type) return;

    // Build a simple signature to avoid duplicate injections
    const signature = JSON.stringify({
      t: payload.type,
      c: typeof payload.content === 'string' ? payload.content.slice(0, 1024) : null
    });
    if (signature === lastSignature) return;

    switch (payload.type) {
      case 'text':
      case 'bookmark': {
        if (payload.content) {
          appendToInput(String(payload.content));
          lastSignature = signature;
          if (autoFocus) dom.messageInput?.focus();
        }
        break;
      }
      case 'html': {
        const txt = stripHtml(payload.content);
        if (txt) {
          appendToInput(txt);
          lastSignature = signature;
          if (autoFocus) dom.messageInput?.focus();
        }
        break;
      }
      case 'rtf': {
        const txt = rtfToText(payload.content);
        if (txt) {
          appendToInput(txt);
          lastSignature = signature;
          if (autoFocus) dom.messageInput?.focus();
        }
        break;
      }
      default:
        // Ignore non-textual payloads for now (images, etc.)
        break;
    }
  });
}

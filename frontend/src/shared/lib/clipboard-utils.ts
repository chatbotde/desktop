/**
 * Clipboard Utilities
 * 
 * Functions for detecting content types and formatting content for clipboard insertion
 */

export type ContentType = 'text' | 'code' | 'html' | 'table' | 'markdown' | 'rtf';

export interface ContentData {
  type: ContentType;
  text: string;
  html?: string;
  language?: string; // For code blocks
  metadata?: Record<string, any>;
}

/**
 * Detects the content type from a string
 * Now handles mixed content (text + code blocks, etc.)
 */
export function detectContentType(content: string): ContentType {
  const trimmed = content.trim();
  
  // Check for code blocks anywhere in the content (not just at start/end)
  if (/```[\s\S]*?```/m.test(trimmed) || /`[^`\n]+`/m.test(trimmed)) {
    // If it contains code blocks, treat as markdown (can have text + code)
    if (trimmed.includes('```')) {
      return 'markdown'; // Mixed content with code blocks
    }
  }
  
  // Check for markdown tables (check before HTML as tables use | characters)
  if (/^\|[\s\S]*\|[\s\S]*\|/m.test(trimmed) && trimmed.split('\n').filter(line => line.trim().startsWith('|')).length >= 2) {
    return 'table';
  }
  
  // Check for HTML content
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return 'html';
  }
  
  // Check for markdown content (headers, lists, etc.)
  if (/^#{1,6}\s|^[-*+]\s|^\d+\.\s/m.test(trimmed)) {
    return 'markdown';
  }
  
  return 'text';
}

/**
 * Extracts all code blocks from content (handles multiple code blocks)
 */
export function extractCodeBlocks(content: string): Array<{ code: string; language?: string; fullMatch: string }> {
  const codeBlocks: Array<{ code: string; language?: string; fullMatch: string }> = [];
  
  // Match all ```language\ncode\n``` blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({
      code: match[2],
      language: match[1] || undefined,
      fullMatch: match[0]
    });
  }
  
  return codeBlocks;
}

/**
 * Extracts code block information (single block, for backward compatibility)
 */
export function extractCodeBlock(content: string): { code: string; language?: string } | null {
  const blocks = extractCodeBlocks(content);
  if (blocks.length > 0) {
    return {
      code: blocks[0].code,
      language: blocks[0].language
    };
  }
  
  // Match inline code `code` (only if entire content is inline code)
  const inlineCodeMatch = /^`([^`]+)`$/.exec(content.trim());
  if (inlineCodeMatch) {
    return {
      code: inlineCodeMatch[1],
      language: undefined
    };
  }
  
  return null;
}

/**
 * Converts markdown table to HTML table
 */
export function markdownTableToHTML(markdown: string): string {
  const lines = markdown.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return markdown;
  
  const rows: string[][] = [];
  
  for (const line of lines) {
    // Skip separator rows (|---|---|)
    if (/^\|[\s-|:]+\|$/.test(line)) continue;
    
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  if (rows.length === 0) return markdown;
  
  let html = '<table>\n';
  
  // First row is header
  if (rows.length > 0) {
    html += '  <thead>\n    <tr>\n';
    for (const cell of rows[0]) {
      html += `      <th>${escapeHTML(cell)}</th>\n`;
    }
    html += '    </tr>\n  </thead>\n';
  }
  
  // Rest are body rows
  if (rows.length > 1) {
    html += '  <tbody>\n';
    for (let i = 1; i < rows.length; i++) {
      html += '    <tr>\n';
      for (const cell of rows[i]) {
        html += `      <td>${escapeHTML(cell)}</td>\n`;
      }
      html += '    </tr>\n';
    }
    html += '  </tbody>\n';
  }
  
  html += '</table>';
  return html;
}

/**
 * Converts markdown to HTML (handles code blocks properly)
 */
export function markdownToHTML(markdown: string): string {
  let html = markdown;
  
  // First, convert code blocks (do this before other conversions)
  const codeBlocks = extractCodeBlocks(markdown);
  for (const block of codeBlocks) {
    const codeHTML = `<pre><code${block.language ? ` class="language-${block.language}"` : ''}>${escapeHTML(block.code)}</code></pre>`;
    html = html.replace(block.fullMatch, codeHTML);
  }
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold (but not inside code blocks)
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
  
  // Italic (but not inside code blocks)
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
  
  // Inline code (but not code blocks which are already converted)
  html = html.replace(/`([^`\n]+)`/gim, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
  
  // Convert line breaks to <br> but preserve code block structure
  // Split by code blocks first, then process each segment
  const segments = html.split(/(<pre><code[\s\S]*?<\/code><\/pre>)/);
  html = segments.map((segment) => {
    // Skip code blocks
    if (segment.startsWith('<pre><code')) {
      return segment;
    }
    // Process text segments
    let processed = segment;
    processed = processed.replace(/\n\n/gim, '</p><p>');
    processed = processed.replace(/\n/gim, '<br>');
    return processed;
  }).join('');
  
  // Wrap in paragraph if needed (but preserve code blocks)
  if (!html.startsWith('<') && !html.startsWith('<pre>')) {
    html = `<p>${html}</p>`;
  }
  
  return html;
}

/**
 * Formats content for clipboard insertion
 * Now properly handles mixed content (text + code blocks)
 */
export function formatContentForClipboard(content: string | ContentData): ContentData {
  // If already formatted, return as-is
  if (typeof content !== 'string') {
    return content;
  }
  
  const type = detectContentType(content);
  const data: ContentData = {
    type,
    text: content // Keep original text for plain text fallback
  };
  
  switch (type) {
    case 'code': {
      // Pure code block (entire content is code)
      const codeBlock = extractCodeBlock(content);
      if (codeBlock) {
        // For pure code, use just the code (no markdown syntax)
        data.text = codeBlock.code;
        data.language = codeBlock.language;
        data.html = `<pre><code${codeBlock.language ? ` class="language-${codeBlock.language}"` : ''}>${escapeHTML(codeBlock.code)}</code></pre>`;
      }
      break;
    }
    
    case 'table': {
      data.html = markdownTableToHTML(content);
      // Keep plain text version too
      break;
    }
    
    case 'html': {
      data.html = content;
      // Extract plain text from HTML
      data.text = content.replace(/<[^>]*>/g, '').trim();
      break;
    }
    
    case 'markdown': {
      // Convert markdown to HTML (handles code blocks, text, etc.)
      data.html = markdownToHTML(content);
      
      // Also create a plain text version that preserves code blocks
      // Replace code blocks with just the code (no markdown syntax)
      let plainText = content;
      const codeBlocks = extractCodeBlocks(content);
      for (const block of codeBlocks) {
        // Replace markdown code block with just the code
        plainText = plainText.replace(block.fullMatch, block.code);
      }
      data.text = plainText;
      
      // Check if it contains a table and handle it
      if (content.includes('|') && /^\|[\s\S]*\|/m.test(content)) {
        // If it's primarily a table, use table conversion
        const tablePart = content.split('\n').filter(line => line.trim().startsWith('|')).join('\n');
        if (tablePart.length > content.length / 2) {
          data.html = markdownTableToHTML(content);
        }
      }
      break;
    }
    
    case 'text':
    default: {
      // Plain text, no HTML needed
      break;
    }
  }
  
  return data;
}

/**
 * Escapes HTML special characters
 */
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Prepares clipboard data for writing
 * Ensures full content (text + code blocks) is preserved
 */
export async function writeToClipboard(
  content: string | ContentData,
  electronAPI?: any
): Promise<void> {
  if (!electronAPI?.clipboard) {
    throw new Error('Electron clipboard API is not available');
  }
  
  const formatted = formatContentForClipboard(content);
  
  // For content with code blocks, ensure we preserve the full text
  // The text should include all content (surrounding text + code)
  let finalText = formatted.text;
  let finalHTML = formatted.html;
  
  // If we have markdown with code blocks, make sure text includes everything
  if (formatted.type === 'markdown' && typeof content === 'string') {
    // For markdown, the text should preserve code blocks as plain code
    // but keep all surrounding text
    const codeBlocks = extractCodeBlocks(content);
    let textWithCode = content;
    for (const block of codeBlocks) {
      // Replace markdown code block syntax with just the code content
      // This way code editors get the code, but we preserve the structure
      textWithCode = textWithCode.replace(block.fullMatch, block.code);
    }
    finalText = textWithCode;
  }
  
  // Write multiple formats for maximum compatibility
  if (finalHTML) {
    // Use the write method to write both HTML and text simultaneously
    // This ensures both formats are available for the application to choose
    // Rich text editors will use HTML, code editors will use plain text
    await electronAPI.clipboard.write({
      text: finalText,
      html: finalHTML
    });
  } else {
    // Plain text only
    await electronAPI.clipboard.writeText(finalText);
  }
}


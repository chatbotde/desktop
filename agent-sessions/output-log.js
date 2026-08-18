const MAX_LINES = 400;
const MAX_LINE_CHARS = 800;

/** Strip VT/ANSI so the phone never sees terminal control garbage. */
function stripAnsi(text) {
  return String(text || '')
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
    .replace(/\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g, '')
    .replace(/\u001b[()][0-9A-Za-z]/g, '')
    .replace(/\u001b./g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

const SPINNER_RE = /^[\s⠋⠙⠹⠸⠴⠦⠧⠇⠏◐◓◑◒⣾⣽⣻⢿⡿⣟⣯⣷▪▫•●○◎☆★✦✧✔✖✗✓✕…·]+$/u;
const BOX_ONLY_RE = /^[\s┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬▀▄█░▒▓━┃┏┓┗┛┣┫┳┻╋]+$/u;
const PROMPT_RE = /^(ps\s+[^>]*>|[>$%#›»]+|\w+@[\w.-]+:.*[#$]|❯|➜)\s*$/i;

/**
 * @param {string} line
 * @returns {boolean}
 */
function isGarbageLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (trimmed.length <= 2 && !/[A-Za-z0-9]/.test(trimmed)) return true;
  if (SPINNER_RE.test(trimmed)) return true;
  if (BOX_ONLY_RE.test(trimmed)) return true;
  if (PROMPT_RE.test(trimmed)) return true;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('starting ') && !lower.includes('you:')) return true;
  if (lower.startsWith('process exited')) return true;
  if (lower.includes('buddy bridge connected')) return true;
  if (lower.includes('phone i/o connected')) return true;
  if (lower.startsWith('permission requested:')) return true;
  if (lower.startsWith('tool start:') || lower.startsWith('tool done:')) return true;
  if (lower === 'session idle') return true;
  if (lower.includes('npm run agent:install-')) return true;

  // Progress / percent bars
  if (/^\s*[\[|]*[█▓▒░=\-#.]{4,}[\s\]|]*\d{1,3}%?\s*$/.test(trimmed)) return true;
  if (/^\s*\d{1,3}%\s*$/.test(trimmed)) return true;

  return false;
}

/**
 * @param {string} line
 * @returns {string}
 */
function cleanLine(line) {
  return stripAnsi(line)
    .replace(/\t/g, ' ')
    .replace(/[ \t]+$/g, '')
    .slice(-MAX_LINE_CHARS);
}

class OutputLog {
  constructor() {
    /** @type {string[]} */
    this.lines = [];
    this.rawBuffer = '';
  }

  /**
   * @param {string} chunk
   * @returns {string[]}
   */
  appendChunk(chunk) {
    if (!chunk) {
      return [];
    }

    // Turn CR progress rewrites into newlines so we can drop spinner frames.
    this.rawBuffer += String(chunk).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const parts = this.rawBuffer.split('\n');
    this.rawBuffer = parts.pop() ?? '';

    const appended = [];
    for (const part of parts) {
      const line = cleanLine(part);
      if (isGarbageLine(line)) {
        continue;
      }
      this.lines.push(line);
      appended.push(line);
      if (this.lines.length > MAX_LINES) {
        this.lines.shift();
      }
    }

    return appended;
  }

  /**
   * @param {string} line
   * @returns {string[]}
   */
  appendLine(line) {
    const cleaned = cleanLine(line);
    const lower = cleaned.toLowerCase();
    const isUserMarker =
      lower.startsWith('you:') || lower.startsWith('phone →') || lower.startsWith('phone ->');
    if (!cleaned.trim()) {
      return [];
    }
    if (isGarbageLine(cleaned) && !isUserMarker) {
      return [];
    }
    this.lines.push(cleaned);
    if (this.lines.length > MAX_LINES) {
      this.lines.shift();
    }
    return [cleaned];
  }

  /**
   * @returns {string[]}
   */
  getLines() {
    const tail = cleanLine(this.rawBuffer);
    if (tail.trim() && !isGarbageLine(tail)) {
      return [...this.lines, tail];
    }
    return [...this.lines];
  }

  /**
   * @returns {string}
   */
  getSummary() {
    const lines = this.getLines();
    return lines[lines.length - 1] || '';
  }
}

module.exports = {
  OutputLog,
  MAX_LINES,
  stripAnsi,
  cleanLine,
  isGarbageLine,
};

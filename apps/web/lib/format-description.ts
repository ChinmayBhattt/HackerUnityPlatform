/**
 * Utilities for parsing, formatting, and displaying rich event descriptions
 * Supporting Markdown, HTML, and plain-text formats gracefully.
 */

/**
 * Strips HTML tags and Markdown formatting to produce a clean single/multi-line
 * plain text snippet for cards, search indexing, and previews.
 */
export function stripHtmlAndMarkdown(text?: string | null, maxLength?: number): string {
  if (!text) return '';

  let clean = text
    // Replace line breaks and block element closings with spaces so words don't merge
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, ' ')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove markdown headers (# Title)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italic markers (**bold**, *italic*, __bold__, _italic_)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove strikethrough (~~del~~)
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bullet points and numbered list markers
    .replace(/^[\s]*([•\-\*◦⁃]|\u2022)\s+/gm, '')
    .replace(/^[\s]*\d+[\.\)]\s+/gm, '')
    // Remove blockquotes (> quote)
    .replace(/^>\s+/gm, '')
    // Remove inline code ticks
    .replace(/`([^`]+)`/g, '$1')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse duplicate whitespace and newlines
    .replace(/\s+/g, ' ')
    .trim();

  if (maxLength && clean.length > maxLength) {
    clean = clean.slice(0, maxLength).trim() + '...';
  }

  return clean;
}

/**
 * Basic XSS sanitizer that removes dangerous elements and attributes
 * while leaving formatting tags intact.
 */
function sanitizeHtml(html: string): string {
  let clean = html
    // Remove scripts and styles
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove iframe/embed/object/form/input
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^>]*>/gi, '')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
    // Remove inline event handlers (onload, onerror, onclick, etc.)
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Neutralize javascript: URLs
    .replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'href="#"')
    .replace(/src\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'src=""');

  return clean;
}

/**
 * Formats inline Markdown syntax (bold, italic, strikethrough, links, code)
 */
function formatInlineMarkdown(str: string): string {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

/**
 * Converts raw event description into clean, semantic, safely-rendered HTML.
 * Handles:
 * 1. Raw Markdown (e.g. # Heading, ## Subheading, - List items, **bold**)
 * 2. Raw HTML strings (e.g. <p><h2><b>HACK IN HILLS</b></h2></p>)
 * 3. Mixed content where Markdown is inside HTML tags
 * 4. Plain text with line breaks
 */
export function renderDescriptionToHtml(rawText?: string | null): string {
  if (!rawText || !rawText.trim()) return '';

  const trimmed = rawText.trim();

  // Check if string contains HTML tags
  const hasHtml = /<\/?(?:p|div|h[1-6]|ul|ol|li|b|strong|i|em|br|a|blockquote|hr|table|span|s|strike|del)\b/i.test(trimmed);

  if (hasHtml) {
    let clean = trimmed;

    // Fix cases where markdown was entered inside HTML paragraphs (e.g. <p># Heading</p> or <p>- List item</p>)
    clean = clean.replace(/<p>\s*#\s+([^<]+)<\/p>/gi, '<h2>$1</h2>');
    clean = clean.replace(/<p>\s*##\s+([^<]+)<\/p>/gi, '<h3>$1</h3>');
    clean = clean.replace(/<p>\s*###\s+([^<]+)<\/p>/gi, '<h4>$1</h4>');
    clean = clean.replace(/<p>\s*####\s+([^<]+)<\/p>/gi, '<h5>$1</h5>');

    // Convert markdown bold/italic/links that might be inside HTML
    clean = clean.replace(/\*\*([^*<]+)\*\*/g, '<strong>$1</strong>');
    clean = clean.replace(/\[([^\]<]+)\]\((https?:\/\/[^\s\)<]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Clean up empty paragraphs and excessive breaks
    clean = clean.replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, '');
    clean = clean.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br /><br />');

    return sanitizeHtml(clean);
  }

  // Pure Markdown or Plain Text parsing
  const lines = trimmed.split(/\r?\n/);
  let html = '';
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      continue;
    }

    // Horizontal rules (--- or ***)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line)) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += '<hr />';
      continue;
    }

    // Markdown Headings: # -> h2, ## -> h3, ### -> h4, #### -> h5
    const h1Match = line.match(/^#\s+(.*)$/);
    const h2Match = line.match(/^##\s+(.*)$/);
    const h3Match = line.match(/^###\s+(.*)$/);
    const h4Match = line.match(/^####\s+(.*)$/);

    if (h4Match) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h5>${formatInlineMarkdown(h4Match[1])}</h5>`;
      continue;
    }
    if (h3Match) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h4>${formatInlineMarkdown(h3Match[1])}</h4>`;
      continue;
    }
    if (h2Match) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h3>${formatInlineMarkdown(h2Match[1])}</h3>`;
      continue;
    }
    if (h1Match) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h2>${formatInlineMarkdown(h1Match[1])}</h2>`;
      continue;
    }

    // Blockquotes (> quote)
    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<blockquote>${formatInlineMarkdown(quoteMatch[1])}</blockquote>`;
      continue;
    }

    // Unordered List Bullet (-, *, •, ◦, ⁃)
    const bulletMatch = line.match(/^([•\-\*◦⁃]|\u2022)\s+(.*)$/);
    if (bulletMatch) {
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${formatInlineMarkdown(bulletMatch[2] || '')}</li>`;
      continue;
    }

    // Ordered List (1. or 1))
    const olMatch = line.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (olMatch) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${formatInlineMarkdown(olMatch[2] || '')}</li>`;
      continue;
    }

    // Regular Paragraph
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
    html += `<p>${formatInlineMarkdown(line)}</p>`;
  }

  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';

  return sanitizeHtml(html || `<p>${formatInlineMarkdown(trimmed)}</p>`);
}

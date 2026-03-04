/**
 * Escape plain text for safe insertion into Telegram HTML messages.
 * Use this for external plain text (titles, usernames, descriptions)
 * that should render as literal text, not be parsed as HTML.
 * 
 * Note: This escapes plain text. If the input might already contain HTML entities,
 * use escapeHtmlSafe() instead to avoid double-encoding.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Safely escape text that might already contain HTML entities.
 * Decodes any existing entities first, then re-escapes to avoid double-encoding.
 * Use this for external API data that might be pre-encoded.
 */
export function escapeHtmlSafe(text: string): string {
  const decoded = decodeHtmlEntities(text);
  return escapeHtml(decoded);
}

/**
 * Sanitize HTML content for Telegram's supported HTML subset.
 * Converts block-level tags to newlines, keeps supported inline tags,
 * and strips everything else.
 */
export function sanitizeHtmlForTelegram(html: string): string {
  let result = html;

  // Convert <p> tags to double newlines
  result = result.replace(/<p\b[^>]*>/gi, "\n\n");
  result = result.replace(/<\/p>/gi, "");

  // Convert <br> tags to newlines
  result = result.replace(/<br\s*\/?>/gi, "\n");

  // Convert <img> tags — extract src as a link if present, otherwise strip
  result = result.replace(/<img[^>]*\bsrc="([^"]*)"[^>]*>/gi, "[$1]");

  // Telegram supported tags (with attributes for <a> and <pre>):
  // <b>, <strong>, <i>, <em>, <u>, <ins>, <s>, <strike>, <del>,
  // <a href="...">, <code>, <pre>, <blockquote>, <tg-spoiler>
  const allowedTags = /^\/?(b|strong|i|em|u|ins|s|strike|del|code|pre|blockquote|tg-spoiler)$/i;
  const allowedTagsWithAttrs = /^(a)\s/i;

  // Strip all tags that are not in the allowed list
  result = result.replace(/<([^>]*)>/g, (match, inner: string) => {
    const tagContent = inner.trim();

    // Closing tag: </tagname>
    if (tagContent.startsWith("/")) {
      const tagName = tagContent.slice(1).trim();
      if (allowedTags.test("/" + tagName)) return match;
      if (/^a$/i.test(tagName)) return match;
      return "";
    }

    // Self-closing or opening tag
    const tagName = tagContent.split(/[\s/>]/)[0];
    if (allowedTags.test(tagName)) return match;
    if (allowedTagsWithAttrs.test(tagContent)) return match;
    return "";
  });

  // Collapse excessive newlines (more than 2 consecutive)
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * Decode HTML entities to their character equivalents.
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&nbsp;": " ",
    "&ndash;": "–",
    "&mdash;": "—",
    "&hellip;": "…",
    "&rsquo;": "'",
    "&lsquo;": "'",
    "&rdquo;": '"',
    "&ldquo;": '"',
    "&bull;": "•",
    "&middot;": "·",
    "&trade;": "™",
    "&copy;": "©",
    "&reg;": "®",
    "&deg;": "°",
    "&plusmn;": "±",
    "&times;": "×",
    "&divide;": "÷",
    "&ne;": "≠",
    "&le;": "≤",
    "&ge;": "≥",
    "&infin;": "∞",
    "&asymp;": "≈",
    "&equiv;": "≡",
    "&larr;": "←",
    "&rarr;": "→",
    "&uarr;": "↑",
    "&darr;": "↓",
    "&harr;": "↔",
  };

  const MAX_CODE_POINT = 0x10ffff;

  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      const codePoint = parseInt(hex, 16);
      return codePoint <= MAX_CODE_POINT ? String.fromCodePoint(codePoint) : match;
    })
    .replace(/&#(\d+);/g, (match, dec) => {
      const codePoint = parseInt(dec, 10);
      return codePoint <= MAX_CODE_POINT ? String.fromCodePoint(codePoint) : match;
    })
    .replace(/&[a-z]+;/gi, (match) => entities[match.toLowerCase()] || match);
}

/**
 * Safely truncate HTML content without breaking tags or entities.
 * Returns { html: string, isPlainText: boolean } where:
 * - If content fits, returns original HTML with tags (isPlainText: false)
 * - If truncation needed, strips tags and returns decoded plain text (isPlainText: true)
 */
export function truncateHtml(
  html: string,
  maxLength: number
): { html: string; isPlainText: boolean } {
  let plainText = html.replace(/<[^>]*>/g, "");
  const plainTextDecoded = decodeHtmlEntities(plainText);
  
  if (plainTextDecoded.length <= maxLength) {
    return { html, isPlainText: false };
  }
  
  return { html: plainTextDecoded.slice(0, maxLength) + "…", isPlainText: true };
}

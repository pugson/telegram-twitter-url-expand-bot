/**
 * Escape plain text for safe insertion into Telegram HTML messages.
 * Use this for external plain text (titles, usernames, descriptions)
 * that should render as literal text, not be parsed as HTML.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Sanitize HTML content for Telegram's supported HTML subset.
 * Converts block-level tags to newlines, keeps supported inline tags,
 * and strips everything else.
 */
export function sanitizeHtmlForTelegram(html: string): string {
  let result = html;

  // Convert <p> tags to double newlines
  result = result.replace(/<p[^>]*>/gi, "\n\n");
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
 * Safely truncate HTML content without breaking tags.
 * Strips all HTML tags, truncates to maxLength, then adds ellipsis if needed.
 */
export function truncateHtml(html: string, maxLength: number): string {
  const plainText = html.replace(/<[^>]*>/g, "");
  if (plainText.length <= maxLength) {
    return html;
  }
  const stripped = plainText.slice(0, maxLength);
  return stripped + "…";
}

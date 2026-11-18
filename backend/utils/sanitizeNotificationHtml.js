const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "p", "div", "br", "span"]);
const VOID_TAGS = new Set(["br"]);
const COLOR_RE = /^(?:#[0-9a-fA-F]{6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/;

function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Rebuild a tiny formatting-only HTML subset. All source attributes are discarded
// except a validated hex color on span; scripts/styles/URLs are never retained.
function sanitizeNotificationHtml(input) {
  const source = String(input || "").slice(0, 12000);
  const tokens = source.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+|</g) || [];
  const stack = [];
  let output = "";
  for (const token of tokens) {
    if (token.startsWith("<!--")) continue;
    if (token[0] !== "<" || token === "<") { output += escapeText(token); continue; }
    const match = token.match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>$/);
    if (!match) continue;
    const closing = Boolean(match[1]);
    const tag = match[2].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) continue;
    if (closing) {
      const index = stack.lastIndexOf(tag);
      if (index >= 0) {
        for (let i = stack.length - 1; i >= index; i--) output += `</${stack.pop()}>`;
      }
      continue;
    }
    if (tag === "span") {
      const style = match[3].match(/\bstyle\s*=\s*["'][^"']*color\s*:\s*(#[0-9a-fA-F]{6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))\s*;?[^"']*["']/i);
      const color = style && COLOR_RE.test(style[1]) ? style[1] : "";
      output += color ? `<span style="color:${color}">` : "<span>";
    } else output += `<${tag}>`;
    if (!VOID_TAGS.has(tag)) stack.push(tag);
  }
  while (stack.length) output += `</${stack.pop()}>`;
  return output;
}

function notificationPlainText(html) {
  return String(html || "").replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

module.exports = { sanitizeNotificationHtml, notificationPlainText };

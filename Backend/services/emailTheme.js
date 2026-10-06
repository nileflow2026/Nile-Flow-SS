const EMAIL_THEME_CSS = `
  :root { color-scheme: light; }
  body { background: #f4f7f6 !important; color: #1f2937 !important; font-family: Arial, sans-serif !important; }
  .container, .card, .email-wrapper { background: #ffffff !important; border: 1px solid #dce8e2 !important; box-shadow: 0 16px 40px rgba(20, 83, 45, 0.12) !important; }
  .header, .email-header, .promo-header, .announcement-header { background: linear-gradient(135deg, #14532d 0%, #16a34a 100%) !important; color: #ffffff !important; }
  .logo, .greeting, .team-name, .section-title { color: #14532d !important; }
  .content, .email-body { background: #ffffff !important; color: #374151 !important; }
  .section, .info-box, .order-table, .welcome-banner, .feature-card { background: #f8faf9 !important; border-color: #dce8e2 !important; }
  .section-title, .order-number span, .product-price, .highlight { color: #b45309 !important; }
  .section-content, .info-text, .thank-you, ul { color: #374151 !important; }
  .footer { background: #14532d !important; color: #d1fae5 !important; border-top-color: #16a34a !important; }
  .footer-link { color: #d1fae5 !important; }
  a { color: #15803d; }
`;

const EMAIL_FOOTER_HTML = `
  <footer style="background:#14532d;color:#d1fae5;padding:28px 24px;text-align:center;font-family:Arial,sans-serif;border-top:3px solid #d97706;">
    <div style="font-size:18px;font-weight:800;letter-spacing:1px;color:#ffffff;">NILE FLOW</div>
    <div style="margin-top:6px;font-size:12px;color:#bbf7d0;">Trusted African commerce</div>
    <div style="margin:18px 0 12px;">
      <a href="https://www.facebook.com/profile.php?id=61580711948973" style="color:#ffffff;text-decoration:none;margin:0 8px;">Facebook</a>
      <a href="https://www.instagram.com/nileflowafrica" style="color:#ffffff;text-decoration:none;margin:0 8px;">Instagram</a>
      <a href="https://twitter.com/nileflowafrica" style="color:#ffffff;text-decoration:none;margin:0 8px;">Twitter</a>
      <a href="https://www.tiktok.com/@nileflowafrica" style="color:#ffffff;text-decoration:none;margin:0 8px;">TikTok</a>
      <a href="https://www.linkedin.com/in/nile-flow-683806395" style="color:#ffffff;text-decoration:none;margin:0 8px;">LinkedIn</a>
      <a href="https://www.youtube.com/@nileflowafrica" style="color:#ffffff;text-decoration:none;margin:0 8px;">YouTube</a>
    </div>
    <div style="font-size:12px;color:#d1fae5;">Nairobi, Kenya | <a href="mailto:support@nileflowafrica.com" style="color:#fef3c7;text-decoration:none;">support@nileflowafrica.com</a></div>
    <!-- EMAIL_UNSUBSCRIBE_LINK -->
    <div style="margin-top:12px;font-size:11px;color:#a7f3d0;">© ${new Date().getFullYear()} Nile Flow. All rights reserved.</div>
  </footer>
`;

function matchingElementEnd(html, tagName, startIndex) {
  const tags = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tags.lastIndex = startIndex;
  let depth = 1;
  let match;

  while ((match = tags.exec(html))) {
    if (/^<\//.test(match[0])) {
      depth -= 1;
    } else if (!/\/\s*>$/.test(match[0])) {
      depth += 1;
    }

    if (depth === 0) return tags.lastIndex;
  }

  return -1;
}

function removeExistingFooters(html) {
  const openingTags = /<([a-z][\w:-]*)\b([^>]*)>/gi;
  let output = "";
  let cursor = 0;
  let match;

  while ((match = openingTags.exec(html))) {
    const tagName = match[1].toLowerCase();
    const classMatch = match[2].match(
      /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
    );
    const classNames = (classMatch?.[1] || classMatch?.[2] || classMatch?.[3] || "")
      .split(/\s+/)
      .filter(Boolean);
    const isFooter =
      tagName === "footer" ||
      classNames.includes("email-legacy-footer") ||
      (tagName === "div" &&
        (classNames.includes("footer") || classNames.includes("email-footer")));

    if (!isFooter) continue;

    const endIndex = matchingElementEnd(html, tagName, openingTags.lastIndex);
    if (endIndex === -1) {
      throw new Error(`Cannot apply the shared email footer: unmatched <${tagName}>`);
    }

    output += html.slice(cursor, match.index);
    cursor = endIndex;
    openingTags.lastIndex = endIndex;
  }

  return output + html.slice(cursor);
}

function getUnsubscribeHref(html) {
  const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi) || [];

  for (const anchor of anchors) {
    if (!/unsubscribe/i.test(anchor)) continue;
    const href = anchor.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (href) return href[1] || href[2] || href[3] || "";
  }

  return "";
}

function escapeHtmlAttribute(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function ensureHtmlDocument(html) {
  if (!/<html\b/i.test(html)) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
  }

  let documentHtml = html;
  if (!/<head\b/i.test(documentHtml)) {
    documentHtml = documentHtml.replace(/<html\b[^>]*>/i, "$&<head></head>");
  }
  if (!/<\/head\s*>/i.test(documentHtml)) {
    documentHtml = documentHtml.replace(/<body\b/i, "</head><body");
    if (!/<\/head\s*>/i.test(documentHtml)) {
      documentHtml = documentHtml.replace(/<\/html\s*>/i, "</head></html>");
    }
  }
  if (!/<body\b/i.test(documentHtml)) {
    documentHtml = documentHtml.replace(/<\/head\s*>/i, "$&<body>");
  }
  if (!/<\/body\s*>/i.test(documentHtml)) {
    documentHtml = documentHtml.replace(/<\/html\s*>/i, "</body></html>");
  }

  return documentHtml;
}

function applyEmailTheme(content) {
  const originalHtml = String(content || "");
  const unsubscribeHref = getUnsubscribeHref(originalHtml);
  let html = removeExistingFooters(originalHtml).replace(
    /<style\b[^>]*data-nileflow-email-theme=["']true["'][^>]*>[\s\S]*?<\/style\s*>/gi,
    "",
  );
  html = ensureHtmlDocument(html);

  const unsubscribeMarkup = unsubscribeHref
    ? `<div style="margin-top:12px;font-size:12px;"><a href="${escapeHtmlAttribute(unsubscribeHref)}" style="color:#d1fae5;text-decoration:underline;">Unsubscribe</a></div>`
    : "";
  const footer = EMAIL_FOOTER_HTML.replace(
    "<!-- EMAIL_UNSUBSCRIBE_LINK -->",
    unsubscribeMarkup,
  );
  const themeStyle = `<style data-nileflow-email-theme="true">${EMAIL_THEME_CSS}</style>`;

  html = html.replace(/<\/head\s*>/i, `${themeStyle}</head>`);
  return html.replace(/<\/body\s*>/i, `${footer}</body>`);
}

async function sendBrandedEmail(resend, options) {
  const html = applyEmailTheme(options.html);
  return resend.emails.send({ ...options, html });
}

module.exports = {
  EMAIL_THEME_CSS,
  EMAIL_FOOTER_HTML,
  applyEmailTheme,
  sendBrandedEmail,
};

/**
 * nileFlowEmailTemplates — Professionally branded, theme-consistent email templates
 * for all Nile Flow communications (newsletters, updates, announcements).
 *
 * Theme: Gold (#D4A017 / #B8860B) accent on dark background (#1A1A1A / #2C1810)
 * Font: Inter, system sans-serif
 * Style: Premium, warm, African marketplace identity
 *
 * @module services/nileFlowEmailTemplates
 */

'use strict';

const YEAR = new Date().getFullYear();
const BRAND = {
  name: 'Nile Flow Africa',
  tagline: 'Elevating African commerce through technology',
  supportEmail: 'support@nileflowafrica.com',
  website: 'https://nileflowafrica.com',
  shopUrl: 'https://nileflowafrica.com/shop',
  twitterUrl: 'https://twitter.com/nileflowafrica',
  instagramUrl: 'https://instagram.com/nileflowafrica',
};

/**
 * Build the outer shell that wraps every Nile Flow email.
 * All templates call this then inject their body content.
 */
function shell({ bodyContent, subject = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject ? `${subject} | ${BRAND.name}` : BRAND.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      margin: 0;
      padding: 32px 16px;
      color: #e2e8f0;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(180deg, #1a1a1a 0%, #1c1c1c 100%);
      border: 1px solid rgba(212, 160, 23, 0.15);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    }

    /* ── Header ─────────────────────────────────────────── */
    .email-header {
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 50%, #8B6914 100%);
      padding: 36px 32px 32px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .email-header::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.06) 0%, transparent 60%);
    }

    .brand-logo {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
      position: relative;
      z-index: 1;
    }

    .brand-tagline {
      font-size: 11px;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      letter-spacing: 2.5px;
      text-transform: uppercase;
      margin-top: 6px;
      position: relative;
      z-index: 1;
    }

    /* ── Body ───────────────────────────────────────────── */
    .email-body {
      padding: 40px 32px;
    }

    /* ── Footer ─────────────────────────────────────────── */
    .email-footer {
      background: #111111;
      padding: 32px;
      text-align: center;
      border-top: 1px solid rgba(212, 160, 23, 0.1);
    }

    .footer-social {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .footer-social a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
      font-size: 16px;
      text-decoration: none;
      transition: background 0.2s;
    }

    .footer-social a:hover { background: rgba(212,160,23,0.2); }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .footer-links a {
      color: #9ca3af;
      font-size: 12px;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-links a:hover { color: #D4A017; }

    .footer-copyright {
      font-size: 11px;
      color: #6b7280;
      line-height: 1.6;
    }

    /* ── Common Components ──────────────────────────────── */
    .greeting {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #D4A017, #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .paragraph {
      font-size: 15px;
      color: #cbd5e1;
      margin-bottom: 20px;
      line-height: 1.7;
    }

    .paragraph strong { color: #fbbf24; }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent);
      margin: 32px 0;
    }

    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      text-align: center;
      box-shadow: 0 4px 20px rgba(212, 160, 23, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(212, 160, 23, 0.4);
    }

    .btn-secondary {
      display: inline-block;
      background: transparent;
      color: #D4A017 !important;
      padding: 12px 28px;
      border: 2px solid rgba(212, 160, 23, 0.4);
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      text-align: center;
      transition: border-color 0.2s, color 0.2s;
    }

    .btn-secondary:hover {
      border-color: #D4A017;
      color: #fbbf24 !important;
    }

    .highlight-box {
      background: rgba(212, 160, 23, 0.08);
      border: 1px solid rgba(212, 160, 23, 0.25);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }

    .highlight-box h3 {
      color: #D4A017;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .highlight-box p {
      color: #cbd5e1;
      font-size: 14px;
      margin: 0;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 24px 0;
    }

    .feature-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }

    .feature-card .icon { font-size: 28px; display: block; margin-bottom: 8px; }
    .feature-card h4 { color: #f1f5f9; font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .feature-card p { color: #9ca3af; font-size: 12px; margin: 0; }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .info-row:last-child { border-bottom: none; }

    .info-label {
      color: #9ca3af;
      font-size: 14px;
    }

    .info-value {
      color: #f1f5f9;
      font-size: 14px;
      font-weight: 600;
      text-align: right;
    }

    .signature {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(212,160,23,0.15);
    }

    .signature .team-name {
      font-size: 16px;
      font-weight: 700;
      color: #D4A017;
      margin-bottom: 2px;
    }

    .signature .team-title {
      font-size: 12px;
      color: #9ca3af;
    }

    @media (max-width: 600px) {
      body { padding: 16px 8px; }
      .email-body { padding: 28px 20px; }
      .email-header { padding: 28px 20px; }
      .brand-logo { font-size: 22px; }
      .feature-grid { grid-template-columns: 1fr; }
      .greeting { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header -->
    <div class="email-header">
      <div class="brand-logo">NILE FLOW</div>
      <div class="brand-tagline">Premium African Marketplace</div>
    </div>

    <!-- Body -->
    <div class="email-body">
      ${bodyContent}
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <div class="footer-social">
        <a href="${BRAND.website}" style="color:#9ca3af;">🌐</a>
        <a href="${BRAND.twitterUrl}" style="color:#9ca3af;">𝕏</a>
        <a href="${BRAND.instagramUrl}" style="color:#9ca3af;">📷</a>
      </div>
      <div class="footer-links">
        <a href="${BRAND.website}">Visit Store</a>
        <a href="${BRAND.website}/help">Help Centre</a>
        <a href="${BRAND.website}/privacy">Privacy</a>
        <a href="mailto:${BRAND.supportEmail}">Contact Us</a>
      </div>
      <div class="footer-copyright">
        <p>© ${YEAR} ${BRAND.name}. All rights reserved.</p>
        <p style="margin-top:4px;">Nairobi, Kenya</p>
        <p style="margin-top:12px;">
          You received this email because you are registered with ${BRAND.name}.
          <br><a href="{{unsubscribe_link}}" style="color:#6b7280;">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Template Builders ──────────────────────────────────────────────────────

function formatMessage(message) {
  return String(message ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p class="paragraph">${paragraph
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

/**
 * General Newsletter / Update
 */
function newsletter({ subject, message, ctaText, ctaLink, recipientName = 'there' }) {
  const body = `
    <div class="greeting">Hello ${recipientName} 👋</div>

    ${formatMessage(message)}

    ${ctaText && ctaLink ? `
    <div style="text-align:center;margin:32px 0;">
      <a href="${ctaLink}" class="btn-primary">${ctaText}</a>
    </div>` : ''}

    <div class="divider"></div>

    <div class="signature">
      <div class="team-name">The Nile Flow Team</div>
      <div class="team-title">Elevating African commerce through technology</div>
    </div>
  `;
  return shell({ bodyContent: body, subject });
}

/**
 * App Update / New Features announcement
 */
function appUpdate({ subject, message, features, ctaText, ctaLink, recipientName = 'there' }) {
  const featureCards = (features || []).map(f => `
    <div class="feature-card">
      <span class="icon">${f.icon || '✨'}</span>
      <h4>${f.title}</h4>
      <p>${f.description}</p>
    </div>
  `).join('');

  const body = `
    <div class="greeting">Hello ${recipientName} 🚀</div>

    ${formatMessage(message)}

    ${features && features.length ? `
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;background:rgba(212,160,23,0.15);color:#D4A017;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What's New</span>
    </div>
    <div class="feature-grid">
      ${featureCards}
    </div>` : ''}

    ${ctaText && ctaLink ? `
    <div style="text-align:center;margin:32px 0;">
      <a href="${ctaLink}" class="btn-primary">${ctaText}</a>
    </div>` : ''}

    <div class="divider"></div>

    <div class="highlight-box">
      <h3>💡 Need Help Getting Started?</h3>
      <p>Our support team is here for you. Reply to this email or visit our Help Centre.</p>
    </div>

    <div class="signature">
      <div class="team-name">The Nile Flow Team</div>
      <div class="team-title">Elevating African commerce through technology</div>
    </div>
  `;
  return shell({ bodyContent: body, subject });
}

/**
 * Survey / Feedback Request
 */
function survey({ subject, message, surveyLink, recipientName = 'there' }) {
  const body = `
    <div class="greeting">Hello ${recipientName} 💬</div>

    ${formatMessage(message)}

    <div class="highlight-box" style="text-align:center;">
      <h3>📝 Your Feedback Matters</h3>
      <p style="margin-bottom:20px;">It takes less than 2 minutes. Help us improve!</p>
      <a href="${surveyLink}" class="btn-primary">Take the Survey</a>
    </div>

    <div class="divider"></div>

    <div class="signature">
      <div class="team-name">The Nile Flow Team</div>
      <div class="team-title">Elevating African commerce through technology</div>
    </div>
  `;
  return shell({ bodyContent: body, subject });
}

/**
 * Promotional / Sale Announcement
 */
function promotion({ subject, message, bannerUrl, ctaText, ctaLink, recipientName = 'there' }) {
  const body = `
    <div class="greeting">Hello ${recipientName} 🎉</div>

    ${formatMessage(message)}

    ${bannerUrl ? `
    <div style="text-align:center;margin:24px 0;">
      <img src="${bannerUrl}" alt="" style="max-width:100%;border-radius:12px;border:1px solid rgba(212,160,23,0.2);" />
    </div>` : ''}

    ${ctaText && ctaLink ? `
    <div style="text-align:center;margin:32px 0;">
      <a href="${ctaLink}" class="btn-primary">${ctaText}</a>
    </div>` : ''}

    <div class="divider"></div>

    <div class="signature">
      <div class="team-name">The Nile Flow Team</div>
      <div class="team-title">Elevating African commerce through technology</div>
    </div>
  `;
  return shell({ bodyContent: body, subject });
}

/**
 * Generic — catches all other types with a simple layout
 */
function generic({ subject, message, recipientName = 'there' }) {
  const body = `
    <div class="greeting">Hello ${recipientName}</div>

    ${formatMessage(message)}

    <div class="divider"></div>

    <div class="signature">
      <div class="team-name">The Nile Flow Team</div>
      <div class="team-title">Elevating African commerce through technology</div>
    </div>
  `;
  return shell({ bodyContent: body, subject });
}

/**
 * Render — picks the right template based on campaign type
 */
function render(type, payload) {
  switch (type) {
    case 'newsletter':
    case 'announcement':
      return newsletter(payload);
    case 'app_update':
      return appUpdate(payload);
    case 'survey':
      return survey(payload);
    case 'promotion':
    case 'promotional':
      return promotion(payload);
    default:
      return generic(payload);
  }
}

module.exports = {
  shell,
  newsletter,
  appUpdate,
  survey,
  promotion,
  generic,
  render,
  BRAND,
};

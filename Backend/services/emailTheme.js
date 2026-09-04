const EMAIL_THEME_CSS = `
  :root { color-scheme: light; }
  body { background: #f4f7f6 !important; color: #1f2937 !important; }
  .container { background: #ffffff !important; border: 1px solid #dce8e2 !important; box-shadow: 0 16px 40px rgba(20, 83, 45, 0.12) !important; }
  .header { background: linear-gradient(135deg, #14532d 0%, #16a34a 100%) !important; }
  .logo, .greeting, .team-name, .section-title { color: #14532d !important; }
  .content { background: #ffffff !important; }
  .section, .info-box, .order-table, .welcome-banner, .feature-card { background: #f8faf9 !important; border-color: #dce8e2 !important; }
  .section-title, .order-number span, .product-price, .highlight { color: #b45309 !important; }
  .section-content, .info-text, .thank-you, ul { color: #374151 !important; }
  .footer { background: #14532d !important; color: #d1fae5 !important; border-top-color: #16a34a !important; }
  .footer-link { color: #d1fae5 !important; }
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
    <div style="margin-top:12px;font-size:11px;color:#a7f3d0;">© ${new Date().getFullYear()} Nile Flow. All rights reserved.</div>
  </footer>
`;

async function sendBrandedEmail(resend, options) {
  const html = String(options.html || '')
    .replace(/<\/style>/i, `${EMAIL_THEME_CSS}</style>`)
    .replace(/<\/body>/i, `${EMAIL_FOOTER_HTML}</body>`);

  return resend.emails.send({ ...options, html });
}

module.exports = { EMAIL_THEME_CSS, sendBrandedEmail };

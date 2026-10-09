const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  addEmailCampaignTracking,
  applyEmailTheme,
  sendBrandedEmail,
} = require("./emailTheme");

test("applies the shared theme and replaces legacy footers", () => {
  const html = applyEmailTheme(`
    <!DOCTYPE html>
    <html>
      <head><style>.container { color: red; }</style></head>
      <body>
        <div class="container"><p>Order confirmed</p></div>
        <div class="footer"><a href="https://example.com/unsubscribe?email=a%40b.com">Unsubscribe</a></div>
        <table><tr class="email-legacy-footer"><td>Legacy copyright</td></tr></table>
      </body>
    </html>
  `);

  assert.equal((html.match(/<style data-nileflow-email-theme="true">/g) || []).length, 1);
  assert.equal((html.match(/<footer\b/gi) || []).length, 1);
  assert.doesNotMatch(html, /class="footer"/);
  assert.doesNotMatch(html, /Legacy copyright/);
  assert.match(html, /href="https:\/\/example\.com\/unsubscribe\?email=a%40b\.com"/);
  assert.match(html, /Order confirmed/);
});

test("wraps HTML fragments and remains idempotent", () => {
  const firstPass = applyEmailTheme("<h2>Order placed</h2><p>Thank you</p>");
  const secondPass = applyEmailTheme(firstPass);

  assert.match(firstPass, /<html lang="en">/);
  assert.match(firstPass, /<body><h2>Order placed<\/h2>/);
  assert.equal((secondPass.match(/<style data-nileflow-email-theme="true">/g) || []).length, 1);
  assert.equal((secondPass.match(/<footer\b/gi) || []).length, 1);
});

test("replaces newsletter template footers with the shared footer", () => {
  const emailTemplates = require("./nileFlowEmailTemplates");
  const original = emailTemplates.newsletter({
    subject: "Updates",
    message: "A marketplace update",
    recipientName: "Customer",
  }).replace(
    /{{unsubscribe_link}}/g,
    "https://example.com/unsubscribe?email=customer%40example.com",
  );
  const html = applyEmailTheme(original);

  assert.equal((html.match(/<footer\b/gi) || []).length, 1);
  assert.doesNotMatch(html, /class="email-footer"/);
  assert.match(html, /href="https:\/\/example\.com\/unsubscribe\?email=customer%40example\.com"/);
});

test("renders newsletter messages as escaped paragraphs with preserved line breaks", () => {
  const emailTemplates = require("./nileFlowEmailTemplates");
  const html = emailTemplates.newsletter({
    subject: "Updates",
    message: "First & <message>\ncontinued\n\nSecond paragraph.",
    recipientName: "Customer",
  });

  assert.match(
    html,
    /<p class="paragraph">First &amp; &lt;message&gt;<br \/>continued<\/p>/,
  );
  assert.match(html, /<p class="paragraph">Second paragraph\.<\/p>/);
  assert.doesNotMatch(html, /<message>/);
});

test("preserves paragraphs for every broadcast email template", () => {
  const emailTemplates = require("./nileFlowEmailTemplates");
  const templates = [
    emailTemplates.newsletter,
    emailTemplates.appUpdate,
    emailTemplates.survey,
    emailTemplates.promotion,
    emailTemplates.generic,
  ];

  for (const render of templates) {
    const html = render({
      subject: "Updates",
      message: "First paragraph.\n\nSecond paragraph.",
      features: [],
      surveyLink: "https://example.com/survey",
      recipientName: "Customer",
    });

    assert.match(html, /<p class="paragraph">First paragraph\.<\/p>/);
    assert.match(html, /<p class="paragraph">Second paragraph\.<\/p>/);
  }
});

test("sends the normalized HTML through the shared sender", async () => {
  let sentOptions;
  const resend = {
    emails: {
      send: async (options) => {
        sentOptions = options;
        return { id: "email-id" };
      },
    },
  };

  await sendBrandedEmail(resend, {
    to: "customer@example.com",
    subject: "Order update",
    html: "<p>Your order is on its way.</p>",
  });

  test("adds campaign tracking to branded links but preserves unsubscribe links", async () => {
    let sentOptions;
    const resend = {
      emails: {
        send: async (options) => {
          sentOptions = options;
          return { id: "email-id" };
        },
      },
    };

    await sendBrandedEmail(resend, {
      to: "customer@example.com",
      subject: "10.10",
      html: '<a href="https://example.com/shop?ref=campaign">Shop</a><a href="https://example.com/unsubscribe?email=a%40b.com">Unsubscribe</a>',
      emailCampaign: { source: "email", name: "nileflow1010" },
    });

    assert.match(sentOptions.html, /ref=campaign&amp;utm_source=email&amp;utm_campaign=nileflow1010/);
    assert.match(sentOptions.html, /href="https:\/\/example\.com\/unsubscribe\?email=a%40b\.com"/);
    assert.doesNotMatch(sentOptions.html, /unsubscribe[^"]*utm_source/i);
    assert.equal(sentOptions.emailCampaign, undefined);
  });

  test("campaign tracking works on already themed HTML", () => {
    const html = addEmailCampaignTracking(
      applyEmailTheme('<a href="https://example.com/shop">Shop</a>'),
      { source: "email", name: "nileflow1010" },
    );

    assert.match(html, /href="https:\/\/example\.com\/shop\?utm_source=email&amp;utm_campaign=nileflow1010"/);
    assert.match(html, /href="https:\/\/www\.facebook\.com\/profile\.php\?id=61580711948973&amp;utm_source=email&amp;utm_campaign=nileflow1010"/);
  });

  assert.match(sentOptions.html, /Your order is on its way/);
  assert.equal((sentOptions.html.match(/<footer\b/gi) || []).length, 1);
});

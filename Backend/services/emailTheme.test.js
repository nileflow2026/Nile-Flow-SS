const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
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

  assert.match(sentOptions.html, /Your order is on its way/);
  assert.equal((sentOptions.html.match(/<footer\b/gi) || []).length, 1);
});

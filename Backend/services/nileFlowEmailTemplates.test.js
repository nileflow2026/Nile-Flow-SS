const assert = require("node:assert/strict");
const { test } = require("node:test");
const { anniversaryNewsletter } = require("./nileFlowEmailTemplates");

test("renders the anniversary email without unconfirmed optional offers", () => {
  const html = anniversaryNewsletter({
    subject: "Nile Flow turns 1 today",
    shopUrl: "https://www.nileflowafrica.com/shop?ref=mail",
  });

  assert.match(html, /One year ago, it was just an idea/);
  assert.match(html, /One year ago today, Nile Flow was an idea/);
  assert.match(html, /utm_source=email&amp;utm_campaign=nileflow1010/);
  assert.equal((html.match(/class="btn-primary"/g) || []).length, 1);
  assert.doesNotMatch(html, /Double Nile Miles/);
  assert.doesNotMatch(html, /Meet the Ten/);
  assert.doesNotMatch(html, /Discovery Drop/);
  assert.doesNotMatch(html, /Live with the team/);
  assert.doesNotMatch(html, /Our first year, in numbers/);
  assert.match(html, /agreed to receive Nile Flow newsletter emails/);
});

test("renders only supplied confirmed sections and escapes admin content", () => {
  const html = anniversaryNewsletter({
    subject: "10.10",
    recipientName: "{{recipient_name}}",
    founderVideoUrl: "https://video.example/watch",
    doubleMilesEndsAt: "11:59 PM EAT",
    meetTenUrl: "https://nileflow.example/ten",
    discoveryDropDescription: "New & <special> finds",
    liveAt: "3:00 PM EAT",
    liveUrl: "https://nileflow.example/live",
    merchantsOnboarded: 10,
    ordersDelivered: 200,
    citiesReached: 3,
    whatsappUrl: "https://chat.whatsapp.com/example",
    playStoreUrl: "https://play.google.com/store/apps/details?id=nileflow",
    appStoreUrl: "https://apps.apple.com/app/nile-flow/id123",
    referralUrl: "https://nileflow.example/share",
  });

  assert.match(html, /Watch the video/);
  assert.match(html, /Ends 11:59 PM EAT/);
  assert.match(html, /Meet the Ten/);
  assert.match(html, /New &amp; &lt;special&gt; finds/);
  assert.doesNotMatch(html, /New & <special> finds/);
  assert.match(html, /3:00 PM EAT/);
  assert.match(html, /10<\/strong> Merchants onboarded/);
  assert.match(html, /Join the community/);
  assert.match(html, /Download on Google Play/);
  assert.match(html, /Download on the App Store/);
  assert.match(html, /Share Nile Flow/);
});

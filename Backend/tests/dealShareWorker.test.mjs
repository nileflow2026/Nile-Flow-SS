import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import worker from "../../CloudflareWorkers/deal-share-worker.mjs";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("proxies only the public deal share path to the configured Backend", async () => {
  let requestedUrl;
  let requestOptions;
  globalThis.fetch = async (url, options) => {
    requestedUrl = url.toString();
    requestOptions = options;
    return new Response("<html>preview</html>", {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  };

  const response = await worker.fetch(
    new Request("https://www.nileflowafrica.com/share/deal/deal%20id?ignored=value", {
      headers: {
        Accept: "text/html",
        Cookie: "session=private",
        Authorization: "Bearer private",
      },
    }),
    { BACKEND_ORIGIN: "https://backend.example.com" },
  );

  assert.equal(requestedUrl, "https://backend.example.com/api/v1/deal-shares/deal%20id");
  assert.deepEqual([...new Headers(requestOptions.headers).entries()], [["accept", "text/html"]]);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(await response.text(), "<html>preview</html>");
});

test("does not proxy other paths or unsupported methods", async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response();
  };

  const wrongPath = await worker.fetch(
    new Request("https://www.nileflowafrica.com/api/v1/health"),
    { BACKEND_ORIGIN: "https://backend.example.com" },
  );
  const wrongMethod = await worker.fetch(
    new Request("https://www.nileflowafrica.com/share/deal/deal-id", { method: "POST" }),
    { BACKEND_ORIGIN: "https://backend.example.com" },
  );

  assert.equal(wrongPath.status, 404);
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "GET");
  assert.equal(fetchCalled, false);
});

test("rejects invalid origins and upstream redirects without exposing the Backend host", async () => {
  const invalidOrigin = await worker.fetch(
    new Request("https://www.nileflowafrica.com/share/deal/deal-id"),
    { BACKEND_ORIGIN: "http://backend.example.com" },
  );
  globalThis.fetch = async () =>
    new Response(null, {
      status: 302,
      headers: { Location: "https://backend.example.com/login" },
    });

  const redirect = await worker.fetch(
    new Request("https://www.nileflowafrica.com/share/deal/deal-id"),
    { BACKEND_ORIGIN: "https://backend.example.com" },
  );

  assert.equal(invalidOrigin.status, 500);
  assert.equal(redirect.status, 502);
  assert.equal(redirect.headers.has("location"), false);
  assert.equal(await redirect.text(), "Deal preview is unavailable.");
});

const SHARE_PATH_PREFIX = "/share/deal/";
const SHARE_HOSTNAME = "www.nileflowafrica.com";

const responseWithNoStore = (body, status, headers = {}) =>
  new Response(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });

const resolveBackendOrigin = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("BACKEND_ORIGIN is not configured.");
  }

  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error("BACKEND_ORIGIN must be an HTTPS origin.");
  }

  return url.origin;
};

const createUpstreamUrl = (requestUrl, backendOrigin) => {
  const url = new URL(requestUrl);
  if (url.hostname !== SHARE_HOSTNAME || url.protocol !== "https:") {
    return null;
  }

  const match = url.pathname.match(/^\/share\/deal\/([^/]+)$/);
  if (!match) return null;

  let dealId;
  try {
    dealId = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  if (!dealId || dealId.includes("/") || dealId.includes("\\") || /[\u0000-\u001f]/.test(dealId)) {
    return null;
  }

  return new URL(
    `/api/v1/deal-shares/${encodeURIComponent(dealId)}`,
    backendOrigin,
  );
};

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    if (requestUrl.hostname !== SHARE_HOSTNAME || !requestUrl.pathname.startsWith(SHARE_PATH_PREFIX)) {
      return responseWithNoStore("Not found.", 404);
    }

    if (request.method !== "GET") {
      return responseWithNoStore("Method not allowed.", 405, { Allow: "GET" });
    }

    let backendOrigin;
    try {
      backendOrigin = resolveBackendOrigin(env.BACKEND_ORIGIN);
    } catch (error) {
      console.error("[deal-share-worker] Invalid Backend origin configuration.", {
        errorName: error.name,
      });
      return responseWithNoStore("Deal preview is unavailable.", 500);
    }

    const upstreamUrl = createUpstreamUrl(request.url, backendOrigin);
    if (!upstreamUrl) {
      return responseWithNoStore("Not found.", 404);
    }

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: "GET",
        headers: {
          Accept: request.headers.get("Accept") || "text/html",
        },
        redirect: "manual",
      });

      if ([301, 302, 303, 307, 308].includes(upstreamResponse.status)) {
        return responseWithNoStore("Deal preview is unavailable.", 502);
      }

      const headers = new Headers(upstreamResponse.headers);
      headers.set("Cache-Control", "no-store");
      headers.delete("Location");
      headers.delete("Set-Cookie");
      headers.delete("Server");
      headers.delete("Via");
      headers.delete("X-Powered-By");

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers,
      });
    } catch (error) {
      console.error("[deal-share-worker] Backend preview request failed.", {
        errorName: error.name,
      });
      return responseWithNoStore("Deal preview is unavailable.", 502);
    }
  },
};

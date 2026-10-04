function getCookieDomain(req) {
  const origin = req.get("origin") || req.get("referer");
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";

  console.log("[Cookie Domain Debug]", {
    origin,
    host,
    protocol,
    isSecure: protocol === "https",
  });

  const isCrossOrigin =
    origin &&
    host &&
    !origin.includes(host) &&
    !host.includes(origin.replace("https://", "").replace("http://", ""));

  if (isCrossOrigin) {
    console.log("[Cookie] Cross-origin detected - no domain restriction");
    return {
      domain: undefined,
      secure: protocol === "https",
      sameSite: "none",
    };
  }

  if (
    !origin ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    (host && host.includes("localhost"))
  ) {
    console.log("[Cookie] Using localhost - no domain restriction");
    return { domain: undefined, secure: false, sameSite: "lax" };
  }

  if (
    (origin && origin.includes("nileflowafrica.com")) ||
    (host && host.includes("nileflowafrica.com"))
  ) {
    console.log("[Cookie] Using nileflowafrica.com domain (same-origin)");
    return {
      domain: ".nileflowafrica.com",
      secure: protocol === "https",
      sameSite: "lax",
    };
  }

  if (
    (origin && origin.includes("nileflow.co.ke")) ||
    (host && host.includes("nileflow.co.ke"))
  ) {
    console.log("[Cookie] Using nileflow.co.ke domain (same-origin)");
    return {
      domain: ".nileflow.co.ke",
      secure: protocol === "https",
      sameSite: "lax",
    };
  }

  console.log("[Cookie] Using default - no domain restriction");
  return {
    domain: undefined,
    secure: protocol === "https",
    sameSite: "lax",
  };
}

function setCustomerSessionCookies(req, res, accessToken, refreshToken) {
  const cookieConfig = getCookieDomain(req);
  const cookieOptions = {
    httpOnly: true,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    path: "/",
  };

  if (cookieConfig.domain) {
    cookieOptions.domain = cookieConfig.domain;
  }

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

module.exports = { getCookieDomain, setCustomerSessionCookies };

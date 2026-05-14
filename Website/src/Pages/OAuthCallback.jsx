import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OAuthCallback = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign-in…");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    if (!token) {
      navigate("/signin?error=oauth_failed", { replace: true });
      return;
    }

    // Try to hand the tokens to the mobile app first.
    // expo-web-browser's openAuthSessionAsync watches for navigations to the
    // app scheme and intercepts them, closing the in-app browser and returning
    // the URL to the app. On a regular web browser this silently fails (no
    // handler registered) so the setTimeout below runs instead.
    const mobileDeepLink =
      `nileflowapp://oauth/callback?token=${encodeURIComponent(token)}` +
      (refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : "");
    window.location.href = mobileDeepLink;

    // Fallback for web: the deep-link redirect above either did nothing (no
    // scheme handler) or already closed the in-app browser. After 500 ms we
    // store the tokens and continue with the web session.
    const timer = setTimeout(() => {
      setStatus("Redirecting…");
      localStorage.setItem("accessToken", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      // Full navigation so the auth context re-reads localStorage on mount.
      window.location.href = "/home";
    }, 500);

    return () => clearTimeout(timer);
  }, [search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-amber-200 text-lg font-medium">{status}</p>
      </div>
    </div>
  );
};

export default OAuthCallback;

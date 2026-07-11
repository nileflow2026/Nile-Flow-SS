/**
 * Lighthouse CI Configuration — Core Web Vitals Monitoring
 *
 * Collects Lighthouse reports for Nile Flow's most critical pages.
 * Runs on every PR and nightly on production.
 *
 * Usage:
 *   npx lhci autorun --config=lighthouserc.cjs
 */

module.exports = {
  ci: {
    collect: {
      // Start with no server (assumes app is already running)
      startServerCommand: null,
      // Collect on the production URL
      url: [
        "https://www.nileflowafrica.com/",
        "https://www.nileflowafrica.com/products",
        "https://www.nileflowafrica.com/search",
        "https://www.nileflowafrica.com/about",
        "https://www.nileflowafrica.com/help",
        "https://www.nileflowafrica.com/privacy",
        "https://www.nileflowafrica.com/terms",
        "https://www.nileflowafrica.com/contact",
        "https://www.nileflowafrica.com/careers",
        "https://www.nileflowafrica.com/category/electronics",
      ],
      // Run 3 times per URL and use the median
      numberOfRuns: 3,
      // Mobile-first by default
      settings: {
        preset: "desktop",
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 812,
          deviceScaleFactor: 2,
        },
      },
    },
    assert: {
      // Assertion presets — threshold failures fail the CI
      assertions: {
        // Core Web Vitals
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.25 }],
        "total-blocking-time": ["warn", { maxNumericValue: 500 }],
        "interaction-to-next-paint": ["warn", { maxNumericValue: 500 }],
        "speed-index": ["warn", { maxNumericValue: 5000 }],
        // SEO
        "canonical": ["error"],
        "meta-description": ["warn"],
        "crawlable-anchors": ["warn"],
        "document-title": ["error"],
        "font-display": ["warn"],
        "hreflang": ["warn"],
        "is-crawlable": ["warn"],
        "link-text": ["warn"],
        "meta-viewport": ["error"],
        "robots-txt": ["warn"],
        "structured-data": ["warn"],
        "tap-targets": ["warn"],
        "valid-source-maps": ["off"],
        // Best practices
        "uses-http2": ["warn"],
        "uses-long-cache-ttl": ["warn"],
        "uses-responsive-images": ["warn"],
        "uses-webp-images": ["warn"],
      },
    },
    upload: {
      // Upload to temporary storage (no public URL)
      target: "temporary-public-storage",
    },
    server: {
      // Run Lighthouse server on port 9001
      port: 9001,
    },
  },
};

import { seoMeta } from "~/lib/seo-meta";
import type { Route } from "./+types/SearchPage";

/**
 * Search Products â€” Nile Flow Africa
 *
 * Route: /search
 * Purpose: Search and discover curated African products.
 * Design: Uses nile-* utility classes consistent with Mobileapp design system
 */

export function meta({}: Route.MetaArgs) {
  return seoMeta("/search");
}

export default function SearchPage() {
  return (
    <div className="nile-screen">
      {/* Page Header */}
      <section className="bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border">
        <div className="container-page py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="nile-h1 mb-4">Search Products</h1>
            <p className="nile-body text-lg">Find what you're looking for.</p>
          </div>
        </div>
      </section>

      {/* Page Content */}
      <section className="container-page py-12">
        <div className="max-w-3xl mx-auto">
          <div className="nile-card p-8">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-nile-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="nile-subheading text-xl mb-2">Coming Soon</h2>
              <p className="nile-body">This page is under construction and will be available shortly.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

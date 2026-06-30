import { seoMeta } from "~/lib/seo-meta";
import type { Route } from "./+types/ShopPage";

export function meta({}: Route.MetaArgs) {
  return seoMeta("/shop");
}

export default function ShopPage() {
  return (
    <div className="nile-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border">
        <div className="container-page py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="nile-h1 mb-4">Shop Authentic African Products</h1>
            <p className="nile-body text-lg">
              Browse curated African products, crafts, fashion, and premium collections
              from trusted vendors across the continent.
            </p>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container-page py-12">
        <div className="product-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <a
              key={i}
              href={`/products/${i + 1}`}
              className="nile-card overflow-hidden hover:shadow-elevated transition-shadow duration-200"
            >
              <div className="aspect-square bg-nile-surface flex items-center justify-center">
                <span className="text-nile-muted text-4xl font-bold">NF</span>
              </div>
              <div className="p-4">
                <span className="nile-badge-green inline-block mb-2">
                  <span className="nile-badge-text">African Product</span>
                </span>
                <h3 className="font-semibold text-nile-heading line-clamp-2">
                  Premium Product {i + 1}
                </h3>
                <p className="nile-gold-text text-lg mt-1">KES {(i + 1) * 500}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

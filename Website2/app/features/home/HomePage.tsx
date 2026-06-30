import { seoMeta } from "~/lib/seo-meta";
import type { Route } from "./+types/HomePage";

export function meta({}: Route.MetaArgs) {
  return seoMeta("/");
}

export default function HomePage() {
  return (
    <div className="nile-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-nile-green-900 via-nile-green-800 to-nile-green-700">
        <div className="container-page py-20 md:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-nile-gold-400 animate-pulse" />
              <span className="text-nile-green-100 text-sm font-medium">
                Premium African Marketplace
              </span>
            </div>
            <h1 className="text-white font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6">
              Discover Africa's
              <span className="text-nile-gold-400 block">Finest Treasures</span>
            </h1>
            <p className="text-nile-green-200 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Handpicked authentic products from across the continent,
              delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/shop" className="nile-btn bg-nile-gold-600 hover:bg-nile-gold-700 text-white text-lg px-8 py-4">
                Start Shopping
              </a>
              <a href="/premium" className="nile-btn-outline border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4">
                Go Premium
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-nile-border bg-nile-surface">
        <div className="container-page py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🚚", title: "Fast Delivery", desc: "Across Africa" },
              { icon: "🛡️", title: "Secure Payment", desc: "100% Protected" },
              { icon: "💬", title: "24/7 Support", desc: "Local Agents" },
              { icon: "⭐", title: "Premium Quality", desc: "Authentic Products" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-nile-border">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-nile-heading text-sm">{item.title}</p>
                  <p className="text-nile-muted text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <h2 className="nile-h2 mb-8 text-center">Shop by Category</h2>
        <div className="nile-grid">
          {["Fashion", "Art & Crafts", "Home & Living", "Jewelry", "Food & Spices", "Beauty"].map((cat) => (
            <a
              key={cat}
              href={`/categories/${cat.toLowerCase().replace(/\s+/g, "-")}`}
              className="nile-card p-6 text-center hover:border-nile-green-300 transition-colors duration-200"
            >
              <div className="w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-nile-green-600 font-bold text-xl">{cat[0]}</span>
              </div>
              <h3 className="font-semibold text-nile-heading">{cat}</h3>
              <p className="text-nile-muted text-sm mt-1">Explore {cat}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Premium CTA */}
      <section className="bg-gradient-to-r from-nile-gold-600 to-nile-gold-700">
        <div className="container-page py-16 text-center">
          <h2 className="text-white font-bold text-3xl md:text-4xl mb-4">
            Go Premium & Save Big
          </h2>
          <p className="text-yellow-100 text-lg mb-8 max-w-xl mx-auto">
            Free shipping, exclusive deals, and 10% back in Nile Miles on every purchase.
          </p>
          <a href="/premium" className="inline-flex items-center gap-2 bg-white text-nile-gold-700 font-bold px-8 py-4 rounded-xl hover:bg-yellow-50 transition-colors">
            Learn More
          </a>
        </div>
      </section>
    </div>
  );
}

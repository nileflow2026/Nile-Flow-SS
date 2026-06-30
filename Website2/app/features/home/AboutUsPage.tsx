import { seoMeta } from "~/lib/seo-meta";
import type { Route } from "./+types/AboutUsPage";

export function meta({}: Route.MetaArgs) {
  return seoMeta("/about");
}

export default function AboutUsPage() {
  return (
    <div className="nile-screen">
      <section className="bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border">
        <div className="container-page py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="nile-h1 mb-4">About Nile Flow Africa</h1>
            <p className="nile-body text-lg">
              Our mission is to digitize African commerce infrastructure and empower youth
              participation in the economy.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="nile-card p-8">
            <h2 className="nile-h3 mb-4">Our Story</h2>
            <p className="nile-body leading-relaxed">
              Nile Flow is a hyperlocal commerce ecosystem designed to connect local merchants
              and consumers through accessible, culturally adaptive digital commerce solutions.
              We are building the foundational digital infrastructure for African commerce.
            </p>
          </div>
          <div className="nile-card p-8">
            <h2 className="nile-h3 mb-4">Our Mission</h2>
            <p className="nile-body leading-relaxed">
              We exist to digitize African commerce, empower youth participation in the economy,
              build trust-centered digital commerce, create culturally adaptive technology,
              and scale South Sudanese innovation globally.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

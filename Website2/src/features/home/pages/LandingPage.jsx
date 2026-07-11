import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ProductCard from '@shared/ui/product-card/ProductCard'
import Button from '@shared/ui/button/Button'
import { productService } from '@api/services'
import { useAuth } from '@auth/AuthContext'
import { SeoHead } from '@shared/seo/SeoHead'
import HeroSection from '../components/HeroSection'
import MarketplaceSection from '../components/MarketplaceSection'
import WhyNileFlow from '../components/WhyNileFlow'
import AfricaMap from '../components/AfricaMap'
import CommunityImpact from '../components/CommunityImpact'
import MerchantSection from '../components/MerchantSection'
import AIAssistantSection from '../components/AIAssistantSection'
import NileVerseSection from '../components/NileVerseSection'
import TestimonialsSection from '../components/TestimonialsSection'

function LandingPage() {
  const { isAuthenticated, user } = useAuth()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true)
      try {
        const result = await productService.getProducts()
        setFeaturedProducts(result.products?.slice(0, 6) || [])
      } catch {
        setFeaturedProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadFeatured()
  }, [])

  return (
    <PageShell>
      <SeoHead
        title="Nile Flow | African Commerce & AI Marketplace"
        description="Discover authentic products, secure payments, and dependable delivery across Africa. Shop smarter with Nile Flow."
        keywords={['African marketplace', 'online shopping Africa', 'ecommerce Africa', 'AI commerce', 'Nile Flow']}
      />
      <HeroSection />
      <MarketplaceSection />
      <WhyNileFlow />

      {featuredProducts.length > 0 && (
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-surface-muted)_0%,var(--color-background)_100%)] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {isAuthenticated ? (
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
                  Welcome, {user?.name || user?.username || user?.email?.split('@')[0] || 'back'}!
                </p>
              ) : (
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
                  Featured
                </p>
              )}
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
                Trending <span className="text-emerald-600">Products</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
                Popular products our customers love right now.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="col-span-full flex items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 py-12 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    Loading products...
                  </div>
                </div>
              ) : (
                featuredProducts.map((product) => (
                  <ProductCard
                    key={product.$id || product.id}
                    product={product}
                    href={`/products/${product.$id || product.id}`}
                    compact
                  />
                ))
              )}
            </div>

            <div className="mt-8 text-center">
              <Link to="/products">
                <Button variant="outline" className="border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]">
                  View all products →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <AfricaMap />
      <CommunityImpact />
      <MerchantSection />
      <AIAssistantSection />
      <NileVerseSection />
      <TestimonialsSection />

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-amber-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to Join Africa's <span className="text-amber-400">Commerce Revolution</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-emerald-100/70 sm:text-lg">
            Whether you're shopping, selling, or building — Nile Flow is your platform for the future of African commerce.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/home"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-600/30 transition-all hover:bg-amber-600 hover:shadow-xl hover:scale-105"
            >
              Start Shopping
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/50"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

export default LandingPage

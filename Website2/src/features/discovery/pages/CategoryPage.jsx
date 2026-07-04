import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import ProductCard from '@shared/ui/product-card/ProductCard'
import Loader from '@shared/ui/loader/Loader'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import { productService } from '@api/services'

const CATEGORY_ICONS = {
  beverages: '☕',
  'home-living': '🧺',
  beauty: '🧴',
  accessories: '📿',
  groceries: '🍯',
  electronics: '🖥️',
  fashion: '👕',
}

function CategoryPage() {
  const { categorySlug } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const categoryName = categorySlug
    ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Category'
  const categoryIcon = CATEGORY_ICONS[categorySlug] || '📦'

  useEffect(() => {
    if (!categorySlug) return

    const loadCategoryProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        // Try lowercase; also try title-case if first attempt returns no results
        const result = await productService.getProducts({
          category: categorySlug,
        })
        // If no results using the slug directly, try searching
        if (result.products.length === 0) {
          const searchResult = await productService.getProducts({
            search: categoryName,
          })
          setProducts(searchResult.products)
        } else {
          setProducts(result.products)
        }
      } catch (err) {
        setError(err?.message || 'Failed to load category products.')
      } finally {
        setLoading(false)
      }
    }

    loadCategoryProducts()
  }, [categorySlug, categoryName])

  return (
    <PageShell>
      <div className="bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-[var(--color-accent)]/5 px-4 py-14 text-center sm:px-6 sm:py-20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-3xl sm:h-20 sm:w-20">
          {categoryIcon}
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
          {categoryName}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[var(--color-text-secondary)]">
          Browse products in {categoryName.toLowerCase()}
        </p>
      </div>

      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        {loading ? (
          <Loader label={`Loading ${categoryName} products…`} />
        ) : error ? (
          <EmptyState
            title="Failed to load products"
            description={error}
            icon="⚠️"
            action={<Link to="/products"><PrimaryButton>Browse all products</PrimaryButton></Link>}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description={`This category is being stocked. Check back soon or browse other categories.`}
            icon="📦"
            action={<Link to="/products"><PrimaryButton>Browse all products</PrimaryButton></Link>}
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
              {products.length} product{products.length > 1 ? 's' : ''} in {categoryName.toLowerCase()}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.$id || product.id}
                  product={product}
                  href={`/products/${product.$id || product.id}`}
                />
              ))}
            </div>
          </>
        )}
      </ResponsiveSection>
    </PageShell>
  )
}

export default CategoryPage

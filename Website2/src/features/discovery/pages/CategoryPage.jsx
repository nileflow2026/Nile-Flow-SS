import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import { SeoHead } from '@shared/seo/SeoHead'
import { SITE_CONFIG } from '@shared/seo/SeoConstants'
import { createCollectionPageSchema } from '@shared/seo/SchemaFactory'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import ProductCard from '@shared/ui/product-card/ProductCard'
import Loader from '@shared/ui/loader/Loader'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Breadcrumbs from '@shared/ui/breadcrumbs/Breadcrumbs'
import { productService, categoryService } from '@api/services'

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
  const { slug: categorySlug } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoryInfo, setCategoryInfo] = useState(null)

  const categoryName = categoryInfo?.name || (categorySlug
    ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Category')
  const breadcrumbItems = [
    { label: 'Products', href: '/products' },
    { label: categoryName },
  ]

  useEffect(() => {
    if (!categorySlug) return

    const loadCategoryProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        // 1. Resolve slug to category by fetching all and matching slug
        const allCategories = await categoryService.getCategories()
        const match = allCategories.find((c) => {
          const name = c.name || ''
          const cSlug = c.slug || name.toLowerCase().replace(/\s+/g, '-')
          return cSlug.toLowerCase() === categorySlug.toLowerCase()
        })

        if (match) {
          setCategoryInfo(match)
          const categoryId = match.$id || match.id
          // 2. Fetch products by the real category ID
          const result = await productService.getProducts({
            category: categoryId,
          })
          setProducts(result.products)
        } else {
          // Fallback: search by the slug-derived name
          setCategoryInfo({ name: categoryName })
          const result = await productService.getProducts({
            search: categoryName,
          })
          setProducts(result.products)
        }
      } catch (err) {
        setError(err?.message || 'Failed to load category products.')
      } finally {
        setLoading(false)
      }

    }

    loadCategoryProducts()
  }, [categorySlug])

  return (
    <PageShell>
      <SeoHead
        title={`${categoryName} Products`}
        description={`Browse ${categoryName.toLowerCase()} products on Nile Flow — African marketplace for quality goods.`}
        keywords={[categoryName, 'African marketplace', 'online shopping Africa']}
        breadcrumbs={breadcrumbItems}
        schema={createCollectionPageSchema({
          title: `${categoryName} Products`,
          description: `Browse ${categoryName.toLowerCase()} products on Nile Flow`,
          path: `/category/${categorySlug}`,
          numberOfItems: products.length,
        })}
      />

      <div className="responsive-shell pt-4 sm:pt-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="border-y border-emerald-100/80 bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 px-4 py-7 text-center sm:px-6 sm:py-9 dark:border-emerald-900/30 dark:from-emerald-950/10 dark:to-amber-950/10">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          {categoryName}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]">
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
              {products.map((product) => {
                const productId = product?.productId || product?.$id || product?.id
                return (
                  <ProductCard
                    key={productId}
                    product={product}
                    href={`/products/${productId}`}
                  />
                )
              })}
            </div>
          </>
        )}
      </ResponsiveSection>
    </PageShell>
  )
}

export default CategoryPage

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
import { imageProxyUrl } from '@api/config'

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
  const [categoryProducts, setCategoryProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [subcategoryLoading, setSubcategoryLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categoryInfo, setCategoryInfo] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [selectedSubcategory, setSelectedSubcategory] = useState('')

  const categoryName = categoryInfo?.name || (categorySlug
    ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Category')
  const selectedSubcategoryName = subcategories.find(
    (subcategory) => (subcategory.$id || subcategory.id) === selectedSubcategory,
  )?.name || 'this subcategory'
  const rawCategoryImage = categoryInfo?.img || categoryInfo?.image || categoryInfo?.imgUrl || categoryInfo?.imageUrl || ''
  const categoryImage = typeof rawCategoryImage === 'object'
    ? rawCategoryImage.url || rawCategoryImage.imageUrl || rawCategoryImage.href || ''
    : rawCategoryImage
  const categoryImageUrl = categoryImage && (
    categoryImage.includes('appwrite.io') || categoryImage.includes('/v1/storage/') || categoryImage.includes('/api/image-proxy?')
  )
    ? imageProxyUrl(categoryImage, 1400, 78)
    : categoryImage
  const categoryBackgroundImage = categoryImage
    ? `linear-gradient(rgba(6, 78, 59, 0.72), rgba(6, 78, 59, 0.64)), url("${categoryImageUrl}")`
    : undefined
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
        setSubcategories([])
        setSelectedSubcategory('')
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
          const [result, categorySubcategories] = await Promise.all([
            productService.getProducts({ category: categoryId }),
            categoryService.getSubcategories(categoryId).catch(() => []),
          ])
          setProducts(result.products)
          setCategoryProducts(result.products)
          setSubcategories(categorySubcategories)
        } else {
          // Fallback: search by the slug-derived name
          setCategoryInfo({ name: categoryName })
          const result = await productService.getProducts({
            search: categoryName,
          })
          setProducts(result.products)
          setCategoryProducts(result.products)
        }
      } catch (err) {
        setError(err?.message || 'Failed to load category products.')
      } finally {
        setLoading(false)
      }

    }

    loadCategoryProducts()
  }, [categorySlug])

  const handleSubcategorySelect = async (subcategoryId) => {
    setSelectedSubcategory(subcategoryId)
    setError(null)
    if (!subcategoryId) {
      setProducts(categoryProducts)
      return
    }

    setSubcategoryLoading(true)
    try {
      const subcategoryProducts = await productService.getSubcategoryProducts(subcategoryId)
      setProducts(subcategoryProducts)
    } catch (err) {
      setProducts([])
      setError(err?.message || 'Failed to load subcategory products.')
    } finally {
      setSubcategoryLoading(false)
    }
  }

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

      

      <div
        className="border-y border-emerald-100/80 bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 bg-cover bg-center px-4 py-12 text-center sm:px-6 sm:py-16 dark:border-emerald-900/30 dark:from-emerald-950/10 dark:to-amber-950/10"
        style={categoryBackgroundImage ? { backgroundImage: categoryBackgroundImage } : undefined}
      >
        <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${categoryBackgroundImage ? 'text-white drop-shadow-md' : 'text-[var(--color-text-primary)]'}`}>
          {categoryName}
        </h1>
        <p className={`mx-auto mt-2 max-w-lg text-sm leading-6 ${categoryBackgroundImage ? 'text-white/90' : 'text-[var(--color-text-secondary)]'}`}>
          Browse products in {categoryName.toLowerCase()}
        </p>
      </div>

      {subcategories.length > 0 && (
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
              Browse by subcategory
            </p>
            <div className="-mx-4 overflow-x-auto overflow-y-hidden scrollbar-none sm:mx-0 sm:overflow-visible">
              <div className="flex w-max gap-2 px-4 sm:w-auto sm:flex-wrap sm:px-0">
                <button
                  type="button"
                  onClick={() => handleSubcategorySelect('')}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer touch-manipulation ${
                    !selectedSubcategory
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-emerald-500 hover:text-emerald-600'
                  }`}
                >
                  All
                </button>
                {subcategories.map((subcategory) => {
                  const subcategoryId = subcategory.$id || subcategory.id
                  return (
                    <button
                      type="button"
                      key={subcategoryId}
                      onClick={() => handleSubcategorySelect(subcategoryId)}
                      disabled={subcategoryLoading}
                      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer touch-manipulation disabled:cursor-wait disabled:opacity-60 ${
                        selectedSubcategory === subcategoryId
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-emerald-500 hover:text-emerald-600'
                      }`}
                    >
                      {subcategory.name || subcategory.title}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        {loading || subcategoryLoading ? (
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
            title={selectedSubcategory ? 'No products found' : 'No products yet'}
            description={selectedSubcategory
              ? `There are no products in ${selectedSubcategoryName} yet.`
              : 'This category is being stocked. Check back soon or browse other categories.'}
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

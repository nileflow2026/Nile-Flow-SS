import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Input from '@shared/ui/input/Input'

const mockResults = [
  { id: 1, name: 'Nile Premium Coffee', price: 'KES 1,200', category: 'Beverages', image: '☕' },
  { id: 2, name: 'Handwoven Basket Set', price: 'KES 2,400', category: 'Home & Living', image: '🧺' },
  { id: 3, name: 'Organic Shea Butter', price: 'KES 850', category: 'Beauty', image: '🧴' },
  { id: 4, name: 'Maasai Beaded Bracelet', price: 'KES 450', category: 'Accessories', image: '📿' },
]

function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)

  const handleSearch = (event) => {
    event.preventDefault()
    setSearched(true)
    if (!query.trim()) {
      setResults([])
      return
    }
    const filtered = mockResults.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    )
    setResults(filtered)
  }

  return (
    <PageShell>
      <ResponsiveSection
        eyebrow="Search"
        title="Find what you need"
        description="Search across products, categories, and merchants on Nile Flow."
        className="py-10 sm:py-14 lg:py-16"
      >
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, categories…"
              aria-label="Search products"
            />
          </div>
          <PrimaryButton type="submit" className="shrink-0">Search</PrimaryButton>
        </form>

        <div className="mt-8">
          {searched && results.length === 0 && (
            <EmptyState
              title="No results found"
              description={`We couldn't find anything for "${query}". Try a different keyword or browse categories.`}
              action={<Link to="/products"><PrimaryButton>Browse all products</PrimaryButton></Link>}
            />
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">{results.length} result{results.length > 1 ? 's' : ''} found</p>
              {results.map((item) => (
                <Link key={item.id} to={`/products/${item.id}`} className="flex items-center gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] sm:p-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[var(--color-surface-muted)] text-2xl">
                    {item.image}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-base font-semibold text-[var(--color-text-primary)]">{item.name}</p>
                      <Badge variant="neutral">{item.category}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-accent)] font-semibold">{item.price}</p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-primary)]">View →</span>
                </Link>
              ))}
            </div>
          )}

          {!searched && (
            <div className="mt-4">
              <p className="text-sm text-[var(--color-text-muted)]">Popular: Coffee · Baskets · Shea Butter · Beaded Jewelry</p>
            </div>
          )}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default SearchPage

import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'

function NotFoundPage() {
  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-10 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">404</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Page not found</h1>
          <p className="mt-4 text-base leading-8 text-gray-600 dark:text-gray-400 sm:text-lg">
            The page you requested is unavailable. Return to the Nile Flow home page to continue exploring the marketplace.
          </p>
          <Link to="/" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700">
            Go to home
          </Link>
        </div>
      </section>
    </PageShell>
  )
}

export default NotFoundPage

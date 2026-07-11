import { motion } from 'framer-motion'
import {
  Store, Palette, Apple, Tv, Shirt, HeartPulse, BookOpen, Smartphone,
} from 'lucide-react'

const categories = [
  { icon: Store, label: 'Local Businesses', color: '#065F46', gradient: 'from-emerald-500 to-emerald-700' },
  { icon: Palette, label: 'Handcrafted Goods', color: '#D97706', gradient: 'from-amber-500 to-amber-700' },
  { icon: Apple, label: 'Fresh Produce', color: '#16A34A', gradient: 'from-green-500 to-green-700' },
  { icon: Tv, label: 'Electronics', color: '#2563EB', gradient: 'from-blue-500 to-blue-700' },
  { icon: Shirt, label: 'Fashion', color: '#9333EA', gradient: 'from-purple-500 to-purple-700' },
  { icon: HeartPulse, label: 'Health', color: '#DC2626', gradient: 'from-red-500 to-red-700' },
  { icon: BookOpen, label: 'Education', color: '#0D9488', gradient: 'from-teal-500 to-teal-700' },
  { icon: Smartphone, label: 'Digital Services', color: '#F59E0B', gradient: 'from-amber-400 to-orange-600' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function MarketplaceSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-surface-muted)_0%,var(--color-background)_100%)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
            African Marketplace
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
            Built Around <span className="text-emerald-600">African Communities</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Discover a marketplace that understands local needs — from bustling city markets to rural community shops.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6"
        >
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.label}
                variants={cardVariants}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 sm:p-6"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 transition-opacity group-hover:opacity-10`} />
                <div
                  className="inline-flex rounded-xl p-3 text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)] sm:text-base">
                  {cat.label}
                </h3>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

export default MarketplaceSection

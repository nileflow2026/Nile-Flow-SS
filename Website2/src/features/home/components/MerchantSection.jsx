import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Store, ArrowRight, TrendingUp, BarChart3, Users, CreditCard } from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Grow Your Sales',
    description: 'Reach thousands of customers across Africa with AI-powered product discovery.',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Real-time insights into your sales, customers, and inventory performance.',
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Join a network of African entrepreneurs sharing knowledge and growth.',
  },
  {
    icon: CreditCard,
    title: 'Easy Payments',
    description: 'Accept card, M-Pesa, and mobile money with instant settlement.',
  },
]

function MerchantSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
              For Merchants
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Empowering <span className="text-emerald-600 dark:text-emerald-400">African Entrepreneurs</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Whether you run a small shop in Juba, a farm in Nakuru, or a brand in Nairobi — 
              Nile Flow gives you the tools to sell online, reach new customers, and grow your business.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <div key={benefit.title} className="flex gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{benefit.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                <Store className="h-5 w-5" />
                Become a Merchant
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                Learn More
              </Link>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto aspect-[4/3] max-w-md">
              {/* Decorative card stack */}
              {[
                { rotation: -6, y: 0, color: 'from-emerald-500 to-emerald-600', label: 'Dashboard', icon: '📊' },
                { rotation: 3, y: 20, color: 'from-amber-500 to-amber-600', label: 'Analytics', icon: '📈' },
                { rotation: -2, y: 40, color: 'from-blue-500 to-blue-600', label: 'Payments', icon: '💳' },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} p-6 shadow-xl`}
                  style={{
                    transform: `rotate(${card.rotation}deg)`,
                    top: card.y,
                  }}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: card.y }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
                >
                  <div className="flex items-center gap-3 text-white">
                    <span className="text-2xl">{card.icon}</span>
                    <span className="text-lg font-semibold">{card.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default MerchantSection

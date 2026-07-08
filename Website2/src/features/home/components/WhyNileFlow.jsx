import { motion } from 'framer-motion'
import {
  Bot, MapPin, Shield, Gift, Zap, Mic, TrendingUp, Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'AI Shopping Assistant',
    description: 'Smart product discovery powered by AI that understands your preferences and local context.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Discovery',
    description: 'Find products and merchants in your neighborhood with location-aware search.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Trusted Payments',
    description: 'Secure payments via card, M-Pesa, or mobile money with end-to-end encryption.',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Gift,
    title: 'Nile Miles Rewards',
    description: 'Earn points on every purchase and unlock exclusive perks, discounts, and free delivery.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'Fast Delivery',
    description: 'Reliable last-mile delivery network across East Africa with real-time tracking.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Mic,
    title: 'Voice Commerce',
    description: 'Shop using your voice in English, Kiswahili, and more African languages.',
    gradient: 'from-red-500 to-rose-500',
  },
  {
    icon: TrendingUp,
    title: 'Merchant Growth',
    description: 'Tools and insights to help African businesses grow online and offline.',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Sparkles,
    title: 'Smart Recommendations',
    description: 'AI-curated product suggestions tailored to your taste and shopping habits.',
    gradient: 'from-amber-400 to-yellow-600',
  },
]

function WhyNileFlow() {
  return (
    <section className="relative overflow-hidden py-20 dark:bg-gray-950">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/10" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
            Why Nile Flow
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Built for <span className="text-emerald-600 dark:text-emerald-400">African Commerce</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
            Every feature is thoughtfully designed for the unique realities of African markets.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Gradient hover accent */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-5`} />

                <div className={`inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3 text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default WhyNileFlow

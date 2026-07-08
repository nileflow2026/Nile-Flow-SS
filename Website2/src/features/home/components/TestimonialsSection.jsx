import { motion } from 'framer-motion'
import { Shield, Lock, Truck, Cpu, BadgeCheck, ShieldCheck } from 'lucide-react'

const trustIndicators = [
  { icon: Shield, label: 'Secure Payments', description: '256-bit encrypted transactions' },
  { icon: Lock, label: 'Encrypted Platform', description: 'Your data is always protected' },
  { icon: Truck, label: 'Fast Delivery', description: 'Real-time tracking on every order' },
  { icon: Cpu, label: 'AI Powered', description: 'Smart recommendations and search' },
  { icon: BadgeCheck, label: 'Merchant Verified', description: 'Every seller is authenticated' },
  { icon: ShieldCheck, label: 'Customer Protection', description: 'Buy with confidence, always' },
]

const testimonials = [
  {
    name: 'Akinyi O.',
    role: 'Fashion Entrepreneur, Nairobi',
    quote: 'Nile Flow transformed my small boutique into a continental brand. I now ship to 12 African countries.',
    avatar: '👩🏾‍💼',
  },
  {
    name: 'James M.',
    role: 'Tech Student, Juba',
    quote: 'The AI assistant helped me find exactly what I needed. It understands local context like no other platform.',
    avatar: '👨🏿‍💻',
  },
  {
    name: 'Fatima H.',
    role: 'Small Business Owner, Dar es Salaam',
    quote: 'Finally, a platform built for African entrepreneurs. The payment system just works.',
    avatar: '👩🏾‍🌾',
  },
]

function TestimonialsSection() {
  return (
    <section className="overflow-hidden bg-white py-20 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
            Trust & Security
          </p>
          <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Built on <span className="text-emerald-600 dark:text-emerald-400">Trust</span>
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {trustIndicators.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex-shrink-0 rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20"
        >
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
            Testimonials
          </p>
          <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Voices of <span className="text-emerald-600 dark:text-emerald-400">Africa</span>
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900"
              >
                <div className="absolute right-4 top-4 text-4xl text-emerald-200/50 dark:text-emerald-800/50">"</div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-900/30">
                    {t.avatar}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  "{t.quote}"
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TestimonialsSection

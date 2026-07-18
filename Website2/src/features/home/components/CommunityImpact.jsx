import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, ShoppingCart, Globe, HeartHandshake } from 'lucide-react'

const stats = [
  { icon: Users, value: 10000, suffix: '+', label: 'Future Businesses Empowered', prefix: '' },
  { icon: ShoppingCart, value: 1000000, suffix: '+', label: 'Future Customers', prefix: '' },
  { icon: Globe, value: 3, suffix: '', label: 'African Countries Vision', prefix: '' },
  { icon: HeartHandshake, value: 5000, suffix: '+', label: 'Jobs Created', prefix: '' },
]

function AnimatedCounter({ value, duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const increment = Math.ceil(value / (60 * duration))
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, value, duration])

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K'
    return num.toString()
  }

  return <span ref={ref}>{formatNumber(count)}</span>
}

function CommunityImpact() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-amber-900 py-20">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `
          repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 22px)
        `,
      }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            Community Impact
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Building Africa's <span className="text-amber-400">Digital Economy</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-emerald-100/70 sm:text-lg">
            Every merchant, every customer, every transaction — we're empowering a generation.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
              >
                <div className="mx-auto inline-flex rounded-xl bg-amber-500/20 p-3 text-amber-400 backdrop-blur-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix}
                </p>
                <p className="mt-1 text-sm text-emerald-200/70">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default CommunityImpact

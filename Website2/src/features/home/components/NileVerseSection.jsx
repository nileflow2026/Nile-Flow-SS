import { motion } from 'framer-motion'
import { ShoppingBag, Wallet, GraduationCap, Heart, Zap } from 'lucide-react'

const products = [
  { icon: ShoppingBag, name: 'Nile Flow', tagline: 'Commerce OS', gradient: 'from-emerald-500 to-teal-500', x: 50, y: 25 },
  { icon: Wallet, name: 'Nile Pay', tagline: 'Payments', gradient: 'from-amber-500 to-orange-500', x: 20, y: 50 },
  { icon: GraduationCap, name: 'Nile Learn', tagline: 'Education', gradient: 'from-blue-500 to-indigo-500', x: 80, y: 50 },
  { icon: Heart, name: 'Nile Health', tagline: 'Health', gradient: 'from-rose-500 to-pink-500', x: 65, y: 70 },
]

function NileVerseSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-950 py-20">
      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            NileVerse Ecosystem
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            One Ecosystem. <span className="text-amber-400">Infinite Possibilities.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-emerald-100/70 sm:text-lg">
            Connected by shared AI infrastructure, NileVerse powers commerce, payments, education, and health across Africa.
          </p>
        </motion.div>

        <div className="relative mt-16">
          {/* Ecosystem ring */}
          <svg viewBox="0 0 400 400" className="mx-auto h-80 w-80 sm:h-96 sm:w-96">
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Outer ring */}
            <motion.circle
              cx="200" cy="200" r="160"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="1"
              strokeDasharray="8 8"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '200px 200px' }}
            />

            {/* Inner ring */}
            <motion.circle
              cx="200" cy="200" r="120"
              fill="none"
              stroke="#10B981"
              strokeWidth="0.5"
              strokeOpacity="0.15"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '200px 200px' }}
            />

            {/* Center hub */}
            <circle cx="200" cy="200" r="16" fill="#065F46" stroke="#10B981" strokeWidth="2" />
            <circle cx="200" cy="200" r="8" fill="#10B981" />

            {/* Hub label */}
            <text x="200" y="230" textAnchor="middle" fill="#10B981" fontSize="11" fontWeight="700" fontFamily="system-ui">
              AI CORE
            </text>

            {/* Connection lines */}
            {products.map((product) => {
              const angle = Math.atan2(product.y - 50, product.x - 50)
              const endX = 200 + 160 * Math.cos(angle)
              const endY = 200 + 160 * Math.sin(angle)
              return (
                <motion.line
                  key={product.name}
                  x1="200" y1="200" x2={endX} y2={endY}
                  stroke="#10B981"
                  strokeWidth="0.5"
                  strokeOpacity="0.2"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5 }}
                />
              )
            })}
          </svg>

          {/* Product cards surrounding */}
          {products.map((product, i) => {
            const Icon = product.icon
            const angle = (i * 360) / products.length - 90
            const radius = 56
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180)

            return (
              <motion.div
                key={product.name}
                className="absolute"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="group cursor-pointer">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${product.gradient} text-white shadow-lg transition-transform group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-center text-xs font-semibold text-white">{product.name}</p>
                  <p className="text-center text-[10px] text-emerald-300/60">{product.tagline}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default NileVerseSection

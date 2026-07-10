import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingBag, Store, Sparkles, ArrowRight } from 'lucide-react'

const floatingProductCards = [
  { emoji: '🛍️', label: 'Fashion', x: '15%', y: '20%', delay: 0 },
  { emoji: '📱', label: 'Tech', x: '75%', y: '15%', delay: 0.4 },
  { emoji: '🥑', label: 'Fresh', x: '80%', y: '60%', delay: 0.8 },
  { emoji: '🎨', label: 'Crafts', x: '10%', y: '65%', delay: 1.2 },
  { emoji: '💊', label: 'Health', x: '50%', y: '10%', delay: 1.6 },
  { emoji: '📚', label: 'Learn', x: '45%', y: '75%', delay: 2.0 },
]

function HeroSection() {
  const controls = useAnimation()
  const ref = useRef(null)

  useEffect(() => {
    controls.start('visible')
  }, [controls])

  return (
    <section ref={ref} className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-amber-950">
      {/* Animated flowing gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 50%, #065F46 0%, transparent 60%)',
            'radial-gradient(ellipse at 80% 50%, #D97706 0%, transparent 60%)',
            'radial-gradient(ellipse at 50% 20%, #1D4ED8 0%, transparent 60%)',
            'radial-gradient(ellipse at 20% 50%, #065F46 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* African geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 42px),
          repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 42px)
        `,
      }} />

      {/* Floating product cards */}
      {floatingProductCards.map((item, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-white text-xs font-medium"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [20, 0, -10, -30],
          }}
          transition={{
            duration: 4,
            delay: item.delay,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <span className="text-base">{item.emoji}</span>
          <span>{item.label}</span>
        </motion.div>
      ))}

      {/* River flow lines - animated via opacity rather than path morphing to avoid SVG interpolation errors */}
      <svg className="absolute bottom-0 left-0 right-0 h-32 opacity-20" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="heroRiverGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#FCD34D" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="heroRiverGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z" fill="none" stroke="url(#heroRiverGrad)" strokeWidth="2" opacity="0.4" />
        <motion.path
          d="M0,70 C240,110 480,30 720,70 C960,110 1200,30 1440,70 L1440,120 L0,120 Z"
          fill="none"
          stroke="url(#heroRiverGrad2)"
          strokeWidth="1.5"
          opacity="0.3"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>

      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-medium text-amber-300 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Built in Africa · Designed for Africa · Ready for the World
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          <span className="bg-gradient-to-r from-emerald-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent">
            Powering Africa's Next Generation
          </span>
          <br />
          <span className="text-white">of Commerce</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-emerald-100/80 sm:text-lg"
        >
          The AI-powered commerce ecosystem built for African merchants, communities, 
          and entrepreneurs. Shop smart, sell global, grow local.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            to="/products"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-600/30 transition-all hover:shadow-xl hover:shadow-amber-600/40 hover:scale-105 sm:w-auto"
          >
            <ShoppingBag className="h-5 w-5" />
            Start Shopping
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="https://vendor.nileflowafrica.com"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/50 sm:w-auto"
          >
            <Store className="h-5 w-5" />
            Become a Merchant
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          {[
            { label: 'AI-Powered', icon: '🤖' },
            { label: 'Secure Payments', icon: '🔒' },
            { label: 'Fast Delivery', icon: '⚡' },
            { label: '54 Countries', icon: '🌍' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-emerald-200/70">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default HeroSection

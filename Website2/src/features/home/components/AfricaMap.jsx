import { useState } from 'react'
import { motion } from 'framer-motion'

const regions = [
  { name: 'South Sudan', status: 'active', x: 50, y: 45, pulse: true },
  { name: 'East Africa', status: 'active', x: 52, y: 42, pulse: false },
  { name: 'West Africa', status: 'active', x: 35, y: 38, pulse: false },
  { name: 'North Africa', status: 'active', x: 45, y: 20, pulse: false },
  { name: 'Southern Africa', status: 'active', x: 48, y: 68, pulse: false },
  { name: 'Central Africa', status: 'active', x: 50, y: 48, pulse: false },
]

const connectionLines = [
  [50,45,52,42], [50,45,35,38], [50,45,45,20],
  [50,45,48,68], [50,45,50,48], [52,42,35,38],
  [35,38,45,20], [48,68,50,48],
]

function PulsingDot({ cx, cy }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#10B981" stroke="#10B981" strokeWidth="2" className="origin-center">
        <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={10} fill="none" stroke="#10B981" strokeWidth="2" opacity="0.6">
        <animate attributeName="r" values="10;25;10" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

function AfricaMap() {
  const [hoveredRegion, setHoveredRegion] = useState(null)

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-emerald-950 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Our Reach
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Connecting <span className="text-amber-400">Across Africa</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-emerald-100/70 sm:text-lg">
            From Juba to Johannesburg, Casablanca to Cape Town — we're building commerce infrastructure for every African.
          </p>
        </motion.div>

        <div className="relative mt-16">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-lg sm:aspect-[5/6] lg:aspect-[3/4]">
            <svg viewBox="0 0 400 500" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="continentGlow" cx="50%" cy="45%" r="45%">
                  <stop offset="0%" stopColor="#065F46" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#065F46" stopOpacity="0" />
                </radialGradient>
              </defs>

              <ellipse cx="200" cy="225" rx="150" ry="200" fill="url(#continentGlow)" stroke="#065F46" strokeWidth="2" strokeOpacity="0.3" />
              <ellipse cx="200" cy="225" rx="120" ry="170" fill="none" stroke="#10B981" strokeWidth="1" strokeOpacity="0.15" />

              {/* Animated connection lines */}
              {connectionLines.map((line, i) => (
                <motion.line
                  key={i}
                  x1={line[0] * 4}
                  y1={line[1] * 5}
                  x2={line[2] * 4}
                  y2={line[3] * 5}
                  stroke="#10B981"
                  strokeWidth="1"
                  strokeOpacity="0.2"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, delay: i * 0.15 }}
                />
              ))}

              {/* Region nodes - using native SVG animate to avoid framer-motion circle interpolation errors */}
              {regions.map((region, i) => (
                <g key={region.name}>
                  {region.pulse ? (
                    <PulsingDot cx={region.x * 4} cy={region.y * 5} />
                  ) : (
                    <circle
                      cx={region.x * 4}
                      cy={region.y * 5}
                      r={hoveredRegion === i ? 14 : 8}
                      fill="#065F46"
                      stroke="#10B981"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredRegion(i)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      className="cursor-pointer transition-all duration-300"
                    />
                  )}
                  {hoveredRegion === i && (
                    <>
                      <rect
                        x={region.x * 4 + 16}
                        y={region.y * 5 - 10}
                        width={region.name.length * 8 + 16}
                        height="22"
                        rx="11"
                        fill="#111827"
                        stroke="#10B981"
                      />
                      <text
                        x={region.x * 4 + 16 + 8}
                        y={region.y * 5 - 10 + 15}
                        fill="#10B981"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {region.name}
                      </text>
                    </>
                  )}
                </g>
              ))}
            </svg>

            {/* Region labels (desktop) */}
            <div className="absolute inset-0">
              {regions.map((region) => (
                <div
                  key={region.name}
                  className="absolute hidden lg:flex items-center gap-1.5"
                  style={{
                    left: `${region.x + (region.x < 45 ? -2 : 2)}%`,
                    top: `${region.y - 2}%`,
                    transform: region.x < 45 ? 'translateX(-100%)' : 'translateX(0)',
                  }}
                >
                  {region.status === 'active' && (
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  )}
                  <span className="text-xs font-medium text-emerald-300/70">{region.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AfricaMap

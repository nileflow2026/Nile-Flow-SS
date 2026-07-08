import { motion } from 'framer-motion'
import { Bot, Mic, MessageCircle, Sparkles } from 'lucide-react'

const messages = [
  { role: 'user', text: 'Find me fresh produce in Juba', delay: 0 },
  { role: 'assistant', text: 'I found 12 local farmers near you. Top pick: Mama Sarah\'s Organic Farm — 2.5km away 🥬', delay: 0.8 },
  { role: 'user', text: 'Recommend something for dinner', delay: 1.6 },
  { role: 'assistant', text: 'How about Nile Perch with ugali? Available from 3 vendors. Starting at 2,500 KSh 🐟', delay: 2.4 },
]

function AIAssistantSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Chat UI */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Chat window */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 dark:border-gray-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Nile AI Assistant</p>
                  <p className="text-xs text-emerald-100">Online · Powered by AI</p>
                </div>
                <Mic className="h-4 w-4 text-white/70" />
              </div>

              {/* Messages */}
              <div className="space-y-4 p-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: msg.delay }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'rounded-br-md bg-emerald-600 text-white'
                          : 'rounded-bl-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 p-3 dark:border-gray-800">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                  <input
                    type="text"
                    placeholder="Ask Nile AI anything..."
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
                    readOnly
                  />
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Floating sparkle */}
            <motion.div
              className="absolute -right-4 -top-4 text-amber-400"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
              AI Assistant
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Your <span className="text-emerald-600 dark:text-emerald-400">Conversational</span> Shopping Companion
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Meet Nile AI — your personal shopping assistant that understands your needs, language, and local context. 
              Search by voice, get smart recommendations, and discover products naturally.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: MessageCircle, text: 'Natural language search — "Find me affordable school shoes"' },
                { icon: Mic, text: 'Voice commerce in English, Kiswahili, and more' },
                { icon: Sparkles, text: 'AI-curated recommendations based on your preferences' },
                { icon: Bot, text: '24/7 customer support with context-aware responses' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.text}</p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default AIAssistantSection

import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import Button from '@shared/ui/button/Button'

const mockGroupBuys = [
  { id: 1, name: 'Nile Premium Coffee (5kg)', target: 20, current: 14, price: 'KES 980/kg', fullPrice: 'KES 1,200/kg', image: '☕', ends: '2 days', savings: '18%' },
  { id: 2, name: 'Handwoven Basket Set (6pc)', target: 15, current: 11, price: 'KES 2,000/set', fullPrice: 'KES 2,400/set', image: '🧺', ends: '4 days', savings: '17%' },
  { id: 3, name: 'Organic Shea Butter (12pc)', target: 25, current: 18, price: 'KES 700/pc', fullPrice: 'KES 850/pc', image: '🧴', ends: '6 days', savings: '18%' },
]

function GroupBuyPage() {
  return (
    <PageShell>
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/30 via-amber-50/30 to-transparent px-4 py-14 text-center sm:px-6 sm:py-20 dark:from-emerald-950/10 dark:via-amber-950/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Group buying</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Buy together, save more</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-gray-600 dark:text-gray-400">
          Team up with other shoppers to unlock lower prices. The more people join, the less everyone pays.
        </p>
        <PrimaryButton className="mt-6">Start a group buy</PrimaryButton>
      </div>

      <ResponsiveSection eyebrow="Active group buys" title="Join an existing group" description="Find a product you love and join a group that's already forming." className="py-10 sm:py-14 lg:py-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockGroupBuys.map((gb) => {
            const progress = Math.round((gb.current / gb.target) * 100)
            return (
              <div key={gb.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-gray-100 text-2xl dark:bg-gray-800">{gb.image}</div>
                <p className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{gb.name}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Group price</span><span className="font-semibold text-amber-600 dark:text-amber-400">{gb.price}</span></div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Regular</span><span className="line-through">{gb.fullPrice}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Savings</span><Badge variant="warning">{gb.savings}</Badge></div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>{gb.current}/{gb.target} joined</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-500">Ends in {gb.ends}</span>
                  <Button variant="primary" className="text-xs">Join group</Button>
                </div>
              </div>
            )
          })}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default GroupBuyPage

'use client'

import ClaimButton from './ClaimButton'

interface WantlistItem {
  id: string
  item: string
  added_by: string | null
  price_estimate: number | null
  price_low: number | null
  price_high: number | null
  link: string | null
  category: string | null
  priority: number | null
  image_url: string | null
  notes: string | null
  claimed_by: string | null
}

interface Props {
  item: WantlistItem
  currentUser: string | null
  isOwnList: boolean
}

const categoryColors: Record<string, string> = {
  Beauty: 'bg-pink-100 text-pink-700',
  Fashion: 'bg-purple-100 text-purple-700',
  Experience: 'bg-amber-100 text-amber-700',
  Tech: 'bg-blue-100 text-blue-700',
  Books: 'bg-emerald-100 text-emerald-700',
  Other: 'bg-surface-hover text-foreground/70',
}

export default function GiftCard({ item, currentUser, isOwnList }: Props) {
  const hearts = item.priority || 1

  const priceDisplay = (() => {
    if (item.price_low && item.price_high) return `$${item.price_low} - $${item.price_high}`
    if (item.price_estimate) return `~$${item.price_estimate}`
    return null
  })()

  const catColor = categoryColors[item.category || 'Other'] || categoryColors.Other

  return (
    <div className="relative group rounded-2xl bg-surface border border-border shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-rose-200 transition-all duration-300 overflow-hidden animate-stagger-in">
      {/* Ribbon decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
        <div className="absolute top-2 right-[-20px] w-[80px] h-[20px] bg-gradient-to-r from-rose-400 to-pink-400 rotate-45 shadow-sm" />
      </div>
      {/* Ribbon side accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-300 via-pink-300 to-rose-400" />

      <div className="p-5 pl-5">
        {/* Image */}
        {item.image_url && (
          <div className="mb-3 rounded-lg overflow-hidden bg-surface-hover h-40 flex items-center justify-center">
            <img
              src={item.image_url}
              alt={item.item}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <h3 className="font-semibold text-foreground flex-1 leading-snug">{item.item}</h3>
          <div className="flex gap-0.5 shrink-0">
            {[1, 2, 3, 4, 5].map((h) => (
              <span
                key={h}
                className={`text-sm transition-colors duration-200 ${h <= hearts ? 'text-rose-400' : 'text-zinc-200 group-hover:text-rose-200'}`}
              >
                {'\u2665'}
              </span>
            ))}
          </div>
        </div>

        {/* Category badge */}
        {item.category && (
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${catColor}`}>
            {item.category}
          </span>
        )}

        {/* Price */}
        {priceDisplay && (
          <p className="text-sm text-muted mb-2">{priceDisplay}</p>
        )}

        {/* Notes */}
        {item.notes && (
          <p className="text-xs text-muted mb-3 line-clamp-2">{item.notes}</p>
        )}

        {/* Link */}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-rose-500 hover:text-rose-600 hover:translate-x-0.5 font-medium mb-3 transition-all duration-200"
          >
            View item &rarr;
          </a>
        )}

        {/* Claim button — only on "Their List" view */}
        {!isOwnList && (
          <div className="mt-2">
            <ClaimButton
              itemId={item.id}
              claimedBy={item.claimed_by}
              currentUser={currentUser}
            />
          </div>
        )}
      </div>
    </div>
  )
}

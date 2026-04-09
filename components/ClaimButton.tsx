'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  itemId: string
  claimedBy: string | null
  currentUser: string | null
}

export default function ClaimButton({ itemId, claimedBy, currentUser }: Props) {
  const [loading, setLoading] = useState(false)
  const isClaimed = !!claimedBy
  const isClaimedByMe = claimedBy === currentUser

  const handleClaim = async () => {
    if (!currentUser) return
    setLoading(true)
    const { data } = await supabase
      .from('wantlist')
      .update({ claimed_by: currentUser })
      .eq('id', itemId)
      .is('claimed_by', null)
      .select()
    setLoading(false)
    if (!data || data.length === 0) {
      alert('This item was already claimed!')
    }
  }

  const handleUnclaim = async () => {
    setLoading(true)
    await supabase
      .from('wantlist')
      .update({ claimed_by: null })
      .eq('id', itemId)
    setLoading(false)
  }

  if (isClaimedByMe) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          You&apos;re getting this for them
        </p>
        <button
          onClick={handleUnclaim}
          disabled={loading}
          className="text-xs text-muted hover:text-foreground/70 transition"
        >
          {loading ? '...' : 'Unclaim'}
        </button>
      </div>
    )
  }

  if (isClaimed) {
    return null // Someone else claimed it — don't show anything
  }

  return (
    <button
      onClick={handleClaim}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-rose-400 to-pink-500 text-white hover:from-rose-500 hover:to-pink-600 shadow-sm transition disabled:opacity-50"
    >
      {loading ? '...' : 'Claim this gift'}
    </button>
  )
}

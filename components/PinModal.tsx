'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/components/UserContext'

interface Props {
  open: boolean
  onClose: () => void
  locationId: string
}

const categories = ['food', 'activity', 'stay', 'other'] as const

const categoryLabels: Record<string, string> = {
  food: 'Food',
  activity: 'Activity',
  stay: 'Stay',
  other: 'Other',
}

export default function PinModal({ open, onClose, locationId }: Props) {
  const { currentUser } = useUser()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<string>('food')
  const [notes, setNotes] = useState('')
  const [link, setLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)

    let lat: number | null = null
    let lng: number | null = null

    if (address.trim()) {
      setGeocoding(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address.trim())}&format=json&limit=1`,
          { headers: { 'User-Agent': 'FutureDocApp/1.0' } }
        )
        const results = await res.json()
        if (results && results.length > 0) {
          lat = parseFloat(results[0].lat)
          lng = parseFloat(results[0].lon)
        }
      } catch {
        // geocoding failed, save without coords
      }
      setGeocoding(false)
    }

    const { error } = await supabase.from('travel_pins').insert({
      location_id: locationId,
      name: name.trim(),
      address: address.trim() || null,
      lat,
      lng,
      category,
      notes: notes.trim() || null,
      link: link.trim() && /^https?:\/\//i.test(link.trim()) ? link.trim() : null,
      created_by: currentUser,
    })

    setSaving(false)
    if (!error) {
      setName('')
      setAddress('')
      setCategory('food')
      setNotes('')
      setLink('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-overlay-in">
      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4 max-h-[90vh] overflow-y-auto animate-modal-in"
      >
        <h2 className="text-xl font-bold text-foreground">Add Pin</h2>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-400 outline-none"
            placeholder="e.g. Ichiran Ramen"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-400 outline-none"
            placeholder="Will auto-geocode to get coordinates"
          />
          {geocoding && (
            <p className="text-xs text-emerald-600 mt-1">Geocoding address...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Category</label>
          <div className="flex gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] focus:outline-none ${
                  category === c
                    ? c === 'food' ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-400'
                    : c === 'activity' ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-400'
                    : c === 'stay' ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                    : 'bg-zinc-200 text-foreground/80 ring-2 ring-zinc-400'
                    : 'bg-surface-hover text-muted hover:bg-zinc-200'
                }`}
              >
                {categoryLabels[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-400 outline-none resize-none"
            rows={2}
            placeholder="Any notes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Link</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-400 outline-none"
            placeholder="https://..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground/70 hover:bg-surface-hover active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || geocoding}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 hover:shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          >
            {saving ? 'Saving...' : 'Add Pin'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/components/UserContext'

interface Props {
  open: boolean
  onClose: () => void
}

const categories = ['Beauty', 'Fashion', 'Experience', 'Tech', 'Books', 'Other']

export default function AddGiftModal({ open, onClose }: Props) {
  const { currentUser } = useUser()
  const [item, setItem] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [priceLow, setPriceLow] = useState('')
  const [priceHigh, setPriceHigh] = useState('')
  const [link, setLink] = useState('')
  const [category, setCategory] = useState('Other')
  const [priority, setPriority] = useState(1)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.trim() || !currentUser) return
    setSaving(true)

    const { error } = await supabase.from('wantlist').insert({
      item: item.trim(),
      added_by: currentUser,
      created_by: currentUser,
      image_url: imageUrl.trim() && /^https?:\/\//i.test(imageUrl.trim()) ? imageUrl.trim() : null,
      price_low: priceLow ? parseFloat(priceLow) : null,
      price_high: priceHigh ? parseFloat(priceHigh) : null,
      price_estimate: priceLow && priceHigh
        ? (parseFloat(priceLow) + parseFloat(priceHigh)) / 2
        : priceLow ? parseFloat(priceLow) : null,
      link: link.trim() && /^https?:\/\//i.test(link.trim()) ? link.trim() : null,
      category,
      priority,
      notes: notes.trim() || null,
    })

    setSaving(false)
    if (error) {
      alert('Failed to add item. Please try again.')
      return
    }
    setItem('')
    setImageUrl('')
    setPriceLow('')
    setPriceHigh('')
    setLink('')
    setCategory('Other')
    setPriority(1)
    setNotes('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold text-foreground">Add to Your Wishlist</h2>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Item Name</label>
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-rose-400 outline-none"
            placeholder="e.g. Dyson Airwrap"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Image URL (optional)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-rose-400 outline-none"
            placeholder="https://..."
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground/70 mb-1">Price Low</label>
            <input
              type="number"
              value={priceLow}
              onChange={(e) => setPriceLow(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="$"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground/70 mb-1">Price High</label>
            <input
              type="number"
              value={priceHigh}
              onChange={(e) => setPriceHigh(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="$"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Link (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-rose-400 outline-none"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-rose-400 outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Priority</label>
          <div className="flex gap-2">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className="flex gap-0.5"
              >
                {[1, 2, 3].map((h) => (
                  <span
                    key={h}
                    className={`text-lg ${h <= p ? 'text-rose-400' : 'text-zinc-200'}`}
                  >
                    {'\u2665'}
                  </span>
                ))}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-rose-400 outline-none resize-none"
            rows={2}
            placeholder="Size, color preference, etc."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground/70 hover:bg-surface-hover/50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-400 to-pink-500 text-white font-medium hover:from-rose-500 hover:to-pink-600 transition disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  )
}

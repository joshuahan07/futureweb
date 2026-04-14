'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/components/UserContext'

interface Props {
  open: boolean
  onClose: () => void
  onAdded: (locationId: string) => void
}

const regions = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Other'] as const

export default function AddLocationModal({ open, onClose, onAdded }: Props) {
  const { currentUser } = useUser()
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState<string>('North America')
  const [status, setStatus] = useState<string>('future')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('travel_locations')
      .insert({
        name: name.trim(),
        country: country.trim(),
        region,
        status,
        created_by: currentUser,
      })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setName('')
      setCountry('')
      setRegion('North America')
      setStatus('future')
      onAdded(data.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-xl animate-overlay-in">
      <form
        onSubmit={handleSubmit}
        className="glass-strong rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4 animate-modal-in"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Add Travel Location</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">✕</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-400 outline-none"
            placeholder="e.g. Tokyo"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Country</label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-400 outline-none"
            placeholder="e.g. Japan"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-400 outline-none"
          >
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-400 outline-none"
          >
            <option value="future">Future</option>
            <option value="visited">Visited</option>
          </select>
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
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 hover:shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          >
            {saving ? 'Adding...' : 'Add Location'}
          </button>
        </div>
      </form>
    </div>
  )
}

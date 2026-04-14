'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useRealtimeSync } from '@/lib/realtime'
import { seedIfEmpty } from '@/lib/seed'
import { useUser } from '@/components/UserContext'
import Layout from '@/components/Layout'
import LocationCard from '@/components/LocationCard'
import AddLocationModal from '@/components/AddLocationModal'
import PinModal from '@/components/PinModal'

const TravelMap = dynamic(() => import('@/components/TravelMap'), { ssr: false })

interface TravelLocation {
  id: string
  name: string
  country: string | null
  region: string
  status: string
}

interface TravelPin {
  id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  category: string
  notes: string | null
  link: string | null
  location_id: string
}

const SEED_LOCATIONS = [
  { name: 'New York City', country: 'United States', region: 'North America', status: 'future' },
  { name: 'Canada', country: 'Canada', region: 'North America', status: 'future' },
  { name: 'Seoul', country: 'South Korea', region: 'Asia', status: 'future' },
  { name: 'Tokyo', country: 'Japan', region: 'Asia', status: 'future' },
  { name: 'Kyoto', country: 'Japan', region: 'Asia', status: 'future' },
  { name: 'Singapore', country: 'Singapore', region: 'Asia', status: 'future' },
  { name: 'Helsinki', country: 'Finland', region: 'Europe', status: 'future' },
]

const SEED_PINS = [
  { name: 'Glanta Kyoto Sanjo Kawaramachi (ring making)', locationName: 'Kyoto' },
  { name: 'Glanta Kyoto Ninenzaka (ring making)', locationName: 'Kyoto' },
]

const regionOrder = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Other']

export default function TravelPage() {
  const { currentUser } = useUser()
  const [locations, setLocations] = useState<TravelLocation[]>([])
  const [pins, setPins] = useState<TravelPin[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [showAddPin, setShowAddPin] = useState(false)
  const [addPinLocationId, setAddPinLocationId] = useState<string | null>(null)
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null)
  const [fitBounds, setFitBounds] = useState<[number, number][] | null>(null)
  const [loaded, setLoaded] = useState(false)

  const fetchLocations = useCallback(async () => {
    const { data } = await supabase
      .from('travel_locations')
      .select('*')
      .order('region')
      .order('country')
      .order('name')
    if (data) setLocations(data)
    return data
  }, [])

  const fetchPins = useCallback(async () => {
    const { data } = await supabase.from('travel_pins').select('*')
    if (data) setPins(data)
  }, [])

  const fetchAll = useCallback(async () => {
    const locs = await fetchLocations()
    await fetchPins()
    return locs
  }, [fetchLocations, fetchPins])

  // Seed locations if empty
  useEffect(() => {
    async function init() {
      await seedIfEmpty('travel_locations', SEED_LOCATIONS.map((l) => ({ ...l, created_by: 'joshua' })))
      const locs = await fetchAll()
      // Seed Kyoto pins if no pins exist
      if (locs && locs.length > 0) {
        const { count } = await supabase.from('travel_pins').select('*', { count: 'exact', head: true })
        if (count === 0) {
          const kyoto = locs.find((l: { name: string }) => l.name === 'Kyoto')
          if (kyoto) {
            await supabase.from('travel_pins').insert(
              SEED_PINS.map((p) => ({ location_id: kyoto.id, name: p.name, category: 'activity', created_by: 'joshua' }))
            )
            await fetchPins()
          }
        }
      }
      setLoaded(true)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useRealtimeSync('travel_locations', fetchLocations)
  useRealtimeSync('travel_pins', fetchPins)

  // Group locations by region then country
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, TravelLocation[]>> = {}
    for (const loc of locations) {
      const r = loc.region || 'Other'
      if (!map[r]) map[r] = {}
      const c = loc.country || 'Unknown'
      if (!map[r][c]) map[r][c] = []
      map[r][c].push(loc)
    }
    return map
  }, [locations])

  const pinsForLocation = useCallback(
    (locationId: string) => pins.filter((p) => p.location_id === locationId),
    [pins]
  )

  const handleSelectLocation = (loc: TravelLocation) => {
    const isDeselect = selectedId === loc.id
    setSelectedId(isDeselect ? null : loc.id)
    if (!isDeselect) {
      const locPins = pinsForLocation(loc.id)
      const validPins = locPins.filter((p) => p.lat != null && p.lng != null)
      if (validPins.length > 0) {
        setFitBounds(validPins.map((p) => [p.lat!, p.lng!]))
        setFlyTo(null)
      }
    }
  }

  const handlePanToPin = (lat: number, lng: number) => {
    setFlyTo({ lat, lng, zoom: 16 })
    setFitBounds(null)
  }

  const handleAddPin = (locationId: string) => {
    setAddPinLocationId(locationId)
    setShowAddPin(true)
  }

  const handleLocationAdded = (locationId: string) => {
    setSelectedId(locationId)
    setAddPinLocationId(locationId)
    setShowAddPin(true)
  }

  // Edit / delete handlers
  const [editingLocation, setEditingLocation] = useState<TravelLocation | null>(null)
  const [editName, setEditName] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editStatus, setEditStatus] = useState('')

  const handleEditLocation = (loc: TravelLocation) => {
    setEditingLocation(loc)
    setEditName(loc.name)
    setEditCountry(loc.country || '')
    setEditRegion(loc.region)
    setEditStatus(loc.status)
  }

  const handleSaveEdit = async () => {
    if (!editingLocation || !editName.trim()) return
    await supabase.from('travel_locations').update({
      name: editName.trim(),
      country: editCountry.trim() || null,
      region: editRegion,
      status: editStatus,
    }).eq('id', editingLocation.id)
    setEditingLocation(null)
    await fetchLocations()
  }

  const handleDeleteLocation = async (id: string) => {
    await supabase.from('travel_locations').delete().eq('id', id)
    if (selectedId === id) setSelectedId(null)
    await fetchLocations()
    await fetchPins()
  }

  const handleDeletePin = async (id: string) => {
    await supabase.from('travel_pins').delete().eq('id', id)
    await fetchPins()
  }

  const REGIONS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Other']

  if (!loaded) {
    return (
      <Layout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-4">
          <div className="lg:w-[40%] space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-shimmer rounded-xl h-16" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <div className="lg:w-[60%] h-[400px] lg:h-[600px] animate-shimmer rounded-xl" />
        </div>
      </div>
      </Layout>
    )
  }

  return (
    <Layout>
    <div className="min-h-screen rounded-xl -mx-4 -mt-6 px-4 pt-6">
      <div className="flex justify-end px-4 py-2">
        <button onClick={() => setShowAddLocation(true)}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm">
          + Add Location
        </button>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-4 h-[calc(100vh-80px)]">
        {/* Left panel — Location list */}
        <div className="lg:w-[40%] overflow-y-auto scroll-smooth space-y-4 pr-1 pt-1">
          {regionOrder.map((region) => {
            const countries = grouped[region]
            if (!countries) return null
            return (
              <div key={region}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-2 px-1">
                  {region}
                </h2>
                {Object.entries(countries)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([country, locs]) => (
                    <div key={country} className="mb-3">
                      <h3 className="text-sm font-semibold text-foreground/70 mb-1.5 px-1">
                        {country}
                      </h3>
                      <div className="space-y-2">
                        {locs.map((loc, locIdx) => (
                          <LocationCard
                            key={loc.id}
                            location={loc}
                            pins={pinsForLocation(loc.id)}
                            isSelected={selectedId === loc.id}
                            onSelect={() => handleSelectLocation(loc)}
                            onPanToPin={handlePanToPin}
                            onAddPin={() => handleAddPin(loc.id)}
                            onEditLocation={handleEditLocation}
                            onDeleteLocation={handleDeleteLocation}
                            onDeletePin={handleDeletePin}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )
          })}
        </div>

        {/* Right panel — Map */}
        <div className="lg:w-[60%] h-[400px] lg:h-full rounded-xl overflow-hidden shadow-lg border border-border">
          <TravelMap pins={pins} flyTo={flyTo} fitBounds={fitBounds} />
        </div>
      </div>

      {/* Modals */}
      <AddLocationModal
        open={showAddLocation}
        onClose={() => setShowAddLocation(false)}
        onAdded={handleLocationAdded}
      />
      {addPinLocationId && (
        <PinModal
          open={showAddPin}
          onClose={() => {
            setShowAddPin(false)
            setAddPinLocationId(null)
          }}
          locationId={addPinLocationId}
        />
      )}

      {/* Edit location modal */}
      {editingLocation && (
        <div data-modal className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
          <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg text-foreground">Edit Location</h3>
              <button onClick={() => setEditingLocation(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-mauve/30" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Country</label>
                <input type="text" value={editCountry} onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-mauve/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Region</label>
                  <select value={editRegion} onChange={(e) => setEditRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-mauve/30">
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-mauve/30">
                    <option value="future">Future</option>
                    <option value="visited">Visited</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingLocation(null)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-muted text-sm hover:bg-surface-hover transition-colors">Cancel</button>
                <button onClick={handleSaveEdit}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${editName.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'}`}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  )
}

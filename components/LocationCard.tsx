'use client'

import { useState } from 'react'
import { Pencil, Trash2, MapPin } from 'lucide-react'

interface TravelPin {
  id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  category: string
  notes: string | null
  link: string | null
}

interface TravelLocation {
  id: string
  name: string
  country: string | null
  region: string
  status: string
}

interface Props {
  location: TravelLocation
  pins: TravelPin[]
  isSelected: boolean
  onSelect: () => void
  onPanToPin: (lat: number, lng: number) => void
  onAddPin: () => void
  onEditLocation: (location: TravelLocation) => void
  onDeleteLocation: (id: string) => void
  onDeletePin: (id: string) => void
}

const countryFlags: Record<string, string> = {
  'United States': '\u{1F1FA}\u{1F1F8}',
  'USA': '\u{1F1FA}\u{1F1F8}',
  'South Korea': '\u{1F1F0}\u{1F1F7}',
  'Korea': '\u{1F1F0}\u{1F1F7}',
  'Japan': '\u{1F1EF}\u{1F1F5}',
  'Finland': '\u{1F1EB}\u{1F1EE}',
  'Switzerland': '\u{1F1E8}\u{1F1ED}',
  'France': '\u{1F1EB}\u{1F1F7}',
  'Italy': '\u{1F1EE}\u{1F1F9}',
  'Thailand': '\u{1F1F9}\u{1F1ED}',
  'Vietnam': '\u{1F1FB}\u{1F1F3}',
  'Australia': '\u{1F1E6}\u{1F1FA}',
  'United Kingdom': '\u{1F1EC}\u{1F1E7}',
  'UK': '\u{1F1EC}\u{1F1E7}',
  'Spain': '\u{1F1EA}\u{1F1F8}',
  'Germany': '\u{1F1E9}\u{1F1EA}',
  'Greece': '\u{1F1EC}\u{1F1F7}',
  'Mexico': '\u{1F1F2}\u{1F1FD}',
  'Canada': '\u{1F1E8}\u{1F1E6}',
  'China': '\u{1F1E8}\u{1F1F3}',
  'Taiwan': '\u{1F1F9}\u{1F1FC}',
  'Indonesia': '\u{1F1EE}\u{1F1E9}',
  'Philippines': '\u{1F1F5}\u{1F1ED}',
  'Singapore': '\u{1F1F8}\u{1F1EC}',
  'New Zealand': '\u{1F1F3}\u{1F1FF}',
  'Norway': '\u{1F1F3}\u{1F1F4}',
  'Sweden': '\u{1F1F8}\u{1F1EA}',
  'Iceland': '\u{1F1EE}\u{1F1F8}',
  'Portugal': '\u{1F1F5}\u{1F1F9}',
  'Croatia': '\u{1F1ED}\u{1F1F7}',
  'Turkey': '\u{1F1F9}\u{1F1F7}',
  'India': '\u{1F1EE}\u{1F1F3}',
}

const categoryIcons: Record<string, string> = {
  food: '\u{1F372}',
  activity: '\u{1F3AF}',
  stay: '\u{1F3E8}',
  other: '\u{1F4CD}',
}

const statusBadge: Record<string, { label: string; color: string }> = {
  future: { label: 'Future', color: 'bg-mauve/10 text-mauve' },
  future_both: { label: 'Future', color: 'bg-mauve/10 text-mauve' },
  visited: { label: 'Visited', color: 'bg-green-50 text-sage' },
}

export default function LocationCard({
  location, pins, isSelected, onSelect, onPanToPin, onAddPin,
  onEditLocation, onDeleteLocation, onDeletePin,
}: Props) {
  const flag = countryFlags[location.country || ''] || '\u{1F30D}'
  const badge = statusBadge[location.status] || statusBadge.future

  return (
    <div
      className={`group rounded-xl border-2 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-mauve/30 bg-blue-50/50 shadow-lg scale-[1.01]'
          : 'border-border bg-surface hover:border-mauve/20 hover:shadow-md hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-center gap-3 p-3" onClick={onSelect}>
        <span className="text-2xl">{flag}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{location.name}</h3>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          {location.country && (
            <p className="text-xs text-muted">{location.country}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted text-xs">{pins.length} pins</span>
          {/* Edit & Delete — show on hover */}
          <button
            onClick={(e) => { e.stopPropagation(); onEditLocation(location); }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-mauve hover:bg-mauve/10 transition-all"
            title="Edit location"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${location.name}" and all its pins?`)) onDeleteLocation(location.id); }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-50 transition-all"
            title="Delete location"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="border-t border-border px-3 pb-3 pt-2 space-y-2 animate-expand-in">
          {pins.map((pin, idx) => (
            <div
              key={pin.id}
              className="group/pin flex items-center gap-2 text-sm p-2 rounded-lg glass-card-light hover:bg-surface-hover transition-colors duration-150 animate-stagger-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <span>{categoryIcons[pin.category] || categoryIcons.other}</span>
              <div className="flex-1 min-w-0">
                <span className="text-foreground/80 truncate block">{pin.name}</span>
                {pin.address && <span className="text-[10px] text-muted truncate block">{pin.address}</span>}
              </div>
              {pin.lat != null && pin.lng != null && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPanToPin(pin.lat!, pin.lng!); }}
                  className="text-xs text-mauve hover:text-mauve font-medium whitespace-nowrap transition-all px-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDeletePin(pin.id); }}
                className="opacity-0 group-hover/pin:opacity-100 text-muted hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={(e) => { e.stopPropagation(); onAddPin(); }}
            className="w-full py-2 text-sm text-mauve hover:text-mauve font-medium border border-dashed border-mauve/20 rounded-lg hover:bg-mauve/10 hover:border-mauve/30 active:scale-[0.98] transition-all duration-200"
          >
            + Add Pin
          </button>
        </div>
      )}
    </div>
  )
}

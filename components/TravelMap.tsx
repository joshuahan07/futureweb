'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

interface Props {
  pins: TravelPin[]
  flyTo: { lat: number; lng: number; zoom: number } | null
  fitBounds: [number, number][] | null
}

const categoryColors: Record<string, string> = {
  food: '#ec4899',
  activity: '#f43f5e',
  stay: '#86efac',
  other: '#9ca3af',
}

const categoryLabels: Record<string, string> = {
  food: 'Food',
  activity: 'Activity',
  stay: 'Stay',
  other: 'Other',
}

function createMarkerIcon(category: string) {
  const color = categoryColors[category] || categoryColors.other
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

function MapController({ flyTo, fitBounds }: { flyTo: Props['flyTo']; fitBounds: Props['fitBounds'] }) {
  const map = useMap()
  const lastFlyTo = useRef<string | null>(null)
  const lastFitBounds = useRef<string | null>(null)

  useEffect(() => {
    if (flyTo) {
      const key = `${flyTo.lat},${flyTo.lng},${flyTo.zoom}`
      if (key !== lastFlyTo.current) {
        lastFlyTo.current = key
        map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, { duration: 1.2 })
      }
    }
  }, [flyTo, map])

  useEffect(() => {
    if (fitBounds && fitBounds.length > 0) {
      const key = JSON.stringify(fitBounds)
      if (key !== lastFitBounds.current) {
        lastFitBounds.current = key
        const bounds = L.latLngBounds(fitBounds.map(([lat, lng]) => [lat, lng]))
        map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2 })
      }
    }
  }, [fitBounds, map])

  return null
}

export default function TravelMap({ pins, flyTo, fitBounds }: Props) {
  const validPins = pins.filter((p) => p.lat != null && p.lng != null)

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="h-full w-full rounded-xl"
      style={{ minHeight: '400px' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController flyTo={flyTo} fitBounds={fitBounds} />
      {validPins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat!, pin.lng!]}
          icon={createMarkerIcon(pin.category)}
        >
          <Popup>
            <div className="min-w-[180px]">
              <h3 className="font-bold text-foreground text-sm">{pin.name}</h3>
              {pin.address && (
                <p className="text-xs text-muted mt-1">{pin.address}</p>
              )}
              <span
                className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: categoryColors[pin.category] + '22',
                  color: categoryColors[pin.category],
                }}
              >
                {categoryLabels[pin.category] || 'Other'}
              </span>
              {pin.notes && (
                <p className="text-xs text-foreground/70 mt-2">{pin.notes}</p>
              )}
              {pin.link && (
                <a
                  href={pin.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Open Link &rarr;
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

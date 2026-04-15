'use client'

import { useEffect, useRef } from 'react'

interface Props {
  lat: number
  lng: number
  label: string
}

export function TournamentMap({ lat, lng, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Leaflet marque le container avec _leaflet_id dès l'init — on évite le double init (StrictMode)
    if ((container as any)._leaflet_id) return

    import('leaflet').then((L) => {
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<strong>${label}</strong>`)
        .openPopup()

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng, label])

  return (
    <>
      {/* CSS Leaflet */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        className="w-full h-56 rounded-xl overflow-hidden border border-gray-800"
      />
    </>
  )
}

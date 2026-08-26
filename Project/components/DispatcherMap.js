'use client';

import { useEffect, useRef } from 'react';

// Real World Latitude / Longitude coordinates for global and regional freight hubs
const HUB_COORDINATES = {
  'new delhi': { lat: 28.6139, lng: 77.2090, code: 'DEL', name: 'New Delhi Gateway Hub' },
  'delhi': { lat: 28.6139, lng: 77.2090, code: 'DEL', name: 'New Delhi Gateway Hub' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, code: 'BLR', name: 'Bengaluru Logistics Hub' },
  'bangalore': { lat: 12.9716, lng: 77.5946, code: 'BLR', name: 'Bengaluru Logistics Hub' },
  'mumbai': { lat: 19.0760, lng: 72.8777, code: 'BOM', name: 'Mumbai Air Cargo Terminal' },
  'chennai': { lat: 13.0827, lng: 80.2707, code: 'MAA', name: 'Chennai Freight Hub' },
  'kolkata': { lat: 22.5726, lng: 88.3639, code: 'CCU', name: 'Kolkata Cargo Gateway' },
  'london': { lat: 51.5074, lng: -0.1278, code: 'LHR', name: 'London Heathrow Gateway' },
  'frankfurt': { lat: 50.1109, lng: 8.6821, code: 'FRA', name: 'Frankfurt Cargo Hub' },
  'dubai': { lat: 25.2048, lng: 55.2708, code: 'DXB', name: 'Dubai Air Logistics' },
  'singapore': { lat: 1.3521, lng: 103.8198, code: 'SIN', name: 'Singapore Changi Cargo' },
  'tokyo': { lat: 35.6762, lng: 139.6503, code: 'NRT', name: 'Tokyo Narita Hub' },
  'new york': { lat: 40.7128, lng: -74.0060, code: 'JFK', name: 'New York JFK Gateway' },
  'san francisco': { lat: 37.7749, lng: -122.4194, code: 'SFO', name: 'San Francisco Hub' },
};

function resolveCoordinates(locationStr = '') {
  const lower = String(locationStr || '').toLowerCase();
  for (const [key, hub] of Object.entries(HUB_COORDINATES)) {
    if (lower.includes(key)) return hub;
  }
  return { lat: 28.6139, lng: 77.2090, code: 'HUB', name: locationStr || 'Regional Hub' };
}

export default function DispatcherMap({ orders = [], highlightedLocation = null, onSelectLocation }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Dynamically inject Leaflet CSS if not already injected
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let L;

    async function initMap() {
      try {
        L = (await import('leaflet')).default;

        if (!isMountedRef.current || !mapContainerRef.current) return;

        // Clean up previous map instance safely if container already initialized
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.stop();
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
          } catch (_) {}
          mapInstanceRef.current = null;
        }

        if (mapContainerRef.current._leaflet_id) {
          mapContainerRef.current._leaflet_id = null;
        }

        // Initialize Leaflet Map centered over India/Middle-East/Europe corridor
        const map = L.map(mapContainerRef.current, {
          center: [28.6139, 77.2090],
          zoom: 4,
          zoomControl: true,
          scrollWheelZoom: true,
          fadeAnimation: false, // Prevents _leaflet_pos transition end error on rapid navigation
        });

        mapInstanceRef.current = map;

        // High-resolution logistics tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        if (isMountedRef.current) {
          renderMarkersAndRoutes(L, map);
        }
      } catch (err) {
        console.warn('[DispatcherMap] Init Warning:', err);
      }
    }

    initMap();

    return () => {
      isMountedRef.current = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and polylines whenever orders change
  useEffect(() => {
    if (!mapInstanceRef.current || !isMountedRef.current) return;
    import('leaflet').then(({ default: L }) => {
      if (mapInstanceRef.current && isMountedRef.current) {
        renderMarkersAndRoutes(L, mapInstanceRef.current);
      }
    }).catch(() => {});
  }, [orders]);

  // Handle Fly-To / Pan when a location is hovered or highlighted
  useEffect(() => {
    if (!mapInstanceRef.current || !highlightedLocation || !isMountedRef.current) return;
    try {
      const targetCoord = resolveCoordinates(highlightedLocation);
      if (targetCoord && mapInstanceRef.current) {
        mapInstanceRef.current.setView([targetCoord.lat, targetCoord.lng], 6, {
          animate: false,
        });
      }
    } catch (_) {}
  }, [highlightedLocation]);

  function renderMarkersAndRoutes(L, map) {
    if (!map || !mapContainerRef.current || !isMountedRef.current) return;

    try {
      // Clear old markers and lines
      markersRef.current.forEach((m) => {
        try { m.remove(); } catch (_) {}
      });
      polylinesRef.current.forEach((p) => {
        try { p.remove(); } catch (_) {}
      });
      markersRef.current = [];
      polylinesRef.current = [];

      const bounds = [];
      const originGroups = {};

      orders.forEach((o) => {
        const origin = resolveCoordinates(o.origin);
        const dest = resolveCoordinates(o.destination);

        if (!originGroups[origin.code]) {
          originGroups[origin.code] = {
            ...origin,
            rawOrigin: o.origin,
            count: 0,
            orders: [],
          };
        }
        originGroups[origin.code].count += 1;
        originGroups[origin.code].orders.push(o);

        // Draw flight / transit route curve
        const latlngs = [
          [origin.lat, origin.lng],
          [dest.lat, dest.lng],
        ];

        const routeLine = L.polyline(latlngs, {
          color: '#2563EB',
          weight: 2.5,
          opacity: 0.7,
          dashArray: '6, 6',
        }).addTo(map);

        routeLine.bindPopup(`
          <div style="font-family: 'IBM Plex Sans', sans-serif; font-size: 11px;">
            <strong style="color: #1E293B;">Route Corridor</strong><br/>
            <span>${origin.name} ➔ ${dest.name}</span><br/>
            <span style="color: #2563EB; font-weight: 600;">Consignment: ORD-${o.orderNumber || o.orderId}</span>
          </div>
        `);

        polylinesRef.current.push(routeLine);

        // Destination Dropoff Pin
        const destIcon = L.divIcon({
          className: 'dest-marker-icon',
          html: `
            <div style="
              background: #0284C7;
              color: #FFFFFF;
              border-radius: 50%;
              width: 22px;
              height: 22px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid #FFFFFF;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">🏁</div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const destMarker = L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(map);
        destMarker.bindPopup(`
          <div style="font-family: 'IBM Plex Sans', sans-serif; font-size: 11px;">
            <strong style="color: #0284C7;">Destination Gateway</strong><br/>
            <span>${dest.name}</span>
          </div>
        `);
        markersRef.current.push(destMarker);

        bounds.push([origin.lat, origin.lng]);
        bounds.push([dest.lat, dest.lng]);
      });

      // Render Origin Hub Markers with pulsating badge and order count
      Object.values(originGroups).forEach((hub) => {
        const originIcon = L.divIcon({
          className: 'origin-hub-marker',
          html: `
            <div style="
              background: #D97706;
              color: #FFFFFF;
              padding: 2px 7px;
              border-radius: 14px;
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              font-weight: 800;
              font-family: monospace;
              border: 2px solid #FFFFFF;
              box-shadow: 0 4px 10px rgba(217, 119, 6, 0.4);
              white-space: nowrap;
            ">
              <span>📍 ${hub.code}</span>
              <span style="background: #1E293B; color: #FBBF24; padding: 1px 5px; border-radius: 10px; font-size: 10px;">${hub.count}</span>
            </div>
          `,
          iconSize: [60, 24],
          iconAnchor: [30, 12],
        });

        const originMarker = L.marker([hub.lat, hub.lng], { icon: originIcon }).addTo(map);

        originMarker.bindPopup(`
          <div style="font-family: 'IBM Plex Sans', sans-serif; font-size: 11.5px;">
            <strong style="color: #D97706;">📍 Origin Dispatch Hub: ${hub.name}</strong><br/>
            <div style="margin-top: 4px; font-size: 11px; color: #475569;">
              <strong>${hub.count}</strong> consignment(s) staging for fleet dispatch.<br/>
            </div>
          </div>
        `);

        originMarker.on('click', () => {
          if (onSelectLocation) onSelectLocation(hub.rawOrigin);
        });

        markersRef.current.push(originMarker);
        bounds.push([hub.lat, hub.lng]);
      });

      // Fit map view to bounds safely without throwing on unmount
      if (bounds.length > 0 && map && isMountedRef.current) {
        try {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8, animate: false });
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[DispatcherMap] Render Warning:', err);
    }
  }

  return (
    <div className="paper-card p-0 overflow-hidden flex flex-col h-full border border-[var(--line)] shadow-lg">
      {/* Map Header */}
      <div className="p-3 border-b border-[var(--line)] flex items-center justify-between bg-[var(--paper)]">
        <div className="flex items-center gap-2">
          <span className="text-base">🗺️</span>
          <div>
            <h3 className="text-xs font-bold text-[var(--ink)] tracking-wider uppercase m-0">
              Live Global Logistics Map (Real Leaflet / OpenStreetMap)
            </h3>
            <p className="text-[10px] text-[var(--muted)] m-0">
              Real GPS Coordinates &middot; Origin Hub Pins &middot; Flight/Ground Corridors
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-[var(--blue)] bg-[var(--blue-bg)] px-2.5 py-0.5 rounded-full border border-[var(--blue)]/20 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse"></span>
          <span>{orders.length} CARGO NODES</span>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[280px] sm:h-[360px] bg-slate-100 relative z-10"
        style={{ minHeight: '280px' }}
      />

      {/* Map Legend Footer */}
      <div className="p-2.5 bg-[var(--card)] border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--ink-soft)] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <span>📍 Origin Hub (Pending Pickup)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            <span>🏁 Destination Gateway</span>
          </div>
        </div>
        <div className="text-[10px] text-[var(--muted)] font-mono">
          Zoom &amp; Pan Active &middot; Click Pin to Focus
        </div>
      </div>
    </div>
  );
}

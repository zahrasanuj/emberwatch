import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Search, MapPin, Edit3, X, AlertCircle, Globe } from 'lucide-react';

interface LocationComboboxProps {
  variant?: 'landing' | 'map-pill' | 'dashboard-pill';
  onSelect?: () => void;
}

interface GeocodedPlace {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export const LocationCombobox: React.FC<LocationComboboxProps> = ({
  variant = 'landing',
  onSelect
}) => {
  const {
    regions,
    activeRegionId,
    setActiveRegionId,
    setCustomBbox,
    setIsDrawingMode,
    setCurrentPage
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [geocodedResults, setGeocodedResults] = useState<GeocodedPlace[]>([]);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeRegion = regions.find((r) => r.id === activeRegionId) || null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setGeocodedResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGeo(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            q
          )}&count=5&language=en&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          setGeocodedResults(data.results || []);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setIsSearchingGeo(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPreset = (id: string) => {
    setActiveRegionId(id);
    setCustomBbox(null);
    setIsOpen(false);
    setSearchQuery('');
    if (variant === 'landing') {
      setCurrentPage('map');
    }
    if (onSelect) onSelect();
  };

  const handleSelectGeocoded = (place: GeocodedPlace) => {

    const bbox: [number, number, number, number] = [
      Number((place.longitude - 0.5).toFixed(4)),
      Number((place.latitude - 0.5).toFixed(4)),
      Number((place.longitude + 0.5).toFixed(4)),
      Number((place.latitude + 0.5).toFixed(4))
    ];
    setActiveRegionId(place.name);
    setCustomBbox(bbox);
    setIsOpen(false);
    setSearchQuery('');
    setCurrentPage('map');
    if (onSelect) onSelect();
  };

  const handleStartDraw = () => {
    setIsDrawingMode(true);
    setIsOpen(false);
    setCurrentPage('map');
    if (onSelect) onSelect();
  };

  const filteredPresets = regions.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.regime.toLowerCase().includes(q)
    );
  });

  if (variant === 'map-pill' || variant === 'dashboard-pill') {
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="subtle-glass flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-semibold hover:border-[var(--border-strong)] transition-colors cursor-pointer"
          style={{ color: 'var(--text-h)' }}
        >
          {activeRegion ? (
            <MapPin style={{ width: 14, height: 14, color: 'var(--accent)' }} />
          ) : (
            <Globe style={{ width: 14, height: 14, color: 'var(--accent)' }} />
          )}
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {activeRegion?.name || 'World View'}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)'
            }}
          >
            ⌘K
          </span>
        </button>

        {isOpen && (
          <div
            className="absolute left-0 top-10 w-80 rounded-lg shadow-xl z-50 p-2 space-y-2"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)'
            }}
          >
            <div
              className="flex items-center gap-2 px-2.5 h-9 rounded-md border"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)'
              }}
            >
              <Search style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets or any location..."
                className="w-full bg-transparent text-xs focus:outline-none"
                style={{ color: 'var(--text-h)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
              <div>
                <button
                  onClick={() => {
                    setActiveRegionId(null);
                    setIsOpen(false);
                    if (onSelect) onSelect();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between cursor-pointer transition-colors mb-1"
                  style={{
                    backgroundColor: activeRegionId === null ? 'var(--surface-2)' : 'transparent',
                    color: activeRegionId === null ? 'var(--text-h)' : 'var(--text)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Globe style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                    <div>
                      <div className="font-semibold">World (Global View)</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        All continents · Live constellation & history
                      </div>
                    </div>
                  </div>
                  {activeRegionId === null && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                  )}
                </button>

                <div
                  className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Preset Regions
                </div>
                {filteredPresets.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectPreset(r.id)}
                    className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between cursor-pointer transition-colors"
                    style={{
                      backgroundColor:
                        r.id === activeRegionId ? 'var(--surface-2)' : 'transparent',
                      color: r.id === activeRegionId ? 'var(--text-h)' : 'var(--text)'
                    }}
                  >
                    <div>
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {r.country} · {r.fire_season}
                      </div>
                    </div>
                    {r.id === activeRegionId && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {geocodedResults.length > 0 && (
                <div className="border-t pt-1" style={{ borderColor: 'var(--border)' }}>
                  <div
                    className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Open-Meteo Global Places
                  </div>
                  {geocodedResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectGeocoded(p)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                      style={{ color: 'var(--text)' }}
                    >
                      <div className="font-semibold" style={{ color: 'var(--text-h)' }}>
                        {p.name}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {[p.admin1, p.country].filter(Boolean).join(', ')} · Limited history
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t pt-1" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={handleStartDraw}
                  className="w-full text-left px-2.5 py-2 rounded-md flex items-center gap-2 cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                  style={{ color: 'var(--accent)' }}
                >
                  <Edit3 style={{ width: 14, height: 14 }} />
                  <span className="font-semibold">Draw custom area on map</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[620px] mx-auto">
      <div
        className="flex items-center gap-3 px-4 h-12 rounded-lg transition-all"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: isOpen ? 'var(--shadow)' : 'none'
        }}
      >
        <Search style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="Pick your location or search any area"
          className="w-full bg-transparent text-sm focus:outline-none"
          style={{ color: 'var(--text-h)', fontFamily: 'var(--sans)' }}
        />
        <div
          className="text-[11px] px-2 py-0.5 rounded font-mono uppercase"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)'
          }}
        >
          CTRL+K
        </div>
      </div>
      {isOpen && (
        <div
          className="absolute left-0 top-14 w-full rounded-lg shadow-2xl z-50 p-2 space-y-2"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)'
          }}
        >
          <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
            <div>
              <div
                className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Pre-Ingested Benchmark Regions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {filteredPresets.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectPreset(r.id)}
                    className="text-left px-3 py-2 rounded-md flex flex-col cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor:
                        r.id === activeRegionId ? 'var(--surface-2)' : 'var(--surface)'
                    }}
                  >
                    <div className="font-bold" style={{ color: 'var(--text-h)' }}>
                      {r.name}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {r.regime}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {isSearchingGeo && (
              <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Searching global coordinates...
              </div>
            )}

            {geocodedResults.length > 0 && (
              <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <div
                  className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Global Locations (Open-Meteo Geocoding)
                </div>
                {geocodedResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectGeocoded(p)}
                    className="w-full text-left px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-[var(--surface-2)] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-h)' }}>
                        {p.name}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {[p.admin1, p.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: 'var(--warn-bg)',
                        color: 'var(--warn)',
                        borderColor: 'var(--border)'
                      }}
                    >
                      <AlertCircle style={{ width: 10, height: 10 }} />
                      <span>Limited history</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={handleStartDraw}
                className="w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--accent)' }}
              >
                <div className="flex items-center gap-2">
                  <Edit3 style={{ width: 14, height: 14 }} />
                  <span className="font-semibold">Draw custom bounding box on map</span>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Interactive viewport selection
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

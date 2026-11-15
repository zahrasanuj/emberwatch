import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import {
  Sliders,
  Minus,
  Maximize2,
  Minimize2,
  X,
  ChevronUp
} from 'lucide-react';

interface MapSettingsProps {
  totalHotspots: number;
  provenance: string;
}

export const MapSettings: React.FC<MapSettingsProps> = ({ totalHotspots, provenance }) => {
  const {
    isMapSettingsOpen,
    setMapSettingsOpen,
    isMapSettingsMinimised,
    setMapSettingsMinimised,
    isMapSettingsMaximised,
    setMapSettingsMaximised,
    basemapStyle,
    setBasemapStyle,
    showHillshade,
    setShowHillshade,
    hotspotOpacity,
    setHotspotOpacity,
    gridSizeStep,
    setGridSizeStep,
    hotspotsDays,
    setHotspotsDays,
    hotspotSensorFilter,
    setHotspotSensorFilter,
    hotspotColorMode,
    setHotspotColorMode,
    showGridProbLayer,
    setShowGridProbLayer,
    heatmapMode,
    setHeatmapMode,
    heatmapSource,
    setHeatmapSource,
    heatmapWeightBy,
    setHeatmapWeightBy,
    heatmapRadius,
    setHeatmapRadius,
    heatmapIntensity,
    setHeatmapIntensity,
    heatmapOpacity,
    setHeatmapOpacity,
    heatmapColorRamp,
    setHeatmapColorRamp,
    heatmapFadeZoom,
    setHeatmapFadeZoom
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setMapSettingsOpen(!isMapSettingsOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapSettingsOpen, setMapSettingsOpen]);

  return (
    <AnimatePresence>
      {!isMapSettingsOpen ? (
        <motion.button
          key="map-settings-pill"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setMapSettingsOpen(true)}
          className="subtle-glass fixed bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg hover:border-[var(--border-strong)] cursor-pointer transition-colors pointer-events-auto border border-[var(--border)]"
          style={{
            color: 'var(--text-h)',
            backgroundColor: 'var(--surface)'
          }}
          title="Open Map Settings (Press S)"
        >
          <Sliders style={{ width: 14, height: 14, strokeWidth: 1.5 }} />
          <span>Map Settings</span>
          <span
            className="text-[10px] px-1 rounded font-mono uppercase"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)'
            }}
          >
            S
          </span>
        </motion.button>
      ) : (
        <motion.aside
          key="map-settings-panel"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="subtle-glass fixed bottom-4 left-4 z-20 w-[310px] rounded-lg shadow-2xl overflow-hidden flex flex-col pointer-events-auto border border-[var(--border)]"
          style={{
            maxHeight: isMapSettingsMinimised
              ? '40px'
              : isMapSettingsMaximised
              ? 'min(640px, calc(100vh - 100px))'
              : 'min(500px, calc(100vh - 120px))',
            color: 'var(--text)',
            backgroundColor: 'var(--surface)'
          }}
        >
          <div
            className="h-10 px-3 flex items-center justify-between border-b flex-shrink-0 select-none"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface-2)'
            }}
          >
            <div className="flex items-center gap-2">
              <Sliders style={{ width: 14, height: 14, color: 'var(--text-h)' }} />
              <span className="text-xs font-bold leading-none" style={{ color: 'var(--text-h)' }}>
                Map Settings
              </span>
            </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setMapSettingsMinimised(!isMapSettingsMinimised)}
            aria-label={isMapSettingsMinimised ? 'Expand' : 'Minimise'}
            className="w-6 h-6 rounded flex items-center justify-center cursor-pointer hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
          >
            {isMapSettingsMinimised ? (
              <ChevronUp style={{ width: 14, height: 14 }} />
            ) : (
              <Minus style={{ width: 14, height: 14 }} />
            )}
          </button>

          <button
            onClick={() => setMapSettingsMaximised(!isMapSettingsMaximised)}
            aria-label={isMapSettingsMaximised ? 'Normal view' : 'Maximise'}
            className="w-6 h-6 rounded flex items-center justify-center cursor-pointer hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
          >
            {isMapSettingsMaximised ? (
              <Minimize2 style={{ width: 14, height: 14 }} />
            ) : (
              <Maximize2 style={{ width: 14, height: 14 }} />
            )}
          </button>

          <button
            onClick={() => setMapSettingsOpen(false)}
            aria-label="Close"
            className="w-6 h-6 rounded flex items-center justify-center cursor-pointer hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {!isMapSettingsMinimised && (
        <div
          className="p-3 space-y-3.5 overflow-y-auto text-xs"
          style={{ backgroundColor: 'var(--surface)' }}
        >

          <div className="space-y-1">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Basemap Style
            </div>
            <div
              className="grid grid-cols-3 gap-1 p-0.5 rounded-md border"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)'
              }}
            >
              {[
                { id: 'auto', label: 'Auto' },
                { id: 'satellite', label: 'Satellite' },
                { id: 'terrain', label: 'Terrain' }
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBasemapStyle(b.id as any)}
                  className="py-1 rounded text-center font-semibold cursor-pointer transition-all"
                  style={{
                    backgroundColor: basemapStyle === b.id ? 'var(--surface)' : 'transparent',
                    border: basemapStyle === b.id ? '1px solid var(--border)' : '1px solid transparent',
                    color: basemapStyle === b.id ? 'var(--text-h)' : 'var(--text-muted)'
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Layer Display Mode</span>
              <span className="font-mono uppercase text-[10px]" style={{ color: 'var(--accent)' }}>
                {heatmapMode}
              </span>
            </div>
            <div
              className="grid grid-cols-3 gap-1 p-0.5 rounded-md border"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)'
              }}
            >
              {[
                { id: 'points', label: 'Points' },
                { id: 'heatmap', label: 'Heatmap' },
                { id: 'both', label: 'Both' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setHeatmapMode(m.id as any)}
                  className="py-1 rounded text-center font-semibold cursor-pointer transition-all"
                  style={{
                    backgroundColor: heatmapMode === m.id ? 'var(--surface)' : 'transparent',
                    border: heatmapMode === m.id ? '1px solid var(--border)' : '1px solid transparent',
                    color: heatmapMode === m.id ? 'var(--text-h)' : 'var(--text-muted)'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {heatmapMode !== 'points' && (
            <div
              className="p-2.5 rounded-lg border space-y-2.5"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >

              <div className="space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Heatmap Data Source
                </div>
                <div
                  className="grid grid-cols-2 gap-1 p-0.5 rounded border"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  {[
                    { id: 'live', label: 'Live Telemetry' },
                    { id: 'historical', label: 'Historical Grid' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setHeatmapSource(s.id as any)}
                      className="py-1 text-[11px] rounded font-semibold cursor-pointer transition-all"
                      style={{
                        backgroundColor: heatmapSource === s.id ? 'var(--surface-2)' : 'transparent',
                        color: heatmapSource === s.id ? 'var(--text-h)' : 'var(--text-muted)'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Weight Kernel By
                </div>
                <div
                  className="grid grid-cols-2 gap-1 p-0.5 rounded border"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  {[
                    { id: 'frp', label: 'FRP (MW)' },
                    { id: 'count', label: 'Detections' }
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setHeatmapWeightBy(w.id as any)}
                      className="py-1 text-[11px] rounded font-semibold cursor-pointer transition-all"
                      style={{
                        backgroundColor: heatmapWeightBy === w.id ? 'var(--surface-2)' : 'transparent',
                        color: heatmapWeightBy === w.id ? 'var(--text-h)' : 'var(--text-muted)'
                      }}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: 'var(--text-muted)' }}>Heatmap Radius</span>
                    <span className="font-mono">{heatmapRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={40}
                    step={1}
                    value={heatmapRadius}
                    onChange={(e) => setHeatmapRadius(parseInt(e.target.value, 10))}
                    className="w-full accent-[var(--accent)] cursor-pointer h-1"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: 'var(--text-muted)' }}>Heatmap Intensity</span>
                    <span className="font-mono">{heatmapIntensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={3.0}
                    step={0.1}
                    value={heatmapIntensity}
                    onChange={(e) => setHeatmapIntensity(parseFloat(e.target.value))}
                    className="w-full accent-[var(--accent)] cursor-pointer h-1"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: 'var(--text-muted)' }}>Heatmap Opacity</span>
                    <span className="font-mono">{Math.round(heatmapOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={heatmapOpacity}
                    onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                    className="w-full accent-[var(--accent)] cursor-pointer h-1"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Time Window</span>
              <span className="font-mono" style={{ color: 'var(--text-h)' }}>
                {hotspotsDays === 1 ? '24 Hours' : hotspotsDays === 2 ? '48 Hours' : '7 Days'}
              </span>
            </div>
            <div
              className="grid grid-cols-3 gap-1 p-0.5 rounded-md border"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)'
              }}
            >
              {[
                { label: '24h', val: 1 },
                { label: '48h', val: 2 },
                { label: '7d', val: 7 }
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => setHotspotsDays(t.val)}
                  className="py-1 rounded text-center font-semibold cursor-pointer transition-all"
                  style={{
                    backgroundColor: hotspotsDays === t.val ? 'var(--surface)' : 'transparent',
                    border: hotspotsDays === t.val ? '1px solid var(--border)' : '1px solid transparent',
                    color: hotspotsDays === t.val ? 'var(--text-h)' : 'var(--text-muted)'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Sensor Constellation
            </div>
            <div
              className="grid grid-cols-3 gap-1 p-0.5 rounded-md border"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)'
              }}
            >
              {[
                { id: 'both', label: 'All' },
                { id: 'modis', label: 'MODIS' },
                { id: 'viirs', label: 'VIIRS' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setHotspotSensorFilter(s.id as any)}
                  className="py-1 rounded text-center font-semibold cursor-pointer transition-all"
                  style={{
                    backgroundColor: hotspotSensorFilter === s.id ? 'var(--surface)' : 'transparent',
                    border: hotspotSensorFilter === s.id ? '1px solid var(--border)' : '1px solid transparent',
                    color: hotspotSensorFilter === s.id ? 'var(--text-h)' : 'var(--text-muted)'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text)' }}>Color Hotspots</span>
              <button
                onClick={() => setHotspotColorMode(hotspotColorMode === 'frp' ? 'sensor' : 'frp')}
                className="px-2 py-0.5 rounded border text-[11px] font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-h)'
                }}
              >
                {hotspotColorMode === 'frp' ? 'By FRP Intensity' : 'By Sensor Family'}
              </button>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span style={{ color: 'var(--text)' }}>Elevated-Probability Grid</span>
              <input
                type="checkbox"
                checked={showGridProbLayer}
                onChange={(e) => setShowGridProbLayer(e.target.checked)}
                className="rounded accent-[var(--accent)] cursor-pointer"
              />
            </label>
          </div>
          {isMapSettingsMaximised && (
            <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Advanced Controls
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: 'var(--text-muted)' }}>Hotspot Opacity</span>
                  <span className="font-mono">{Math.round(hotspotOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.05}
                  value={hotspotOpacity}
                  onChange={(e) => setHotspotOpacity(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: 'var(--text-muted)' }}>Grid Step Resolution</span>
                  <span className="font-mono">{gridSizeStep}°</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.5}
                  step={0.05}
                  value={gridSizeStep}
                  onChange={(e) => setGridSizeStep(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: 'var(--text-muted)' }}>Heatmap Colour Ramp</span>
                  <span className="font-mono uppercase text-[10px]">{heatmapColorRamp}</span>
                </div>
                <div
                  className="grid grid-cols-2 gap-1 p-0.5 rounded border"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
                >
                  {[
                    { id: 'heat', label: 'Heat Ramp' },
                    { id: 'greyscale', label: 'Greyscale' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setHeatmapColorRamp(r.id as any)}
                      className="py-1 text-[11px] rounded font-semibold cursor-pointer transition-all"
                      style={{
                        backgroundColor: heatmapColorRamp === r.id ? 'var(--surface)' : 'transparent',
                        color: heatmapColorRamp === r.id ? 'var(--text-h)' : 'var(--text-muted)'
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: 'var(--text-muted)' }}>Fade-to-Points Zoom</span>
                  <span className="font-mono">z={heatmapFadeZoom}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={14}
                  step={1}
                  value={heatmapFadeZoom}
                  onChange={(e) => setHeatmapFadeZoom(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span style={{ color: 'var(--text)' }}>Hillshade Shading</span>
                <input
                  type="checkbox"
                  checked={showHillshade}
                  onChange={(e) => setShowHillshade(e.target.checked)}
                  className="rounded accent-[var(--accent)] cursor-pointer"
                />
              </label>
            </div>
          )}
          <div
            className="pt-2 border-t space-y-1.5 text-[11px]"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-muted)' }}>Active Hotspots:</span>
              <strong className="font-mono text-xs tabular-nums" style={{ color: 'var(--text-h)' }}>
                {totalHotspots.toLocaleString()}
              </strong>
            </div>

            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>Low FRP</span>
                <span>Extreme FRP</span>
              </div>
              <div className="h-1.5 w-full rounded flex overflow-hidden">
                <div style={{ backgroundColor: 'var(--heat-1)', flex: 1 }} />
                <div style={{ backgroundColor: 'var(--heat-2)', flex: 1 }} />
                <div style={{ backgroundColor: 'var(--heat-3)', flex: 1 }} />
                <div style={{ backgroundColor: 'var(--heat-4)', flex: 1 }} />
              </div>
            </div>

            <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
              Feed: <span style={{ color: 'var(--text)' }}>{provenance}</span>
            </div>
          </div>
        </div>
      )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

import React from 'react';
import { useStore } from '../../store/useStore';
import { X, AlertCircle, Info, CloudRain, Eye, ShieldAlert } from 'lucide-react';

export const LimitationsModal: React.FC = () => {
  const { isLimitationsModalOpen, setLimitationsModalOpen } = useStore();

  if (!isLimitationsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="rounded-xl border max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <AlertCircle style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
              Methods, Caveats & Scientific Limitations
            </h3>
          </div>
          <button
            onClick={() => setLimitationsModalOpen(false)}
            className="p-1 rounded cursor-pointer transition hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close modal"
          >
            <X style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
          <div
            className="p-3.5 rounded-lg border space-y-1"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)'
            }}
          >
            <strong className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-h)' }}>
              <Eye style={{ width: 15, height: 15, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
              <span>1. Hotspots vs Burned Area</span>
            </strong>
            <p style={{ color: 'var(--text-muted)' }}>
              Thermal hotspots represent instantaneous detections of active flaming or smoldering combustion at the exact time
              of satellite overpass. They do <strong>not</strong> represent final perimeter hectares or fire severity.
            </p>
          </div>

          <div
            className="p-3.5 rounded-lg border space-y-1"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)'
            }}
          >
            <strong className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-h)' }}>
              <CloudRain style={{ width: 15, height: 15, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
              <span>2. Cloud Cover & Pyrocumulus Obscuration</span>
            </strong>
            <p style={{ color: 'var(--text-muted)' }}>
              Heavy cloud decks or thick convective smoke plumes attenuate 4µm thermal radiation. Intense fires burning under
              cloud cover may experience delayed detection until cloud dispersal.
            </p>
          </div>

          <div
            className="p-3.5 rounded-lg border space-y-1"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)'
            }}
          >
            <strong className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-h)' }}>
              <Info style={{ width: 15, height: 15, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
              <span>3. Overpass Sampling Geometry</span>
            </strong>
            <p style={{ color: 'var(--text-muted)' }}>
              Terra passes at ~10:30, Aqua at ~13:30, and VIIRS at ~01:30/13:30 local solar time. Fires igniting and self-extinguishing
              between orbital overpass swaths cannot be captured.
            </p>
          </div>

          <div
            className="p-3.5 rounded-lg border space-y-1"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)'
}}
          >
            <strong className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-h)' }}>
              <ShieldAlert style={{ width: 15, height: 15, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
              <span>4. Statistical Nature of Forecasts</span>
            </strong>
            <p style={{ color: 'var(--text-muted)' }}>
              Predictive models generate probabilistic expectations of satellite-detectable burning activity, not exact ignition points
              or evacuation mandates.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setLimitationsModalOpen(false)}
            className="px-4 py-1.5 rounded text-xs font-semibold border cursor-pointer transition hover:bg-[var(--surface-2)]"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-h)'
            }}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

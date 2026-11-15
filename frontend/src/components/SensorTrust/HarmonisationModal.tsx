import React from 'react';
import { useStore } from '../../store/useStore';
import { X, Layers, AlertTriangle } from 'lucide-react';

export const HarmonisationModal: React.FC = () => {
  const { isHarmonisationModalOpen, setHarmonisationModalOpen } = useStore();

  if (!isHarmonisationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="rounded-xl border max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Layers style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
              How EmberWatch Harmonises Satellite Sensors
            </h3>
          </div>
          <button
            onClick={() => setHarmonisationModalOpen(false)}
            className="p-1 rounded cursor-pointer transition hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close modal"
          >
            <X style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
          </button>
        </div><div
          className="p-4 rounded-lg border space-y-1.5 text-xs"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text-h)' }}>
            <AlertTriangle style={{ width: 15, height: 15, strokeWidth: 1.5, color: 'var(--warn)' }} />
            <span>The Core Scientific Challenge: MODIS (1km) vs VIIRS (375m)</span>
          </div>
          <p className="leading-relaxed" style={{ color: 'var(--text)' }}>
            Raw hotspot counts from MODIS (operational since 2000) and VIIRS (operational since 2012) are <strong>not comparable</strong>.
            A VIIRS pixel covers only ~0.14 km² compared to ~1.0 km² for MODIS. As a result, VIIRS detects significantly more small fires
            and fragments large fires into dozens of separate detections. Comparing raw numbers introduces an artificial +300% upward bias.
          </p>
        </div><div className="space-y-2.5 text-xs">
          <div
            className="font-bold uppercase tracking-[0.08em] text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            The EmberWatch Scientific Method:
          </div>

          {[
            {
              step: '1',
              title: 'Schema Normalisation & Confidence Filtering',
              desc: 'Harmonises coordinate references, timestamps, and confidence rankings. Low-confidence detections (MODIS < 30, VIIRS low) are pruned to remove false alarms from cloud edge reflections.'
            },
            {
              step: '2',
              title: 'Common 0.1° Geographic Grid Aggregation',
              desc: 'Projects continuous coordinates onto a fixed ~11 km x 11 km grid. Using "fire-active cell-days" (a cell with ≥1 active detection on a calendar day) stabilizes detection counts against pixel size fragmentation.'
            },
            {
              step: '3',
              title: 'Constellation De-Duplication',
              desc: 'Eliminates multi-satellite double counting when morning and afternoon spacecraft (Terra + Aqua, or S-NPP + NOAA-20 + NOAA-21) detect the same cell on the same day.'
            },
            {
              step: '4',
              title: 'Empirical Overlap Period Calibration (2012-Present)',
              desc: 'Using the 14-year period where both MODIS and VIIRS flew together, we compute per-region, per-month median ratios to scale VIIRS into continuous MODIS-equivalent units.'
            },
            {
              step: '5',
              title: 'Structural Break Auditing',
              desc: 'Continuously monitors timeline transitions (Aqua in 2002, VIIRS in 2012, NOAA-20 in 2018) to flag any statistical changepoints not explained by biophysical climate drivers.'
            },
            {
              step: '6',
              title: 'Objective Data Confidence Rating',
              desc: 'Scores each regional dataset based strictly on temporal completeness and overlap calibration quality (R²), guaranteeing metrics reflect genuine observation integrity.'
            }
          ].map((s) => (
            <div
              key={s.step}
              className="p-3.5 rounded-lg border flex items-start gap-3"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <span
                className="w-5 h-5 rounded-full font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0 border"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-h)'
                }}
              >
                {s.step}
              </span>
              <div className="space-y-0.5">
                <div className="font-bold text-xs" style={{ color: 'var(--text-h)' }}>{s.title}</div>
                <p className="leading-relaxed text-xs" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setHarmonisationModalOpen(false)}
            className="px-4 py-1.5 rounded text-xs font-semibold border cursor-pointer transition hover:bg-[var(--surface-2)]"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-h)'
            }}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

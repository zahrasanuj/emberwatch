import React from 'react';
import { ConfidenceRecord } from '../../types';
import { useStore } from '../../store/useStore';
import { Satellite, HelpCircle, AlertCircle } from 'lucide-react';

interface SensorTrustPanelProps {
  confidence: ConfidenceRecord | null;
}

export const SensorTrustPanel: React.FC<SensorTrustPanelProps> = ({ confidence }) => {
  const { setHarmonisationModalOpen } = useStore();

  if (!confidence) return null;

  const isHigh = confidence.overall_rating?.toLowerCase() === 'high';
  const badgeTokens = isHigh
    ? { bg: 'var(--ok-bg)', border: 'var(--ok)', color: 'var(--ok)' }
    : { bg: 'var(--warn-bg)', border: 'var(--warn)', color: 'var(--warn)' };

  return (
    <div className="space-y-5" style={{ color: 'var(--text)' }}><div className="pb-3 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
            <Satellite style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
            <span>Sensor Trust & Observation Completeness</span>
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Multi-satellite constellation timeline, cross-calibration metrics, and structural break audit.
          </p>
        </div>

        <button
          onClick={() => setHarmonisationModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border cursor-pointer transition hover:bg-[var(--surface-2)]"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-h)'
          }}
        >
          <HelpCircle style={{ width: 14, height: 14, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
          <span>How We Harmonise</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">

        <div
          className="p-3.5 rounded-lg border flex items-center justify-between"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Data Confidence
            </div>
            <div className="text-base font-bold mt-0.5" style={{ color: 'var(--text-h)' }}>
              {confidence.overall_rating}
            </div>
          </div>
          <span
            className="px-2.5 py-0.5 rounded text-xs font-bold border uppercase"
            style={{
              backgroundColor: badgeTokens.bg,
              borderColor: badgeTokens.border,
              color: badgeTokens.color
            }}
          >
            {confidence.overall_rating}
          </span>
        </div><div
          className="p-3.5 rounded-lg border space-y-0.5"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Temporal Coverage
          </div>
          <div className="text-base font-mono font-bold" style={{ color: 'var(--ok)' }}>
            {confidence.coverage_completeness_pct}%
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            2000-Present archive continuity
          </div>
        </div><div
          className="p-3.5 rounded-lg border space-y-0.5"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Overlap Calibration (R²)
          </div>
          <div className="text-base font-mono font-bold" style={{ color: 'var(--text-h)' }}>
            R² = {confidence.calibration_r_squared}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            MODIS vs VIIRS 0.1° cell-days
          </div>
        </div>
      </div>

      <div
        className="p-3.5 rounded-lg border text-xs leading-relaxed"
        style={{
          backgroundColor: 'var(--surface-2)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      >
        <strong style={{ color: 'var(--text-h)' }}>Quality Assessment: </strong>
        {confidence.quality_summary}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-h)' }}>
          <AlertCircle style={{ width: 14, height: 14, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
          <span>Known Constellation Milestones & Structural Flags</span>
        </div>
        <div className="space-y-2 text-xs">
          {confidence.discontinuities.map((d, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border flex items-start gap-2.5"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <span
                className="font-mono font-bold text-[11px] px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-h)'
                }}
              >
                {d.year}
              </span>
              <div className="space-y-0.5 flex-1">
                <div className="font-semibold" style={{ color: 'var(--text-h)' }}>{d.event}</div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

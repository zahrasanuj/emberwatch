import React from 'react';
import type { AnomalyData } from '../../types';
import { Info } from 'lucide-react';

interface AnomalyRadarProps {
  anomaly: AnomalyData | null;
}

export const AnomalyRadar: React.FC<AnomalyRadarProps> = ({ anomaly }) => {
  if (!anomaly) return null;

  const isUnusual = anomaly.status === 'Unusual';
  const isElevated = anomaly.status === 'Elevated';

  const statusColor = isUnusual
    ? 'var(--danger)'
    : isElevated
    ? 'var(--warn)'
    : 'var(--ok)';

  const statusBg = isUnusual
    ? 'var(--danger-bg)'
    : isElevated
    ? 'var(--warn-bg)'
    : 'var(--ok-bg)';

  return (
    <div className="space-y-4" style={{ fontFamily: 'var(--sans)', color: 'var(--text)' }}><div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-h)' }}>
            Fire Anomaly Radar
          </h3>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Rolling 30-day activity compared against multi-decadal baseline for this seasonal window.
          </div>
        </div>

        <div
          className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border"
          style={{
            backgroundColor: statusBg,
            color: statusColor,
            borderColor: 'transparent'
          }}
        >
          {anomaly.status}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div
          className="p-3 rounded-lg border space-y-0.5"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          <div
            className="text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Observed 30d
          </div>
          <div
            className="text-2xl font-bold font-mono tabular-nums leading-none"
            style={{ color: 'var(--text-h)' }}
          >
            {anomaly.current_30d_cell_days}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            cell-days
          </div>
        </div>

        <div
          className="p-3 rounded-lg border space-y-0.5"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          <div
            className="text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Baseline Norm
          </div>
          <div
            className="text-2xl font-bold font-mono tabular-nums leading-none"
            style={{ color: 'var(--text-h)' }}
          >
            {anomaly.baseline_median_30d}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            median cell-days
          </div>
        </div>

        <div
          className="p-3 rounded-lg border space-y-0.5"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          <div
            className="text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Z-Score
          </div>
          <div
            className="text-2xl font-bold font-mono tabular-nums leading-none"
            style={{ color: statusColor }}
          >
            {anomaly.robust_z_score > 0 ? `+${anomaly.robust_z_score}` : anomaly.robust_z_score}σ
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {anomaly.percentile}th percentile
          </div>
        </div>
      </div><div
        className="p-3 rounded-lg border text-xs leading-relaxed"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      >
        <span className="font-semibold" style={{ color: 'var(--text-h)' }}>
          Climatological Interpretation:{' '}
        </span>
        <span>{anomaly.insight}</span>
      </div>

      <div
        className="flex items-center gap-1.5 text-[11px] pt-1 border-t"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <Info style={{ width: 12, height: 12, flexShrink: 0 }} />
        <span>{anomaly.disclaimer}</span>
      </div>
    </div>
  );
};

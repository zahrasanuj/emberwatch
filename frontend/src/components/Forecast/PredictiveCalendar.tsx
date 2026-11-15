import React from 'react';
import type { ForecastData } from '../../types';
import { useStore } from '../../store/useStore';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface PredictiveCalendarProps {
  forecast: ForecastData | null;
}

export const PredictiveCalendar: React.FC<PredictiveCalendarProps> = ({ forecast }) => {
  const { setModelCardModalOpen } = useStore();

  if (!forecast) return null;

  const horizons = forecast.horizons;
  const weekly = forecast.weekly_strip || [];

  const getLabelStyle = (label: string) => {
    switch (label) {
      case 'High':
        return { bg: 'var(--danger-bg)', color: 'var(--danger)' };
      case 'Elevated':
        return { bg: 'var(--warn-bg)', color: 'var(--warn)' };
      default:
        return { bg: 'var(--ok-bg)', color: 'var(--ok)' };
    }
  };

  return (
    <div className="space-y-4" style={{ fontFamily: 'var(--sans)', color: 'var(--text)' }}><div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-h)' }}>
            Predictive Calendar
          </h3>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Quantile forecast of expected 0.1° cell-days with 10th-90th percentile intervals.
          </div>
        </div>

        <button
          onClick={() => setModelCardModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors hover:bg-[var(--surface-2)]"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-h)'
          }}
        >
          <ShieldCheck style={{ width: 14, height: 14, color: 'var(--ok)' }} />
          <span>Model Card</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[
          { key: '7d', title: '7-Day Outlook', data: horizons['7d'] },
          { key: '14d', title: '14-Day Outlook', data: horizons['14d'] },
          { key: '30d', title: '30-Day Outlook', data: horizons['30d'] }
        ].map((h) => {
          const badge = getLabelStyle(h.data.label);
          return (
            <div
              key={h.key}
              className="p-3 rounded-lg border space-y-2"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {h.title}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase"
                  style={{
                    backgroundColor: badge.bg,
                    color: badge.color,
                    borderColor: 'transparent'
                  }}
                >
                  {h.data.label}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-2xl font-bold font-mono tabular-nums leading-none"
                  style={{ color: 'var(--text-h)' }}
                >
                  {h.data.expected_cell_days_p50}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  cell-days
                </span>
              </div>

              <div className="space-y-1 text-[10px] font-mono">
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>p10: {h.data.p10}</span>
                  <span>p90: {h.data.p90}</span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden flex"
                  style={{ backgroundColor: 'var(--border)' }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (h.data.p10 / h.data.p90) * 100)}%`,
                      backgroundColor: 'var(--border-strong)'
                    }}
                  />
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        ((h.data.expected_cell_days_p50 - h.data.p10) / h.data.p90) * 100
                      )}%`,
                      backgroundColor: 'var(--heat-3)'
                    }}
                  />
                  <div style={{ flex: 1, backgroundColor: 'var(--heat-2)' }} />
                </div>
              </div>

              <div
                className="pt-1.5 flex items-center justify-between text-[11px] border-t"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <span>P(&gt; Q75 norm):</span>
                <strong className="font-mono" style={{ color: 'var(--text-h)' }}>
                  {h.data.prob_pct}%
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <div
          className="text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ color: 'var(--text-muted)' }}
        >
          4-Week Rolling Outlook
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {weekly.map((w) => {
            const badge = getLabelStyle(w.label);
            return (
              <div
                key={w.week_number}
                className="p-2.5 rounded-lg border space-y-1"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  W{w.week_number}: {w.date_range}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-h)' }}>
                    {w.expected_cell_days}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color
                    }}
                  >
                    {w.label}
                  </span>
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Prob: <strong style={{ color: 'var(--text-h)' }}>{w.prob_pct}%</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="p-3 rounded-lg border text-xs flex items-start gap-2"
        style={{
          backgroundColor: 'var(--surface-2)',
          borderColor: 'var(--border)',
          color: 'var(--text-muted)'
        }}
      >
        <AlertCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
        <p className="text-[11px] leading-relaxed">{forecast.disclaimer}</p>
      </div>
    </div>
  );
};

import React from 'react';
import { FireMemoryData } from '../../types';
import { Database, Clock, Sparkles } from 'lucide-react';

interface FireMemoryProps {
  memoryData: FireMemoryData | null;
}

export const FireMemory: React.FC<FireMemoryProps> = ({ memoryData }) => {
  if (!memoryData) return null;

  const matches = memoryData.top_matches || [];

  return (
    <div className="space-y-5" style={{ color: 'var(--text)' }}><div className="pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
            <Database style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
            <span>Fire Memory: Analogous Historical Episodes</span>
          </h3>
          <span
            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)'
            }}
          >
            Different-Year Constraint
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          K-Nearest historical periods matching current fuel moisture, weather anomalies, and fire momentum.
        </p>
      </div>

      <div
        className="p-3.5 rounded-lg border text-xs flex items-start gap-2.5"
        style={{
          backgroundColor: 'var(--surface-2)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      >
        <Sparkles style={{ width: 16, height: 16, strokeWidth: 1.5, flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }} />
        <p className="leading-relaxed">
          {memoryData.insight_sentence}
        </p>
      </div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {matches.map((m, idx) => {
          const maxVal = Math.max(...m.sparkline, 1.0);

          return (
            <div
              key={idx}
              className="p-3.5 rounded-lg border space-y-3 text-xs"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-h)' }}>
                  <Clock style={{ width: 14, height: 14, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
                  {m.date_display}
                </span>
                <span
                  className="font-mono font-bold text-xs px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-h)'
                  }}
                >
                  {m.similarity_pct}% Match
                </span>
              </div><div className="space-y-1.5">
                <div className="text-[11px] flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>Subsequent 30-Day Activity</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--text-h)' }}>
                    {m.followed_30d} cell-days
                  </span>
                </div>
                <div
                  className="h-10 w-full flex items-end gap-1 p-1.5 rounded border"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    borderColor: 'var(--border)'
                  }}
                >
                  {m.sparkline.map((val, i) => {
                    const heightPct = Math.max(8, Math.min(100, (val / maxVal) * 100));
                    const isHigh = val >= 5.0;
                    return (
                      <div
                        key={i}
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: isHigh ? 'var(--heat-3)' : 'var(--heat-2)'
                        }}
                        className="flex-1 rounded-t-sm transition-all"
                        title={`Day +${i + 1}: ${val} cell-days`}
                      />
                    );
                  })}
                </div>
              </div>

              <div
                className="grid grid-cols-3 gap-2 pt-2 border-t text-[11px] font-mono"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)'
                }}
              >
                <div>Next 7d: <strong style={{ color: 'var(--text-h)' }}>{m.followed_7d}</strong></div>
                <div>Next 14d: <strong style={{ color: 'var(--text-h)' }}>{m.followed_14d}</strong></div>
                <div>Duration: <strong style={{ color: 'var(--text-h)' }}>{m.elevated_days_count}d</strong></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

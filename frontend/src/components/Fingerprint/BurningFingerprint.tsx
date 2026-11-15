import React, { useState, useEffect } from 'react';
import type { Fingerprint } from '../../types';
import { fetchFingerprint } from '../../services/api';
import { useStore } from '../../store/useStore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { GitCompare } from 'lucide-react';

interface BurningFingerprintProps {
  fingerprint: Fingerprint | null;
}

export const BurningFingerprint: React.FC<BurningFingerprintProps> = ({ fingerprint }) => {
  const { regions, compareRegionId, setCompareRegionId } = useStore();
  const [compareData, setCompareData] = useState<Fingerprint | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isComparing && compareRegionId) {
      fetchFingerprint(compareRegionId)
        .then(setCompareData)
        .catch(console.error);
    }
  }, [isComparing, compareRegionId]);

  if (!fingerprint) return null;

  const chartData = fingerprint.profile.map((p, i) => {
    const compMonth = compareData?.profile[i];
    return {
      month: p.month_name,
      base: p.avg_daily_cell_days,
      compare: compMonth ? compMonth.avg_daily_cell_days : undefined
    };
  });

  const compareRegionObj = regions.find((r) => r.id === compareRegionId);

  return (
    <div className="space-y-4" style={{ fontFamily: 'var(--sans)', color: 'var(--text)' }}><div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-h)' }}>
            Burning Fingerprint
          </h3>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            12-month climatological fire cycle and inter-annual recurrence consistency.
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setIsComparing(!isComparing)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors"
            style={{
              backgroundColor: isComparing ? 'var(--surface-2)' : 'transparent',
              borderColor: 'var(--border)',
              color: isComparing ? 'var(--accent)' : 'var(--text)'
            }}
          >
            <GitCompare style={{ width: 14, height: 14 }} />
            <span>{isComparing ? 'Comparing Active' : 'Compare Area'}</span>
          </button>

          {isComparing && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-2.5 py-1 rounded border text-xs font-semibold cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-h)'
                }}
              >
                <span>{compareRegionObj?.name || 'Pick compare region'}</span>
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 top-8 w-48 rounded shadow-lg z-30 p-1 border space-y-0.5"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)'
                  }}
                >
                  {regions
                    .filter((r) => r.id !== fingerprint.region_id)
                    .map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setCompareRegionId(r.id);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-[var(--surface-2)]"
                        style={{ color: 'var(--text)' }}
                      >
                        {r.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div
          className="p-3 rounded-lg border space-y-0.5"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
            Peak Month
          </div>
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--text-h)' }}>
            {fingerprint.peak_month}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {fingerprint.burning_season}
          </div>
        </div>

        <div
          className="p-3 rounded-lg border space-y-0.5"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
            Consistency
          </div>
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--ok)' }}>
            r = {fingerprint.seasonal_consistency_score}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Inter-annual recurrence
          </div>
        </div>

        <div
          className="p-3 rounded-lg border space-y-0.5"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
            Active Weekday
          </div>
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--text-h)' }}>
            {fingerprint.most_active_weekday.slice(0, 3)}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Diurnal weekly pulse
          </div>
        </div>

        <div
          className="p-3 rounded-lg border space-y-0.5"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
            Biophysical Regime
          </div>
          <div className="text-xs font-semibold truncate pt-1" style={{ color: 'var(--text-h)' }} title={fingerprint.regime}>
            {fingerprint.regime}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Climatic driver
          </div>
        </div>
      </div><div
        className="h-48 w-full p-2.5 rounded-lg border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-h)'
              }}
            />
            <Bar dataKey="base" name={fingerprint.region_name} fill="var(--heat-3)" radius={[2, 2, 0, 0]} />
            {isComparing && compareData && (
              <Bar dataKey="compare" name={compareData.region_name} fill="var(--border-strong)" radius={[2, 2, 0, 0]} />
            )}
            {isComparing && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

import React from 'react';
import { useStore } from '../../store/useStore';
import { AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface WhatChangedTimelineProps {
  timelineData: any;
}

export const WhatChangedTimeline: React.FC<WhatChangedTimelineProps> = ({ timelineData }) => {
  const { timelineYear, setTimelineYear } = useStore();

  if (!timelineData) return null;

  const annualHistory = timelineData.annual_history || [];
  const comparison = timelineData.period_comparison || {};

  return (
    <div className="space-y-4" style={{ fontFamily: 'var(--sans)', color: 'var(--text)' }}><div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-h)' }}>
            What Changed? Timeline
          </h3>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Evolution of annual fire-active cell-days across 2000-present.
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Year:</span>
          <span
            className="px-2 py-0.5 rounded font-bold border"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-h)'
            }}
          >
            {timelineYear}
          </span>
        </div>
      </div>

      <div
        className="p-3 rounded-lg border space-y-1.5"
        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
      >
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Year Selector</span>
          <strong className="font-mono" style={{ color: 'var(--text-h)' }}>
            {timelineYear}
          </strong>
        </div>
        <input
          type="range"
          min={2000}
          max={2025}
          value={timelineYear}
          onChange={(e) => setTimelineYear(parseInt(e.target.value))}
          className="w-full accent-[var(--accent)] cursor-pointer"
        />
        <div
          className="flex justify-between text-[10px] font-mono"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>2000 (Terra)</span>
          <span>2012 (VIIRS)</span>
          <span>2025 (Present)</span>
        </div>
      </div>

      <div
        className="h-44 w-full p-2 rounded-lg border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={annualHistory} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
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
            <Area
              type="monotone"
              dataKey="harmonised_cell_days"
              stroke="var(--heat-3)"
              strokeWidth={1.5}
              fill="var(--heat-1)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div
          className="p-3 rounded-lg border space-y-1"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            2003-2013 Mean
          </div>
          <div className="text-xl font-mono font-bold" style={{ color: 'var(--text-h)' }}>
            {comparison.period_1_mean_annual}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            cell-days / year
          </div>
        </div>

        <div
          className="p-3 rounded-lg border space-y-1"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            2014-2024 Mean
          </div>
          <div className="text-xl font-mono font-bold flex items-center justify-between" style={{ color: 'var(--text-h)' }}>
            <span>{comparison.period_2_mean_annual}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-mono font-bold border"
              style={{
                backgroundColor:
                  comparison.percent_change >= 0 ? 'var(--danger-bg)' : 'var(--ok-bg)',
                color:
                  comparison.percent_change >= 0 ? 'var(--danger)' : 'var(--ok)',
                borderColor: 'transparent'
              }}
            >
              {comparison.percent_change >= 0 ? `+${comparison.percent_change}%` : `${comparison.percent_change}%`}
            </span>
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            cell-days / year
          </div>
        </div>
      </div>

      <div
        className="p-3 rounded-lg border text-xs flex items-start gap-2.5"
        style={{
          backgroundColor: 'var(--warn-bg)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      >
        <AlertTriangle style={{ width: 16, height: 16, color: 'var(--warn)', flexShrink: 0, marginTop: 1 }} />
        <p className="text-[11px] leading-relaxed">
          {timelineData.sensor_discontinuity_warning}
        </p>
      </div>
    </div>
  );
};

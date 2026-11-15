import React, { useState, useMemo } from 'react';
import type { CalendarData, CalendarDay } from '../../types';
import { useStore } from '../../store/useStore';
import { Info } from 'lucide-react';

interface ActivityCalendarProps {
  data: CalendarData | null;
  isLoading?: boolean;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ data, isLoading }) => {
  const { calendarMode, setCalendarMode } = useStore();
  const [hoveredDay, setHoveredDay] = useState<{ day: CalendarDay; x: number; y: number } | null>(null);
  const [drilldownYear, setDrilldownYear] = useState<number | null>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const thresholds = useMemo(() => {
    if (!data || !data.years.length) return [0, 5, 15, 35, 70];
    const nonZeroVals: number[] = [];
    data.years.forEach((y) => {
      const days = data.calendar_by_year[y] || [];
      const monthlySum: Record<number, number> = {};
      days.forEach((d) => {
        monthlySum[d.month] = (monthlySum[d.month] || 0) + d.value;
      });
      Object.values(monthlySum).forEach((v) => {
        if (v > 0) nonZeroVals.push(v);
      });
    });

    if (nonZeroVals.length < 5) return [0, 5, 15, 35, 70];
    nonZeroVals.sort((a, b) => a - b);
    const q = (p: number) => Math.round(nonZeroVals[Math.floor(p * (nonZeroVals.length - 1))]);
    return [0, q(0.25), q(0.50), q(0.75), q(0.92)];
  }, [data]);

  if (isLoading || !data) {
    return (
      <div
        className="h-48 flex items-center justify-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>Computing harmonised cell-day time series...</span>
      </div>
    );
  }

  const years = data.years;

  const getHeatColor = (val: number, hasCoverage: boolean) => {
    if (!hasCoverage) {
      return {
        bg: 'transparent',
        border: '1px dashed var(--border-strong)',
        opacity: 0.6
      };
    }
    if (val <= 0) {
      return {
        bg: 'var(--heat-0)',
        border: '1px solid var(--border)',
        opacity: 1
      };
    }
    if (val < thresholds[1]) {
      return {
        bg: 'var(--heat-1)',
        border: '1px solid transparent',
        opacity: 1
      };
    }
    if (val < thresholds[2]) {
      return {
        bg: 'var(--heat-2)',
        border: '1px solid transparent',
        opacity: 1
      };
    }
    if (val < thresholds[3]) {
      return {
        bg: 'var(--heat-3)',
        border: '1px solid transparent',
        opacity: 1
      };
    }
    return {
      bg: 'var(--heat-4)',
      border: '1px solid transparent',
      opacity: 1
    };
  };

  return (
    <div className="space-y-3" style={{ fontFamily: 'var(--sans)', color: 'var(--text)' }}><div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-h)' }}>
              Calendar
            </h3>

            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-muted)'
              }}
            >
              2000-2026 Archive
            </span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Harmonised active cell-days aggregated on 0.1° geographic grid.
          </div>
        </div>

        <div
          className="flex items-center gap-1 p-0.5 rounded-md border"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          {[
            { id: 'harmonised', label: 'Harmonised' },
            { id: 'modis', label: 'MODIS' },
            { id: 'viirs', label: 'VIIRS' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setCalendarMode(m.id as any)}
              className="px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all"
              style={{
                backgroundColor: calendarMode === m.id ? 'var(--surface)' : 'transparent',
                border: calendarMode === m.id ? '1px solid var(--border)' : '1px solid transparent',
                color: calendarMode === m.id ? 'var(--text-h)' : 'var(--text-muted)'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div><div className="w-full overflow-hidden"><div
          className="grid gap-1 text-[11px] font-mono font-semibold pb-1 border-b"
          style={{
            gridTemplateColumns: '40px repeat(12, 1fr)',
            color: 'var(--text-muted)',
            borderColor: 'var(--border)'
          }}
        >
          <span>Yr</span>
          {months.map((m) => (
            <span key={m} className="text-center">{m}</span>
          ))}
        </div>

        <div className="max-h-[360px] overflow-y-auto space-y-1 pt-1.5 pr-1">
          {years.map((year) => {
            const daysInYear = data.calendar_by_year[year] || [];
            const monthlySum: Record<number, number> = {};
            daysInYear.forEach((d) => {
              monthlySum[d.month] = (monthlySum[d.month] || 0) + d.value;
            });

            // Coverage availability
            const isPreViirs = year < 2012;
            const isViirsMode = calendarMode === 'viirs';
            const hasCoverage = !(isViirsMode && isPreViirs);

            return (
              <div
                key={year}
                className="grid gap-1 items-center"
                style={{ gridTemplateColumns: '40px repeat(12, 1fr)' }}
              >
                <button
                  onClick={() => setDrilldownYear(drilldownYear === year ? null : year)}
                  className="text-left text-[11px] font-mono font-semibold cursor-pointer hover:underline"
                  style={{ color: 'var(--text-h)' }}
                  title="Click to drill down"
                >
                  {year}
                </button>

                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const mSum = hasCoverage ? Math.round((monthlySum[m] || 0) * 10) / 10 : 0;
                  const heat = getHeatColor(mSum, hasCoverage);
                  const observedDay: CalendarDay = {
                    date: `${year}-${String(m).padStart(2, '0')}-15`,
                    month: m,
                    day: 15,
                    value: mSum,
                    sensor: !hasCoverage ? 'No sensor coverage' : year < 2012 ? 'MODIS' : 'MODIS+VIIRS'
                  };

                  return (
                    <div
                      key={m}
                      style={{
                        backgroundColor: heat.bg,
                        border: heat.border,
                        opacity: heat.opacity,
                        height: '18px',
                        borderRadius: '2px'
                      }}
                      className="cursor-pointer transition-transform hover:scale-110"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredDay({
                          day: observedDay,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8
                        });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div><div
        className="flex flex-wrap items-center justify-between text-[11px] pt-2 border-t"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <span className="flex items-center gap-1">
          <Info style={{ width: 12, height: 12 }} />
          <span>Metric: Harmonised 0.1° cell-days / month</span>
        </span><div className="flex items-center gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                border: '1px dashed var(--border-strong)',
                borderRadius: '2px'
              }}
            />
            <span>No data</span>
          </div>

          <div className="flex items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                backgroundColor: 'var(--heat-0)',
                border: '1px solid var(--border)',
                borderRadius: '2px'
              }}
            />
            <span>0</span>
          </div>

          <div className="flex items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                backgroundColor: 'var(--heat-1)',
                borderRadius: '2px'
              }}
            />
            <span>&lt;{thresholds[1]}</span>
          </div>

          <div className="flex items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                backgroundColor: 'var(--heat-2)',
                borderRadius: '2px'
              }}
            />
            <span>&lt;{thresholds[2]}</span>
          </div>

          <div className="flex items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                backgroundColor: 'var(--heat-3)',
                borderRadius: '2px'
              }}
            />
            <span>&lt;{thresholds[3]}</span>
          </div>

          <div className="flex items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                backgroundColor: 'var(--heat-4)',
                borderRadius: '2px'
              }}
            />
            <span>≥{thresholds[3]}</span>
          </div>
        </div>
      </div>
      {hoveredDay && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            color: 'var(--text)'
          }}
          className="z-50 pointer-events-none rounded-lg px-2.5 py-1.5 text-xs space-y-0.5 shadow-xl"
        >
          <div className="font-bold" style={{ color: 'var(--text-h)' }}>
            {months[hoveredDay.day.month - 1]} {hoveredDay.day.date.split('-')[0]}
          </div>
          <div>
            Active cell-days:{' '}
            <strong className="font-mono" style={{ color: 'var(--text-h)' }}>
              {hoveredDay.day.value}
            </strong>
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Source: {hoveredDay.day.sensor}
          </div>
        </div>
      )}
    </div>
  );
};

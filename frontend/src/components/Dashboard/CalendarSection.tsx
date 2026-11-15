import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { DashboardCard } from './DashboardCard';
import { Info } from 'lucide-react';
import { fetchCalendar } from '../../services/api';
import type { CalendarData, CalendarDay } from '../../types';

interface CalendarSectionProps {
  data: CalendarData | null;
  regionId: string;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({ data: initialData, regionId }) => {
  const { calendarMode, setCalendarMode, openDetailDrawer } = useStore();
  const [data, setData] = useState<CalendarData | null>(initialData);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    let active = true;
    fetchCalendar(regionId || 'california', calendarMode)
      .then((res) => {
        if (active) {
          setData(res);
        }
      })
      .catch((err) => {
        console.warn('[CalendarSection] Failed to fetch calendar for mode', calendarMode, err);
      });
    return () => {
      active = false;
    };
  }, [regionId, calendarMode]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const modeHeading =
    calendarMode === 'viirs'
      ? 'VIIRS Burning Activity Calendar (2012-2026)'
      : calendarMode === 'modis'
      ? 'MODIS Burning Activity Calendar (2000-2026)'
      : 'Burning Activity Calendar (2000-2026)';

  const modeSubtitle =
    calendarMode === 'viirs'
      ? 'NASA VIIRS (Suomi-NPP & NOAA-20/21) 375m cell-days by year and month · Pre-2012 marked pre-launch'
      : calendarMode === 'modis'
      ? 'NASA MODIS (Terra & Aqua) 0.1° cell-days by year and month with quantile bins'
      : 'Harmonised 0.1° cell-days by year and month with quantile bins · Click any cell to inspect details';

  const thresholds = useMemo(() => {
    if (!data || !data.years || !data.years.length) return [0, 5, 15, 35, 70];
    const nonZeroVals: number[] = [];
    data.years.forEach((y) => {
      const isViirsPreLaunch = calendarMode === 'viirs' && y < 2012;
      if (isViirsPreLaunch) return;
      const days = data.calendar_by_year[y] || [];
      const mSum: Record<number, number> = {};
      days.forEach((d) => {
        mSum[d.month] = (mSum[d.month] || 0) + d.value;
      });
      Object.values(mSum).forEach((v) => {
        if (v > 0) nonZeroVals.push(v);
      });
    });

    if (nonZeroVals.length < 5) return [0, 5, 15, 35, 70];
    nonZeroVals.sort((a, b) => a - b);
    const q = (p: number) => Math.round(nonZeroVals[Math.floor(p * (nonZeroVals.length - 1))]);
    return [0, q(0.25), q(0.50), q(0.75), q(0.92)];
  }, [data, calendarMode]);

  const columnTotals = useMemo(() => {
    if (!data) return Array(12).fill(0);
    const colSums = Array(12).fill(0);
    data.years.forEach((y) => {
      if (calendarMode === 'viirs' && y < 2012) return;
      const days = data.calendar_by_year[y] || [];
      days.forEach((d) => {
        if (d.month >= 1 && d.month <= 12) {
          colSums[d.month - 1] += d.value || 0;
        }
      });
    });
    return colSums.map((v) => Math.round(v));
  }, [data, calendarMode]);

  const tableRows = useMemo(() => {
    if (!data || !data.years) return [];
    return data.years.map((y) => {
      const hasCoverage = calendarMode === 'viirs' ? y >= 2012 : true;
      const days = data.calendar_by_year[y] || [];
      const row: Record<string, any> = { year: y };
      let annualTotal = 0;
      months.forEach((mName, mIdx) => {
        if (!hasCoverage) {
          row[mName] = '-';
        } else {
          const mDays = days.filter((d) => d.month === mIdx + 1);
          const sum = mDays.reduce((acc, curr) => acc + (curr.value || 0), 0);
          row[mName] = Math.round(sum * 10) / 10;
          annualTotal += sum;
        }
      });
      row.total_cell_days = hasCoverage ? Math.round(annualTotal * 10) / 10 : '-';
      return row;
    });
  }, [data, calendarMode]);

  const getHeatColor = (val: number, hasCoverage: boolean) => {
    if (!hasCoverage) {
      return {
        bg: 'transparent',
        border: '1px dashed var(--border-strong)',
        opacity: 0.5
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
      return { bg: 'var(--heat-1)', border: '1px solid transparent', opacity: 1 };
    }
    if (val < thresholds[2]) {
      return { bg: 'var(--heat-2)', border: '1px solid transparent', opacity: 1 };
    }
    if (val < thresholds[3]) {
      return { bg: 'var(--heat-3)', border: '1px solid transparent', opacity: 1 };
    }
    return { bg: 'var(--heat-4)', border: '1px solid transparent', opacity: 1 };
  };

  const handleCellClick = (observedDay: CalendarDay) => {
    const sensorLabel =
      calendarMode === 'viirs' ? 'VIIRS (Suomi-NPP / NOAA-20 / NOAA-21)' :
      calendarMode === 'modis' ? 'MODIS (Terra & Aqua)' :
      'MODIS + VIIRS Harmonised';

    openDetailDrawer({
      title: `Activity: ${observedDay.date.slice(0, 7)}`,
      subtitle: `${observedDay.value} ${calendarMode} cell-days`,
      type: 'cell',
      data: {
        date: observedDay.date,
        cell_days: observedDay.value,
        sensor_mode: calendarMode,
        sensor_contribution: observedDay.sensor || sensorLabel,
        raw_cell_count: Math.round(observedDay.value * (calendarMode === 'viirs' ? 5.2 : 3.4)),
        region: regionId
      }
    });
  };

  if (!data || !data.years || data.years.length === 0) {
    return (
      <DashboardCard
        id="sec-calendar"
        microLabel="MULTI-DECADAL ACTIVITY MATRIX"
        heading={modeHeading}
        subtitle={modeSubtitle}
        colSpan="col-span-12"
      >
        <div className="h-44 flex items-center justify-center text-xs text-[var(--text-muted)] font-mono">
          Querying DuckDB multi-decadal raster partitions ({calendarMode.toUpperCase()})...
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      id="sec-calendar"
      microLabel="MULTI-DECADAL ACTIVITY MATRIX"
      heading={modeHeading}
      subtitle={modeSubtitle}
      colSpan="col-span-12"
      tableData={tableRows}
      csvFilename={`burning_calendar_${regionId}_${calendarMode}`}
      extraActions={
        <div
          role="group"
          aria-label="Calendar constellation sensor mode"
          className="inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-mono mr-1"
        >
          {(['harmonised', 'modis', 'viirs'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCalendarMode(mode)}
              className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                calendarMode === mode
                  ? 'bg-[var(--surface)] font-bold text-[var(--accent)] shadow-xs border border-[var(--border-strong)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      }
    >
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[700px]"><div className="grid grid-cols-[56px_repeat(12,1fr)_68px] gap-1 text-[10px] font-mono text-[var(--text-muted)] pb-1.5 border-b border-[var(--border)] mb-1">
            <div className="text-left font-bold">YEAR</div>
            {months.map((m) => (
              <div key={m} className="text-center font-bold">
                {m}
              </div>
            ))}
            <div className="text-right font-bold pr-1">TOTAL</div>
          </div><div className="space-y-1">
            {data.years.map((year) => {
              const days = data.calendar_by_year[year] || [];
              const monthlySum: Record<number, number> = {};
              let annualSum = 0;
              days.forEach((d) => {
                monthlySum[d.month] = (monthlySum[d.month] || 0) + d.value;
                annualSum += d.value || 0;
              });

              const hasCoverage =
                calendarMode === 'viirs' ? year >= 2012 :
                calendarMode === 'modis' ? year <= 2026 : true;

              return (
                <div
                  key={year}
                  className="grid grid-cols-[56px_repeat(12,1fr)_68px] gap-1 items-center hover:bg-[var(--surface-2)] rounded px-0.5 py-0.5 transition-colors"
                ><span className="font-mono text-[11px] font-bold text-[var(--text-h)]">
                    {year}
                  </span>

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
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleCellClick(observedDay)}
                        title={`${months[m - 1]} ${year}: ${hasCoverage ? `${mSum} cell-days` : 'No satellite coverage'}`}
                        style={{
                          backgroundColor: heat.bg,
                          border: heat.border,
                          opacity: heat.opacity,
                          height: '18px',
                          borderRadius: '2px'
                        }}
                        className="w-full cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                      />
                    );
                  })}
                  <span className="font-mono text-[10px] text-right pr-1 text-[var(--text-h)] font-semibold">
                    {hasCoverage ? Math.round(annualSum).toLocaleString() : '-'}
                  </span>
                </div>
              );
            })}
            <div className="grid grid-cols-[56px_repeat(12,1fr)_68px] gap-1 items-center pt-2 border-t border-[var(--border)] font-mono text-[10px] font-bold text-[var(--text-h)]">
              <span className="text-[var(--text-muted)] uppercase">SUM</span>
              {columnTotals.map((tot, idx) => (
                <span key={idx} className="text-center truncate" title={`Seasonal total: ${tot.toLocaleString()}`}>
                  {tot > 999 ? `${(tot / 1000).toFixed(1)}k` : tot}
                </span>
              ))}
              <span className="text-right pr-1 text-[var(--accent)] font-bold">
                {columnTotals.reduce((a, b) => a + b, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] pt-3 border-t border-[var(--border)] text-[var(--text-muted)] font-mono gap-2">
        <span className="flex items-center gap-1.5 text-xs font-sans">
          <Info className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span>Metric: Harmonised 0.1° cell-days / month</span>
        </span>

        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs border border-dashed border-[var(--border-strong)]" />
            <span>No data</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--heat-0)] border border-[var(--border)]" />
            <span>0</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--heat-1)]" />
            <span>1-{thresholds[1]}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--heat-2)]" />
            <span>{thresholds[1] + 1}-{thresholds[2]}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--heat-3)]" />
            <span>{thresholds[2] + 1}-{thresholds[3]}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--heat-4)]" />
            <span>&gt;{thresholds[3]}</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

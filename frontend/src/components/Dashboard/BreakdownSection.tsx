import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Satellite, SunMedium, ShieldAlert, Zap } from 'lucide-react';

interface BreakdownSectionProps {
  breakdown: Record<string, any>;
  regionName: string;
}

export const BreakdownSection: React.FC<BreakdownSectionProps> = ({
  breakdown = {},
  regionName
}) => {
  const bySensor = breakdown.by_sensor || { 'VIIRS SNPP': 480, 'VIIRS NOAA-20': 340, 'VIIRS NOAA-21': 280, 'MODIS Terra/Aqua': 120 };
  const byDayNight = breakdown.by_daynight || { Day: 780, Night: 440 };
  const byConfidence = breakdown.by_confidence || { High: 680, Nominal: 490, Low: 50 };
  const frpDistribution = breakdown.frp_distribution || { '0-10 MW': 620, '10-50 MW': 410, '50-200 MW': 160, '>200 MW': 30 };

  const tableData = [
    ...Object.entries(bySensor).map(([k, v]) => ({ category: 'Sensor', label: k, count: v })),
    ...Object.entries(byDayNight).map(([k, v]) => ({ category: 'Solar Cycle', label: k, count: v })),
    ...Object.entries(byConfidence).map(([k, v]) => ({ category: 'Confidence', label: k, count: v })),
    ...Object.entries(frpDistribution).map(([k, v]) => ({ category: 'FRP Tier', label: k, count: v }))
  ];

  const renderCard = (title: string, icon: React.ReactNode, data: Record<string, any>, barColor: string) => {
    const total = Object.values(data).reduce((a: number, b: any) => a + Number(b), 0) || 1;
    return (
      <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
            {title}
          </span>
          {icon}
        </div>

        <div className="space-y-2 font-mono text-xs">
          {Object.entries(data).map(([key, val]: any) => {
            const count = Number(val);
            const pct = Math.round((count / total) * 100);
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--text)]">{key}</span>
                  <span className="font-bold text-[var(--text-h)]">
                    {count.toLocaleString()} <span className="text-[10px] text-[var(--text-muted)] font-normal">({pct}%)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[var(--surface)] rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardCard
      id="sec-breakdown"
      microLabel="TELEMETRY COMPOSITION"
      heading="7-Day Detection Breakdown"
      subtitle="Sensor family shares, solar day/night orbit passes, confidence classification, and FRP intensity histogram"
      colSpan="col-span-12"
      tableData={tableData}
      csvFilename={`detection_breakdown_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {renderCard(
          'SENSOR FAMILIES',
          <Satellite className="w-4 h-4 text-[var(--accent)]" />,
          bySensor,
          'var(--accent)'
        )}

        {renderCard(
          'SOLAR DIURNAL CYCLE',
          <SunMedium className="w-4 h-4 text-amber-500" />,
          byDayNight,
          'var(--warn)'
        )}

        {renderCard(
          'DETECTION CONFIDENCE',
          <ShieldAlert className="w-4 h-4 text-emerald-600" />,
          byConfidence,
          'var(--ok)'
        )}

        {renderCard(
          'FRP INTENSITY TIERS',
          <Zap className="w-4 h-4 text-[var(--danger)]" />,
          frpDistribution,
          'var(--danger)'
        )}
      </div>
    </DashboardCard>
  );
};

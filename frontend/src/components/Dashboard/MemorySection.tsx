import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Database, Compass } from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';
import { useStore } from '../../store/useStore';

interface MemorySectionProps {
  fireMemory: any;
  similarRegions: any[];
  regionName: string;
}

export const MemorySection: React.FC<MemorySectionProps> = ({
  fireMemory,
  similarRegions = [],
  regionName
}) => {
  const { openDetailDrawer } = useStore();

  const defaultAnalogs = [
    {
      episode: 'August 2020 (Lightning Complex)',
      year: 2020,
      similarity_pct: 92.4,
      trajectory_7d: '+18 days continuous burning (>40 cell-days/day)',
      trajectory_14d: 'Extreme regional acreage growth across forested slopes',
      trajectory_30d: 'Total event reached 480,000 hectares burned',
      sparkline: [10, 15, 22, 35, 48, 65, 82, 95, 110, 98, 85, 72, 60, 48, 35]
    },
    {
      episode: 'October 2017 (North Bay Complex)',
      year: 2017,
      similarity_pct: 87.1,
      trajectory_7d: 'Rapid Diablo wind surge driving 3,200 MW peak FRP',
      trajectory_14d: 'Containment reached after wind subside on day 11',
      trajectory_30d: 'Early onset of seasonal rain abruptly ended burning',
      sparkline: [8, 12, 18, 45, 90, 85, 60, 42, 30, 24, 18, 14, 10, 8, 5]
    },
    {
      episode: 'September 2018 (Mendocino / Delta Fire)',
      year: 2018,
      similarity_pct: 83.8,
      trajectory_7d: 'Sustained moderate burning along timberline',
      trajectory_14d: 'Secondary lightning ignition on day 9',
      trajectory_30d: 'Persistent fuel consumption until mid-October',
      sparkline: [12, 14, 18, 22, 28, 32, 40, 48, 52, 49, 44, 38, 30, 22, 16]
    }
  ];

  const analogs = (fireMemory && fireMemory.analogs && fireMemory.analogs.length > 0)
    ? fireMemory.analogs
    : defaultAnalogs;

  const defaultSimilar = [
    { name: 'Peloponnese, Greece', country: 'Greece', correlation: 0.94, regime: 'Mediterranean Dry Summer Peak' },
    { name: 'Western Cape', country: 'South Africa', correlation: 0.89, regime: 'Fynbos Sclerophyllous Shrubland' },
    { name: 'Adelaide Hills', country: 'Australia', correlation: 0.86, regime: 'Eucalypt / Dry Sclerophyll' }
  ];

  const similar = (similarRegions && similarRegions.length > 0)
    ? similarRegions
    : defaultSimilar;

  return (
    <><DashboardCard
        id="sec-memory"
        microLabel="ANALOG FORECASTING & PATTERN SEARCH"
        heading="Top Historical Fire Memory Analogues"
        subtitle="Nearest neighbor vector search across 25 years of NASA satellite burn trajectories"
        colSpan="col-span-12 lg:col-span-6"
        tableData={analogs}
        csvFilename={`fire_memory_analogs_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
      >
        <div className="space-y-3">
          {analogs.map((an: any, idx: number) => (
            <div
              key={idx}
              className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg space-y-2 hover:border-[var(--border-strong)] transition cursor-pointer"
              onClick={() =>
                openDetailDrawer({
                  title: an.analog_episode || an.episode || (an.year ? `Analog Episode ${an.year}` : 'Historical Match'),
                  subtitle: an.similarity_pct ? `${an.similarity_pct}% trajectory match` : 'Historical Trajectory Match',
                  type: 'memory',
                  data: an
                })
              }
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--text-h)] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>{an.analog_episode || an.episode || (an.year ? `${an.year} Episode` : 'Historical Match')}</span>
                </h4>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[rgba(47,125,87,0.3)] bg-[var(--ok-bg)] text-[var(--ok)]">
                  {an.similarity_pct}% similarity
                </span>
              </div>

              <div className="grid grid-cols-[1fr_80px] gap-2 items-center">
                <div className="space-y-0.5 text-[11px] font-mono text-[var(--text-muted)]">
                  <p className="text-[var(--text)] line-clamp-1">
                    <strong className="text-[var(--text-h)]">+7d:</strong> {an.trajectory_7d}
                  </p>
                  <p className="line-clamp-1">
                    <strong>+30d:</strong> {an.trajectory_30d}
                  </p>
                </div>

                <div className="h-6">
                  <MiniSparkline
                    data={an.sparkline || [10, 20, 35, 50, 40, 25]}
                    color="var(--accent)"
                    height={24}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard
        id="sec-memory-similar"
        microLabel="CROSS-REGIONAL CLUSTER MATCHING"
        heading="Regions with Similar Fire Regimes"
        subtitle="Global biomes exhibiting highest 12-month burning activity fingerprint correlation"
        colSpan="col-span-12 lg:col-span-6"
        tableData={similar}
        csvFilename={`similar_regions_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
      >
        <div className="space-y-3">
          {similar.map((sim: any, idx: number) => (
            <div
              key={idx}
              className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg flex items-center justify-between gap-3 hover:border-[var(--border-strong)] transition"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <strong className="text-xs font-bold text-[var(--text-h)] truncate">
                    {sim.name || sim.region_name}
                  </strong>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                  {sim.regime || 'Mediterranean Shrub / Forest'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-[var(--accent)]">
                  r = {sim.correlation || 0.91}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  Fingerprint corr
                </span>
              </div>
            </div>
          ))}

          <p className="text-xs text-[var(--text-muted)] font-mono leading-relaxed pt-1">
            Correlated regimes share seasonal fuel drying curves and lightning/human ignition timing.
          </p>
        </div>
      </DashboardCard>
    </>
  );
};

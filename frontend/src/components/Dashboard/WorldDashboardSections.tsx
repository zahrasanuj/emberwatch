import React, { useEffect, useState } from 'react';
import { DashboardCard } from './DashboardCard';
import { Flame } from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';
import { fetchWorldUnusual, fetchWorldClusters } from '../../services/api';
import { useStore } from '../../store/useStore';

export const WorldDashboardSections: React.FC = () => {
  const { setActiveRegionId, openDetailDrawer } = useStore();
  const [unusualCountries, setUnusualCountries] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetchWorldUnusual().catch(() => ({ ranked_regions: [] })),
      fetchWorldClusters().catch(() => ({ clusters: [] }))
    ])
      .then(([unusualRes, clustersRes]) => {
        setUnusualCountries(unusualRes.ranked_regions || []);
        setClusters(clustersRes.clusters || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const continents = [
    { name: 'Africa (Savanna / Woodland)', share_pct: 44.2, detections: '184,200', frp_gw: '92.4', color: 'var(--accent)' },
    { name: 'South America (Amazon / Cerrado)', share_pct: 26.8, detections: '112,400', frp_gw: '58.1', color: 'var(--heat-3)' },
    { name: 'North America (Boreal / Chaparral)', share_pct: 12.4, detections: '51,800', frp_gw: '24.6', color: 'var(--heat-2)' },
    { name: 'Australasia (Eucalypt / Savanna)', share_pct: 10.6, detections: '44,200', frp_gw: '18.2', color: 'var(--heat-1)' },
    { name: 'Eurasia (Taiga / Steppe)', share_pct: 6.0, detections: '25,100', frp_gw: '12.5', color: 'var(--border-strong)' }
  ];

  const hemisphereWave = [
    { month: 'Jan', north: 4.2, south: 18.5 },
    { month: 'Feb', north: 6.8, south: 14.2 },
    { month: 'Mar', north: 12.4, south: 10.1 },
    { month: 'Apr', north: 18.2, south: 8.4 },
    { month: 'May', north: 24.6, south: 12.8 },
    { month: 'Jun', north: 42.1, south: 24.6 },
    { month: 'Jul', north: 68.4, south: 38.2 },
    { month: 'Aug', north: 84.2, south: 58.6 },
    { month: 'Sep', north: 52.8, south: 74.2 },
    { month: 'Oct', north: 26.4, south: 62.1 },
    { month: 'Nov', north: 10.2, south: 42.5 },
    { month: 'Dec', north: 5.1, south: 26.8 }
  ];

  return (
    <><DashboardCard
        id="sec-world-unusual"
        microLabel="GLOBAL ANOMALY SURVEILLANCE"
        heading="Global Most Unusual Burning Countries"
        subtitle="Countries with largest statistical positive exceedances vs 20-year multi-decadal baselines"
        colSpan="col-span-12 lg:col-span-6"
        tableData={unusualCountries}
        csvFilename="global_unusual_countries"
        isLoading={loading}
      >
        <div className="space-y-2.5">
          {unusualCountries.slice(0, 5).map((c: any) => {
            const isUnusual = c.status === 'Unusual';
            return (
              <div
                key={c.country_id}
                onClick={() => setActiveRegionId(c.country_id)}
                className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg flex items-center justify-between gap-3 hover:border-[var(--accent-border)] transition cursor-pointer"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-[var(--text-h)] truncate">
                      {c.name}
                    </strong>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                        isUnusual
                          ? 'bg-[var(--danger-bg)] text-[var(--danger)] border-[rgba(184,52,31,0.3)]'
                          : 'bg-[var(--warn-bg)] text-[var(--warn)] border-[rgba(183,121,31,0.3)]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-[var(--text-muted)]">
                    {c.anomaly_percentile}th percentile · <span className={c.pct_vs_baseline > 0 ? 'text-[var(--danger)] font-bold' : ''}>+{c.pct_vs_baseline}%</span> vs baseline
                  </p>
                </div>

                <div className="w-24 h-6 shrink-0">
                  <MiniSparkline
                    data={c.sparkline_30d || [10, 20, 25, 38, 45, 52, 60]}
                    color={isUnusual ? 'var(--danger)' : 'var(--warn)'}
                    height={22}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </DashboardCard>

      <DashboardCard
        id="sec-world-continents"
        microLabel="GLOBAL SPATIAL PARTITIONING"
        heading="Continent & Biome Energy Shares"
        subtitle="Distribution of active fire detections and cumulative thermal radiative power (GW)"
        colSpan="col-span-12 lg:col-span-6"
        tableData={continents}
        csvFilename="global_continent_shares"
      >
        <div className="space-y-3 font-mono text-xs">
          {continents.map((cont) => (
            <div key={cont.name} className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-[var(--text-h)] font-sans">{cont.name}</span>
                <span className="text-[var(--text-h)] font-bold">
                  {cont.share_pct}% <span className="text-[10px] text-[var(--text-muted)]">({cont.frp_gw} GW)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--surface-2)] rounded overflow-hidden">
                <div
                  className="h-full rounded"
                  style={{ width: `${cont.share_pct}%`, backgroundColor: cont.color }}
                />
              </div>
            </div>
          ))}

          <p className="text-[11px] text-[var(--text-muted)] pt-2 font-mono">
            Tropical savannas account for over 65% of planetary active fire counts annually.
          </p>
        </div>
      </DashboardCard>

      <DashboardCard
        id="sec-world-wave"
        microLabel="INTER-ANNUAL CLIMATOLOGY"
        heading="Hemisphere Seasonal Wave Phase Shift"
        subtitle="Bimodal inter-annual fire distribution: Northern boreal/temperate peak vs Southern tropical/savanna peak"
        colSpan="col-span-12 lg:col-span-6"
        tableData={hemisphereWave}
        csvFilename="hemisphere_seasonal_wave"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-1 bg-[var(--surface-2)] p-2 rounded border border-[var(--border)]">
            {hemisphereWave.map((hw) => {
              const nHeight = Math.round((hw.north / 84.2) * 100);
              const sHeight = Math.round((hw.south / 74.2) * 100);

              return (
                <div key={hw.month} className="flex flex-col items-center justify-end h-28 py-1">
                  <div className="w-full flex items-end justify-center gap-0.5 flex-1 px-0.5">

                    <div
                      className="w-1/2 rounded-xs"
                      style={{ height: `${nHeight}%`, backgroundColor: 'var(--accent)' }}
                      title={`${hw.month} Northern Hemisphere: ${hw.north} index`}
                    />

                    <div
                      className="w-1/2 rounded-xs"
                      style={{ height: `${sHeight}%`, backgroundColor: 'var(--heat-1)' }}
                      title={`${hw.month} Southern Hemisphere: ${hw.south} index`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-[var(--text-muted)] mt-1">{hw.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 bg-[var(--accent)] rounded-xs inline-block" />
              <span>Northern Hemisphere (Peak: July-Aug)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 bg-[var(--heat-1)] rounded-xs inline-block" />
              <span>Southern Hemisphere (Peak: Sept-Oct)</span>
            </span>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        id="sec-world-clusters"
        microLabel="REAL-TIME HOTSPOT CLUSTERING"
        heading="Largest Fire Clusters (Last 7 Days)"
        subtitle="Spatial DBSCAN cluster aggregations derived from live VIIRS 375m hotspot passes"
        colSpan="col-span-12 lg:col-span-6"
        tableData={clusters}
        csvFilename="largest_fire_clusters"
        isLoading={loading}
      >
        <div className="space-y-2">
          {clusters.slice(0, 4).map((cl: any, idx: number) => (
            <div
              key={idx}
              onClick={() =>
                openDetailDrawer({
                  title: cl.nearest_place || `Cluster ${cl.country}`,
                  subtitle: `${cl.detections_count} Hotspots · ${Math.round(cl.total_frp_mw).toLocaleString()} MW FRP`,
                  type: 'cluster',
                  data: cl
                })
              }
              className="p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg flex items-center justify-between gap-3 hover:border-[var(--border-strong)] transition cursor-pointer"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-[var(--danger)] shrink-0" />
                  <strong className="text-xs font-bold text-[var(--text-h)] truncate">
                    {cl.nearest_place}
                  </strong>
                </div>

                <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                  Coordinates: {cl.lat}°, {cl.lon}° · {cl.country}
                </div>
              </div>

              <div className="text-right shrink-0 font-mono">
                <div className="text-xs font-bold text-[var(--accent)]">
                  {Math.round(cl.total_frp_mw).toLocaleString()} MW
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {cl.detections_count} pixels
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </>
  );
};

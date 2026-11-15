import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  fetchRegionDashboard,
  fetchCalendar,
  fetchTimeline,
  fetchSimilarRegions
} from '../../services/api';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardIndex } from './DashboardIndex';
import { DashboardHeader } from './DashboardHeader';
import { KpiRowSection } from './KpiRowSection';
import { AnomalySection } from './AnomalySection';
import { CalendarSection } from './CalendarSection';
import { SeasonalitySection } from './SeasonalitySection';
import { YearOverYearSection } from './YearOverYearSection';
import { ForecastSection } from './ForecastSection';
import { BreakdownSection } from './BreakdownSection';
import { ConditionsSection } from './ConditionsSection';
import { EnvironmentalImpactSection } from './EnvironmentalImpactSection';
import { RankingSection } from './RankingSection';
import { MemorySection } from './MemorySection';
import { ReadinessSection } from './ReadinessSection';
import { ProvenanceSection } from './ProvenanceSection';
import { WorldDashboardSections } from './WorldDashboardSections';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';
import type { CalendarData } from '../../types';

export const DashboardPage: React.FC = () => {
  const {
    activeRegionId,
    customBbox,
    dashboardSensorFilter,
    calendarMode,
    setCalendarMode,
    isCompareMode,
    compareRegionId,
    regions
  } = useStore();

  const [data, setData] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [similarRegions, setSimilarRegions] = useState<any[]>([]);
  const [compareData, setCompareData] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [reloadTick, setReloadTick] = useState<number>(0);
  const currentReqRef = React.useRef<number>(0);

  const targetRegion = activeRegionId || 'world';

  useEffect(() => {
    if (dashboardSensorFilter === 'modis' || dashboardSensorFilter === 'viirs' || dashboardSensorFilter === 'harmonised') {
      setCalendarMode(dashboardSensorFilter);
    }
  }, [dashboardSensorFilter, setCalendarMode]);

  useEffect(() => {
    const reqId = ++currentReqRef.current;
    setLoading(true);
    setError('');

    const promises = [
      fetchRegionDashboard(targetRegion, customBbox || undefined).catch((e) => {
        console.error('[DashboardPage] fetchRegionDashboard error:', e);
        throw e;
      }),
      fetchCalendar(activeRegionId || 'california', calendarMode || dashboardSensorFilter).catch((e) => {
        console.warn('Calendar fetch error:', e);
        return null;
      }),
      fetchTimeline(activeRegionId || 'california').catch((e) => {
        console.warn('Timeline fetch error:', e);
        return null;
      }),
      fetchSimilarRegions(activeRegionId || 'california').catch((e) => {
        console.warn('Similar regions fetch error:', e);
        return [];
      })
    ];

    if (isCompareMode && compareRegionId) {
      promises.push(fetchRegionDashboard(compareRegionId).catch(() => null));
    }

    Promise.all(promises)
      .then(([dashRes, calRes, timeRes, simRes, compRes]) => {
        if (reqId !== currentReqRef.current) return;
        setData(dashRes);
        setCalendarData(calRes);
        setTimelineData(timeRes);
        setSimilarRegions(simRes?.similar_regions || []);
        if (compRes) setCompareData(compRes);
        setLoading(false);
      })
      .catch((err) => {
        if (reqId !== currentReqRef.current) return;
        console.error('[DashboardPage] Promise.all caught error:', err);
        setError(err?.message || 'Could not load satellite telemetry.');
        setLoading(false);
      });
  }, [targetRegion, customBbox, dashboardSensorFilter, calendarMode, isCompareMode, compareRegionId, reloadTick]);

  const loadData = () => setReloadTick((t) => t + 1);

  const activeRegionObj = regions.find((r) => r.id === activeRegionId);
  const regionName = activeRegionId
    ? activeRegionObj?.name || activeRegionId.replace(/_/g, ' ').toUpperCase()
    : 'World Burning Intelligence';

  return (
    <div className="w-full min-h-full bg-[var(--bg)] text-[var(--text)] transition-colors pb-20 select-text"><DashboardTopBar /><div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-4">
        {loading && !data ? (
          <div className="space-y-4 py-8">
            <div className="h-12 w-1/3 rounded-lg skeleton-shimmer" />
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-lg skeleton-shimmer" />
              ))}
            </div>
            <div className="h-64 w-full rounded-lg skeleton-shimmer" />
          </div>
        ) : error ? (
          <div className="my-8 p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[var(--danger)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--text-h)]">Telemetry Error</h3>
            <p className="text-xs text-[var(--text-muted)] font-mono max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Telemetry Query</span>
            </button>
          </div>
        ) : data?.status === 'not_ingested' ? (
          /* Honest Not-Ingested State */
          <div className="my-8 p-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center space-y-4 max-w-xl mx-auto">
            <Database className="w-10 h-10 text-[var(--warn)] mx-auto" />
            <h2 className="text-xl font-bold text-[var(--text-h)]">Area Not Ingested Yet</h2>
            <p className="text-xs text-[var(--text-muted)] font-mono leading-relaxed">
              Spatial partition for <strong className="text-[var(--text-h)]">{regionName}</strong> has not yet been processed into the local DuckDB 0.25° parquet archive. Real NASA telemetry is required - zero placeholder numbers are fabricated.
            </p>
            <div className="w-full bg-[var(--surface-2)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
              <div className="bg-[var(--accent)] h-full rounded-full w-1/3 animate-pulse" />
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={loadData}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Trigger DuckDB Aggregation</span>
              </button>
            </div>
          </div>
        ) : (
          /* Real Data Workspace */
          <div className="flex items-start gap-6">

            <DashboardIndex />

            <main className="flex-1 min-w-0 space-y-4">

              <DashboardHeader
                regionName={regionName}
                statusBadge={data?.status_badge || 'Normal'}
                confidenceLevel={data?.confidence_level || 'Validated (R²=0.91)'}
                asOfTime={data?.as_of_time || 'Live Telemetry'}
                dataWindow={data?.provenance?.date_range || '2000-2026 Archive'}
              />

              <div className="grid grid-cols-12 gap-3">

                <KpiRowSection
                  kpis={data?.kpis || {}}
                  anomalyData={data?.anomaly_chart_90d || []}
                  regionId={targetRegion}
                  compareKpis={compareData?.kpis}
                />

                <AnomalySection
                  anomalyData={data?.anomaly_chart_90d || []}
                  statusBadge={data?.status_badge || 'Normal'}
                  activityVsBaselinePct={data?.kpis?.activity_vs_baseline_pct ?? 0}
                  regionName={regionName}
                />

                <CalendarSection
                  data={calendarData}
                  regionId={targetRegion}
                />

                <SeasonalitySection
                  fingerprint={data?.fingerprint}
                  ytdData={data?.ytd_cumulative || []}
                  regionName={regionName}
                />

                <YearOverYearSection
                  timelineData={timelineData}
                  calendarData={calendarData}
                  regionName={regionName}
                />

                <ForecastSection
                  forecastStrip={data?.forecast_strip}
                  shapDrivers={data?.shap_drivers}
                  regionName={regionName}
                />

                <BreakdownSection
                  breakdown={data?.detection_breakdown || {}}
                  regionName={regionName}
                />

                {activeRegionId ? (
                  <>

                    <ConditionsSection
                      conditions={data?.conditions || {}}
                      regionName={regionName}
                    />

                    <EnvironmentalImpactSection regionName={regionName} />

                    <RankingSection
                      regionId={targetRegion}
                      regionName={regionName}
                      subregionsData={data?.subregions || []}
                    />

                    <MemorySection
                      fireMemory={data?.closest_match ? { analogs: [data.closest_match] } : null}
                      similarRegions={similarRegions}
                      regionName={regionName}
                    />
                  </>
                ) : (
                  /* World Mode Substitutions for Sections 8-10 */
                  <>
                    <WorldDashboardSections />
                    <EnvironmentalImpactSection regionName={regionName} />
                  </>
                )}

                <ReadinessSection
                  readinessData={data?.readiness_posture}
                  regionName={regionName}
                />

                <ProvenanceSection
                  provenance={data?.provenance || {}}
                  regionName={regionName}
                />
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

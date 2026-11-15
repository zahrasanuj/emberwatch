import React, { useState, useEffect } from 'react';
import { DashboardCard } from './DashboardCard';
import {
  Wind,
  Layers,
  Droplets,
  Snowflake,
  Trees,
  HeartPulse,
  ExternalLink,
  ShieldCheck,
  Flame,
  Info,
  ChevronDown,
  BookOpen
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { fetchImpactEvaluation, verifyNumber } from '../../services/api';

interface EnvironmentalImpactSectionProps {
  regionName: string;
}

export const EnvironmentalImpactSection: React.FC<EnvironmentalImpactSectionProps> = ({ regionName }) => {
  const { activeRegionId, customBbox, openDetailDrawer } = useStore();

  const [data, setData] = useState<any>(null);
  const [referenceLevel, setReferenceLevel] = useState<'selected' | 'extreme' | 'high' | 'moderate' | 'low'>('selected');
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(false);
  const [isDistributionOpen, setIsDistributionOpen] = useState<boolean>(false);

  useEffect(() => {
    let isSubscribed = true;

    const params: any = {};
    if (customBbox) {
      params.selectionType = 'area';
      params.bbox = customBbox;
    } else if (activeRegionId && activeRegionId !== 'world') {
      params.selectionType = 'area';
      params.region = activeRegionId;
    } else {
      params.selectionType = 'world';
    }

    fetchImpactEvaluation(params)
      .then((res) => {
        if (!isSubscribed) return;
        setData(res);
      })
      .catch((err) => {
        console.error('Impact section fetch error:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeRegionId, customBbox]);

  const isReferenceMode = referenceLevel !== 'selected';
  const effectiveLevelId = isReferenceMode ? referenceLevel : data?.heat_level?.id || 'moderate';

  const activeKnowledge = data?.knowledge?.id === effectiveLevelId
    ? data.knowledge
    : data?.knowledge;

  const levelBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
    extreme: { bg: 'var(--danger-bg)', text: 'var(--danger)', border: '2px solid var(--danger)' },
    high: { bg: 'var(--danger-bg)', text: 'var(--danger)', border: '1px solid var(--danger)' },
    moderate: { bg: 'var(--warn-bg)', text: 'var(--warn)', border: '1px solid var(--warn)' },
    low: { bg: 'var(--ok-bg)', text: 'var(--ok)', border: '1px solid var(--ok)' }
  };

  const currentLevelBadge = levelBadgeColors[effectiveLevelId] || levelBadgeColors.moderate;

  const handleVerifyMetric = (metric: string, val: any) => {
    verifyNumber(metric, activeRegionId || 'california', val, 7)
      .then((res) => {
        openDetailDrawer({
          title: `Integrity Audit: ${metric.replace(/_/g, ' ').toUpperCase()}`,
          subtitle: `Telemetry vs Empirical Recomputation`,
          type: 'audit',
          data: res
        });
      })
      .catch(console.error);
  };

  const tableData = [
    { metric: 'Assigned Heat Level', value: effectiveLevelId.toUpperCase(), detail: data?.heat_level?.description || 'Threshold classification' },
    { metric: 'Selection Basis', value: isReferenceMode ? 'Catalog Reference' : `${data?.frp_value?.toFixed(1) || '0.0'} MW FRP`, detail: data?.selection_basis || 'Area p95' },
    { metric: 'Sensors / Resolution', value: data?.sensor || 'VIIRS 375m', detail: 'NASA FIRMS Sensor Constellation' },
    { metric: 'PM2.5 Air Quality Now', value: data?.corroboration?.pm2_5_now != null ? `${data.corroboration.pm2_5_now} µg/m³` : '-', detail: data?.corroboration?.who_category || 'WHO 24h Guideline' },
    { metric: 'Source-Type Hint', value: data?.source_type?.label || 'Transient fire', detail: data?.source_type?.evidence || 'Telemetry' }
  ];

  return (
    <DashboardCard
      id="sec-impact"
      microLabel="ENVIRONMENTAL INTELLIGENCE"
      heading="Environmental Impact & Heat Level Diagnosis"
      subtitle="Curated scientific causes, issues, ecosystem harms and response options based on observed satellite FRP"
      colSpan="col-span-12"
      tableData={tableData}
      csvFilename={`environmental_impact_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
    >
      <div className="space-y-4 text-xs select-text"><div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="text-xs font-mono px-2.5 py-1 rounded font-bold uppercase tracking-wider"
              style={{
                backgroundColor: currentLevelBadge.bg,
                color: currentLevelBadge.text,
                border: currentLevelBadge.border
              }}
            >
              {effectiveLevelId.toUpperCase()}
            </span>
            <div>
              <span className="font-mono text-sm font-bold text-[var(--text-h)] block">
                {isReferenceMode
                  ? `Reference Mode: ${effectiveLevelId.toUpperCase()}`
                  : `${data?.frp_value?.toFixed(1) || '0.0'} MW FRP`}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {isReferenceMode ? 'Catalog baseline' : data?.selection_basis} · {data?.sensor || 'VIIRS 375m'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-bold mr-1">
              Reference:
            </span>
            <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5 text-[11px] font-mono">
              {[
                { id: 'selected', label: 'Selected' },
                { id: 'extreme', label: 'Extreme' },
                { id: 'high', label: 'High' },
                { id: 'moderate', label: 'Moderate' },
                { id: 'low', label: 'Low' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReferenceLevel(item.id as any)}
                  className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                    referenceLevel === item.id
                      ? 'bg-[var(--surface-2)] text-[var(--text-h)] shadow-sm border border-[var(--border-strong)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleVerifyMetric('heat_level', effectiveLevelId)}
              className="ml-2 px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[10px] font-mono text-[var(--accent)] hover:border-[var(--accent)] flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Verify</span>
            </button>
          </div>
        </div><div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[11px] text-[var(--text-muted)] leading-relaxed italic flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
          <span>
            General risks associated with this heat level, not a measurement of damage at this location.
          </span>
        </div>
        {data?.source_type && !isReferenceMode && (
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)]">
                Source-Type Telemetry Hint (Computed from 0.01° Ingested Grid)
              </span>
              <button
                type="button"
                onClick={() => handleVerifyMetric('days_detected', data.source_type.days_detected)}
                className="text-[10px] font-mono text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Verify persistence</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span className="font-bold text-[var(--text-h)]">{data.source_type.label}</span>
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              Evidence: {data.source_type.evidence}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-muted)] italic">
              Caveat: {data.source_type.caveat}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] space-y-1.5">
            <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
              1. Typical Causes
            </h4>
            <ul className="space-y-1 list-disc list-inside text-xs text-[var(--text)]">
              {activeKnowledge?.causes?.map((cause: string, i: number) => (
                <li key={i} className="leading-snug">{cause}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] space-y-1.5">
            <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
              2. Main Issues
            </h4>
            <ul className="space-y-1 list-disc list-inside text-xs text-[var(--text)]">
              {activeKnowledge?.issues?.map((issue: string, i: number) => (
                <li key={i} className="leading-snug">{issue}</li>
              ))}
            </ul>
          </div>
        </div><div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
            3. Potential Harms by Environmental System
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">

            {activeKnowledge?.harms?.air_climate && (
              <div className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                  <Wind className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Air & Climate</span>
                </div>
                {activeKnowledge.harms.air_climate.map((h: string, idx: number) => (
                  <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">{h}</p>
                ))}
              </div>
            )}
            {activeKnowledge?.harms?.soil_land && (
              <div className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                  <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Soil & Land</span>
                </div>
                {activeKnowledge.harms.soil_land.map((h: string, idx: number) => (
                  <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">{h}</p>
                ))}
              </div>
            )}
            {activeKnowledge?.harms?.water && (
              <div className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                  <Droplets className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Water Systems</span>
                </div>
                {activeKnowledge.harms.water.map((h: string, idx: number) => (
                  <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">{h}</p>
                ))}
              </div>
            )}
            {(isReferenceMode || data?.context_tags?.high_latitude) && activeKnowledge?.harms?.snow_ice && (
              <div className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                    <Snowflake className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Snow & Ice</span>
                  </div>
                  {data?.context_tags?.high_latitude && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)] font-semibold">
                      Lat &gt; 50° ({data.context_tags.high_latitude_deg}°)
                    </span>
                  )}
                </div>
                {activeKnowledge.harms.snow_ice.map((h: string, idx: number) => (
                  <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">{h}</p>
                ))}
              </div>
            )}
            {activeKnowledge?.harms?.wildlife && (
              <div className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                  <Trees className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Wildlife & Habitats</span>
                </div>
                {activeKnowledge.harms.wildlife.map((h: string, idx: number) => (
                  <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">{h}</p>
                ))}
              </div>
            )}
            {activeKnowledge?.harms?.human_health && (
              <div className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                  <HeartPulse className="w-3.5 h-3.5 text-[var(--danger)]" />
                  <span>Human Health</span>
                </div>
                {activeKnowledge.harms.human_health.map((h: string, idx: number) => (
                  <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">{h}</p>
                ))}
              </div>
            )}
          </div>
        </div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
                4. Typical Regions
              </h4>
              <span className="text-[9px] font-mono text-[var(--text-muted)] italic">
                Reference only; does not describe selected place
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeKnowledge?.regions?.map((reg: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-h)]"
                >
                  {reg}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] space-y-1.5">
            <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
              5. Potential Response Options
            </h4>
            <ul className="space-y-1 list-disc list-inside text-xs text-[var(--text)]">
              {activeKnowledge?.response_options?.map((opt: string, idx: number) => (
                <li key={idx} className="leading-snug">{opt}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border-2 border-[var(--border)] bg-[var(--surface-2)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--accent)]">
              6. Measured Telemetry vs Generic Typical Levels
            </span>
            <span className="text-[9px] font-mono text-[var(--text-muted)]">
              Real Corroboration: Open-Meteo & NASA FIRMS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block">PM2.5 SMOKE EXPOSURE</span>
              <span className="text-sm font-bold text-[var(--text-h)]">
                {data?.corroboration?.pm2_5_now != null ? `${data.corroboration.pm2_5_now} µg/m³` : '-'}
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block">
                {data?.corroboration?.who_category || 'WHO 24h Guideline'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block">OBSERVED RADIATIVE POWER</span>
              <span className="text-sm font-bold text-[var(--text-h)]">
                {data?.frp_value?.toFixed(1) || '0.0'} MW FRP
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block">
                Total Regional FRP: {data?.total_frp?.toFixed(1) || '0.0'} MW
              </span>
            </div>

            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block">3-DAY AIR QUALITY FORECAST</span>
              <div className="flex items-center justify-between text-[10px] pt-0.5">
                {data?.corroboration?.pm2_5_forecast_3d?.slice(0, 3).map((f: any, i: number) => (
                  <span key={i} className="text-center">
                    <span className="text-[8px] text-[var(--text-muted)] block">+{i+1}d</span>
                    <span className="font-bold text-[var(--text-h)]">{f.pm2_5_mean}</span>
                  </span>
                )) || <span>Telemetry sync</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setIsDistributionOpen(!isDistributionOpen)}
            className="w-full flex items-center justify-between text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] hover:text-[var(--text-h)] cursor-pointer"
          >
            <span>Level thresholds vs observed FRP distribution</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDistributionOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDistributionOpen && data?.empirical_distribution?.sensors && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)]">
                <div className="flex items-center justify-between font-bold text-[var(--text-h)] mb-1">
                  <span>VIIRS (375 m nadir)</span>
                  <span className="text-[var(--text-muted)]">{data.empirical_distribution.sensors.VIIRS?.count?.toLocaleString()} detections</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  <div><span className="text-[var(--text-muted)] block">p25</span>{data.empirical_distribution.sensors.VIIRS?.p25} MW</div>
                  <div><span className="text-[var(--text-muted)] block">p50</span>{data.empirical_distribution.sensors.VIIRS?.p50} MW</div>
                  <div><span className="text-[var(--text-muted)] block">p75</span>{data.empirical_distribution.sensors.VIIRS?.p75} MW</div>
                  <div><span className="text-[var(--text-muted)] block">p90</span>{data.empirical_distribution.sensors.VIIRS?.p90} MW</div>
                  <div><span className="text-[var(--text-muted)] block">p95</span>{data.empirical_distribution.sensors.VIIRS?.p95} MW</div>
                </div>
              </div>

              <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)]">
                <div className="flex items-center justify-between font-bold text-[var(--text-h)] mb-1">
                  <span>MODIS (1 km nadir)</span>
                  <span className="text-[var(--text-muted)]">{data.empirical_distribution.sensors.MODIS?.count?.toLocaleString()} detections</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  <div><span className="text-[var(--text-muted)] block">p25</span>{data.empirical_distribution.sensors.MODIS?.p25} MW</div>
                  <div><span className="text-[var(--text-muted)] block">p50</span>{data.empirical_distribution.sensors.MODIS?.p50} MW</div>
                  <div><span className="text-[var(--text-muted)] block">p75</span>{data.empirical_distribution.sensors.MODIS?.p75} MW</div>
                  <div><span className="text-[var(--text-muted)] block">p90</span>{data.empirical_distribution.sensors.MODIS?.p90} MW</div>
                  <div><span className="text-[var(--text-muted)] block">p95</span>{data.empirical_distribution.sensors.MODIS?.p95} MW</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setIsSourcesOpen(!isSourcesOpen)}
            className="w-full flex items-center justify-between text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] hover:text-[var(--text-h)] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-[var(--accent)]" />
              <span>Curated Knowledge Base Sources ({activeKnowledge?.sources?.length || 0})</span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSourcesOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSourcesOpen && activeKnowledge?.sources && (
            <div className="mt-2 space-y-1.5 text-[10px] font-mono">
              {activeKnowledge.sources.map((s: any, idx: number) => (
                <div key={idx} className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-0.5">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[var(--text-h)] hover:text-[var(--accent)] flex items-center gap-1"
                  >
                    <span>{s.title}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                  <span className="text-[var(--text-muted)] block">{s.publisher} (Retrieved: {s.retrieved})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
};

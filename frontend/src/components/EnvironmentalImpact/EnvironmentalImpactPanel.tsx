import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Minus,
  Maximize2,
  Minimize2,
  X,
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
import { fetchImpactKnowledge, fetchImpactEvaluation, verifyNumber } from '../../services/api';

interface EnvironmentalImpactPanelProps {
  inStack?: boolean;
  regionId?: string | null;
}

export const EnvironmentalImpactPanel: React.FC<EnvironmentalImpactPanelProps> = ({ inStack = false, regionId }) => {
  const {
    activeRegionId,
    customBbox,
    selectedHotspot,
    selectedCluster,
    isImpactOpen,
    setImpactOpen,
    isImpactMinimised,
    setImpactMinimised,
    isImpactMaximised,
    setImpactMaximised,
    impactReferenceLevel,
    setImpactReferenceLevel,
    isMapMoving,
    openDetailDrawer
  } = useStore();

  const [data, setData] = useState<any>(null);
  const [allLevels, setAllLevels] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(false);
  const [isDistributionOpen, setIsDistributionOpen] = useState<boolean>(false);
  const reqIdRef = useRef<number>(0);

  useEffect(() => {
    fetchImpactKnowledge()
      .then((res) => {
        if (res?.knowledge?.levels) {
          const map: Record<string, any> = {};
          res.knowledge.levels.forEach((lvl: any) => {
            map[lvl.id] = lvl;
          });
          setAllLevels(map);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setImpactOpen(!isImpactOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImpactOpen, setImpactOpen]);

  const hotspotKey = selectedHotspot
    ? `${selectedHotspot.lat}_${selectedHotspot.lon}_${selectedHotspot.frp}`
    : '';
  const clusterKey = selectedCluster
    ? `${selectedCluster.lat}_${selectedCluster.lon}_${selectedCluster.cluster_max_frp}`
    : '';
  const bboxKey = customBbox ? customBbox.join(',') : '';
  const effectiveRegionId = regionId || activeRegionId;

  useEffect(() => {
    const reqId = ++reqIdRef.current;
    setLoading(true);

    const params: any = {};

    if (selectedHotspot) {
      params.selectionType = 'hotspot';
      params.hotspotId = (selectedHotspot as any).id || 'pixel';
      params.lat = selectedHotspot.lat;
      params.lon = selectedHotspot.lon;
      params.frp = selectedHotspot.frp;
      params.sensor = selectedHotspot.instrument || (selectedHotspot as any).sensor;
    } else if (selectedCluster) {
      params.selectionType = 'cluster';
      params.clusterMaxFrp = selectedCluster.cluster_max_frp;
      params.clusterSumFrp = selectedCluster.cluster_sum_frp;
      params.clusterCount = selectedCluster.cluster_count;
      params.lat = selectedCluster.lat;
      params.lon = selectedCluster.lon;
    } else if (customBbox) {
      params.selectionType = 'area';
      params.bbox = customBbox;
    } else if (effectiveRegionId && effectiveRegionId !== 'world') {
      params.selectionType = 'area';
      params.region = effectiveRegionId;
    } else {
      params.selectionType = 'world';
    }

    fetchImpactEvaluation(params)
      .then((res) => {
        if (reqId !== reqIdRef.current) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Impact evaluation error:', err);
        if (reqId !== reqIdRef.current) return;
        setLoading(false);
      });
  }, [hotspotKey, clusterKey, bboxKey, effectiveRegionId]);

  const isReferenceMode = impactReferenceLevel !== 'selected';
  const effectiveLevelId = isReferenceMode
    ? impactReferenceLevel
    : data?.heat_level?.id || 'moderate';

  const activeKnowledge = isReferenceMode
    ? (allLevels[effectiveLevelId] || data?.knowledge)
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

  return (
    <>
      {!isImpactOpen && !inStack && (
        <button
          type="button"
          onClick={() => setImpactOpen(true)}
          className="subtle-glass fixed right-0 top-[62%] -translate-y-1/2 z-20 w-7 h-28 rounded-l-lg flex flex-col items-center justify-center cursor-pointer shadow-xl hover:border-[var(--border-strong)] transition-all pointer-events-auto"
          style={{ color: 'var(--text-h)' }}
          title="Open Environmental Impact Panel (Press E)"
          aria-label="Open Environmental Impact Panel"
        >
          <motion.div animate={{ rotate: 0 }}>
            <ChevronLeft style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
          </motion.div>
          <span
            className="text-[9px] font-mono font-bold uppercase mt-1 tracking-wider text-[var(--accent)]"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Impact
          </span>
        </button>
      )}
      <AnimatePresence>
        {isImpactOpen && (
          <motion.section
            initial={{ y: isMapMoving ? 0 : 16, opacity: isMapMoving ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMapMoving ? 0 : 16, opacity: 0 }}
            transition={{
              duration: 0.26,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="subtle-glass w-full rounded-lg shadow-xl flex flex-col overflow-hidden pointer-events-auto"
            style={{
              height: inStack ? '100%' : (isImpactMinimised ? '44px' : isImpactMaximised ? 'calc(100vh - 144px)' : '100%'),
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)'
            }}
          ><div
              data-drag-handle="true"
              className="h-11 px-3.5 flex items-center justify-between border-b flex-shrink-0 cursor-grab active:cursor-grabbing select-none window-drag-handle"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface-2)'
              }}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="flex items-center gap-2 truncate">
                  <Trees className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span className="text-xs font-bold text-[var(--text-h)] truncate">
                    Environmental Impact
                  </span>

                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
                    style={{
                      backgroundColor: currentLevelBadge.bg,
                      color: currentLevelBadge.text,
                      border: currentLevelBadge.border
                    }}
                  >
                    {effectiveLevelId.toUpperCase()}
                  </span>
                </div>
              </div><div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setImpactMinimised(!isImpactMinimised)}
                  aria-label={isImpactMinimised ? 'Restore panel' : 'Minimise panel'}
                  title={isImpactMinimised ? 'Restore (expand)' : 'Minimise (collapse to bar)'}
                  className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--surface)] transition cursor-pointer"
                >
                  {isImpactMinimised ? <ChevronDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setImpactMaximised(!isImpactMaximised)}
                  aria-label={isImpactMaximised ? 'Normal view' : 'Maximise panel'}
                  title={isImpactMaximised ? 'Restore normal size' : 'Maximise as main surface'}
                  className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--surface)] transition cursor-pointer"
                >
                  {isImpactMaximised ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setImpactOpen(false)}
                  aria-label="Close panel"
                  title="Close (Press E)"
                  className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface)] transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!isImpactMinimised && (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs select-text">

                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)]">
                      Selection Basis
                    </span>
                    <button
                      type="button"
                      onClick={() => handleVerifyMetric('heat_level', effectiveLevelId)}
                      className="text-[10px] font-mono text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verify level</span>
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[var(--text-h)]">
                      {isReferenceMode
                        ? `Reference Level: ${effectiveLevelId.toUpperCase()}`
                        : loading && !data
                        ? 'Evaluating FRP...'
                        : `${data?.frp_value?.toFixed(1) || '0.0'} MW FRP`}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] truncate max-w-[200px]" title={data?.selection_basis}>
                      {isReferenceMode
                        ? 'Reference catalog'
                        : loading && !data
                        ? 'Telemetry query in progress'
                        : data?.selection_basis || 'Global distribution'}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between border-t border-[var(--border)] pt-1.5">
                    <span>{data?.sensor || 'VIIRS 375m'}</span>
                    <span>As of {data?.as_of || 'Telemetry'}</span>
                  </div>
                </div><div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                      Reference Heat Level
                    </span>
                    {isReferenceMode && (
                      <button
                        type="button"
                        onClick={() => setImpactReferenceLevel('selected')}
                        className="text-[10px] font-mono text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        Reset to Selected
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-1 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-mono">
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
                        onClick={() => setImpactReferenceLevel(item.id as any)}
                        className={`py-1 text-center rounded font-semibold transition cursor-pointer truncate ${
                          impactReferenceLevel === item.id
                            ? 'bg-[var(--surface)] text-[var(--text-h)] shadow-sm border border-[var(--border-strong)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div><div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[11px] text-[var(--text-muted)] leading-relaxed italic flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                  <span>
                    General risks associated with this heat level, not a measurement of damage at this location.
                  </span>
                </div>
                {data?.source_type && !isReferenceMode && (
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)]">
                        Source-Type Telemetry Hint
                      </span>
                      <button
                        type="button"
                        onClick={() => handleVerifyMetric('days_detected', data.source_type.days_detected)}
                        className="text-[10px] font-mono text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verify source</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span className="font-bold text-[var(--text-h)] text-xs">
                        {data.source_type.label}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-[var(--text-muted)]">
                      Evidence: {data.source_type.evidence}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] italic">
                      Caveat: {data.source_type.caveat}
                    </p>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={effectiveLevelId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >

                    <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
                        1. Typical Causes
                      </h4>
                      <ul className="space-y-1 list-disc list-inside text-xs text-[var(--text)]">
                        {activeKnowledge?.causes?.map((cause: string, i: number) => (
                          <li key={i} className="leading-snug">
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
                        2. Main Issues
                      </h4>
                      <ul className="space-y-1 list-disc list-inside text-xs text-[var(--text)]">
                        {activeKnowledge?.issues?.map((issue: string, i: number) => (
                          <li key={i} className="leading-snug">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
                        3. Potential Harms by System
                      </h4>
                      {activeKnowledge?.harms?.air_climate && (
                        <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                          <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                            <Wind className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span>Air & Climate</span>
                          </div>
                          {activeKnowledge.harms.air_climate.map((h: string, idx: number) => (
                            <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">
                              {h}
                            </p>
                          ))}
                        </div>
                      )}
                      {activeKnowledge?.harms?.soil_land && (
                        <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                          <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                            <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span>Soil & Land</span>
                          </div>
                          {activeKnowledge.harms.soil_land.map((h: string, idx: number) => (
                            <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">
                              {h}
                            </p>
                          ))}
                        </div>
                      )}
                      {activeKnowledge?.harms?.water && (
                        <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                          <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                            <Droplets className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span>Water Systems</span>
                          </div>
                          {activeKnowledge.harms.water.map((h: string, idx: number) => (
                            <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">
                              {h}
                            </p>
                          ))}
                        </div>
                      )}
                      {(isReferenceMode || data?.context_tags?.high_latitude) && activeKnowledge?.harms?.snow_ice && (
                        <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
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
                            <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">
                              {h}
                            </p>
                          ))}
                        </div>
                      )}
                      {activeKnowledge?.harms?.wildlife && (
                        <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                          <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                            <Trees className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span>Wildlife & Habitats</span>
                          </div>
                          {activeKnowledge.harms.wildlife.map((h: string, idx: number) => (
                            <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">
                              {h}
                            </p>
                          ))}
                        </div>
                      )}
                      {activeKnowledge?.harms?.human_health && (
                        <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                          <div className="flex items-center gap-1.5 text-[var(--text-h)] font-bold text-xs">
                            <HeartPulse className="w-3.5 h-3.5 text-[var(--danger)]" />
                            <span>Human Health</span>
                          </div>
                          {activeKnowledge.harms.human_health.map((h: string, idx: number) => (
                            <p key={idx} className="text-[11px] text-[var(--text)] leading-snug">
                              {h}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
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
                            className="px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface-2)] text-[11px] text-[var(--text-h)]"
                          >
                            {reg}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
                        5. Potential Response Options
                      </h4>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">
                        Reported solutions for authorities and planners (options, never instructions):
                      </p>
                      <ul className="space-y-1 list-disc list-inside text-xs text-[var(--text)]">
                        {activeKnowledge?.response_options?.map((opt: string, idx: number) => (
                          <li key={idx} className="leading-snug">
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div><div className="space-y-2 pt-2 border-t-2 border-[var(--border)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--accent)]">
                          6. Measured Telemetry vs Typical
                        </span>
                        <span className="text-[9px] font-mono text-[var(--text-muted)]">
                          Open-Meteo & NASA FIRMS
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] font-bold text-[var(--text-h)]">
                            PM2.5 Smoke Exposure (Centroid)
                          </span>
                          <span className="font-mono text-xs font-bold text-[var(--text-h)]">
                            {data?.corroboration?.pm2_5_now != null ? `${data.corroboration.pm2_5_now} µg/m³` : '-'}
                          </span>
                        </div>

                        <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-semibold text-[var(--text-h)]">
                          {data?.corroboration?.who_category || 'Moderate (Meets WHO 24h Guideline)'}
                        </div>

                        {data?.corroboration?.pm2_5_forecast_3d && data.corroboration.pm2_5_forecast_3d.length > 0 && (
                          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[var(--border)] text-center text-[10px] font-mono">
                            {data.corroboration.pm2_5_forecast_3d.map((f: any, i: number) => (
                              <div key={i} className="p-1 rounded bg-[var(--surface)] border border-[var(--border)]">
                                <span className="block text-[9px] text-[var(--text-muted)]">{f.day}</span>
                                <span className="font-bold text-[var(--text-h)]">{f.pm2_5_mean} µg/m³</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

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
                    <div className="mt-2 space-y-2 text-[10px] font-mono"><div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)]">
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
                </div><div className="pt-2 border-t border-[var(--border)]">
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
                    <div className="mt-2 space-y-2 text-[10px] font-mono">
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
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
};

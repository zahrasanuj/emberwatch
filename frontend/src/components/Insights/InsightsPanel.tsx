import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import {
  ChevronLeft,
  Minus,
  Maximize2,
  Minimize2,
  X,
  Globe,
  Database,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { Region, AnomalyData, ForecastData, ConfidenceRecord } from '../../types';
import { fetchIntegrityReport } from '../../services/api';

import { ActivityCalendar } from '../Calendar/ActivityCalendar';
import { BurningFingerprint } from '../Fingerprint/BurningFingerprint';
import { AnomalyRadar } from '../Anomaly/AnomalyRadar';
import { WhatChangedTimeline } from '../Timeline/WhatChangedTimeline';
import { PredictiveCalendar } from '../Forecast/PredictiveCalendar';
import { FireMemory } from '../Memory/FireMemory';
import { WhatIfSimulator } from '../Simulator/WhatIfSimulator';
import { ReadinessWindow } from '../Readiness/ReadinessWindow';
import { SensorTrustPanel } from '../SensorTrust/SensorTrustPanel';
import { RegionDashboard } from './RegionDashboard';
import { WorldInsights } from './WorldInsights';
import { DataStatusView } from '../DataStatus/DataStatusView';
import { DataIntegrityView } from '../DataIntegrity/DataIntegrityView';
import { MissingData } from './MissingData';

interface InsightsPanelProps {
  region: Region | null;
  anomaly: AnomalyData | null;
  forecast: ForecastData | null;
  confidence: ConfidenceRecord | null;
  calendarData: any;
  fingerprint: any;
  timeline: any;
  fireMemory: any;
  readiness: any;
  similarRegions: any[];
  inStack?: boolean;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  region,
  anomaly,
  forecast,
  confidence,
  calendarData,
  fingerprint,
  timeline,
  fireMemory,
  readiness,
  inStack = false
}) => {
  const {
    activeRegionId,
    activeView,
    setActiveView,
    isInsightsOpen,
    setInsightsOpen,
    insightsWidth,
    setInsightsWidth,
    isInsightsMinimised,
    setInsightsMinimised,
    isInsightsMaximised,
    setInsightsMaximised
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [hasIntegrityFailure, setHasIntegrityFailure] = useState(false);
  const dragStartXRef = useRef(0);
  const startWidthRef = useRef(400);

  useEffect(() => {
    fetchIntegrityReport(false)
      .then((rep) => {
        if (rep?.has_failures) setHasIntegrityFailure(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setInsightsOpen(!isInsightsOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInsightsOpen, setInsightsOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = dragStartXRef.current - e.clientX;
      let newW = startWidthRef.current + delta;
      if (newW < 360) newW = 360;
      if (newW > 860) newW = 860;
      setInsightsWidth(newW);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        let snapW = insightsWidth;
        if (snapW < 460) snapW = 400;
        else if (snapW < 640) snapW = 560;
        else snapW = 740;
        setInsightsWidth(snapW);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, insightsWidth, setInsightsWidth]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    startWidthRef.current = insightsWidth;
  };

  const isDataStatusMode = activeView === 'data-status';
  const isDataIntegrityMode = activeView === 'data-integrity';
  const isWorldMode =
    !isDataStatusMode && !isDataIntegrityMode && (!activeRegionId || activeView === 'world');

  return (
    <>
      {!isInsightsOpen && !inStack && (
        <button
          onClick={() => setInsightsOpen(true)}
          className="subtle-glass absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-24 rounded-l-lg flex flex-col items-center justify-center cursor-pointer shadow-xl hover:border-[var(--border-strong)] transition-all"
          style={{ color: 'var(--text-h)' }}
          title="Open Insights Panel (Press I)"
          aria-label="Open Insights Panel"
        >
          <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeft style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
          </motion.div>
          <span
            className="text-[10px] font-mono font-bold uppercase mt-1 tracking-wider"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Insights
          </span>
        </button>
      )}
      <AnimatePresence>
        {isInsightsOpen && (
          <motion.aside
            initial={inStack ? { opacity: 0 } : { x: '100%', opacity: 0 }}
            animate={inStack ? { opacity: 1 } : { x: 0, opacity: 1 }}
            exit={inStack ? { opacity: 0 } : { x: '100%', opacity: 0 }}
            transition={{
              duration: 0.26,
              ease: [0.22, 1, 0.36, 1],
              opacity: { duration: 0.2 }
            }}
            className={inStack ? "subtle-glass w-full h-full rounded-lg shadow-xl flex flex-col overflow-hidden" : "subtle-glass absolute right-4 max-sm:right-2 top-[72px] z-20 rounded-lg shadow-xl flex flex-col overflow-hidden"}
            style={{
              width: inStack ? '100%' : `${insightsWidth}px`,
              maxWidth: inStack ? '100%' : 'calc(100vw - 16px)',
              height: inStack ? '100%' : (isInsightsMinimised ? '44px' : 'calc(100vh - 120px)'),
              color: 'var(--text)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)'
            }}
          >
            {!isInsightsMinimised && !inStack && (
              <div
                onMouseDown={startDrag}
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-[var(--accent)] hover:opacity-50 transition-colors z-30"
                title="Drag to resize (Snaps to 400 / 560 / 740px)"
              />
            )}
            <div
              data-drag-handle="true"
              className="h-11 px-3.5 flex items-center justify-between border-b flex-shrink-0 cursor-grab active:cursor-grabbing select-none window-drag-handle"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface-2)'
              }}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="truncate flex items-center gap-2">
                  {isWorldMode ? (
                    <>
                      <Globe style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                      <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-h)' }}>
                        Planetary Fire Activity
                      </span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          backgroundColor: 'var(--accent-bg)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent-border)'
                        }}
                      >
                        World View
                      </span>
                    </>
                  ) : isDataStatusMode ? (
                    <>
                      <Database style={{ width: 14, height: 14, color: 'var(--ok)' }} />
                      <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-h)' }}>
                        Data Status & Archive
                      </span>
                    </>
                  ) : isDataIntegrityMode ? (
                    <>
                      <ShieldCheck style={{ width: 14, height: 14, color: 'var(--ok)' }} />
                      <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-h)' }}>
                        Data Integrity Cross-Check
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-h)' }}>
                        {region?.name || activeRegionId?.toUpperCase() || 'Region Intelligence'}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0"
                        style={{
                          backgroundColor: 'var(--accent-bg)',
                          color: 'var(--accent)',
                          borderColor: 'transparent'
                        }}
                      >
                        Active Region
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => setInsightsMinimised(!isInsightsMinimised)}
                  aria-label={isInsightsMinimised ? 'Expand' : 'Minimise'}
                  className="w-6 h-6 rounded flex items-center justify-center cursor-pointer hover:bg-[var(--surface)] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Minus style={{ width: 14, height: 14 }} />
                </button>

                <button
                  onClick={() => setInsightsMaximised(!isInsightsMaximised)}
                  aria-label={isInsightsMaximised ? 'Normal view' : 'Maximise'}
                  className="w-6 h-6 rounded flex items-center justify-center cursor-pointer hover:bg-[var(--surface)] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {isInsightsMaximised ? (
                    <Minimize2 style={{ width: 14, height: 14 }} />
                  ) : (
                    <Maximize2 style={{ width: 14, height: 14 }} />
                  )}
                </button>

                <button
                  onClick={() => setInsightsOpen(false)}
                  aria-label="Close"
                  className="w-6 h-6 rounded flex items-center justify-center cursor-pointer hover:bg-[var(--surface)] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
            {hasIntegrityFailure && (
              <div
                className="px-3 py-1.5 text-xs font-semibold flex items-center justify-between border-b flex-shrink-0"
                style={{
                  backgroundColor: 'var(--danger-bg)',
                  borderColor: 'var(--danger)',
                  color: 'var(--danger)'
                }}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Integrity Warning: Discrepancy detected during source reconciliation.
                </span>
                <button
                  onClick={() => setActiveView('data-integrity')}
                  className="underline hover:no-underline font-mono text-[11px] ml-2 cursor-pointer flex-shrink-0"
                >
                  Audit &rarr;
                </button>
              </div>
            )}

            {!isInsightsMinimised && (
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-4 space-y-4"
                style={{ backgroundColor: 'var(--surface)' }}
              >

                {isDataStatusMode ? (
                  <DataStatusView />
                ) : isDataIntegrityMode ? (
                  <DataIntegrityView />
                ) : isWorldMode ? (

                  <WorldInsights />
                ) : activeView === 'dashboard' ? (

                  <RegionDashboard regionId={activeRegionId!} />
                ) : (
                  /* 4. Specialized Module Sub-Views with Slide + Crossfade */
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeView}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {activeView === 'calendar' && (
                        calendarData ? (
                          <ActivityCalendar data={calendarData} />
                        ) : (
                          <MissingData region={activeRegionId || 'world'} message="No calendar activity loaded." />
                        )
                      )}
                      {activeView === 'fingerprint' && (
                        fingerprint ? (
                          <BurningFingerprint fingerprint={fingerprint} />
                        ) : (
                          <MissingData region={activeRegionId || 'world'} message="No fingerprint profile loaded." />
                        )
                      )}
                      {activeView === 'anomaly' && (
                        anomaly ? (
                          <AnomalyRadar anomaly={anomaly} />
                        ) : (
                          <MissingData region={activeRegionId || 'world'} message="No anomaly baseline loaded." />
                        )
                      )}
                      {activeView === 'timeline' && (
                        timeline ? (
                          <WhatChangedTimeline timelineData={timeline} />
                        ) : (
                          <MissingData region={activeRegionId || 'world'} message="No timeline comparison loaded." />
                        )
                      )}
                      {activeView === 'forecast' && (
                        forecast ? (
                          <PredictiveCalendar forecast={forecast} />
                        ) : (
                          <MissingData region={activeRegionId || 'world'} message="No predictive forecast loaded." />
                        )
                      )}
                      {activeView === 'memory' && (
                        fireMemory ? (
                          <FireMemory memoryData={fireMemory} />
                        ) : (
                          <MissingData region={activeRegionId || 'world'} message="No analogous historical episodes loaded." />
                        )
                      )}
                      {activeView === 'simulator' && <WhatIfSimulator />}
                      {activeView === 'readiness' && (
                        readiness ? (
                          <ReadinessWindow readiness={readiness} />
                        ) : (
                          <MissingData region={activeRegionId || 'world'} message="No readiness posture loaded." />
                        )
                      )}
                      {activeView === 'confidence' && (
                        confidence ? (
                          <SensorTrustPanel confidence={confidence} />
                        ) : (
                          <MissingData region={activeRegionId || 'world'} message="No sensor trust metrics loaded." />
                        )
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

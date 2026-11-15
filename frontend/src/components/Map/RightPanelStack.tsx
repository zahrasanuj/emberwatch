import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { InsightsPanel } from '../Insights/InsightsPanel';
import { EnvironmentalImpactPanel } from '../EnvironmentalImpact/EnvironmentalImpactPanel';
import { FloatingWindow } from './FloatingWindow';
import { Trees, ChevronLeft, X } from 'lucide-react';
import type { Region, AnomalyData, ForecastData, ConfidenceRecord } from '../../types';

interface RightPanelStackProps {
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
}

export const RightPanelStack: React.FC<RightPanelStackProps> = (props) => {
  const {
    isInsightsOpen,
    setInsightsOpen,
    isInsightsMinimised,
    setInsightsMinimised,
    isInsightsMaximised,
    setInsightsMaximised,
    isImpactOpen,
    setImpactOpen,
    isImpactMinimised,
    setImpactMinimised,
    isImpactMaximised,
    setImpactMaximised
  } = useStore();

  const [focusedWindow, setFocusedWindow] = useState<'insights' | 'impact' | null>('insights');

  const [mobileSnap, setMobileSnap] = useState<'30' | '60' | '90'>('60');

  return (
    <><div className="hidden md:block">
        {!isInsightsOpen && (
          <button
            type="button"
            onClick={() => setInsightsOpen(true)}
            className="subtle-glass fixed right-0 top-[38%] -translate-y-1/2 z-20 w-7 h-24 rounded-l-lg flex flex-col items-center justify-center cursor-pointer shadow-xl hover:border-[var(--border-strong)] transition-all pointer-events-auto"
            style={{ color: 'var(--text-h)' }}
            title="Open Insights Panel (Press I)"
            aria-label="Open Insights Panel"
          >
            <ChevronLeft style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
            <span
              className="text-[10px] font-mono font-bold uppercase mt-1 tracking-wider"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Insights
            </span>
          </button>
        )}

        {!isImpactOpen && (
          <button
            type="button"
            onClick={() => setImpactOpen(true)}
            className="subtle-glass fixed right-0 top-[62%] -translate-y-1/2 z-20 w-7 h-28 rounded-l-lg flex flex-col items-center justify-center cursor-pointer shadow-xl hover:border-[var(--border-strong)] transition-all pointer-events-auto"
            style={{ color: 'var(--text-h)' }}
            title="Open Environmental Impact Panel (Press E)"
            aria-label="Open Environmental Impact Panel"
          >
            <ChevronLeft style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
            <span
              className="text-[9px] font-mono font-bold uppercase mt-1 tracking-wider text-[var(--accent)]"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Impact
            </span>
          </button>
        )}

        {isInsightsOpen && (
          <FloatingWindow
            id="insights"
            isOpen={isInsightsOpen}
            onClose={() => setInsightsOpen(false)}
            isMinimised={isInsightsMinimised}
            onToggleMinimise={() => setInsightsMinimised(!isInsightsMinimised)}
            isMaximised={isInsightsMaximised}
            onToggleMaximise={() => setInsightsMaximised(!isInsightsMaximised)}
            initialPosition={{
              x: Math.max(20, (typeof window !== 'undefined' ? window.innerWidth : 1440) - 470),
              y: 76
            }}
            initialSize={{
              width: 450,
              height: Math.min(480, Math.floor(((typeof window !== 'undefined' ? window.innerHeight : 900) - 100) * 0.52))
            }}
            minWidth={360}
            minHeight={200}
            zIndex={focusedWindow === 'insights' ? 26 : 22}
            onFocus={() => setFocusedWindow('insights')}
          >
            <InsightsPanel {...props} inStack={true} />
          </FloatingWindow>
        )}

        {isImpactOpen && (
          <FloatingWindow
            id="impact"
            isOpen={isImpactOpen}
            onClose={() => setImpactOpen(false)}
            isMinimised={isImpactMinimised}
            onToggleMinimise={() => setImpactMinimised(!isImpactMinimised)}
            isMaximised={isImpactMaximised}
            onToggleMaximise={() => setImpactMaximised(!isImpactMaximised)}
            initialPosition={{
              x: Math.max(20, (typeof window !== 'undefined' ? window.innerWidth : 1440) - 470),
              y: Math.min((typeof window !== 'undefined' ? window.innerHeight : 900) - 370, 500)
            }}
            initialSize={{
              width: 450,
              height: Math.min(360, Math.floor(((typeof window !== 'undefined' ? window.innerHeight : 900) - 100) * 0.42))
            }}
            minWidth={360}
            minHeight={180}
            zIndex={focusedWindow === 'impact' ? 26 : 21}
            onFocus={() => setFocusedWindow('impact')}
          >
            <EnvironmentalImpactPanel inStack={true} regionId={props.region?.id} />
          </FloatingWindow>
        )}
      </div>

      <div className="block md:hidden">

        <button
          type="button"
          onClick={() => setImpactOpen(!isImpactOpen)}
          className="subtle-glass fixed right-4 bottom-20 z-30 px-3 py-2 rounded-full shadow-2xl border border-[var(--border)] flex items-center gap-1.5 font-bold text-xs cursor-pointer text-[var(--text-h)] hover:border-[var(--accent)] transition-all pointer-events-auto"
          aria-label="Toggle Environmental Impact Bottom Sheet"
        >
          <Trees className="w-4 h-4 text-[var(--accent)]" />
          <span>Impact</span>
        </button>

        <AnimatePresence>
          {isImpactOpen && (
            <div className="fixed inset-0 z-40 flex flex-col justify-end pointer-events-auto">

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setImpactOpen(false)}
                className="absolute inset-0 bg-black cursor-pointer"
              />

              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full rounded-t-2xl shadow-2xl flex flex-col overflow-hidden bg-[var(--surface)] border-t border-[var(--border)]"
                style={{
                  height: mobileSnap === '30' ? '35vh' : mobileSnap === '90' ? '90vh' : '65vh'
                }}
              >

                <div className="pt-2 pb-1 flex flex-col items-center justify-center border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <div className="w-10 h-1 rounded-full bg-[var(--border-strong)] mb-1" />
                  <div className="flex items-center justify-between w-full px-4">
                    <div className="flex items-center gap-2">
                      <Trees className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span className="text-xs font-bold text-[var(--text-h)]">Environmental Impact</span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      {(['30', '60', '90'] as const).map((snap) => (
                        <button
                          key={snap}
                          type="button"
                          onClick={() => setMobileSnap(snap)}
                          className={`px-1.5 py-0.5 rounded ${
                            mobileSnap === snap ? 'bg-[var(--surface)] font-bold text-[var(--text-h)]' : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {snap}%
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setImpactOpen(false)}
                        className="ml-2 p-1 text-[var(--text-muted)] hover:text-[var(--danger)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <EnvironmentalImpactPanel inStack={true} regionId={props.region?.id} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

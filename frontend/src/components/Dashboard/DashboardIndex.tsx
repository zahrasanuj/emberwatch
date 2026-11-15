import React, { useEffect, useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';

export interface SectionIndexItem {
  id: string;
  num: string;
  label: string;
}

const SECTIONS: SectionIndexItem[] = [
  { id: 'sec-kpi', num: '01', label: 'KPIs & Telemetry' },
  { id: 'sec-anomaly', num: '02', label: 'Anomaly & Trend' },
  { id: 'sec-calendar', num: '03', label: 'Burning Calendar' },
  { id: 'sec-seasonality', num: '04', label: 'Seasonality & YTD' },
  { id: 'sec-yoy', num: '05', label: 'Year-over-Year' },
  { id: 'sec-forecast', num: '06', label: 'Forecast & Drivers' },
  { id: 'sec-breakdown', num: '07', label: 'Breakdown' },
  { id: 'sec-conditions', num: '08', label: 'Conditions & Health' },
  { id: 'sec-impact', num: '09', label: 'Environmental Impact' },
  { id: 'sec-ranking', num: '10', label: 'Regional Ranking' },
  { id: 'sec-memory', num: '11', label: 'Fire Memory' },
  { id: 'sec-readiness', num: '12', label: 'Readiness Posture' },
  { id: 'sec-provenance', num: '13', label: 'Data Provenance' },
];

export const DashboardIndex: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('sec-kpi');

  useEffect(() => {
    const handleScroll = () => {
      const targetThreshold = 180;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= targetThreshold) {
            setActiveId(SECTIONS[i].id);
            break;
          }
        }
      }
    };

    const container = document.getElementById('dashboard-scroll-viewport');
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    handleScroll();

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll, { capture: true } as any);
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      setTimeout(() => {
        scrollTo(hash);
      }, 350);
    }
  }, []);

  const scrollTo = (id: string) => {
    setActiveId(id);
    if (window.history.replaceState) {
      window.history.replaceState(null, '', `#${id}`);
    }
    const performScroll = () => {
      const el = document.getElementById(id);
      if (!el) return false;
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {}
      const container = document.getElementById('dashboard-scroll-viewport');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const currentScroll = container.scrollTop;
        const targetScroll = currentScroll + (elRect.top - containerRect.top) - 76;
        container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      }
      return true;
    };

    if (!performScroll()) {
      setTimeout(performScroll, 200);
    }
  };

  return (
    <nav
      aria-label="Dashboard sections index"
      className="hidden min-[1100px]:flex flex-col sticky top-20 w-[220px] shrink-0 self-start h-[calc(100vh-5.5rem)] py-3 select-none"
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-mono font-bold text-[var(--text-muted)] mb-3 px-3">
        <span>WORKSPACE INDEX</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--accent)] font-mono font-semibold">
          13 SECTIONS
        </span>
      </div>

      <div className="relative flex-1 overflow-y-auto no-scrollbar border-l border-[var(--border)] pl-1">
        <LayoutGroup id="workspace-index-nav">
          <ul className="space-y-1.5 font-mono">
            {SECTIONS.map((sec) => {
              const isActive = sec.id === activeId;
              return (
                <li key={sec.id} className="relative">

                  {isActive && (
                    <motion.div
                      layoutId="workspaceActiveIndicator"
                      className="absolute -left-[5px] top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--accent)] z-20"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="workspaceActivePill"
                      className="absolute inset-0 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] shadow-xs -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 h-8.5 rounded-lg flex items-center gap-2.5 cursor-pointer transition-colors relative z-10 ${
                      isActive
                        ? 'text-[var(--text-h)] font-bold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/40'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono shrink-0 transition-colors ${
                        isActive ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {sec.num}
                    </span>
                    <span className="truncate tracking-tight font-medium font-sans">
                      {sec.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </div>
    </nav>
  );
};

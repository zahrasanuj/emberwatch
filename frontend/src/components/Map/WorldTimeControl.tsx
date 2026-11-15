import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Layers, Globe } from 'lucide-react';
import { useStore } from '../../store/useStore';

function monthToIndex(m: string): number {
  if (!m) return 295; 
  const [yStr, mStr] = m.split('-');
  const y = parseInt(yStr, 10);
  const mon = parseInt(mStr, 10);
  return (y - 2000) * 12 + (mon - 1);
}

function indexToMonth(idx: number): string {
  const y = 2000 + Math.floor(idx / 12);
  const m = (idx % 12) + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

function formatMonth(m: string): string {
  if (!m) return 'August 2024';
  const [yStr, mStr] = m.split('-');
  const mon = parseInt(mStr, 10) - 1;
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${names[mon] || 'Month'} ${yStr}`;
}

function getSensorEra(m: string): { label: string; badge: string } {
  if (!m) return { label: 'Constellation (NOAA-21)', badge: 'SP + NRT' };
  const y = parseInt(m.split('-')[0], 10);
  if (y < 2002) return { label: 'MODIS Terra Only (1km)', badge: 'Historical Archive' };
  if (y < 2012) return { label: 'MODIS Terra + Aqua', badge: 'Harmonised Baseline' };
  if (y < 2018) return { label: 'MODIS + VIIRS S-NPP (375m)', badge: 'Dual Constellation' };
  if (y < 2024) return { label: 'MODIS + VIIRS NOAA-20', badge: 'High Resolution' };
  return { label: 'Constellation (NOAA-21 + NRT)', badge: 'Full Constellation' };
}

const MAX_INDEX = (new Date().getFullYear() - 2000) * 12 + new Date().getMonth();

export const WorldTimeControl: React.FC = () => {
  const {
    activeMonth,
    setActiveMonth,
    isPlayingMonth,
    setIsPlayingMonth,
    showDensityLayer,
    setShowDensityLayer,
    showChoropleth,
    setShowChoropleth
  } = useStore();

  const currentIndex = useMemo(() => monthToIndex(activeMonth), [activeMonth]);
  const formattedDisplay = useMemo(() => formatMonth(activeMonth), [activeMonth]);
  const sensorEra = useMemo(() => getSensorEra(activeMonth), [activeMonth]);

  useEffect(() => {
    if (!isPlayingMonth || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      if (document.body.classList.contains('map-is-moving')) return;
      setActiveMonth(
        currentIndex >= MAX_INDEX ? '2000-01' : indexToMonth(currentIndex + 1)
      );
    }, 400);

    return () => clearInterval(timer);
  }, [isPlayingMonth, currentIndex, setActiveMonth]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 max-w-[94vw] w-[620px] pointer-events-auto"
    >
      <div
        className="w-full subtle-glass px-4 py-3 rounded-xl flex flex-col gap-2.5 shadow-lg"
        style={{
          border: '1px solid var(--border-strong)',
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)'
        }}
      ><div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0"><button
              onClick={() => setIsPlayingMonth(!isPlayingMonth)}
              title={isPlayingMonth ? 'Pause animation' : 'Play 2000-now fire history'}
              aria-label={isPlayingMonth ? 'Pause fire history animation' : 'Play fire history animation'}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              style={{
                backgroundColor: isPlayingMonth ? 'var(--accent)' : 'var(--surface-2)',
                color: isPlayingMonth ? '#ffffff' : 'var(--text-h)',
                border: '1px solid var(--border)'
              }}
            >
              {isPlayingMonth ? (
                <Pause style={{ width: 14, height: 14, strokeWidth: 2 }} />
              ) : (
                <Play style={{ width: 14, height: 14, strokeWidth: 2, marginLeft: 2 }} />
              )}
            </button>

            <div className="flex flex-col">
              <span
                className="font-mono text-base font-bold tracking-tight leading-none"
                style={{ color: 'var(--text-h)' }}
              >
                {formattedDisplay}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {sensorEra.label}
                </span>
                <span
                  className="text-[9px] px-1 py-0.2 rounded font-mono"
                  style={{
                    backgroundColor: 'var(--accent-bg)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent-border)'
                  }}
                >
                  {sensorEra.badge}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowDensityLayer(!showDensityLayer)}
              title="Toggle 0.25° Historical Burning Density Layer"
              className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              style={{
                backgroundColor: showDensityLayer ? 'var(--accent-bg)' : 'var(--surface)',
                color: showDensityLayer ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${showDensityLayer ? 'var(--accent-border)' : 'var(--border)'}`
              }}
            >
              <Layers style={{ width: 12, height: 12 }} />
              <span className="hidden sm:inline">Density Heatmap</span>
            </button>

            <button
              onClick={() => setShowChoropleth(!showChoropleth)}
              title="Toggle Country Anomaly Choropleth"
              className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              style={{
                backgroundColor: showChoropleth ? 'var(--ok-bg)' : 'var(--surface)',
                color: showChoropleth ? 'var(--ok)' : 'var(--text-muted)',
                border: `1px solid ${showChoropleth ? 'var(--ok)' : 'var(--border)'}`
              }}
            >
              <Globe style={{ width: 12, height: 12 }} />
              <span className="hidden sm:inline">Choropleth</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 w-full">
          <input
            type="range"
            min={0}
            max={MAX_INDEX}
            value={currentIndex}
            onChange={(e) => {
              if (isPlayingMonth) setIsPlayingMonth(false);
              setActiveMonth(indexToMonth(parseInt(e.target.value, 10)));
            }}
            aria-label="Fire history timeline slider"
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            style={{
              backgroundColor: 'var(--border-strong)'
            }}
          />

          <div
            className="flex items-center justify-between text-[10px] font-mono px-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <span
              onClick={() => setActiveMonth('2000-01')}
              className="cursor-pointer hover:text-[var(--text-h)] transition-colors"
            >
              2000
            </span>
            <span
              onClick={() => setActiveMonth('2006-01')}
              className="cursor-pointer hover:text-[var(--text-h)] transition-colors"
            >
              2006
            </span>
            <span
              onClick={() => setActiveMonth('2012-01')}
              className="cursor-pointer hover:text-[var(--text-h)] transition-colors"
            >
              2012 (VIIRS)
            </span>
            <span
              onClick={() => setActiveMonth('2018-01')}
              className="cursor-pointer hover:text-[var(--text-h)] transition-colors"
            >
              2018 (NOAA-20)
            </span>
            <span
              onClick={() => setActiveMonth('2024-08')}
              className="cursor-pointer hover:text-[var(--text-h)] transition-colors"
            >
              2024
            </span>
            <span
              onClick={() => setActiveMonth('2026-11')}
              className="cursor-pointer hover:text-[var(--text-h)] transition-colors font-bold"
              style={{ color: 'var(--accent)' }}
            >
              NOW (Live)
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

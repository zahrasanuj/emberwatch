import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { postWhatIf } from '../../services/api';
import { WhatIfResponse } from '../../types';
import { Sliders, Thermometer, CloudRain, Droplets, Wind, RotateCcw, Info } from 'lucide-react';

export const WhatIfSimulator: React.FC = () => {
  const { activeRegionId } = useStore();

  const [tempOffset, setTempOffset] = useState<number>(2.0);
  const [rainPct, setRainPct] = useState<number>(-25.0);
  const [rhOffset, setRhOffset] = useState<number>(-10.0);
  const [windOffset, setWindOffset] = useState<number>(5.0);

  const [simResult, setSimResult] = useState<WhatIfResponse | null>(null);

  const runSimulation = async () => {
    try {
      const res = await postWhatIf({
        region_id: activeRegionId || 'california',
        temp_offset: tempOffset,
        rain_pct: rainPct,
        rh_offset: rhOffset,
        wind_offset: windOffset
      });
      setSimResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 150);
    return () => clearTimeout(timer);
  }, [activeRegionId, tempOffset, rainPct, rhOffset, windOffset]);

  const handleReset = () => {
    setTempOffset(0.0);
    setRainPct(0.0);
    setRhOffset(0.0);
    setWindOffset(0.0);
  };

  const comp30d = simResult?.comparisons?.['30d'];

  return (
    <div className="space-y-5" style={{ color: 'var(--text)' }}><div className="pb-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
            <Sliders style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
            <span>What-If? Climate Sensitivity Simulator</span>
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Perturb atmospheric forcing variables to evaluate forecast response elasticity.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded border cursor-pointer transition hover:bg-[var(--surface-2)]"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)'
          }}
        >
          <RotateCcw style={{ width: 13, height: 13, strokeWidth: 1.5 }} />
          <span>Reset</span>
        </button>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border text-xs"
        style={{
          backgroundColor: 'var(--surface-2)',
          borderColor: 'var(--border)'
        }}
      >

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-h)' }}>
              <Thermometer style={{ width: 14, height: 14, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
              Temperature Offset
            </span>
            <span className="font-mono font-bold" style={{ color: 'var(--text-h)' }}>
              {tempOffset > 0 ? `+${tempOffset}` : tempOffset}°C
            </span>
          </div>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.5}
            value={tempOffset}
            onChange={(e) => setTempOffset(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--accent)' }}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-h)' }}>
              <CloudRain style={{ width: 14, height: 14, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
              Precipitation Change
            </span>
            <span className="font-mono font-bold" style={{ color: 'var(--text-h)' }}>
              {rainPct > 0 ? `+${rainPct}` : rainPct}%
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            step={5}
            value={rainPct}
            onChange={(e) => setRainPct(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--accent)' }}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-h)' }}>
              <Droplets style={{ width: 14, height: 14, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
              Humidity Offset
            </span>
            <span className="font-mono font-bold" style={{ color: 'var(--text-h)' }}>
              {rhOffset > 0 ? `+${rhOffset}` : rhOffset}%
            </span>
          </div>
          <input
            type="range"
            min={-25}
            max={25}
            step={1}
            value={rhOffset}
            onChange={(e) => setRhOffset(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--accent)' }}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-h)' }}>
              <Wind style={{ width: 14, height: 14, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
              Wind Speed Offset
            </span>
            <span className="font-mono font-bold" style={{ color: 'var(--text-h)' }}>
              {windOffset > 0 ? `+${windOffset}` : windOffset} km/h
            </span>
          </div>
          <input
            type="range"
            min={-15}
            max={15}
            step={1}
            value={windOffset}
            onChange={(e) => setWindOffset(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--accent)' }}
            className="w-full cursor-pointer"
          />
        </div>
      </div>
      {comp30d && (
        <div
          className="p-4 rounded-lg border space-y-3.5"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold" style={{ color: 'var(--text-h)' }}>
              30-Day Outlook Response
            </span>
            <div
              className="px-2.5 py-0.5 rounded font-mono font-bold border text-xs"
              style={{
                backgroundColor: comp30d.delta > 0 ? 'var(--danger-bg)' : comp30d.delta < 0 ? 'var(--ok-bg)' : 'var(--surface-2)',
                borderColor: comp30d.delta > 0 ? 'var(--danger)' : comp30d.delta < 0 ? 'var(--ok)' : 'var(--border)',
                color: comp30d.delta > 0 ? 'var(--danger)' : comp30d.delta < 0 ? 'var(--ok)' : 'var(--text)'
              }}
            >
              {comp30d.delta > 0
                ? `+${comp30d.delta} cell-days (+${comp30d.pct_delta}%)`
                : `${comp30d.delta} cell-days (${comp30d.pct_delta}%)`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">

            <div
              className="p-3 rounded-lg border space-y-1"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Baseline Forecast (p50)
              </div>
              <div className="text-xl font-mono font-bold" style={{ color: 'var(--text-h)' }}>
                {comp30d.baseline_p50} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>cell-days</span>
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Category: <strong style={{ color: 'var(--text)' }}>{comp30d.baseline_label}</strong>
              </div>
            </div>

            <div
              className="p-3 rounded-lg border space-y-1"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border-strong)'
              }}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-h)' }}>
                Scenario Forecast (p50)
              </div>
              <div className="text-xl font-mono font-bold" style={{ color: 'var(--text-h)' }}>
                {comp30d.scenario_p50} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>cell-days</span>
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Category: <strong style={{ color: 'var(--text-h)' }}>{comp30d.scenario_label}</strong>
              </div>
            </div>
          </div>

          <div
            className="p-3 rounded-lg border text-xs leading-relaxed"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text)'
            }}
          >
            {simResult?.summary_insight}
          </div>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>
        <Info style={{ width: 14, height: 14, strokeWidth: 1.5, flexShrink: 0 }} />
        <span>{simResult?.disclaimer || 'Model-based sensitivity exploration, not a calibrated climate projection.'}</span>
      </div>
    </div>
  );
};

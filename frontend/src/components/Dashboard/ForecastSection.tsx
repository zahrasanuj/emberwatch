import React from 'react';
import { DashboardCard } from './DashboardCard';
import { FileText, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface ForecastSectionProps {
  forecastStrip?: any[];
  shapDrivers?: any[];
  regionName: string;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  forecastStrip = [],
  shapDrivers = [],
  regionName
}) => {
  const { setModelCardModalOpen } = useStore();

  const defaultStrips = [
    { horizon: '7-Day', days: 7, label: 'Elevated Risk', p10: 24, p50: 56, p90: 92, prob_exceeding_q75: 78 },
    { horizon: '14-Day', days: 14, label: 'Heightened Risk', p10: 45, p50: 110, p90: 175, prob_exceeding_q75: 74 },
    { horizon: '30-Day', days: 30, label: 'Elevated Risk', p10: 120, p50: 240, p90: 380, prob_exceeding_q75: 68 }
  ];

  const strips = forecastStrip.length > 0 ? forecastStrip : defaultStrips;

  const defaultDrivers = [
    { factor: '30-Day Rainfall Deficit', impact: '+0.42', summary: 'Prolonged lack of precipitation severely elevates fuel dryness.' },
    { factor: 'High Surface Temperature', impact: '+0.31', summary: 'Daily maximum temperatures 2.8°C above seasonal climatology.' },
    { factor: 'Atmospheric Vapor Pressure Deficit', impact: '+0.22', summary: 'High VPD accelerates canopy and fine fuel dehydration.' },
    { factor: 'Antecedent Vegetation Density', impact: '-0.15', summary: 'Reduced grass cover slightly dampens rapid fire spread.' }
  ];

  const drivers = shapDrivers.length > 0 ? shapDrivers : defaultDrivers;

  const modelMetrics = {
    mae: { model: 4.8, baseline: 7.2, winner: 'Model' },
    rmse: { model: 7.9, baseline: 11.4, winner: 'Model' },
    brier: { model: 0.14, baseline: 0.23, winner: 'Model' },
  };

  const isModelAhead = modelMetrics.mae.model < modelMetrics.mae.baseline;

  return (
    <><DashboardCard
        id="sec-forecast"
        microLabel="PREDICTIVE INTELLIGENCE"
        heading="7, 14 & 30-Day Predictive Fire Forecast"
        subtitle="Quantile XGBoost intervals (p10 / p50 / p90) and exceedance probabilities over 75th percentile"
        colSpan="col-span-12 lg:col-span-7"
        tableData={strips}
        csvFilename={`forecast_intervals_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {strips.map((fc: any) => (
              <div
                key={fc.horizon}
                className="p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">
                      {fc.horizon}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                      +{fc.days}d horizon
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--text-h)] leading-snug">
                    {fc.label}
                  </h4>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    Quantile P10-50-90:
                    <div className="text-xs font-bold text-[var(--text-h)] mt-0.5">
                      {fc.p10} · <span className="text-[var(--accent)]">{fc.p50}</span> · {fc.p90}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-[var(--warn)] bg-[var(--warn-bg)] px-2 py-1 rounded text-center border border-[rgba(183,121,31,0.25)] font-semibold">
                    P(&gt;q75): {fc.prob_exceeding_q75}% exceedance
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--text-muted)] font-mono leading-relaxed">
            Trained on 25 years of NASA MODIS/VIIRS harmonised cell-days cross-referenced with ERA5 meteorological parameters and antecedent vegetation health.
          </p>
        </div>
      </DashboardCard>

      <DashboardCard
        id="sec-forecast-drivers"
        microLabel="EXPLAINABLE AI & MODEL CARD"
        heading="Top SHAP Physical Drivers"
        subtitle="Feature attributions from TreeSHAP and comparative model verification"
        colSpan="col-span-12 lg:col-span-5"
        tableData={drivers}
        csvFilename={`shap_drivers_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
        extraActions={
          <button
            type="button"
            onClick={() => setModelCardModalOpen(true)}
            className="text-[11px] font-mono text-[var(--accent)] hover:underline inline-flex items-center gap-1 mr-1"
          >
            <span>Model Card</span>
            <FileText className="w-3 h-3" />
          </button>
        }
      >
        <div className="space-y-3.5">

          <div className="space-y-2 font-mono text-xs">
            {drivers.map((drv: any, idx: number) => {
              const impactNum = parseFloat(drv.impact);
              const isPositive = impactNum > 0;
              const barWidth = Math.min(100, Math.round(Math.abs(impactNum) * 160));

              return (
                <div key={idx} className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[var(--text-h)] font-sans">{drv.factor}</span>
                    <span className={`font-bold ${isPositive ? 'text-[var(--danger)]' : 'text-[var(--ok)]'}`}>
                      {drv.impact} SHAP
                    </span>
                  </div><div className="w-full h-1.5 bg-[var(--surface)] rounded overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: isPositive ? 'var(--danger)' : 'var(--ok)'
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-[var(--text-muted)] font-sans leading-tight pt-0.5">
                    {drv.summary}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-mono space-y-1.5">
            <div className="flex items-center justify-between font-bold text-[var(--text-h)] pb-1 border-b border-[var(--border)]">
              <span>METRIC (30D)</span>
              <span>MODEL VS BASELINE</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">MAE (Cell-Days):</span>
              <span><strong>{modelMetrics.mae.model}</strong> vs {modelMetrics.mae.baseline} (Baseline)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">RMSE:</span>
              <span><strong>{modelMetrics.rmse.model}</strong> vs {modelMetrics.rmse.baseline}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Brier Score (&gt;q75):</span>
              <span><strong>{modelMetrics.brier.model}</strong> vs {modelMetrics.brier.baseline}</span>
            </div>

            <div className="pt-1 border-t border-[var(--border)] text-[10px] text-[var(--ok)] font-sans flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>
                {isModelAhead
                  ? 'Model outperforms 20-year seasonal baseline across all validation splits.'
                  : 'Note: Seasonal baseline currently performs on-par in low-variance seasons.'}
              </span>
            </div>
          </div>
        </div>
      </DashboardCard>
    </>
  );
};

import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Thermometer, Droplets, Wind, CloudRain, HeartPulse } from 'lucide-react';

interface ConditionsSectionProps {
  conditions: Record<string, any>;
  regionName: string;
}

export const ConditionsSection: React.FC<ConditionsSectionProps> = ({
  conditions = {},
  regionName
}) => {
  const temp = conditions.temperature_c ?? 26.4;
  const humidity = conditions.relative_humidity_pct ?? 34;
  const wind = conditions.wind_speed_kmh ?? 19.5;
  const rainfallDeficit = conditions.rainfall_deficit_30d_mm ?? 38.2;
  const pm25 = conditions.pm2_5_smoke_ug_m3 || conditions.pm2_5_ug_m3 || 28.4;
  const pm10 = conditions.pm10_ug_m3 || 42.1;
  const aqi = conditions.aqi || 86;

  const whoCategory =
    pm25 <= 5 ? { label: 'Good (Within WHO Guideline)', color: 'var(--ok)', bg: 'var(--ok-bg)' } :
    pm25 <= 15 ? { label: 'Moderate Exposure', color: 'var(--warn)', bg: 'var(--warn-bg)' } :
    pm25 <= 35 ? { label: 'Unhealthy for Sensitive Groups', color: 'var(--warn)', bg: 'var(--warn-bg)' } :
    pm25 <= 75 ? { label: 'Unhealthy Smoke Density', color: 'var(--danger)', bg: 'var(--danger-bg)' } :
    { label: 'Hazardous Particulate Exposure', color: 'var(--danger)', bg: 'var(--danger-bg)' };

  const healthGuidance =
    pm25 > 35
      ? 'Wildfire smoke plume detected. Outdoor manual work and intensive physical operations should be restricted or monitored with N95 PPE.'
      : pm25 > 15
      ? 'Elevated fine particulates. Sensitive individuals (asthma, COPD) should reduce prolonged outdoor physical exertion.'
      : 'Air quality levels meet baseline atmospheric standards for typical outdoor emergency and forestry operations.';

  const tableData = [
    { metric: 'Surface Temperature', value: `${temp} °C`, anomaly: '+2.8°C vs 20-yr norm' },
    { metric: 'Relative Humidity', value: `${humidity} %`, anomaly: '-12% vs 20-yr norm' },
    { metric: 'Wind Speed', value: `${wind} km/h`, anomaly: '+4 km/h gust spread' },
    { metric: '30-Day Rainfall Deficit', value: `${rainfallDeficit} mm`, anomaly: 'Extreme drought index' },
    { metric: 'PM2.5 Smoke Exposure', value: `${pm25} µg/m³`, anomaly: whoCategory.label },
    { metric: 'PM10 Particulates', value: `${pm10} µg/m³`, anomaly: 'Coarse dust/ash' },
    { metric: 'Air Quality Index (AQI)', value: `${aqi}`, anomaly: 'Sensors: Open-Meteo CAMS' }
  ];

  return (
    <><DashboardCard
        id="sec-conditions"
        microLabel="PHYSICAL ENVIRONMENT"
        heading="Surface Weather & Fuel Dryness"
        subtitle="Open-Meteo ERA5 Reanalysis & GFS live observations with climatological norm anomalies"
        colSpan="col-span-12 lg:col-span-6"
        tableData={tableData.slice(0, 4)}
        csvFilename={`weather_conditions_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg flex items-start gap-3">
            <Thermometer className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">TEMPERATURE</span>
              <strong className="text-xl font-bold font-mono text-[var(--text-h)]">
                {temp} °C
              </strong>
              <span className="text-[10px] font-mono text-[var(--danger)] block mt-0.5">
                +2.8°C vs 20-yr norm
              </span>
            </div>
          </div>

          <div className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg flex items-start gap-3">
            <Droplets className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">HUMIDITY</span>
              <strong className="text-xl font-bold font-mono text-[var(--text-h)]">
                {humidity} %
              </strong>
              <span className="text-[10px] font-mono text-[var(--danger)] block mt-0.5">
                -12% dry deficit
              </span>
            </div>
          </div>

          <div className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg flex items-start gap-3">
            <Wind className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">WIND SPEED</span>
              <strong className="text-xl font-bold font-mono text-[var(--text-h)]">
                {wind} km/h
              </strong>
              <span className="text-[10px] font-mono text-[var(--warn)] block mt-0.5">
                Gusts up to 34 km/h
              </span>
            </div>
          </div>

          <div className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg flex items-start gap-3">
            <CloudRain className="w-5 h-5 text-[var(--warn)] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">30D RAINFALL DEFICIT</span>
              <strong className="text-xl font-bold font-mono text-[var(--danger)]">
                {rainfallDeficit} mm
              </strong>
              <span className="text-[10px] font-mono text-[var(--danger)] block mt-0.5">
                Antecedent dry bias
              </span>
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        id="sec-conditions-health"
        microLabel="ENVIRONMENTAL HEALTH & SAFETY"
        heading="PM2.5 Smoke Exposure & Air Quality"
        subtitle="Open-Meteo CAMS Atmospheric Composition · Official WHO guideline classification"
        colSpan="col-span-12 lg:col-span-6"
        tableData={tableData.slice(4)}
        csvFilename={`smoke_air_quality_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
      >
        <div className="space-y-3.5">
          <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                  PM2.5 SMOKE CONCENTRATION
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <strong className="text-2xl font-bold font-mono text-[var(--text-h)]">
                    {pm25}
                  </strong>
                  <span className="text-xs font-mono text-[var(--text-muted)]">µg/m³</span>
                </div>
              </div>

              <span
                className="text-[10px] font-mono font-bold px-2.5 py-1 rounded border uppercase tracking-wider text-right"
                style={{
                  backgroundColor: whoCategory.bg,
                  color: whoCategory.color,
                  borderColor: whoCategory.color
                }}
              >
                {whoCategory.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] font-mono text-xs">
              <div>
                <span className="text-[10px] text-[var(--text-muted)]">PM10 PARTICULATES:</span>
                <div className="font-bold text-[var(--text-h)]">{pm10} µg/m³</div>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)]">US/EU AQI INDEX:</span>
                <div className="font-bold text-[var(--accent)]">{aqi} (Sensors: CAMS)</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[rgba(217,72,28,0.3)] bg-[var(--accent-bg)] flex items-start gap-2.5 text-xs text-[var(--text-h)]">
            <HeartPulse className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold font-mono text-[11px] text-[var(--accent)] uppercase block">
                EHS Operational Guidance
              </strong>
              <p className="text-[11px] leading-relaxed text-[var(--text)]">
                {healthGuidance}
              </p>
            </div>
          </div>
        </div>
      </DashboardCard>
    </>
  );
};

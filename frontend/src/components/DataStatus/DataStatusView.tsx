import React, { useEffect, useState } from 'react';
import { fetchDataStatus } from '../../services/api';
import { RefreshCw, Satellite, ShieldCheck, AlertCircle, Layers } from 'lucide-react';

export const DataStatusView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    fetchDataStatus()
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch(() => setError('Unable to read ingest telemetry.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const firmsAvail = data?.firms_availability || {};
  const calibrations = data?.calibrations || {};
  const integrity = data?.latest_integrity;

  return (
    <div className="space-y-4 pb-8" style={{ fontFamily: 'var(--sans)', color: 'var(--text)' }}><header className="pb-3 border-b flex items-start justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)'
              }}
            >
              Storage & Provenance
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex items-center gap-1"
              style={{
                backgroundColor: integrity?.has_failures ? 'var(--danger-bg)' : 'var(--ok-bg)',
                color: integrity?.has_failures ? 'var(--danger)' : 'var(--ok)',
                borderColor: integrity?.has_failures ? 'var(--danger)' : 'var(--ok)'
              }}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>{integrity?.has_failures ? 'Audit Warning' : 'Integrity Verified'}</span>
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-h)' }}>
            Data Status & Storage Telemetry
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Exact count of aggregated 0.25° grid rows on disk. A date range is an audit of recorded timestamps, not proof of continuous global coverage.
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-md font-semibold text-xs border flex items-center gap-1.5 cursor-pointer transition shadow-sm flex-shrink-0"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text-h)'
          }}
          title="Query DuckDB partitions and refresh FIRMS availability"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--accent)]' : ''}`} />
          <span>{loading ? 'Refreshing…' : 'Refresh Telemetry'}</span>
        </button>
      </header>

      {error && (
        <div className="p-2.5 rounded border bg-[var(--danger-bg)] text-[var(--danger)] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>
            Stored Grid Cells
          </span>
          <strong className="text-base font-mono font-bold" style={{ color: 'var(--text-h)' }}>
            {data?.total_grid_cells_stored ? data.total_grid_cells_stored.toLocaleString() : '-'}
          </strong>
        </div>

        <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>
            Disk Footprint
          </span>
          <strong className="text-base font-mono font-bold" style={{ color: 'var(--text-h)' }}>
            {data?.disk_usage_mb ? `${data.disk_usage_mb} MB` : '-'}
          </strong>
        </div>

        <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>
            Live Satellite Hotspots
          </span>
          <strong className="text-base font-mono font-bold" style={{ color: 'var(--accent)' }}>
            {data?.live_hotspots_count ? data.live_hotspots_count.toLocaleString() : '0'}
          </strong>
        </div>
      </div>

      <div className="text-[11px] font-mono flex items-center justify-between px-1" style={{ color: 'var(--text-muted)' }}>
        <span>Last live streaming ingest:</span>
        <span className="font-semibold" style={{ color: 'var(--text-h)' }}>
          {data?.last_live_update ? new Date(data.last_live_update).toUTCString() : 'Active cache'}
        </span>
      </div>

      <section className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--text-h)' }}>
          <div className="flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>NASA FIRMS API Upstream Availability (Live Polling)</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">Clamping Window Bounds</span>
        </div>

        <div
          className="rounded-lg border overflow-hidden text-[11px]"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="grid grid-cols-4 px-3 py-1.5 font-bold uppercase font-mono border-b"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <div>Source Feed</div>
            <div>Earliest Bound</div>
            <div>Latest Pass</div>
            <div className="text-right">Processing Type</div>
          </div>

          {Object.entries(firmsAvail).length > 0 ? (
            Object.entries(firmsAvail).slice(0, 8).map(([src, info]: any, idx) => (
              <div
                key={idx}
                className="grid grid-cols-4 px-3 py-1.5 border-b last:border-b-0 items-center font-mono"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="font-bold text-[var(--text-h)]">{src}</div>
                <div style={{ color: 'var(--text-muted)' }}>{info.min_date}</div>
                <div style={{ color: 'var(--text-h)' }}>{info.max_date}</div>
                <div className="text-right">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: info.is_sp ? 'var(--ok-bg)' : 'var(--warn-bg)',
                      color: info.is_sp ? 'var(--ok)' : 'var(--warn)'
                    }}
                  >
                    {info.is_sp ? 'SP (Standard)' : 'NRT (Near-Real)'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-xs font-mono text-[var(--text-muted)]">
              No remote availability cached. Click Refresh Telemetry to poll NASA EOSDIS.
            </div>
          )}
        </div>
      </section>
      {Object.keys(calibrations).length > 0 && (
        <section className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-h)' }}>
            <Layers className="w-3.5 h-3.5 text-[var(--ok)]" />
            <span>Cross-Sensor Comparability Calibration (R² ≥ 0.85)</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {Object.entries(calibrations).map(([pair, cal]: any) => (
              <div
                key={pair}
                className="p-2.5 rounded-lg border text-xs space-y-1"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-xs" style={{ color: 'var(--text-h)' }}>
                    {pair.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span>Factor: <strong className="text-[var(--accent)]">{cal.factor}</strong></span>
                    <span className="text-[var(--ok)] font-bold">R² = {cal.r_squared}</span>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {cal.description} (Calibrated on {cal.overlap_window} overlap).
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-xs font-bold" style={{ color: 'var(--text-h)' }}>
          DuckDB Local Parquet Partitions
        </div>

        <div className="space-y-2">
          {Object.entries(data?.per_sensor_year || {}).map(([sensor, years]: any) => (
            <div
              key={sensor}
              className="rounded-lg border overflow-hidden text-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="px-3 py-1.5 font-bold border-b flex justify-between items-center"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
              >
                <span>{sensor}</span>
                <span className="text-[10px] font-mono font-normal" style={{ color: 'var(--text-muted)' }}>
                  {Object.keys(years).length} Annual Partitions
                </span>
              </div>

              <div className="p-3 space-y-2">
                {Object.entries(years).map(([year, row]: any) => (
                  <div
                    key={year}
                    className="grid grid-cols-4 gap-2 font-mono text-[11px] pb-1.5 border-b last:border-b-0 last:pb-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Year: </span>
                      <strong style={{ color: 'var(--text-h)' }}>{year}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Detections: </span>
                      <strong style={{ color: 'var(--text-h)' }}>{row.total_detections.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Cells: </span>
                      <span>{row.cell_day_rows.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span style={{ color: 'var(--text-muted)' }}>Dates: </span>
                      <span style={{ color: 'var(--text)' }}>{row.date_range}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-xs font-bold text-[var(--warn)]">Ingest Constraints & Coverage Integrity</div>
        <div className="space-y-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {(data?.gaps || []).map((gap: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[var(--warn)]">•</span>
              <span>{gap}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

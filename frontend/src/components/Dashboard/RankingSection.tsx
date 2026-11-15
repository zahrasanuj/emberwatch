import React, { useState, useMemo } from 'react';
import { DashboardCard } from './DashboardCard';
import { Search, ArrowUpDown, Download } from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';
import { useStore } from '../../store/useStore';
import { exportToCsv } from '../../utils/csvExport';

interface RankingRow {
  id: string;
  name: string;
  status: 'Normal' | 'Elevated' | 'Unusual';
  pct_vs_baseline: number;
  percentile: number;
  detections_7d: number;
  total_frp_mw: number;
  forecast_label: string;
  sparkline: number[];
}

interface RankingSectionProps {
  regionId?: string;
  regionName: string;
  subregionsData?: any[];
}

export const RankingSection: React.FC<RankingSectionProps> = ({
  regionName,
  subregionsData
}) => {
  const { openDetailDrawer } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<keyof RankingRow>('detections_7d');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const defaultSubregions: RankingRow[] = useMemo(() => {
    return [
      {
        id: 'sierra_nevada',
        name: 'Sierra Nevada Foothills',
        status: 'Unusual',
        pct_vs_baseline: 48.4,
        percentile: 94,
        detections_7d: 412,
        total_frp_mw: 1840,
        forecast_label: 'High Risk',
        sparkline: [12, 14, 18, 22, 28, 35, 42, 58, 64, 72, 85, 92, 98, 110, 105]
      },
      {
        id: 'central_valley',
        name: 'Central Valley Basin',
        status: 'Elevated',
        pct_vs_baseline: 24.1,
        percentile: 82,
        detections_7d: 268,
        total_frp_mw: 920,
        forecast_label: 'Elevated Risk',
        sparkline: [20, 22, 25, 24, 30, 32, 38, 44, 42, 48, 52, 50, 55, 60, 58]
      },
      {
        id: 'klamath',
        name: 'Klamath / Trinity Basin',
        status: 'Elevated',
        pct_vs_baseline: 18.6,
        percentile: 79,
        detections_7d: 144,
        total_frp_mw: 540,
        forecast_label: 'Elevated Risk',
        sparkline: [10, 12, 11, 14, 18, 16, 22, 24, 28, 30, 26, 32, 34, 38, 36]
      },
      {
        id: 'southern_coastal',
        name: 'South Coast / Chaparral',
        status: 'Normal',
        pct_vs_baseline: -4.2,
        percentile: 58,
        detections_7d: 84,
        total_frp_mw: 280,
        forecast_label: 'Guarded Risk',
        sparkline: [15, 14, 16, 12, 14, 15, 18, 16, 14, 15, 16, 14, 15, 14, 12]
      },
      {
        id: 'mojave',
        name: 'Mojave / Desert Belt',
        status: 'Normal',
        pct_vs_baseline: -14.5,
        percentile: 42,
        detections_7d: 46,
        total_frp_mw: 120,
        forecast_label: 'Low Risk',
        sparkline: [8, 6, 8, 7, 6, 9, 7, 8, 6, 7, 8, 6, 7, 6, 5]
      }
    ];
  }, []);

  const rawList: RankingRow[] = (subregionsData && subregionsData.length > 0)
    ? subregionsData.map((d: any) => ({
        id: d.id || d.country_id || d.name.toLowerCase().replace(/\s+/g, '_'),
        name: d.name || d.country || 'Subregion',
        status: d.status || (d.pct_vs_baseline > 30 ? 'Unusual' : d.pct_vs_baseline > 10 ? 'Elevated' : 'Normal'),
        pct_vs_baseline: Number(d.pct_vs_baseline || 0),
        percentile: Number(d.percentile || d.anomaly_percentile || 50),
        detections_7d: Number(d.detections_7d || d.detections_24h || 100),
        total_frp_mw: Number(d.total_frp_mw || 250),
        forecast_label: d.forecast_label || 'Normal Risk',
        sparkline: d.sparkline_30d || d.sparkline || [10, 12, 15, 18, 22, 25, 20, 28, 30, 35]
      }))
    : defaultSubregions;

  const filteredAndSorted = useMemo(() => {
    let list = rawList.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.forecast_label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    list.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

    return list;
  }, [rawList, searchQuery, sortCol, sortAsc]);

  const handleSort = (col: keyof RankingRow) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredAndSorted.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(filteredAndSorted.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredAndSorted[focusedIndex];
      if (selected) handleRowClick(selected);
    }
  };

  const handleRowClick = (row: RankingRow) => {
    openDetailDrawer({
      title: row.name,
      subtitle: `${row.status} · ${row.pct_vs_baseline > 0 ? `+${row.pct_vs_baseline}%` : `${row.pct_vs_baseline}%`} vs Baseline`,
      type: 'country',
      data: {
        country: row.name,
        iso3: row.id.toUpperCase(),
        status: row.status,
        anomaly_percentile: row.percentile,
        pct_vs_baseline: row.pct_vs_baseline,
        detections_7d: row.detections_7d,
        total_frp_mw: row.total_frp_mw,
        forecast_label: row.forecast_label
      }
    });
  };

  const handleExportTable = () => {
    const exportRows = filteredAndSorted.map((r) => ({
      name: r.name,
      status: r.status,
      pct_vs_baseline: r.pct_vs_baseline,
      percentile: r.percentile,
      detections_7d: r.detections_7d,
      total_frp_mw: r.total_frp_mw,
      forecast_label: r.forecast_label
    }));
    exportToCsv(`ranking_${regionName.toLowerCase().replace(/\s+/g, '_')}`, exportRows);
  };

  return (
    <DashboardCard
      id="sec-ranking"
      microLabel="REGIONAL DISAGGREGATION & RANKING"
      heading={`Sub-Regional Activity Distribution in ${regionName}`}
      subtitle="Ranked geographic sub-units sorted by thermal intensity and seasonal anomaly exceedance"
      colSpan="col-span-12"
      csvFilename={`subregional_ranking_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
      extraActions={
        <button
          type="button"
          onClick={handleExportTable}
          title="Export current ranking table to CSV"
          className="h-7 px-2.5 rounded border border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-mono font-semibold flex items-center gap-1 hover:border-[var(--border-strong)] transition cursor-pointer mr-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Table</span>
        </button>
      }
    >
      <div className="space-y-3" onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="Ranking table keyboard container"><div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sub-regions or status..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] font-mono"
            />
          </div>

          <div className="text-[11px] font-mono text-[var(--text-muted)]">
            Showing <strong className="text-[var(--text-h)]">{filteredAndSorted.length}</strong> sub-units · Navigate with <kbd className="px-1 py-0.5 bg-[var(--surface-2)] border border-[var(--border)] rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-[var(--surface-2)] border border-[var(--border)] rounded text-[10px]">↓</kbd> <kbd className="px-1 py-0.5 bg-[var(--surface-2)] border border-[var(--border)] rounded text-[10px]">↵</kbd>
          </div>
        </div>

        <div className="border border-[var(--border)] rounded-lg overflow-x-auto max-h-[380px]">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] text-[10px] uppercase font-bold sticky top-0 z-10 border-b border-[var(--border)] select-none">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-3.5 py-2 cursor-pointer hover:text-[var(--text-h)] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Sub-Region</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-3 py-2 cursor-pointer hover:text-[var(--text-h)] whitespace-nowrap"
                >
                  Status
                </th>
                <th
                  onClick={() => handleSort('pct_vs_baseline')}
                  className="px-3 py-2 cursor-pointer hover:text-[var(--text-h)] text-right whitespace-nowrap"
                >
                  % vs Baseline
                </th>
                <th
                  onClick={() => handleSort('percentile')}
                  className="px-3 py-2 cursor-pointer hover:text-[var(--text-h)] text-right whitespace-nowrap"
                >
                  Percentile
                </th>
                <th
                  onClick={() => handleSort('detections_7d')}
                  className="px-3 py-2 cursor-pointer hover:text-[var(--text-h)] text-right whitespace-nowrap"
                >
                  Detections 7d
                </th>
                <th
                  onClick={() => handleSort('total_frp_mw')}
                  className="px-3 py-2 cursor-pointer hover:text-[var(--text-h)] text-right whitespace-nowrap"
                >
                  Total FRP (MW)
                </th>
                <th className="px-3 py-2 text-center w-28 whitespace-nowrap">
                  30d Trend
                </th>
                <th className="px-3.5 py-2 text-right whitespace-nowrap">
                  Outlook
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredAndSorted.map((row, idx) => {
                const isFocused = idx === focusedIndex;
                const badgeClass =
                  row.status === 'Unusual'
                    ? 'bg-[var(--danger-bg)] text-[var(--danger)] border-[rgba(184,52,31,0.3)]'
                    : row.status === 'Elevated'
                    ? 'bg-[var(--warn-bg)] text-[var(--warn)] border-[rgba(183,121,31,0.3)]'
                    : 'bg-[var(--ok-bg)] text-[var(--ok)] border-[rgba(47,125,87,0.3)]';

                return (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    className={`cursor-pointer transition-colors ${
                      isFocused ? 'bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--accent)]' : 'hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <td className="px-3.5 py-2.5 font-bold text-[var(--text-h)] whitespace-nowrap">
                      {row.name}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${badgeClass}`}>
                        {row.status}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">
                      <span className={row.pct_vs_baseline > 0 ? 'text-[var(--danger)]' : 'text-[var(--ok)]'}>
                        {row.pct_vs_baseline > 0 ? `+${row.pct_vs_baseline}%` : `${row.pct_vs_baseline}%`}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-right text-[var(--text-h)] whitespace-nowrap">
                      {row.percentile}th
                    </td>

                    <td className="px-3 py-2.5 text-right text-[var(--text-h)] font-bold whitespace-nowrap">
                      {row.detections_7d.toLocaleString()}
                    </td>

                    <td className="px-3 py-2.5 text-right text-[var(--accent)] font-bold whitespace-nowrap">
                      {row.total_frp_mw.toLocaleString()}
                    </td>

                    <td className="px-3 py-2.5 w-28">
                      <div className="h-5">
                        <MiniSparkline
                          data={row.sparkline}
                          color={row.pct_vs_baseline > 0 ? 'var(--accent)' : 'var(--ok)'}
                          height={20}
                        />
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                      <span className="text-[11px] text-[var(--text)] font-sans">
                        {row.forecast_label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardCard>
  );
};

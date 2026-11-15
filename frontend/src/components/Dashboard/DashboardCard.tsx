import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Table, Eye, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';

interface DashboardCardProps {
  id: string;
  microLabel: string;
  heading: string;
  subtitle: string;
  colSpan?: string;
  children: React.ReactNode;
  tableData?: Record<string, any>[];
  csvFilename?: string;
  extraActions?: React.ReactNode;
  isCollapsible?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  microLabel,
  heading,
  subtitle,
  colSpan = 'col-span-12',
  children,
  tableData,
  csvFilename,
  extraActions,
  isCollapsible = true,
  isLoading = false,
  error = null,
  onRetry,
  className = ''
}) => {
  const storageKey = `emberwatch_dash_col_${id}`;
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(storageKey) === 'true';
  });
  const [showTable, setShowTable] = useState<boolean>(false);

  const toggleCollapse = () => {
    if (!isCollapsible) return;
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(storageKey, String(next));
  };

  const handleExportCsv = () => {
    if (tableData && tableData.length > 0) {
      exportToCsv(csvFilename || id, tableData);
    }
  };

  return (
    <section
      id={id}
      className={`scroll-mt-20 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xs transition-colors ${colSpan} ${className}`}
    ><header className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)] mb-3">
        <div className="space-y-0.5 min-w-0">
          <span className="micro-label uppercase tracking-widest text-[9px] font-bold text-[var(--text-muted)] font-mono block">
            {microLabel}
          </span>
          <h3 className="text-base font-bold text-[var(--text-h)] tracking-tight leading-snug truncate">
            {heading}
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-mono truncate">
            {subtitle}
          </p>
        </div><div className="flex items-center gap-1 shrink-0 pt-0.5">
          {extraActions}
          {tableData && tableData.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              title={showTable ? 'Switch to chart visualization' : 'View underlying data table'}
              aria-label={showTable ? 'Switch to chart' : 'View data table'}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            >
              {showTable ? <Eye className="w-4 h-4" /> : <Table className="w-4 h-4" />}
            </button>
          )}

          {tableData && tableData.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              title="Export data to CSV"
              aria-label="Export data to CSV"
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {isCollapsible && (
            <button
              type="button"
              onClick={toggleCollapse}
              title={isCollapsed ? 'Expand section' : 'Collapse section'}
              aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {!isCollapsed && (
        <div className="relative">
          {isLoading ? (
            <div className="space-y-3 py-6">
              <div className="h-6 w-1/3 rounded skeleton-shimmer" />
              <div className="h-44 w-full rounded skeleton-shimmer" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-md border border-[rgba(184,52,31,0.2)] bg-[var(--danger-bg)] text-xs text-[var(--danger)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-2.5 py-1 rounded border border-[var(--danger)] font-mono font-semibold flex items-center gap-1 hover:bg-[var(--surface)] transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          ) : showTable && tableData && tableData.length > 0 ? (
            <div className="overflow-x-auto max-h-72 border border-[var(--border)] rounded text-xs font-mono">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] uppercase text-[10px] sticky top-0 border-b border-[var(--border)]">
                  <tr>
                    {Object.keys(tableData[0]).map((col) => (
                      <th key={col} className="px-3 py-1.5 font-bold whitespace-nowrap">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {tableData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[var(--surface-2)] transition-colors">
                      {Object.keys(tableData[0]).map((col) => (
                        <td key={col} className="px-3 py-1.5 whitespace-nowrap text-[var(--text-h)]">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
};

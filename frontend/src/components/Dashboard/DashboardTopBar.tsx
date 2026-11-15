import React from 'react';
import { useStore } from '../../store/useStore';
import { Menu, Sun, Moon, Flame, Plus, X } from 'lucide-react';
import { LocationCombobox } from '../Combobox/LocationCombobox';
import { ViewSwitch } from '../Navigation/ViewSwitch';

export const DashboardTopBar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setDrawerOpen,
    setCurrentPage,
    dashboardTimeRange,
    setDashboardTimeRange,
    dashboardSensorFilter,
    setDashboardSensorFilter,
    isCompareMode,
    setCompareMode,
    compareRegionId,
    setCompareRegionId,
    regions
  } = useStore();

  const timeRanges: Array<{ id: '30d' | '90d' | '1y' | '5y' | 'all'; label: string }> = [
    { id: '30d', label: '30d' },
    { id: '90d', label: '90d' },
    { id: '1y', label: '1y' },
    { id: '5y', label: '5y' },
    { id: 'all', label: 'All' }
  ];

  const sensors: Array<{ id: 'harmonised' | 'modis' | 'viirs'; label: string }> = [
    { id: 'harmonised', label: 'Harmonised' },
    { id: 'modis', label: 'MODIS' },
    { id: 'viirs', label: 'VIIRS' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full subtle-glass border-b border-[var(--border)] px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-[1320px] mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-4"><div className="flex items-center gap-2 sm:gap-3 shrink-0"><button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation drawer"
            title="Open Navigation"
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-h)] hover:border-[var(--border-strong)] transition cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('landing')}
            aria-label="Return to landing"
            title="EmberWatch Home"
            className="flex items-center gap-1.5 px-2 h-8 rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-2)] transition cursor-pointer"
          >
            <Flame className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-mono font-bold text-xs tracking-wider text-[var(--text-h)] hidden md:inline">
              EMBERWATCH
            </span>
          </button><LocationCombobox variant="dashboard-pill" /><ViewSwitch />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">

          <div
            role="group"
            aria-label="Time window filter"
            className="hidden sm:inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-mono"
          >
            {timeRanges.map((tr) => (
              <button
                key={tr.id}
                type="button"
                onClick={() => setDashboardTimeRange(tr.id)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  dashboardTimeRange === tr.id
                    ? 'bg-[var(--surface)] font-bold text-[var(--text-h)] shadow-xs border border-[var(--border-strong)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Sensor filter"
            className="hidden md:inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-mono"
          >
            {sensors.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDashboardSensorFilter(s.id)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  dashboardSensorFilter === s.id
                    ? 'bg-[var(--surface)] font-bold text-[var(--accent)] shadow-xs border border-[var(--border-strong)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {!isCompareMode ? (
            <button
              type="button"
              onClick={() => setCompareMode(true)}
              title="Add a second region to compare metrics"
              className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent-border)] hover:text-[var(--accent)] text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 h-8 px-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] text-xs font-mono">
              <span className="text-[var(--text-muted)] text-[10px]">VS:</span>
              <select
                value={compareRegionId}
                onChange={(e) => setCompareRegionId(e.target.value)}
                className="bg-transparent font-bold text-[var(--text-h)] focus:outline-none cursor-pointer"
              >
                {regions.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[var(--surface)] text-[var(--text-h)]">
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCompareMode(false)}
                title="Exit compare mode"
                className="text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-h)] hover:border-[var(--border-strong)] transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

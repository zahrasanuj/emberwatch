import React from 'react';
import { useStore } from '../../store/useStore';
import { motion, LayoutGroup } from 'framer-motion';
import { Map as MapIcon, LayoutDashboard } from 'lucide-react';

interface ViewSwitchProps {
  className?: string;
}

export const ViewSwitch: React.FC<ViewSwitchProps> = ({ className = '' }) => {
  const { currentPage, setCurrentPage } = useStore();

  const isMap = currentPage === 'map';
  const isDashboard = currentPage === 'dashboard';

  return (
    <LayoutGroup id="view-switch-nav">
      <div
        role="group"
        aria-label="View switch"
        className={`relative inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] select-none shadow-xs text-xs ${className}`}
      ><button
          type="button"
          onClick={() => {
            if (!isMap) setCurrentPage('map');
          }}
          aria-pressed={isMap}
          className={`relative px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium ${
            isMap ? 'text-[var(--text-h)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          {isMap && (
            <motion.div
              layoutId="viewSwitchActivePill"
              className="absolute inset-0 rounded-md bg-[var(--surface)] border border-[var(--border-strong)] shadow-xs"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5 pointer-events-none">
            <MapIcon className="w-3.5 h-3.5" style={{ color: isMap ? 'var(--accent)' : 'currentColor' }} />
            <span>Map</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isDashboard) setCurrentPage('dashboard');
          }}
          aria-pressed={isDashboard}
          className={`relative px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium ${
            isDashboard ? 'text-[var(--text-h)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          {isDashboard && (
            <motion.div
              layoutId="viewSwitchActivePill"
              className="absolute inset-0 rounded-md bg-[var(--surface)] border border-[var(--border-strong)] shadow-xs"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5 pointer-events-none">
            <LayoutDashboard className="w-3.5 h-3.5" style={{ color: isDashboard ? 'var(--accent)' : 'currentColor' }} />
            <span>Dashboard</span>
          </span>
        </button>
      </div>
    </LayoutGroup>
  );
};

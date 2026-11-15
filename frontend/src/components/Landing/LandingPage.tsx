import React from 'react';
import { useStore } from '../../store/useStore';
import { LocationCombobox } from '../Combobox/LocationCombobox';
import { Menu, Sun, Moon, Flame, Globe } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setActiveRegionId,
    setCurrentPage,
    setDrawerOpen
  } = useStore();

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--sans)'
      }}
    >
      <header className="w-full px-6 py-4 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
          style={{ color: 'var(--text-h)' }}
        >
          <Menu style={{ width: 20, height: 20, strokeWidth: 1.5 }} />
        </button>

        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
          style={{ color: 'var(--text-h)' }}
        >
          {theme === 'dark' ? (
            <Sun style={{ width: 18, height: 18, strokeWidth: 1.5 }} />
          ) : (
            <Moon style={{ width: 18, height: 18, strokeWidth: 1.5 }} />
          )}
        </button>
      </header>

      <main className="flex-1 w-full max-w-[620px] mx-auto px-6 flex flex-col items-center justify-center -mt-16 select-none">
        <div className="text-center space-y-2 mb-6">
          <div className="flex items-center justify-center gap-2">
            <Flame style={{ width: 20, height: 20, strokeWidth: 1.5, color: 'var(--text-h)' }} />
            <span
              className="text-sm font-bold tracking-[0.16em] uppercase"
              style={{ color: 'var(--text-h)' }}
            >
              EMBERWATCH
            </span>
          </div>
          <p
            className="text-sm font-normal tracking-normal"
            style={{ color: 'var(--text-muted)' }}
          >
            Predict. Detect. Prepare.
          </p>
        </div>

        <div className="w-full">
          <LocationCombobox variant="landing" />
        </div>

        <div className="flex items-center justify-center mt-6">
          <button
            onClick={() => {
              setActiveRegionId(null);
              setCurrentPage('map');
            }}
            className="px-5 py-2.5 rounded-lg flex items-center gap-2 text-xs font-bold cursor-pointer transition-all shadow-md hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: '#0a0a0a',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <Globe style={{ width: 15, height: 15 }} />
            <span>Explore Global World Map</span>
          </button>
        </div>
      </main>
    </div>
  );
};

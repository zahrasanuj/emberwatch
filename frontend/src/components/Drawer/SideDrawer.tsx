import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, AppView } from '../../store/useStore';
import {
  Globe,
  Map as MapIcon,
  LayoutDashboard,
  Calendar,
  Fingerprint,
  Activity,
  History,
  TrendingUp,
  Database,
  Sliders,
  Shield,
  Satellite,
  Compass,
  AlertCircle,
  HelpCircle,
  Sun,
  Moon,
  X,
  Flame,
  FileCheck2,
  ShieldCheck,
  Trees
} from 'lucide-react';

export const SideDrawer: React.FC = () => {
  const {
    theme,
    toggleTheme,
    isDrawerOpen,
    setDrawerOpen,
    activeRegionId,
    setActiveRegionId,
    activeView,
    setActiveView,
    currentPage,
    setCurrentPage,
    setScenarioModalOpen,
    setHarmonisationModalOpen,
    setLimitationsModalOpen,
    setInsightsOpen
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, setDrawerOpen]);

  const navigateToExplore = (dest: 'world' | 'map' | 'dashboard') => {
    if (dest === 'world') {
      setActiveRegionId(null);
      setActiveView('world');
      setCurrentPage('map');
      setInsightsOpen(true);
    } else if (dest === 'map') {
      setCurrentPage('map');
    } else if (dest === 'dashboard') {
      setCurrentPage('dashboard');
    }
    setDrawerOpen(false);
  };

  const navigateToView = (view: AppView) => {
    if (view === 'world') {
      setActiveRegionId(null);
    } else if (view === 'dashboard' && !activeRegionId) {
      setActiveRegionId('california');
    }
    setActiveView(view);
    setInsightsOpen(true);
    setCurrentPage('map');
    setDrawerOpen(false);
  };

  const navSections = [
    {
      title: 'EXPLORE',
      items: [
        { id: 'nav-world', label: 'World', icon: Globe, action: () => navigateToExplore('world') },
        { id: 'nav-map', label: 'Map', icon: MapIcon, action: () => navigateToExplore('map') },
        { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, action: () => navigateToExplore('dashboard') },
        { id: 'calendar', label: 'Activity Calendar', icon: Calendar, action: () => navigateToView('calendar') },
        { id: 'fingerprint', label: 'Burning Fingerprint', icon: Fingerprint, action: () => navigateToView('fingerprint') },
        { id: 'anomaly', label: 'Anomaly Radar', icon: Activity, action: () => navigateToView('anomaly') },
        { id: 'timeline', label: 'What Changed? Timeline', icon: History, action: () => navigateToView('timeline') }
      ]
    },
    {
      title: 'FORECAST & SCENARIOS',
      items: [
        { id: 'forecast', label: 'Predictive Calendar', icon: TrendingUp, action: () => navigateToView('forecast') },
        { id: 'memory', label: 'Fire Memory (Analogs)', icon: Database, action: () => navigateToView('memory') },
        { id: 'simulator', label: 'What-If Simulator', icon: Sliders, action: () => navigateToView('simulator') }
      ]
    },
    {
      title: 'ACT & INTEGRITY',
      items: [
        {
          id: 'environmental-impact',
          label: 'Environmental impact',
          icon: Trees,
          action: () => {
            setCurrentPage('map');
            setDrawerOpen(false);
            useStore.getState().setImpactOpen(true);
            useStore.getState().setImpactMinimised(false);
          }
        },
        { id: 'readiness', label: 'Readiness & Briefing', icon: Shield, action: () => navigateToView('readiness') },
        { id: 'confidence', label: 'Sensor Trust & Harmonisation', icon: Satellite, action: () => navigateToView('confidence') },
        { id: 'data-integrity', label: 'Data Integrity', icon: ShieldCheck, action: () => navigateToView('data-integrity') },
        { id: 'data-status', label: 'Data Status & Archive', icon: FileCheck2, action: () => navigateToView('data-status') }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        ><motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black cursor-pointer"
          /><motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-[310px] h-full flex flex-col p-5 space-y-4 overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              color: 'var(--text)'
            }}
          ><div
              className="flex items-center justify-between pb-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => {
                  setCurrentPage('landing');
                  setDrawerOpen(false);
                }}
                className="flex items-center gap-2 cursor-pointer group text-left"
              >
                <Flame
                  style={{
                    width: 18,
                    height: 18,
                    strokeWidth: 1.5,
                    color: 'var(--accent)'
                  }}
                />
                <div>
                  <span
                    className="text-[13px] font-bold tracking-[0.14em] uppercase block leading-none font-mono"
                    style={{ color: 'var(--text-h)' }}
                  >
                    EMBERWATCH
                  </span>
                  <span
                    className="text-[10px] tracking-wide block mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Predict. Detect. Prepare.
                  </span>
                </div>
              </button>

              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="p-1 rounded-md cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <X style={{ width: 18, height: 18, strokeWidth: 1.5 }} />
              </button>
            </div><div className="flex-1 space-y-5">
              {navSections.map((sec, secIdx) => (
                <div key={sec.title} className="space-y-1">
                  <div
                    className="text-[10px] font-bold tracking-[0.1em] uppercase px-2 mb-1 font-mono"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {sec.title}
                  </div>
                  {sec.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const isActive =
                      item.id === 'nav-dashboard'
                        ? currentPage === 'dashboard'
                        : item.id === 'nav-world'
                        ? currentPage === 'map' && !activeRegionId
                        : item.id === 'nav-map'
                        ? currentPage === 'map' && Boolean(activeRegionId)
                        : activeView === item.id;

                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: (secIdx * 3 + itemIdx) * 0.025,
                          duration: 0.18
                        }}
                        onClick={item.action}
                        className="relative w-full h-9 px-2.5 rounded-lg flex items-center gap-3 text-xs font-medium cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                        style={{
                          backgroundColor: isActive ? 'var(--surface-2)' : 'transparent',
                          color: isActive ? 'var(--text-h)' : 'var(--text)'
                        }}
                      >
                        {isActive && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-r"
                            style={{ backgroundColor: 'var(--accent)' }}
                          />
                        )}
                        <Icon
                          style={{
                            width: 16,
                            height: 16,
                            strokeWidth: 1.5,
                            color: isActive ? 'var(--accent)' : 'currentColor'
                          }}
                        />
                        <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div
              className="pt-3 border-t space-y-1 text-xs flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => {
                  setScenarioModalOpen(true);
                  setDrawerOpen(false);
                }}
                className="w-full h-8 px-2.5 rounded-lg flex items-center gap-3 font-medium cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--text)' }}
              >
                <Compass style={{ width: 16, height: 16, strokeWidth: 1.5, color: 'currentColor' }} />
                <span>Explore a Scenario</span>
              </button>

              <button
                onClick={() => {
                  setLimitationsModalOpen(true);
                  setDrawerOpen(false);
                }}
                className="w-full h-8 px-2.5 rounded-lg flex items-center gap-3 font-medium cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--text)' }}
              >
                <AlertCircle style={{ width: 16, height: 16, strokeWidth: 1.5, color: 'currentColor' }} />
                <span>Methods & Limitations</span>
              </button>

              <button
                onClick={() => {
                  setHarmonisationModalOpen(true);
                  setDrawerOpen(false);
                }}
                className="w-full h-8 px-2.5 rounded-lg flex items-center gap-3 font-medium cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--text)' }}
              >
                <HelpCircle style={{ width: 16, height: 16, strokeWidth: 1.5, color: 'currentColor' }} />
                <span>How We Harmonise</span>
              </button>

              <button
                onClick={toggleTheme}
                className="w-full h-8 px-2.5 rounded-lg flex items-center justify-between font-medium cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--text)' }}
              >
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Sun style={{ width: 16, height: 16, strokeWidth: 1.5, color: 'currentColor' }} />
                  ) : (
                    <Moon style={{ width: 16, height: 16, strokeWidth: 1.5, color: 'currentColor' }} />
                  )}
                  <span>Theme</span>
                </div>
                <span
                  className="text-[10px] font-mono capitalize px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {theme}
                </span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

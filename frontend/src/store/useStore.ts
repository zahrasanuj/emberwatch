import { create } from 'zustand';
import type { Region, Hotspot } from '../types';

export type AppView =
  | 'world'
  | 'overview'
  | 'dashboard'
  | 'calendar'
  | 'fingerprint'
  | 'anomaly'
  | 'timeline'
  | 'forecast'
  | 'simulator'
  | 'memory'
  | 'readiness'
  | 'confidence'
  | 'scenario'
  | 'data-integrity'
  | 'data-status';

export type PageRoute = 'landing' | 'map' | 'dashboard';

export interface DetailDrawerState {
  open: boolean;
  title: string;
  subtitle?: string;
  type?: 'cluster' | 'country' | 'memory' | 'cell' | 'audit' | 'ranking';
  data?: any;
}

interface AppState {

  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  currentPage: PageRoute;
  setCurrentPage: (page: PageRoute) => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;

  dashboardTimeRange: '30d' | '90d' | '1y' | '5y' | 'all';
  setDashboardTimeRange: (range: '30d' | '90d' | '1y' | '5y' | 'all') => void;
  dashboardSensorFilter: 'harmonised' | 'modis' | 'viirs';
  setDashboardSensorFilter: (filter: 'harmonised' | 'modis' | 'viirs') => void;
  isCompareMode: boolean;
  setCompareMode: (open: boolean) => void;

  regions: Region[];
  setRegions: (regions: Region[]) => void;
  activeRegionId: string | null; 
  setActiveRegionId: (id: string | null) => void;
  customBbox: [number, number, number, number] | null;
  setCustomBbox: (bbox: [number, number, number, number] | null) => void;
  isDrawingMode: boolean;
  setIsDrawingMode: (drawing: boolean) => void;

  hotspots: Hotspot[];
  setHotspots: (hotspots: Hotspot[]) => void;
  hotspotsDays: number;
  setHotspotsDays: (days: number) => void;
  hotspotSensorFilter: 'both' | 'modis' | 'viirs';
  setHotspotSensorFilter: (filter: 'both' | 'modis' | 'viirs') => void;
  hotspotColorMode: 'frp' | 'sensor';
  setHotspotColorMode: (mode: 'frp' | 'sensor') => void;
  selectedHotspot: Hotspot | null;
  setSelectedHotspot: (h: Hotspot | null) => void;

  activeMonth: string; 
  setActiveMonth: (month: string) => void;
  isPlayingMonth: boolean;
  setIsPlayingMonth: (play: boolean) => void;
  showDensityLayer: boolean;
  setShowDensityLayer: (show: boolean) => void;
  showChoropleth: boolean;
  setShowChoropleth: (show: boolean) => void;

  detailDrawer: DetailDrawerState | null;
  openDetailDrawer: (detail: Omit<DetailDrawerState, 'open'>) => void;
  closeDetailDrawer: () => void;

  basemapStyle: 'auto' | 'satellite' | 'terrain';
  setBasemapStyle: (style: 'auto' | 'satellite' | 'terrain') => void;
  showHillshade: boolean;
  setShowHillshade: (show: boolean) => void;
  terrainExaggeration: number;
  setTerrainExaggeration: (v: number) => void;
  hotspotOpacity: number;
  setHotspotOpacity: (v: number) => void;
  gridSizeStep: number;
  setGridSizeStep: (v: number) => void;
  showGridProbLayer: boolean;
  setShowGridProbLayer: (show: boolean) => void;

  heatmapMode: 'points' | 'heatmap' | 'both';
  setHeatmapMode: (mode: 'points' | 'heatmap' | 'both') => void;
  heatmapSource: 'live' | 'historical';
  setHeatmapSource: (src: 'live' | 'historical') => void;
  heatmapWeightBy: 'frp' | 'count';
  setHeatmapWeightBy: (weight: 'frp' | 'count') => void;
  heatmapRadius: number;
  setHeatmapRadius: (r: number) => void;
  heatmapIntensity: number;
  setHeatmapIntensity: (i: number) => void;
  heatmapOpacity: number;
  setHeatmapOpacity: (o: number) => void;
  heatmapColorRamp: 'heat' | 'greyscale';
  setHeatmapColorRamp: (ramp: 'heat' | 'greyscale') => void;
  heatmapFadeZoom: number;
  setHeatmapFadeZoom: (z: number) => void;

  calendarMode: 'harmonised' | 'modis' | 'viirs';
  setCalendarMode: (mode: 'harmonised' | 'modis' | 'viirs') => void;
  compareRegionId: string;
  setCompareRegionId: (id: string) => void;
  timelineYear: number;
  setTimelineYear: (year: number) => void;

  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;

  isInsightsOpen: boolean;
  setInsightsOpen: (open: boolean) => void;
  insightsWidth: number;
  setInsightsWidth: (w: number) => void;
  isInsightsMinimised: boolean;
  setInsightsMinimised: (min: boolean) => void;
  isInsightsMaximised: boolean;
  setInsightsMaximised: (max: boolean) => void;

  isMapSettingsOpen: boolean;
  setMapSettingsOpen: (open: boolean) => void;
  isMapSettingsMinimised: boolean;
  setMapSettingsMinimised: (min: boolean) => void;
  isMapSettingsMaximised: boolean;
  setMapSettingsMaximised: (max: boolean) => void;

  isImpactOpen: boolean;
  setImpactOpen: (open: boolean) => void;
  isImpactMinimised: boolean;
  setImpactMinimised: (min: boolean) => void;
  isImpactMaximised: boolean;
  setImpactMaximised: (max: boolean) => void;
  impactReferenceLevel: 'selected' | 'extreme' | 'high' | 'moderate' | 'low';
  setImpactReferenceLevel: (lvl: 'selected' | 'extreme' | 'high' | 'moderate' | 'low') => void;
  selectedCluster: any | null;
  setSelectedCluster: (c: any | null) => void;
  isMapMoving: boolean;
  setIsMapMoving: (m: boolean) => void;

  isHarmonisationModalOpen: boolean;
  setHarmonisationModalOpen: (open: boolean) => void;
  isBriefingModalOpen: boolean;
  setBriefingModalOpen: (open: boolean) => void;
  isScenarioModalOpen: boolean;
  setScenarioModalOpen: (open: boolean) => void;
  isModelCardModalOpen: boolean;
  setModelCardModalOpen: (open: boolean) => void;
  isLimitationsModalOpen: boolean;
  setLimitationsModalOpen: (open: boolean) => void;
}

const initialTheme: 'light' | 'dark' =
  (localStorage.getItem('emberwatch_theme') as 'light' | 'dark') || 'light';

if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const initialRegion = urlParams?.get('region') || null;
const initialView: AppView = (urlParams?.get('view') as AppView) || (initialRegion ? 'dashboard' : 'world');

const isDashboardPath =
  typeof window !== 'undefined' &&
  (window.location.pathname.startsWith('/dashboard') || urlParams?.get('page') === 'dashboard');
const isMapPath =
  typeof window !== 'undefined' &&
  (window.location.pathname.startsWith('/map') || urlParams?.get('page') === 'map');

const initialPage: PageRoute = isDashboardPath
  ? 'dashboard'
  : isMapPath || initialRegion || Boolean(urlParams?.get('view'))
  ? 'map'
  : 'landing';

const initialHeatmap = (urlParams?.get('heatmap') as any) || 'points';
const initialSettingsOpen = typeof window !== 'undefined' && (
  urlParams?.get('settings') === 'open' ||
  urlParams?.get('settings') === 'true' ||
  localStorage.getItem('emberwatch_settings_open') === 'true' ||
  (localStorage.getItem('emberwatch_settings_open') === null && window.innerWidth >= 1024)
);
const initialDrawerOpen = urlParams?.get('drawer') === 'open' || urlParams?.get('drawer') === 'true';

export const useStore = create<AppState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    localStorage.setItem('emberwatch_theme', theme);
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    set({ theme });
  },
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('emberwatch_theme', next);
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    return { theme: next };
  }),

  currentPage: initialPage,
  setCurrentPage: (page) => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const reg = get().activeRegionId;
      if (reg) searchParams.set('region', reg);
      else searchParams.delete('region');
      const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const url = page === 'dashboard' ? `/dashboard${search}` : page === 'map' ? `/map${search}` : `/${search}`;
      window.history.pushState({}, '', url);
    }
    set({ currentPage: page });
  },

  dashboardTimeRange: '90d',
  setDashboardTimeRange: (range) => set({ dashboardTimeRange: range }),

  dashboardSensorFilter: 'harmonised',
  setDashboardSensorFilter: (filter) => set({ dashboardSensorFilter: filter }),

  isCompareMode: false,
  setCompareMode: (open) => set({ isCompareMode: open }),

  activeView: initialView,
  setActiveView: (view) => set({ activeView: view }),

  regions: [],
  setRegions: (regions) => set({ regions }),
  activeRegionId: initialRegion,
  setActiveRegionId: (id) => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (id) searchParams.set('region', id);
      else searchParams.delete('region');
      const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const page = get().currentPage;
      const url = page === 'dashboard' ? `/dashboard${search}` : page === 'map' ? `/map${search}` : `/${search}`;
      window.history.pushState({}, '', url);
    }
    if (id) {
      set({ activeRegionId: id, activeView: 'dashboard', customBbox: null });
    } else {
      set({ activeRegionId: null, activeView: 'world', customBbox: null });
    }
  },

  customBbox: null,
  setCustomBbox: (bbox) => set({ customBbox: bbox }),
  isDrawingMode: false,
  setIsDrawingMode: (drawing) => set({ isDrawingMode: drawing }),

  hotspots: [],
  setHotspots: (hotspots) => set({ hotspots }),
  hotspotsDays: 2,
  setHotspotsDays: (days) => set({ hotspotsDays: days }),
  hotspotSensorFilter: 'both',
  setHotspotSensorFilter: (filter) => set({ hotspotSensorFilter: filter }),
  hotspotColorMode: 'frp',
  setHotspotColorMode: (mode) => set({ hotspotColorMode: mode }),
  selectedHotspot: null,
  setSelectedHotspot: (h) => set({ selectedHotspot: h, selectedCluster: null, isImpactOpen: true }),

  activeMonth: new Date().toISOString().slice(0,7),
  setActiveMonth: (month) => set({ activeMonth: month }),
  isPlayingMonth: false,
  setIsPlayingMonth: (play) => set({ isPlayingMonth: play }),
  showDensityLayer: true,
  setShowDensityLayer: (show) => set({ showDensityLayer: show }),
  showChoropleth: false,
  setShowChoropleth: (show) => set({ showChoropleth: show }),

  detailDrawer: null,
  openDetailDrawer: (detail) => set({ detailDrawer: { ...detail, open: true } }),
  closeDetailDrawer: () => set({ detailDrawer: null }),

  basemapStyle: (localStorage.getItem('emberwatch_basemap') as any) || 'auto',
  setBasemapStyle: (style) => {
    localStorage.setItem('emberwatch_basemap', style);
    set({ basemapStyle: style });
  },
  showHillshade: false,
  setShowHillshade: (show) => set({ showHillshade: show }),
  terrainExaggeration: 1.5,
  setTerrainExaggeration: (v) => set({ terrainExaggeration: v }),
  hotspotOpacity: 0.9,
  setHotspotOpacity: (v) => set({ hotspotOpacity: v }),
  gridSizeStep: 0.25,
  setGridSizeStep: (v) => set({ gridSizeStep: v }),
  showGridProbLayer: false,
  setShowGridProbLayer: (show) => set({ showGridProbLayer: show }),

  heatmapMode: initialHeatmap,
  setHeatmapMode: (mode) => set({ heatmapMode: mode }),
  heatmapSource: 'live',
  setHeatmapSource: (src) => set({ heatmapSource: src }),
  heatmapWeightBy: 'frp',
  setHeatmapWeightBy: (weight) => set({ heatmapWeightBy: weight }),
  heatmapRadius: 16,
  setHeatmapRadius: (r) => set({ heatmapRadius: r }),
  heatmapIntensity: 1.0,
  setHeatmapIntensity: (i) => set({ heatmapIntensity: i }),
  heatmapOpacity: 0.85,
  setHeatmapOpacity: (o) => set({ heatmapOpacity: o }),
  heatmapColorRamp: 'heat',
  setHeatmapColorRamp: (ramp) => set({ heatmapColorRamp: ramp }),
  heatmapFadeZoom: 9,
  setHeatmapFadeZoom: (z) => set({ heatmapFadeZoom: z }),

  calendarMode: 'harmonised',
  setCalendarMode: (mode) => set({ calendarMode: mode }),
  compareRegionId: 'punjab',
  setCompareRegionId: (id) => set({ compareRegionId: id }),
  timelineYear: 2024,
  setTimelineYear: (year) => set({ timelineYear: year }),

  isDrawerOpen: initialDrawerOpen,
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),

  isInsightsOpen: localStorage.getItem('emberwatch_insights_open') !== 'false',
  setInsightsOpen: (open) => {
    localStorage.setItem('emberwatch_insights_open', String(open));
    set({ isInsightsOpen: open });
  },
  insightsWidth: Number(localStorage.getItem('emberwatch_insights_width')) || 440,
  setInsightsWidth: (w) => {
    localStorage.setItem('emberwatch_insights_width', String(w));
    set({ insightsWidth: w });
  },
  isInsightsMinimised: false,
  setInsightsMinimised: (min) => set({ isInsightsMinimised: min, ...(min ? { isInsightsMaximised: false } : {}) }),
  isInsightsMaximised: false,
  setInsightsMaximised: (max) => set({
    isInsightsMaximised: max,
    isInsightsMinimised: false,
    insightsWidth: max ? 720 : 440,
    ...(max ? { isImpactMaximised: false, isImpactMinimised: true } : {})
  }),

  isMapSettingsOpen: initialSettingsOpen,
  setMapSettingsOpen: (open) => {
    localStorage.setItem('emberwatch_settings_open', String(open));
    set({ isMapSettingsOpen: open });
  },
  isMapSettingsMinimised: false,
  setMapSettingsMinimised: (min) => set({ isMapSettingsMinimised: min }),
  isMapSettingsMaximised: false,
  setMapSettingsMaximised: (max) => set({ isMapSettingsMaximised: max }),

  isImpactOpen: localStorage.getItem('emberwatch_impact_open') !== 'false',
  setImpactOpen: (open) => {
    localStorage.setItem('emberwatch_impact_open', String(open));
    set({ isImpactOpen: open });
  },
  isImpactMinimised: localStorage.getItem('emberwatch_impact_minimised') === 'true',
  setImpactMinimised: (min) => {
    localStorage.setItem('emberwatch_impact_minimised', String(min));
    set({ isImpactMinimised: min, ...(min ? { isImpactMaximised: false } : {}) });
  },
  isImpactMaximised: localStorage.getItem('emberwatch_impact_maximised') === 'true',
  setImpactMaximised: (max) => {
    localStorage.setItem('emberwatch_impact_maximised', String(max));
    set({
      isImpactMaximised: max,
      isImpactMinimised: false,
      ...(max ? { isInsightsMaximised: false, isInsightsMinimised: true } : {})
    });
  },
  impactReferenceLevel: 'selected',
  setImpactReferenceLevel: (lvl) => set({ impactReferenceLevel: lvl }),
  selectedCluster: null,
  setSelectedCluster: (c) => set({ selectedCluster: c, selectedHotspot: null, isImpactOpen: true }),
  isMapMoving: false,
  setIsMapMoving: (m) => set({ isMapMoving: m }),

  isHarmonisationModalOpen: false,
  setHarmonisationModalOpen: (open) => set({ isHarmonisationModalOpen: open }),
  isBriefingModalOpen: false,
  setBriefingModalOpen: (open) => set({ isBriefingModalOpen: open }),
  isScenarioModalOpen: false,
  setScenarioModalOpen: (open) => set({ isScenarioModalOpen: open }),
  isModelCardModalOpen: false,
  setModelCardModalOpen: (open) => set({ isModelCardModalOpen: open }),
  isLimitationsModalOpen: false,
  setLimitationsModalOpen: (open) => set({ isLimitationsModalOpen: open }),
}));

if (typeof window !== 'undefined') {
  (window as any).__STORE__ = useStore;
}

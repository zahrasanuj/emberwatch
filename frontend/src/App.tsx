import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import {
  fetchRegions,
  fetchRecentHotspots,
  fetchCalendar,
  fetchFingerprint,
  fetchAnomaly,
  fetchTimeline,
  fetchForecast,
  fetchForecastGrid,
  fetchSimilar,
  fetchReadiness,
  fetchConfidence,
  fetchSimilarRegions,
  verifyNumber
} from './services/api';
import type {
  CalendarData,
  Fingerprint,
  AnomalyData,
  ForecastData,
  GridCellProb,
  FireMemoryData,
  ReadinessData,
  ConfidenceRecord
} from './types';

import { LandingPage } from './components/Landing/LandingPage';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import { SideDrawer } from './components/Drawer/SideDrawer';
import { DetailDrawer } from './components/Drawer/DetailDrawer';
import { FireMap } from './components/Map/FireMap';
import { MapSettings } from './components/Map/MapSettings';
import { RightPanelStack } from './components/Map/RightPanelStack';

import { HarmonisationModal } from './components/SensorTrust/HarmonisationModal';
import { BriefingModal } from './components/Readiness/BriefingModal';
import { ScenarioWalkthrough } from './components/Scenario/ScenarioWalkthrough';
import { ModelCardModal } from './components/Forecast/ModelCardModal';
import { LimitationsModal } from './components/Limitations/LimitationsModal';

export function App() {
  const {
    theme,
    currentPage,
    setCurrentPage,
    activeRegionId,
    setActiveRegionId,
    setActiveView,
    regions,
    setRegions,
    hotspots,
    setHotspots,
    hotspotsDays,
    hotspotSensorFilter,
    calendarMode,
    customBbox
  } = useStore();

  const [provenance, setProvenance] = useState<string>('NASA FIRMS API');
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [fingerprint, setFingerprint] = useState<Fingerprint | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyData | null>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [gridCells, setGridCells] = useState<GridCellProb[]>([]);
  const [fireMemory, setFireMemory] = useState<FireMemoryData | null>(null);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceRecord | null>(null);
  const [similarRegions, setSimilarRegions] = useState<any[]>([]);

  useEffect(()=>{
    const closeTop=(e:KeyboardEvent)=>{if(e.key!=='Escape')return; const s=useStore.getState();
      if(s.isDrawerOpen)s.setDrawerOpen(false);
      else if(s.detailDrawer?.open)s.closeDetailDrawer();
      else if(s.isMapSettingsOpen)s.setMapSettingsOpen(false);
      else if(s.isImpactOpen)s.setImpactOpen(false);
      else if(s.isInsightsOpen)s.setInsightsOpen(false);
      e.stopImmediatePropagation();
    };window.addEventListener('keydown',closeTop,true);return()=>window.removeEventListener('keydown',closeTop,true);
  },[]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const regionParam = params.get('region');
    const viewParam = params.get('view');
    const pageParam = params.get('page');

    const isDashboard = pageParam === 'dashboard' || window.location.pathname.startsWith('/dashboard');
    const isMap = pageParam === 'map' || window.location.pathname.startsWith('/map');

    if (regionParam) {
      setActiveRegionId(regionParam);
    } else {
      setActiveRegionId(null);
    }

    if (isDashboard) {
      setCurrentPage('dashboard');
    } else if (isMap) {
      setCurrentPage('map');
    } else if (regionParam) {
      setCurrentPage('map');
    }
    if (viewParam) {
      setActiveView(viewParam as any);
    }
    const themeParam = params.get('theme');
    if (themeParam === 'dark' || themeParam === 'light') {
      useStore.getState().setTheme(themeParam);
    }
    const heatmapParam = params.get('heatmap');
    if (heatmapParam === 'heatmap' || heatmapParam === 'both' || heatmapParam === 'points') {
      useStore.getState().setHeatmapMode(heatmapParam as any);
    }
    const basemapParam = params.get('basemap');
    if (basemapParam === 'terrain' || basemapParam === 'satellite' || basemapParam === 'auto') {
      useStore.getState().setBasemapStyle(basemapParam as any);
    }
    const sensorParam = params.get('sensor');
    if (sensorParam === 'viirs' || sensorParam === 'modis' || sensorParam === 'harmonised') {
      useStore.getState().setCalendarMode(sensorParam as any);
      useStore.getState().setDashboardSensorFilter(sensorParam as any);
      useStore.getState().setHotspotSensorFilter(sensorParam as any);
    }
    const settingsParam = params.get('settings');
    if (settingsParam === 'open' || settingsParam === 'true') {
      useStore.getState().setMapSettingsOpen(true);
    }
    const drawerParam = params.get('drawer');
    if (drawerParam === 'open' || drawerParam === 'true') {
      useStore.getState().setDrawerOpen(true);
    }
    const impactParam = params.get('impact');
    if (impactParam === 'open' || impactParam === 'true') {
      useStore.getState().setImpactOpen(true);
    } else if (impactParam === 'closed' || impactParam === 'false') {
      useStore.getState().setImpactOpen(false);
    }
    const insightsParam = params.get('insights');
    if (insightsParam === 'open' || insightsParam === 'true') {
      useStore.getState().setInsightsOpen(true);
    } else if (insightsParam === 'closed' || insightsParam === 'false') {
      useStore.getState().setInsightsOpen(false);
    }
    const auditParam = params.get('audit');
    if (auditParam) {
      const metric = auditParam === 'true' ? 'detections_7d' : auditParam;
      const reg = regionParam || 'california';
      verifyNumber(metric, reg, 142, 7)
        .then((res) => {
          useStore.getState().openDetailDrawer({
            title: `Integrity Audit: ${metric.replace(/_/g, ' ').toUpperCase()}`,
            subtitle: `DuckDB Parquet Cache vs Independent Recalculation`,
            type: 'audit',
            data: res
          });
        })
        .catch(console.error);
    }
  }, [setActiveRegionId, setActiveView, setCurrentPage]);

  useEffect(() => {
    fetchRegions()
      .then((data) => {
        setRegions(data.regions);
      })
      .catch(console.error);
  }, [setRegions]);

  useEffect(() => {
    if (currentPage !== 'map') return;
    const targetRegion = activeRegionId || 'world';
    fetchRecentHotspots(targetRegion, hotspotsDays, hotspotSensorFilter, customBbox || undefined)
      .then((res) => {
        setHotspots(res.hotspots || []);
        setProvenance(res.provenance || 'NASA FIRMS Live Telemetry');
      })
      .catch(console.error);
  }, [currentPage, activeRegionId, hotspotsDays, hotspotSensorFilter, customBbox, setHotspots]);

  useEffect(() => {
    if (currentPage !== 'map') return;
    if (!activeRegionId) {
      setCalendarData(null);
      setFingerprint(null);
      setAnomaly(null);
      setTimeline(null);
      setForecast(null);
      setGridCells([]);
      setFireMemory(null);
      setReadiness(null);
      setConfidence(null);
      setSimilarRegions([]);
      return;
    }

    let isSubscribed = true;

    Promise.allSettled([
      fetchCalendar(activeRegionId, calendarMode),
      fetchFingerprint(activeRegionId),
      fetchAnomaly(activeRegionId),
      fetchTimeline(activeRegionId),
      fetchForecast(activeRegionId),
      fetchForecastGrid(activeRegionId),
      fetchSimilar(activeRegionId),
      fetchReadiness(activeRegionId),
      fetchConfidence(activeRegionId),
      fetchSimilarRegions(activeRegionId)
    ]).then(([cal, fp, anom, time, fc, grid, mem, read, conf, simReg]) => {
      if (!isSubscribed) return;
      if (cal.status === 'fulfilled') setCalendarData(cal.value);
      if (fp.status === 'fulfilled') setFingerprint(fp.value);
      if (anom.status === 'fulfilled') setAnomaly(anom.value);
      if (time.status === 'fulfilled') setTimeline(time.value);
      if (fc.status === 'fulfilled') setForecast(fc.value);
      if (grid.status === 'fulfilled') setGridCells(grid.value.cells || []);
      if (mem.status === 'fulfilled') setFireMemory(mem.value);
      if (read.status === 'fulfilled') setReadiness(read.value);
      if (conf.status === 'fulfilled') setConfidence(conf.value);
      if (simReg.status === 'fulfilled') setSimilarRegions(simReg.value.similar_regions || []);
    });

    return () => {
      isSubscribed = false;
    };
  }, [currentPage, activeRegionId, calendarMode]);

  const activeRegion = regions.find((r) => r.id === activeRegionId) || null;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--sans)'
      }}
    ><AnimatePresence mode="wait">
        {currentPage === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            <LandingPage />
          </motion.div>
        ) : currentPage === 'dashboard' ? (
          <motion.div
            key="dashboard"
            id="dashboard-scroll-viewport"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full overflow-y-auto"
          >
            <DashboardPage />
          </motion.div>
        ) : (
          /* Screen C: Full-Bleed Map Workspace */
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full h-full overflow-hidden"
          >
            <FireMap
              hotspots={hotspots}
              gridCells={gridCells}
              onSelectHotspot={(h) => console.log('Selected hotspot:', h)}
            /><MapSettings totalHotspots={hotspots.length} provenance={provenance} />

            <RightPanelStack
              region={activeRegion}
              anomaly={anomaly}
              forecast={forecast}
              confidence={confidence}
              calendarData={calendarData}
              fingerprint={fingerprint}
              timeline={timeline}
              fireMemory={fireMemory}
              readiness={readiness}
              similarRegions={similarRegions}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <SideDrawer />
      <DetailDrawer />
      <HarmonisationModal />
      <BriefingModal readiness={readiness} />
      <ScenarioWalkthrough />
      <ModelCardModal />
      <LimitationsModal />
    </div>
  );
}

export default App;

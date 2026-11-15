import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
maplibregl.setWorkerUrl(workerUrl);
import { useStore } from '../../store/useStore';
import type { Hotspot, GridCellProb } from '../../types';
import { LocationCombobox } from '../Combobox/LocationCombobox';
import { ViewSwitch } from '../Navigation/ViewSwitch';
import { WorldTimeControl } from './WorldTimeControl';
import { fetchWorldDensity } from '../../services/api';
import { Menu, Sun, Moon, AlertCircle, Flame } from 'lucide-react';

interface FireMapProps {
  hotspots: Hotspot[];
  gridCells?: GridCellProb[];
  onSelectHotspot?: (hotspot: Hotspot) => void;
}

export const FireMap: React.FC<FireMapProps> = ({ hotspots, gridCells = [], onSelectHotspot }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);

  const {
    theme,
    toggleTheme,
    regions,
    activeRegionId,
    setActiveRegionId,
    activeView,
    setCurrentPage,
    isInsightsOpen,
    setInsightsOpen,
    customBbox,
    hotspotColorMode,
    hotspotOpacity,
    showGridProbLayer,
    basemapStyle,
    activeMonth,
    showDensityLayer,
    showChoropleth,
    setDrawerOpen,
    isMapSettingsOpen,
    heatmapMode,
    heatmapSource,
    heatmapWeightBy,
    heatmapRadius,
    heatmapIntensity,
    heatmapOpacity,
    heatmapColorRamp,
    heatmapFadeZoom,
    hotspotsDays
  } = useStore();

  const [mapReady,setMapReady] = useState(0);
  const [mapErrorNotice, setMapErrorNotice] = useState<string | null>(null);
  const activeRegion = regions.find((r) => r.id === activeRegionId) || null;

  const getCssVar = (name: string): string => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };

  const getMapStyle = (): any => {
    if (basemapStyle === 'satellite') {
      return {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, Maxar, Earthstar Geographics'
          }
        },
        layers: [
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      };
    }

    if (basemapStyle === 'terrain') {
      return {
        version: 8,
        sources: {
          'esri-terrain': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, USGS, NOAA'
          }
        },
        layers: [
          {
            id: 'esri-terrain-layer',
            type: 'raster',
            source: 'esri-terrain',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      };
    }

    const isDark = theme === 'dark';
    return isDark
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const initialCenter: [number, number] = activeRegion
      ? [activeRegion.centroid.lon, activeRegion.centroid.lat]
      : [15, 20]; 

    const initialZoom = activeRegion ? activeRegion.default_zoom || 6 : 1.8;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      attributionControl: false
    });

    m.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: 'NASA FIRMS | Open-Meteo | Natural Earth'
      }),
      'bottom-right'
    );

    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    popup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12
    });

    m.on('movestart', () => document.body.classList.add('map-is-moving'));
    m.on('moveend', () => document.body.classList.remove('map-is-moving'));

    let boxStart: maplibregl.LngLat | null = null;
    m.on('mousedown', e=>{if(!useStore.getState().isDrawingMode)return; boxStart=e.lngLat; m.dragPan.disable();});
    m.on('mouseup', e=>{if(!boxStart)return; const box:[number,number,number,number]=[Math.min(boxStart.lng,e.lngLat.lng),Math.min(boxStart.lat,e.lngLat.lat),Math.max(boxStart.lng,e.lngLat.lng),Math.max(boxStart.lat,e.lngLat.lat)]; boxStart=null;m.dragPan.enable();const state=useStore.getState();state.setIsDrawingMode(false);if(box[2]-box[0]>60||box[3]-box[1]>60){setMapErrorNotice('Select a box smaller than 60° per side.');return;}state.setActiveRegionId('custom');state.setCustomBbox(box);state.setInsightsOpen(true);});

    m.on('error', (e) => {
      console.warn('MapLibre notice:', e);
      if (!mapErrorNotice) {
        setMapErrorNotice('A map layer could not load.');
      }
    });

    map.current = m;

    m.on('load', () => {
      setupLayers(m);
      updateOutline(m);
      setMapReady(v=>v+1);
    });

    return () => {
      m.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const newStyle = getMapStyle();

    let applied = false;
    const triggerRebuild = () => {
      if (applied || !map.current) return;
      applied = true;
      m.off('styledata', onStyleData);
      m.off('style.load', triggerRebuild);
      setupLayers(m);
      updateOutline(m);
      setMapReady((v) => v + 1);
    };

    const onStyleData = (e: any) => {
      if (e.dataType === 'style' && m.isStyleLoaded()) {
        triggerRebuild();
      }
    };

    m.on('styledata', onStyleData);
    m.once('style.load', triggerRebuild);
    m.setStyle(newStyle);

    if (m.isStyleLoaded()) {
      triggerRebuild();
    } else {
      setTimeout(() => {
        if (!applied && map.current) {
          triggerRebuild();
        }
      }, 120);
    }
  }, [theme, basemapStyle]);

  useEffect(() => {
    if (!map.current) return;
    if (!activeRegionId && !customBbox) {
      map.current.flyTo({
        center: [15, 20],
        zoom: 1.8,
        duration: 1000
      });
      updateOutline(map.current);
      return;
    }

    const bbox = customBbox || (activeRegion ? activeRegion.bbox : null);
    if (!bbox) return;

    const [west, south, east, north] = bbox;
    map.current.fitBounds(
      [
        [west, south],
        [east, north]
      ],
      {
        padding: 60,
        duration: 1200,
        maxZoom: 9
      }
    );

    updateOutline(map.current);
  }, [activeRegionId, customBbox, activeRegion]);

  const updateOutline = (m: maplibregl.Map) => {
    if (!m.isStyleLoaded()) return;
    const bbox = customBbox || (activeRegion ? activeRegion.bbox : null);
    const outlineGeojson: any = bbox
      ? {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [bbox[0], bbox[1]],
                  [bbox[2], bbox[1]],
                  [bbox[2], bbox[3]],
                  [bbox[0], bbox[3]],
                  [bbox[0], bbox[1]]
                ]]
              }
            }
          ]
        }
      : { type: 'FeatureCollection', features: [] };

    if (m.getSource('region-outline-source')) {
      (m.getSource('region-outline-source') as maplibregl.GeoJSONSource).setData(outlineGeojson);
    } else {
      m.addSource('region-outline-source', {
        type: 'geojson',
        data: outlineGeojson
      });

      const accentColor = getCssVar('--accent');
      m.addLayer({
        id: 'region-outline-layer',
        type: 'line',
        source: 'region-outline-source',
        paint: {
          'line-color': accentColor,
          'line-width': 1.5,
          'line-dasharray': [4, 4],
          'line-opacity': 0.85
        }
      });
    }
  };

  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const source = m.getSource('hotspots-source') as maplibregl.GeoJSONSource;
    if (!source) return;

    const geojson: any = {
      type: 'FeatureCollection',
      features: hotspots.map((h, i) => ({
        type: 'Feature',
        id: i,
        geometry: {
          type: 'Point',
          coordinates: [h.lon, h.lat]
        },
        properties: {
          ...h
        }
      }))
    };

    source.setData(geojson);
    const unclustered = m.getSource('hotspots-unclustered-source') as maplibregl.GeoJSONSource;
    if (unclustered) {
      unclustered.setData(geojson);
    }
  }, [hotspots, mapReady]);

  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const source = m.getSource('grid-prob-source') as maplibregl.GeoJSONSource;
    if (!source) return;

    const step = 0.25;
    const geojson: any = {
      type: 'FeatureCollection',
      features: gridCells.map((c, i) => {
        const half = step / 2;
        return {
          type: 'Feature',
          id: i,
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [c.lon - half, c.lat - half],
              [c.lon + half, c.lat - half],
              [c.lon + half, c.lat + half],
              [c.lon - half, c.lat + half],
              [c.lon - half, c.lat - half]
            ]]
          },
          properties: {
            probability: c.probability,
            category: c.category
          }
        };
      })
    };

    source.setData(geojson);
    if (m.getLayer('grid-prob-layer')) {
      m.setLayoutProperty('grid-prob-layer', 'visibility', showGridProbLayer ? 'visible' : 'none');
    }
  }, [gridCells, showGridProbLayer, mapReady]);

  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const source = m.getSource('world-density-source') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (!showDensityLayer) {
      if (m.getLayer('world-density-layer')) {
        m.setLayoutProperty('world-density-layer', 'visibility', 'none');
      }
      return;
    }

    fetchWorldDensity(activeMonth)
      .then((data) => {
        if (!data || !data.cells) return;
        const geojson: any = {
          type: 'FeatureCollection',
          features: data.cells.map((c: any, i: number) => ({
            type: 'Feature',
            id: i,
            geometry: {
              type: 'Point',
              coordinates: [c.lon, c.lat]
            },
            properties: {
              heat_step: c.heat_step,
              detections: c.detections,
              frp: c.frp
            }
          }))
        };
        source.setData(geojson);
        if (m.getLayer('world-density-layer')) {
          m.setLayoutProperty('world-density-layer', 'visibility', 'visible');
        }
      })
      .catch((err) => console.warn('Density layer fetch notice:', err));
  }, [activeMonth, showDensityLayer,mapReady]);

  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const vis = 'visible';
    if (m.getLayer('countries-choropleth-layer')) {
      m.setLayoutProperty('countries-choropleth-layer', 'visibility', vis);
    }
    if (m.getLayer('countries-borders-layer')) {
      m.setLayoutProperty('countries-borders-layer', 'visibility', vis);
    }
  }, [showChoropleth]);

  useEffect(() => {
    if (!map.current) return;
    const m = map.current;

    const heat0 = getCssVar('--heat-0') || '#ebe8e2';
    const heat1 = getCssVar('--heat-1') || '#f1cfb5';
    const heat2 = getCssVar('--heat-2') || '#e8995f';
    const heat3 = getCssVar('--heat-3') || '#d9481c';
    const heat4 = getCssVar('--heat-4') || '#8f2412';

    const heatRampColor =
      heatmapColorRamp === 'heat'
        ? [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0, 0, 0, 0)',
            0.15,
            heat0,
            0.35,
            heat1,
            0.6,
            heat2,
            0.8,
            heat3,
            1.0,
            heat4
          ]
        : [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0, 0, 0, 0)',
            0.2,
            'rgba(220, 220, 220, 0.4)',
            0.4,
            '#b0b0b0',
            0.6,
            '#707070',
            0.8,
            '#353535',
            1.0,
            '#0b0b0b'
          ];

    const radiusExpr = [
      'interpolate',
      ['linear'],
      ['zoom'],
      0,
      Math.max(3, heatmapRadius * 0.35),
      4,
      heatmapRadius * 0.7,
      8,
      heatmapRadius,
      12,
      heatmapRadius * 1.8,
      16,
      heatmapRadius * 3
    ];

    const intensityExpr = [
      'interpolate',
      ['linear'],
      ['zoom'],
      0,
      heatmapIntensity * 0.6,
      6,
      heatmapIntensity,
      12,
      heatmapIntensity * 1.6
    ];

    const weightExpr =
      heatmapWeightBy === 'frp'
        ? ['interpolate', ['linear'], ['get', 'frp'], 0, 0, 5, 0.1, 25, 0.4, 70, 0.75, 150, 1.0]
        : 1;

    const densityWeightExpr =
      heatmapWeightBy === 'frp'
        ? ['interpolate', ['linear'], ['get', 'frp'], 0, 0, 20, 0.2, 100, 0.5, 300, 0.8, 800, 1.0]
        : ['interpolate', ['linear'], ['get', 'detections'], 1, 0.1, 10, 0.35, 50, 0.7, 100, 1.0];

    const heatmapOpacityExpr =
      heatmapMode === 'both'
        ? heatmapOpacity
        : [
            'interpolate',
            ['linear'],
            ['zoom'],
            heatmapFadeZoom,
            heatmapOpacity,
            heatmapFadeZoom + 1,
            0
          ];

    const pointsOpacityExpr =
      heatmapMode === 'heatmap'
        ? [
            'interpolate',
            ['linear'],
            ['zoom'],
            heatmapFadeZoom - 0.5,
            0,
            heatmapFadeZoom + 0.5,
            hotspotOpacity
          ]
        : hotspotOpacity;

    if (m.getLayer('hotspots-heatmap')) {
      const showLiveHeat = heatmapMode !== 'points' && heatmapSource === 'live';
      m.setLayoutProperty('hotspots-heatmap', 'visibility', showLiveHeat ? 'visible' : 'none');
      if (showLiveHeat) {
        m.setPaintProperty('hotspots-heatmap', 'heatmap-color', heatRampColor as any);
        m.setPaintProperty('hotspots-heatmap', 'heatmap-radius', radiusExpr as any);
        m.setPaintProperty('hotspots-heatmap', 'heatmap-intensity', intensityExpr as any);
        m.setPaintProperty('hotspots-heatmap', 'heatmap-weight', weightExpr as any);
        m.setPaintProperty('hotspots-heatmap', 'heatmap-opacity', heatmapOpacityExpr as any);
      }
    }

    if (m.getLayer('world-density-heatmap')) {
      const showHistHeat = heatmapMode !== 'points' && heatmapSource === 'historical';
      m.setLayoutProperty('world-density-heatmap', 'visibility', showHistHeat ? 'visible' : 'none');
      if (showHistHeat) {
        m.setPaintProperty('world-density-heatmap', 'heatmap-color', heatRampColor as any);
        m.setPaintProperty('world-density-heatmap', 'heatmap-radius', radiusExpr as any);
        m.setPaintProperty('world-density-heatmap', 'heatmap-intensity', intensityExpr as any);
        m.setPaintProperty('world-density-heatmap', 'heatmap-weight', densityWeightExpr as any);
        m.setPaintProperty('world-density-heatmap', 'heatmap-opacity', heatmapOpacityExpr as any);
      }
    }

    if (m.getLayer('hotspots-core')) {
      m.setPaintProperty('hotspots-core', 'circle-opacity', pointsOpacityExpr as any);
    }
    if (m.getLayer('hotspots-clusters')) {
      m.setPaintProperty('hotspots-clusters', 'circle-opacity', pointsOpacityExpr as any);
    }
    if (m.getLayer('world-density-layer')) {
      const showDensity = showDensityLayer && (heatmapMode !== 'heatmap' || heatmapSource !== 'historical');
      m.setLayoutProperty('world-density-layer', 'visibility', showDensity ? 'visible' : 'none');
    }
  }, [
    heatmapMode,
    heatmapSource,
    heatmapWeightBy,
    heatmapRadius,
    heatmapIntensity,
    heatmapOpacity,
    heatmapColorRamp,
    heatmapFadeZoom,
    hotspotOpacity,
    showDensityLayer,
    theme,
    mapReady
  ]);

  const setupLayers = (m: maplibregl.Map) => {
    const heat0 = getCssVar('--heat-0') || '#ebe8e2';
    const heat1 = getCssVar('--heat-1') || '#f1cfb5';
    const heat2 = getCssVar('--heat-2') || '#e8995f';
    const heat3 = getCssVar('--heat-3') || '#d9481c';
    const heat4 = getCssVar('--heat-4') || '#8f2412';
    const borderColor = getCssVar('--border') || '#e3e0da';

    if (!m.getSource('countries-choropleth-source')) {
      m.addSource('countries-choropleth-source', {
        type: 'geojson',
        data: '/api/boundaries/countries.geojson'
      });

      m.addLayer({
        id: 'countries-choropleth-layer',
        type: 'fill',
        source: 'countries-choropleth-source',
        layout: {
          visibility: showChoropleth ? 'visible' : 'none'
        },
        paint: {
          'fill-color': getCssVar('--accent') || '#d9481c',
          'fill-opacity': 0.12
        }
      });

      m.addLayer({
        id: 'countries-borders-layer',
        type: 'line',
        source: 'countries-choropleth-source',
        layout: {
          visibility: showChoropleth ? 'visible' : 'none'
        },
        paint: {
          'line-color': getCssVar('--border-strong') || '#cfcbc3',
          'line-width': 0.75,
          'line-opacity': 0.65
        }
      });

      m.on('click', 'countries-choropleth-layer', (e: any) => {
        if (m.queryRenderedFeatures(e.point,{layers:['hotspots-clusters','hotspots-core']}).length) return;
        if(useStore.getState().isDrawingMode) return;
        if (!e.features || !e.features[0]) return;
        const props = e.features[0].properties;
        const cid = props.id || props.iso3 || props.name;
        if (cid) {
          useStore.getState().setCustomBbox(null);
          setActiveRegionId(cid.toLowerCase());
          useStore.getState().setActiveView('dashboard');
          setInsightsOpen(true);
        }
      });

      m.on('mouseenter', 'countries-choropleth-layer', (e: any) => {
        if (showChoropleth) {
          m.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features[0] && popup.current) {
            const props = e.features[0].properties;
            popup.current
              .setLngLat(e.lngLat)
              .setHTML(`<div style="font-family: var(--sans); font-size: 12px; font-weight: 600; color: var(--text-h);">${props.name || 'Country'}</div>`)
              .addTo(m);
          }
        }
      });

      m.on('mouseleave', 'countries-choropleth-layer', () => {
        m.getCanvas().style.cursor = '';
        if (popup.current) popup.current.remove();
      });
    }

    if (!m.getSource('world-density-source')) {
      m.addSource('world-density-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      m.addLayer({
        id: 'world-density-layer',
        type: 'circle',
        source: 'world-density-source',
        layout: {
          visibility: showDensityLayer && heatmapMode !== 'heatmap' ? 'visible' : 'none'
        },
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1, 2.5,
            4, 6,
            8, 14
          ],
          'circle-color': [
            'match',
            ['get', 'heat_step'],
            4, heat4,
            3, heat3,
            2, heat2,
            1, heat1,
            heat0
          ],
          'circle-opacity': 0.65,
          'circle-blur': 0.35
        }
      });

      m.addLayer({
        id: 'world-density-heatmap',
        type: 'heatmap',
        source: 'world-density-source',
        layout: {
          visibility: heatmapMode !== 'points' && heatmapSource === 'historical' ? 'visible' : 'none'
        },
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'frp'],
            0, 0,
            20, 0.2,
            100, 0.5,
            300, 0.8,
            800, 1.0
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, heatmapIntensity * 0.6,
            6, heatmapIntensity,
            12, heatmapIntensity * 1.6
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.15, heat0,
            0.35, heat1,
            0.6, heat2,
            0.8, heat3,
            1.0, heat4
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, Math.max(3, heatmapRadius * 0.35),
            4, heatmapRadius * 0.7,
            8, heatmapRadius,
            12, heatmapRadius * 1.8,
            16, heatmapRadius * 3
          ],
          'heatmap-opacity': heatmapMode === 'both' ? heatmapOpacity : [
            'interpolate',
            ['linear'],
            ['zoom'],
            heatmapFadeZoom, heatmapOpacity,
            heatmapFadeZoom + 1, 0
          ]
        }
      });
    }

    if (!m.getSource('grid-prob-source')) {
      m.addSource('grid-prob-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      m.addLayer({
        id: 'grid-prob-layer',
        type: 'fill',
        source: 'grid-prob-source',
        layout: {
          visibility: showGridProbLayer ? 'visible' : 'none'
        },
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'probability'],
            0.1, heat1,
            0.4, heat2,
            0.7, heat3,
            0.9, heat4
          ],
          'fill-opacity': 0.45,
          'fill-outline-color': borderColor
        }
      });
    }

    if (!m.getSource('hotspots-source')) {
      const initialHotspotsGeojson = {
        type: 'FeatureCollection',
        features: (hotspots || []).map((h, i) => ({
          type: 'Feature',
          id: i,
          geometry: {
            type: 'Point',
            coordinates: [h.lon, h.lat]
          },
          properties: { ...h }
        }))
      };

      m.addSource('hotspots-source', {
        type: 'geojson',
        data: initialHotspotsGeojson,
        cluster: true,
        clusterMaxZoom: 7,
        clusterRadius: 40
      });

      if (!m.getSource('hotspots-unclustered-source')) {
        m.addSource('hotspots-unclustered-source', {
          type: 'geojson',
          data: initialHotspotsGeojson
        });

        m.addLayer({
          id: 'hotspots-heatmap',
          type: 'heatmap',
          source: 'hotspots-unclustered-source',
          layout: {
            visibility: heatmapMode !== 'points' && heatmapSource === 'live' ? 'visible' : 'none'
          },
          paint: {
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'frp'],
              0, 0,
              5, 0.1,
              25, 0.4,
              70, 0.75,
              150, 1.0
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, heatmapIntensity * 0.6,
              6, heatmapIntensity,
              12, heatmapIntensity * 1.6
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.15, heat0,
              0.35, heat1,
              0.6, heat2,
              0.8, heat3,
              1.0, heat4
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, Math.max(3, heatmapRadius * 0.35),
              4, heatmapRadius * 0.7,
              8, heatmapRadius,
              12, heatmapRadius * 1.8,
              16, heatmapRadius * 3
            ],
            'heatmap-opacity': heatmapMode === 'both' ? heatmapOpacity : [
              'interpolate',
              ['linear'],
              ['zoom'],
              heatmapFadeZoom, heatmapOpacity,
              heatmapFadeZoom + 1, 0
            ]
          }
        });
      }

      m.addLayer({
        id: 'hotspots-clusters',
        type: 'circle',
        source: 'hotspots-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            heat2,
            50, heat3,
            250, heat4
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            12,
            50, 16,
            250, 22
          ],
          'circle-opacity': 0.88,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': getCssVar('--surface') || '#fbfaf8'
        }
      });

      m.addLayer({
        id: 'hotspots-core',
        type: 'circle',
        source: 'hotspots-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1, 2.5,
            4, 4,
            8, 6.5,
            12, 11
          ],
          'circle-color':
            hotspotColorMode === 'sensor'
              ? ['case', ['==', ['get', 'instrument'], 'MODIS'], heat2, heat3]
              : [
                  'interpolate',
                  ['linear'],
                  ['get', 'frp'],
                  5, heat1,
                  25, heat2,
                  70, heat3,
                  150, heat4
                ],
          'circle-opacity': hotspotOpacity,
          'circle-stroke-width': 1,
          'circle-stroke-color': getCssVar('--surface') || '#fbfaf8'
        }
      });

      m.on('click', 'hotspots-clusters', async (e: any) => {
        const features = m.queryRenderedFeatures(e.point,{layers:['hotspots-clusters']});
        if(!features[0]) return;
        const src=m.getSource('hotspots-source') as maplibregl.GeoJSONSource;
        const leaves=await src.getClusterLeaves(features[0].properties.cluster_id,100000,0);
        const coords=(features[0].geometry as any).coordinates;
        const total_frp_mw = leaves.reduce((s,l)=>s+Number(l.properties?.frp||0),0);
        const peak_frp = Math.max(...leaves.map(l=>Number(l.properties?.frp||0)));
        useStore.getState().setSelectedCluster({
          lat: coords[1],
          lon: coords[0],
          cluster_id: features[0].properties.cluster_id,
          cluster_count: leaves.length,
          cluster_sum_frp: total_frp_mw,
          cluster_max_frp: peak_frp
        });
        useStore.getState().openDetailDrawer({title:'Observed hotspot cluster',type:'cluster',data:{lat:coords[1].toFixed(2),lon:coords[0].toFixed(2),detections_count:leaves.length,total_frp_mw:total_frp_mw,peak_frp:peak_frp}});
      });

      m.on('mouseenter', 'hotspots-core', (e: any) => {
        m.getCanvas().style.cursor = 'pointer';
        if (!e.features || !e.features[0] || !popup.current) return;
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();

        popup.current
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family: var(--sans); font-size: 12px; line-height: 1.4; color: var(--text);">
              <div style="font-weight: 700; color: var(--text-h); margin-bottom: 2px;">
                ${props.instrument} (${props.satellite})
              </div>
              <div>FRP: <strong style="font-family: var(--mono); color: var(--text-h);">${props.frp} MW</strong></div>
              <div style="color: var(--text-muted); font-size: 11px;">
                ${props.acq_date} · ${props.acq_time} UTC · ${props.confidence} confidence
              </div>
            </div>
          `)
          .addTo(m);
      });

      m.on('mouseleave', 'hotspots-core', () => {
        m.getCanvas().style.cursor = '';
        if (popup.current) popup.current.remove();
      });

      m.on('click', 'hotspots-core', (e: any) => {
        if (!e.features || !e.features[0]) return;
        const props = e.features[0].properties;
        const coords = (e.features[0].geometry as any).coordinates;
        useStore.getState().setSelectedHotspot({
          ...props,
          lat: coords[1],
          lon: coords[0]
        });
        if (onSelectHotspot) onSelectHotspot(props);
      });

      m.on('movestart', () => useStore.getState().setIsMapMoving(true));
      m.on('moveend', () => useStore.getState().setIsMapMoving(false));
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none"><div ref={mapContainer} className="w-full h-full" /><div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto"><button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="subtle-glass w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:border-[var(--border-strong)] transition-colors"
            style={{ color: 'var(--text-h)' }}
          >
            <Menu style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
          </button><button
            onClick={() => setCurrentPage('landing')}
            title="Return to Landing Page"
            aria-label="Return to Landing Page"
            className="subtle-glass px-2.5 h-8 rounded-lg flex items-center gap-1.5 cursor-pointer hover:border-[var(--border-strong)] transition-colors text-xs font-bold"
            style={{ color: 'var(--text-h)' }}
          >
            <Flame style={{ width: 14, height: 14, strokeWidth: 1.5 }} />
            <span className="hidden sm:inline font-mono tracking-wider">EMBERWATCH</span>
          </button>

          <LocationCombobox variant="map-pill" /><ViewSwitch />
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setInsightsOpen(!isInsightsOpen)}
            title="Toggle Insights Panel (Press I)"
            aria-label="Toggle Insights Panel"
            className="subtle-glass px-2.5 h-8 rounded-lg flex items-center gap-1.5 cursor-pointer hover:border-[var(--border-strong)] transition-colors text-xs font-medium"
            style={{ color: 'var(--text-h)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="capitalize">{activeRegionId ? activeView : 'World'}</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="subtle-glass w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:border-[var(--border-strong)] transition-colors"
            style={{ color: 'var(--text-h)' }}
          >
            {theme === 'dark' ? (
              <Sun style={{ width: 15, height: 15, strokeWidth: 1.5 }} />
            ) : (
              <Moon style={{ width: 15, height: 15, strokeWidth: 1.5 }} />
            )}
          </button>
        </div>
      </div>

      {!activeRegionId && <WorldTimeControl />}
      {heatmapMode !== 'points' && (
        <div
          className={`subtle-glass absolute z-10 p-2.5 rounded-lg border shadow-xl flex flex-col gap-1.5 pointer-events-auto w-[248px] ${
            isMapSettingsOpen ? 'left-[308px] bottom-4' : 'left-4 bottom-14'
          }`}
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)'
          }}
        >
          <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--text-h)' }}>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Thermal Energy Heatmap</span>
            </div>
            <span
              className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold"
              style={{
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)'
              }}
            >
              {heatmapMode}
            </span>
          </div>

          <div className="space-y-0.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            <div className="flex justify-between">
              <span>Profile:</span>
              <span className="font-semibold" style={{ color: 'var(--text-h)' }}>
                {heatmapSource === 'live' ? 'Live (VIIRS NRT)' : 'Historical Grid'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Weight:</span>
              <span className="font-semibold" style={{ color: 'var(--text-h)' }}>
                {heatmapWeightBy === 'frp' ? 'Thermal Power (MW)' : 'Detections'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Window:</span>
              <span style={{ color: 'var(--text)' }}>
                {heatmapSource === 'live'
                  ? hotspotsDays === 1
                    ? 'Last 24 Hours'
                    : hotspotsDays === 2
                    ? 'Last 48 Hours'
                    : 'Last 7 Days'
                  : activeMonth}
              </span>
            </div>
          </div><div className="pt-1 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
              <span>{heatmapWeightBy === 'frp' ? '0 MW' : '1 hit'}</span>
              <span>{heatmapWeightBy === 'frp' ? '≥150 MW' : '≥100 hits'}</span>
            </div>
            <div className="h-1.5 w-full rounded-sm flex overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {heatmapColorRamp === 'heat' ? (
                <>
                  <div style={{ backgroundColor: 'var(--heat-0)', flex: 1 }} />
                  <div style={{ backgroundColor: 'var(--heat-1)', flex: 1 }} />
                  <div style={{ backgroundColor: 'var(--heat-2)', flex: 1 }} />
                  <div style={{ backgroundColor: 'var(--heat-3)', flex: 1 }} />
                  <div style={{ backgroundColor: 'var(--heat-4)', flex: 1 }} />
                </>
              ) : (
                <>
                  <div style={{ backgroundColor: '#e0e0e0', flex: 1 }} />
                  <div style={{ backgroundColor: '#b0b0b0', flex: 1 }} />
                  <div style={{ backgroundColor: '#707070', flex: 1 }} />
                  <div style={{ backgroundColor: '#353535', flex: 1 }} />
                  <div style={{ backgroundColor: '#0b0b0b', flex: 1 }} />
                </>
              )}
            </div>
          </div>

          <div className="text-[9px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
            Sensors: <span style={{ color: 'var(--text)' }}>MODIS · VIIRS (SNPP, NOAA-20, NOAA-21)</span>
          </div>
        </div>
      )}
      {mapErrorNotice && (
        <div
          className="subtle-glass absolute top-14 left-4 z-10 px-3 py-1.5 rounded text-xs flex items-center gap-1.5"
          style={{ color: 'var(--warn)' }}
        >
          <AlertCircle style={{ width: 12, height: 12 }} />
          <span>{mapErrorNotice}</span>
        </div>
      )}
    </div>
  );
};

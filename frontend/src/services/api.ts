import {
  Region, Hotspot, CalendarData, Fingerprint, AnomalyData,
  ForecastData, GridCellProb, FireMemoryData, WhatIfResponse,
  ReadinessData, ConfidenceRecord, ScenarioStory
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchRegions(): Promise<{ regions: Region[]; count: number }> {
  const res = await fetch(`${API_BASE}/regions`);
  if (!res.ok) throw new Error('Failed to fetch regions');
  return res.json();
}

export async function fetchRecentHotspots(
  regionId: string,
  days: number = 2,
  sensor: string = 'both',
  customBbox?: [number, number, number, number]
): Promise<{ hotspots: Hotspot[]; total_hotspots: number; provenance: string }> {
  let url = `${API_BASE}/hotspots/recent?days=${days}&sensor=${sensor}`;
  if (customBbox) {
    url += `&bbox=${customBbox.join(',')}`;
  } else {
    url += `&region=${regionId}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch recent hotspots');
  return res.json();
}

export async function fetchCalendar(regionId: string, mode: string = 'harmonised'): Promise<CalendarData> {
  const res = await fetch(`${API_BASE}/calendar?region=${regionId}&mode=${mode}`);
  if (!res.ok) throw new Error('Failed to fetch calendar');
  return res.json();
}

export async function fetchFingerprint(regionId: string): Promise<Fingerprint> {
  const res = await fetch(`${API_BASE}/fingerprint?region=${regionId}`);
  if (!res.ok) throw new Error('Failed to fetch fingerprint');
  return res.json();
}

export async function fetchAnomaly(regionId: string, date?: string): Promise<AnomalyData> {
  let url = `${API_BASE}/anomaly?region=${regionId}`;
  if (date) url += `&date=${date}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch anomaly');
  return res.json();
}

export async function fetchTimeline(regionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/timeline?region=${regionId}`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function fetchForecast(regionId: string, date?: string): Promise<ForecastData> {
  let url = `${API_BASE}/forecast?region=${regionId}`;
  if (date) url += `&date=${date}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  return res.json();
}

export async function fetchForecastGrid(regionId: string): Promise<{ cells: GridCellProb[]; total_cells: number }> {
  const res = await fetch(`${API_BASE}/forecast/grid?region=${regionId}`);
  if (!res.ok) throw new Error('Failed to fetch forecast grid');
  return res.json();
}

export async function fetchSimilar(regionId: string, date?: string, k: number = 4): Promise<FireMemoryData> {
  let url = `${API_BASE}/similar?region=${regionId}&k=${k}`;
  if (date) url += `&date=${date}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch similar periods');
  return res.json();
}

export async function postWhatIf(payload: {
  region_id: string;
  date?: string;
  temp_offset: number;
  rain_pct: number;
  rh_offset: number;
  wind_offset: number;
}): Promise<WhatIfResponse> {
  const res = await fetch(`${API_BASE}/whatif`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to run what-if simulation');
  return res.json();
}

export async function fetchReadiness(regionId: string, date?: string): Promise<ReadinessData> {
  let url = `${API_BASE}/readiness?region=${regionId}`;
  if (date) url += `&date=${date}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch readiness');
  return res.json();
}

export async function fetchConfidence(regionId: string): Promise<ConfidenceRecord> {
  const res = await fetch(`${API_BASE}/confidence?region=${regionId}`);
  if (!res.ok) throw new Error('Failed to fetch confidence');
  return res.json();
}

export async function fetchScenario(regionId: string, date?: string): Promise<ScenarioStory> {
  let url = `${API_BASE}/scenario?region=${regionId}`;
  if (date) url += `&date=${date}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch scenario story');
  return res.json();
}

export async function fetchSimilarRegions(regionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/similar-regions?region=${regionId}`);
  if (!res.ok) throw new Error('Failed to fetch similar regions');
  return res.json();
}

export async function fetchModelCard(): Promise<any> {
  const res = await fetch(`${API_BASE}/model-card`);
  if (!res.ok) throw new Error('Failed to fetch model card');
  return res.json();
}

export async function fetchWorldKpis(): Promise<any> {
  const res = await fetch(`${API_BASE}/world/kpis`);
  if (!res.ok) throw new Error('Failed to fetch world KPIs');
  return res.json();
}

export async function fetchWorldTimeseries(): Promise<any> {
  const res = await fetch(`${API_BASE}/world/timeseries`);
  if (!res.ok) throw new Error('Failed to fetch world timeseries');
  return res.json();
}

export async function fetchWorldUnusual(): Promise<any> {
  const res = await fetch(`${API_BASE}/world/unusual`);
  if (!res.ok) throw new Error('Failed to fetch unusual regions');
  return res.json();
}

export async function fetchWorldDensity(month: string = '2024-08'): Promise<any> {
  const res = await fetch(`${API_BASE}/world/density?month=${month}`);
  if (!res.ok) throw new Error('Failed to fetch world density');
  return res.json();
}

export async function fetchWorldClusters(): Promise<any> {
  const res = await fetch(`${API_BASE}/world/clusters`);
  if (!res.ok) throw new Error('Failed to fetch world clusters');
  return res.json();
}

export async function fetchCountries(): Promise<{ countries: any[] }> {
  const res = await fetch(`${API_BASE}/countries`);
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}

export async function fetchDataStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/data-status`);
  if (!res.ok) throw new Error('Failed to fetch data status');
  return res.json();
}

export async function fetchRegionDashboard(regionId: string, bbox?: [number, number, number, number]): Promise<any> {
  let url = `${API_BASE}/region/dashboard?region=${regionId}`;
  if (bbox) {
    url += `&west=${bbox[0]}&south=${bbox[1]}&east=${bbox[2]}&north=${bbox[3]}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch region dashboard');
  return res.json();
}

export async function fetchIntegrityReport(forceRun: boolean = false): Promise<any> {
  const res = await fetch(`${API_BASE}/integrity?force_run=${forceRun}`);
  if (!res.ok) throw new Error('Failed to fetch data integrity report');
  return res.json();
}

export async function verifyNumber(
  metric: string,
  region: string = 'california',
  value: any = null,
  days: number = 7
): Promise<any> {
  const res = await fetch(`${API_BASE}/integrity/verify-number`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metric, region, value, days })
  });
  if (!res.ok) throw new Error('Failed to verify metric');
  return res.json();
}

export async function fetchSourcesAvailability(force: boolean = false): Promise<any> {
  const res = await fetch(`${API_BASE}/sources/availability?force=${force}`);
  if (!res.ok) throw new Error('Failed to fetch source availability');
  return res.json();
}

export async function fetchSourceProfiles(): Promise<any> {
  const res = await fetch(`${API_BASE}/sources/profiles`);
  if (!res.ok) throw new Error('Failed to fetch source profiles');
  return res.json();
}

export async function fetchImpactKnowledge(): Promise<any> {
  const res = await fetch(`${API_BASE}/impact/knowledge`);
  if (!res.ok) throw new Error('Failed to fetch environmental impact knowledge base');
  return res.json();
}

export async function fetchImpactEvaluation(params: {
  selectionType?: string;
  region?: string;
  bbox?: [number, number, number, number];
  hotspotId?: string;
  lat?: number;
  lon?: number;
  frp?: number;
  sensor?: string;
  clusterMaxFrp?: number;
  clusterSumFrp?: number;
  clusterCount?: number;
}): Promise<any> {
  const q = new URLSearchParams();
  if (params.selectionType) q.set('selection_type', params.selectionType);
  if (params.region) q.set('region', params.region);
  if (params.bbox) {
    q.set('west', String(params.bbox[0]));
    q.set('south', String(params.bbox[1]));
    q.set('east', String(params.bbox[2]));
    q.set('north', String(params.bbox[3]));
  }
  if (params.hotspotId) q.set('hotspot_id', params.hotspotId);
  if (params.lat !== undefined) q.set('lat', String(params.lat));
  if (params.lon !== undefined) q.set('lon', String(params.lon));
  if (params.frp !== undefined) q.set('frp', String(params.frp));
  if (params.sensor) q.set('sensor', params.sensor);
  if (params.clusterMaxFrp !== undefined) q.set('cluster_max_frp', String(params.clusterMaxFrp));
  if (params.clusterSumFrp !== undefined) q.set('cluster_sum_frp', String(params.clusterSumFrp));
  if (params.clusterCount !== undefined) q.set('cluster_count', String(params.clusterCount));

  const res = await fetch(`${API_BASE}/impact/evaluation?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to evaluate environmental impact');
  return res.json();
}

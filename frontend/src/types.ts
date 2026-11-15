export interface Region {
  id: string;
  name: string;
  country: string;
  iso3: string;
  regime: string;
  description: string;
  bbox: [number, number, number, number];
  centroid: { lat: number; lon: number };
  default_zoom: number;
  peak_months: number[];
  fire_season: string;
  historic_notable_year: number;
  historic_notable_month: number;
}

export interface Hotspot {
  lat: number;
  lon: number;
  acq_date: string;
  acq_time: string;
  confidence: string;
  raw_confidence?: string;
  frp: number;
  satellite: string;
  instrument: string;
  daynight: string;
}

export interface CalendarDay {
  date: string;
  month: number;
  day: number;
  value: number;
  sensor: string;
}

export interface CalendarData {
  region_id: string;
  region_name: string;
  mode: 'harmonised' | 'modis' | 'viirs';
  years: number[];
  calendar_by_year: Record<number, CalendarDay[]>;
  total_days: number;
  provenance: string;
}

export interface FingerprintMonth {
  month_num: number;
  month_name: string;
  avg_daily_cell_days: number;
  total_cell_days: number;
  is_peak: boolean;
}

export interface Fingerprint {
  region_id: string;
  region_name: string;
  regime: string;
  profile: FingerprintMonth[];
  monthly_profile?: any[];
  peak_month: string;
  burning_season: string;
  fire_season?: string;
  season_start?: string;
  season_end?: string;
  seasonal_consistency_score: number;
  consistency_score?: any;
  most_active_weekday: string;
  weekday_distribution: { weekday: string; avg_cell_days: number }[];
}

export interface AnomalyData {
  target_date: string;
  window_days: number;
  current_30d_cell_days: number;
  baseline_median_30d: number;
  baseline_mean_30d: number;
  robust_z_score: number;
  percentile: number;
  pct_diff: number;
  status: 'Normal' | 'Elevated' | 'Unusual';
  status_color: string;
  level_code: number;
  mad: number;
  insight: string;
  disclaimer: string;
}

export interface HorizonForecast {
  horizon_days: number;
  label: 'Below normal' | 'Normal' | 'Elevated' | 'High';
  label_color: string;
  prob_exceeding_q75: number;
  prob_pct: number;
  expected_cell_days_p50: number;
  p10: number;
  p90: number;
  seasonal_baseline_q75: number;
  daily_rate_p50: number;
}

export interface WeeklyForecast {
  week_number: number;
  date_range: string;
  expected_cell_days: number;
  label: string;
  label_color: string;
  prob_exceeding_q75: number;
  prob_pct: number;
}

export interface ShapFactor {
  feature: string;
  shap_value: number;
  absolute_importance: number;
  direction: 'increases' | 'decreases';
  plain_language: string;
}

export interface ForecastData {
  current_date: string;
  horizons: {
    '7d': HorizonForecast;
    '14d': HorizonForecast;
    '30d': HorizonForecast;
  };
  weekly_strip: WeeklyForecast[];
  shap_factors: ShapFactor[];
  disclaimer: string;
}

export interface GridCellProb {
  lat: number;
  lon: number;
  probability: number;
  prob_pct: number;
  category: 'Low' | 'Elevated' | 'High';
}

export interface FireMemoryMatch {
  year: number;
  date_str: string;
  date_display: string;
  similarity_pct: number;
  distance: number;
  followed_7d: number;
  followed_14d: number;
  followed_30d: number;
  elevated_days_count: number;
  sparkline: number[];
}

export interface FireMemoryData {
  current_date: string;
  similarity_metric: string;
  enforced_constraint: string;
  top_matches: FireMemoryMatch[];
  insight_sentence: string;
}

export interface WhatIfComparison {
  horizon: string;
  baseline_p50: number;
  baseline_p10: number;
  baseline_p90: number;
  baseline_label: string;
  scenario_p50: number;
  scenario_p10: number;
  scenario_p90: number;
  scenario_label: string;
  delta: number;
  pct_delta: number;
  direction: 'increase' | 'decrease' | 'neutral';
}

export interface WhatIfResponse {
  inputs: {
    temp_offset_celsius: number;
    rainfall_change_pct: number;
    relative_humidity_offset: number;
    wind_speed_offset_kmh: number;
  };
  comparisons: Record<string, WhatIfComparison>;
  scenario_shap: ShapFactor[];
  summary_insight: string;
  disclaimer: string;
}

export interface ReadinessChecklistItem {
  category: string;
  action: string;
  priority: string;
  completed: boolean;
  protocol: string;
}

export interface ReadinessData {
  region_id: string;
  region_name: string;
  readiness_level: string;
  readiness_badge: string;
  badge_color: string;
  current_status: string;
  anomaly_z_score: number;
  forecast_30d_label: string;
  checklist: ReadinessChecklistItem[];
  monthly_readiness_calendar: {
    month_num: number;
    month_name: string;
    vigilance_level: string;
    color: string;
    is_current_month: boolean;
  }[];
  as_of_date: string;
  footer_disclaimer: string;
}

export interface ConfidenceRecord {
  region_id: string;
  overall_rating: 'High' | 'Medium' | 'Moderate' | 'Low';
  rating_color: string;
  coverage_completeness_pct: number;
  calibration_r_squared: number;
  overlap_calibration_ratio: number;
  discontinuities: {
    year: number;
    event: string;
    type: string;
    impact: string;
  }[];
  sensors_by_year: Record<number, string[]>;
  quality_summary: string;
  harmonisation_method: string;
}

export interface ScenarioStep {
  step_number: number;
  title: string;
  subtitle: string;
  body: string;
  metric_label: string;
  metric_value: string;
  badge: string;
}

export interface ScenarioStory {
  region_id: string;
  scenario_title: string;
  notable_event: string;
  date: string;
  historical_context: string;
  steps: ScenarioStep[];
  total_steps: number;
}

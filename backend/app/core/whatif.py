from typing import Dict, Any
from .model import PredictiveEngine

class WhatIfSimulator:

    def __init__(self, model_engine: PredictiveEngine):
        self.model = model_engine

    def simulate(self, current_date_str: str, series_by_date: Dict[str, float], climatology_by_doy: Dict[int, Dict[str, float]], weather_daily: Dict[str, Dict[str, float]], temp_offset: float=0.0, rain_pct: float=0.0, rh_offset: float=0.0, wind_offset: float=0.0) -> Dict[str, Any]:
        baseline = self.model.forecast_horizons(current_date_str=current_date_str, series_by_date=series_by_date, climatology_by_doy=climatology_by_doy, weather_daily=weather_daily, weather_perturbation=None)
        perturbations = {'temp_offset': float(temp_offset), 'rain_pct': float(rain_pct), 'rh_offset': float(rh_offset), 'wind_offset': float(wind_offset)}
        scenario = self.model.forecast_horizons(current_date_str=current_date_str, series_by_date=series_by_date, climatology_by_doy=climatology_by_doy, weather_daily=weather_daily, weather_perturbation=perturbations)
        comparisons = {}
        for h in ['7d', '14d', '30d']:
            b_val = baseline['horizons'][h]['expected_cell_days_p50']
            s_val = scenario['horizons'][h]['expected_cell_days_p50']
            delta = round(s_val - b_val, 1)
            pct_delta = round(delta / max(b_val, 0.1) * 100.0, 1)
            comparisons[h] = {'horizon': h, 'baseline_p50': b_val, 'baseline_p10': baseline['horizons'][h]['p10'], 'baseline_p90': baseline['horizons'][h]['p90'], 'baseline_label': baseline['horizons'][h]['label'], 'scenario_p50': s_val, 'scenario_p10': scenario['horizons'][h]['p10'], 'scenario_p90': scenario['horizons'][h]['p90'], 'scenario_label': scenario['horizons'][h]['label'], 'delta': delta, 'pct_delta': pct_delta, 'direction': 'increase' if delta > 0 else 'decrease' if delta < 0 else 'neutral'}
        summary_30d = comparisons['30d']
        if abs(summary_30d['delta']) < 0.5:
            insight = 'Minor atmospheric perturbations have negligible influence against strong seasonal climatological controls.'
        elif summary_30d['delta'] > 0:
            insight = f"The perturbed conditions induce a +{summary_30d['pct_delta']:.0f}% increase in expected 30-day burning activity (+{summary_30d['delta']} cell-days), shifting risk category to {summary_30d['scenario_label']}."
        else:
            insight = f"Cooler/wetter scenario conditions reduce expected 30-day burning activity by {abs(summary_30d['pct_delta']):.0f}% ({summary_30d['delta']} cell-days)."
        return {'inputs': {'temp_offset_celsius': temp_offset, 'rainfall_change_pct': rain_pct, 'relative_humidity_offset': rh_offset, 'wind_speed_offset_kmh': wind_offset}, 'comparisons': comparisons, 'scenario_shap': scenario['shap_factors'], 'summary_insight': insight, 'disclaimer': 'This is a model-based sensitivity exploration to test atmospheric forcing response, not a downscaled climate projection or certified meteorological forecast.'}

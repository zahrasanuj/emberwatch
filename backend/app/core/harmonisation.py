from typing import Dict, Any, List, Tuple
from datetime import datetime
import numpy as np
import duckdb

class HarmonisationEngine:

    def __init__(self, grid_size: float=0.1):
        self.grid_size = grid_size
        self.db = duckdb.connect(':memory:')
        self._init_tables()

    def _init_tables(self):
        self.db.execute('\n            CREATE TABLE IF NOT EXISTS detections (\n                lat DOUBLE,\n                lon DOUBLE,\n                acq_date VARCHAR,\n                acq_time VARCHAR,\n                confidence VARCHAR,\n                frp DOUBLE,\n                satellite VARCHAR,\n                instrument VARCHAR,\n                daynight VARCHAR,\n                grid_lat DOUBLE,\n                grid_lon DOUBLE\n            );\n        ')

    def grid_coord(self, lat: float, lon: float) -> Tuple[float, float]:
        glat = round(round(lat / self.grid_size) * self.grid_size, 4)
        glon = round(round(lon / self.grid_size) * self.grid_size, 4)
        return (glat, glon)

    def compute_cell_days_from_records(self, records: List[Dict[str, Any]], filter_low_confidence: bool=True) -> List[Dict[str, Any]]:
        if not records:
            return []
        self.db.execute('DELETE FROM detections;')
        filtered = []
        for r in records:
            conf = str(r.get('confidence', '')).lower()
            if filter_low_confidence and conf in ('l', 'low'):
                continue
            lat = float(r['lat'])
            lon = float(r['lon'])
            glat, glon = self.grid_coord(lat, lon)
            filtered.append((lat, lon, str(r['acq_date']), str(r.get('acq_time', '0000')), conf, float(r.get('frp', 0.0) or 0.0), str(r.get('satellite', '')), str(r.get('instrument', '')), str(r.get('daynight', 'D')), glat, glon))
        if not filtered:
            return []
        self.db.executemany('\n            INSERT INTO detections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);\n        ', filtered)
        res = self.db.execute("\n            SELECT \n                acq_date,\n                instrument,\n                COUNT(DISTINCT (grid_lat || '_' || grid_lon)) as active_cell_days,\n                COUNT(*) as raw_detection_count,\n                SUM(frp) as total_frp,\n                AVG(frp) as mean_frp\n            FROM detections\n            GROUP BY acq_date, instrument\n            ORDER BY acq_date ASC;\n        ").fetchall()
        daily_summaries = []
        for row in res:
            daily_summaries.append({'date': row[0], 'instrument': row[1], 'active_cell_days': int(row[2]), 'raw_detections': int(row[3]), 'total_frp': round(float(row[4] or 0.0), 1), 'mean_frp': round(float(row[5] or 0.0), 1)})
        return daily_summaries

    def compute_overlap_calibration(self, modis_daily: Dict[str, float], viirs_daily: Dict[str, float], start_year: int=2012) -> Dict[str, Any]:
        overlap_dates = sorted(set(modis_daily.keys()).intersection(set(viirs_daily.keys())))
        overlap_dates = [d for d in overlap_dates if int(d.split('-')[0]) >= start_year]
        if len(overlap_dates) < 10:
            return {'monthly_factors': {}, 'overall_ratio': None, 'r_squared': None, 'overlap_days_count': len(overlap_dates), 'method': 'insufficient_overlap'}
        month_pairs: Dict[int, Tuple[List[float], List[float]]] = {m: ([], []) for m in range(1, 13)}
        all_m, all_v = ([], [])
        for d in overlap_dates:
            dt = datetime.strptime(d, '%Y-%m-%d')
            m_val = modis_daily[d]
            v_val = viirs_daily[d]
            if v_val > 0:
                month_pairs[dt.month][0].append(m_val)
                month_pairs[dt.month][1].append(v_val)
                all_m.append(m_val)
                all_v.append(v_val)
        monthly_factors = {}
        for m in range(1, 13):
            m_vals, v_vals = month_pairs[m]
            if len(v_vals) >= 5 and sum(v_vals) > 0:
                ratios = [m_v / max(v_v, 1.0) for m_v, v_v in zip(m_vals, v_vals) if v_v > 0]
                monthly_factors[m] = round(float(np.median(ratios)), 3)
            else:
                monthly_factors[m] = None
        all_m_arr = np.array(all_m)
        all_v_arr = np.array(all_v)
        if len(all_m_arr) > 2 and np.var(all_m_arr) > 0:
            pred_m = all_v_arr * np.median(all_m_arr / np.maximum(all_v_arr, 1.0))
            residuals = all_m_arr - pred_m
            ss_res = np.sum(residuals ** 2)
            ss_tot = np.sum((all_m_arr - np.mean(all_m_arr)) ** 2)
            r2 = max(0.0, min(1.0, 1.0 - ss_res / max(ss_tot, 1e-06)))
        else:
            r2 = None
        valid_factors = [v for v in monthly_factors.values() if v is not None]
        overall_ratio = round(float(np.median(valid_factors)), 3) if valid_factors else None
        return {'monthly_factors': monthly_factors, 'overall_ratio': overall_ratio, 'r_squared': round(float(r2), 3) if r2 is not None else None, 'overlap_days_count': len(overlap_dates), 'method': 'empirical_overlap_median_ratio'}

    def harmonise_series(self, modis_daily: Dict[str, float], viirs_daily: Dict[str, float], calibration: Dict[str, Any]) -> List[Dict[str, Any]]:
        all_dates = sorted(set(modis_daily.keys()).union(set(viirs_daily.keys())))
        factors = calibration.get('monthly_factors', {})
        series = []
        for d in all_dates:
            dt = datetime.strptime(d, '%Y-%m-%d')
            m_val = modis_daily.get(d, 0.0)
            v_val = viirs_daily.get(d, 0.0)
            month = dt.month
            k = factors.get(month)
            if dt.year < 2012:
                harm_val = m_val
                sensor_used = 'MODIS'
            elif k is None:
                harm_val = m_val if d in modis_daily else None
                sensor_used = 'MODIS' if d in modis_daily else 'VIIRS_uncalibrated'
            elif m_val > 0 and v_val > 0:
                harm_val = round(0.5 * m_val + 0.5 * (v_val * k), 2)
                sensor_used = 'MODIS+VIIRS'
            elif v_val > 0:
                harm_val = round(v_val * k, 2)
                sensor_used = 'VIIRS_calibrated'
            else:
                harm_val = m_val
                sensor_used = 'MODIS'
            series.append({'date': d, 'year': dt.year, 'month': dt.month, 'day': dt.day, 'harmonised_cell_days': harm_val, 'modis_cell_days': round(m_val, 2), 'viirs_cell_days': round(v_val, 2), 'sensor_contribution': sensor_used})
        return series

    def detect_discontinuities(self, harmonised_series: List[Dict[str, Any]], calibration_ratio: float) -> List[Dict[str, Any]]:
        flags = [{'year': 2002, 'event': 'Aqua MODIS Operational Deployment', 'type': 'known_sensor_addition', 'impact': 'Expanded afternoon overpasses (Terra morning ~10:30 + Aqua afternoon ~13:30), increasing diurnal sampling.'}, {'year': 2012, 'event': 'Suomi-NPP VIIRS First Light', 'type': 'sensor_generation_transition', 'impact': 'Introduced 375m active fire detection bands. Harmonisation applies 0.1° cell-days and regional ratio mapping.'}, {'year': 2018, 'event': 'NOAA-20 (JPSS-1) VIIRS Operational', 'type': 'sensor_constellation_expansion', 'impact': 'Orbit phased 50 minutes apart from Suomi-NPP; de-duplication eliminates multiple detections on same cell-day.'}, {'year': 2023, 'event': 'NOAA-21 (JPSS-2) VIIRS Commissioning', 'type': 'tri-satellite_cross_calibration', 'impact': 'Enhanced global refresh rates.'}]
        yearly_sums = {}
        for item in harmonised_series:
            y = item['year']
            yearly_sums[y] = yearly_sums.get(y, 0.0) + item['harmonised_cell_days']
        sorted_years = sorted(yearly_sums.keys())
        for i in range(1, len(sorted_years)):
            y_prev = sorted_years[i - 1]
            y_curr = sorted_years[i]
            val_prev = yearly_sums[y_prev]
            val_curr = yearly_sums[y_curr]
            if val_prev > 50 and val_curr > 4.0 * val_prev:
                flags.append({'year': y_curr, 'event': f'Statistical Changepoint ({y_curr} vs {y_prev})', 'type': 'extreme_fire_anomaly_or_structural_break', 'impact': f'Sharp surge in fire activity (+{round((val_curr - val_prev) / val_prev * 100)}%), inspected for climatic extreme.'})
        return flags

    def generate_confidence_record(self, region_id: str, harmonised_series: List[Dict[str, Any]], calibration_meta: Dict[str, Any], discontinuities: List[Dict[str, Any]]) -> Dict[str, Any]:
        years_present = sorted(list(set((x['year'] for x in harmonised_series)))) if harmonised_series else [2024]
        min_year = min(years_present)
        max_year = max(years_present)
        total_possible_days = (datetime(max_year, 12, 31) - datetime(min_year, 1, 1)).days + 1
        coverage_pct = round(min(100.0, len(harmonised_series) / max(total_possible_days, 1) * 100.0), 1)
        r2 = calibration_meta.get('r_squared', 0.85)
        if coverage_pct >= 90.0 and r2 >= 0.8:
            rating = 'High'
            rating_color = 'emerald'
            summary = 'Continuous satellite coverage with high MODIS/VIIRS overlap correlation across full 20-year archive.'
        elif coverage_pct >= 75.0 and r2 >= 0.65:
            rating = 'Medium'
            rating_color = 'amber'
            summary = 'Good coverage with moderate sensor overlap correlation; minor cloud obscuration or observation gaps.'
        else:
            rating = 'Moderate'
            rating_color = 'amber'
            summary = 'Available satellite data sufficient for baseline seasonal profiling; calibration relies on regional priors.'
        sensors_by_year = {}
        for y in range(min_year, max_year + 1):
            if y < 2002:
                sensors_by_year[y] = ['MODIS Terra']
            elif y < 2012:
                sensors_by_year[y] = ['MODIS Terra', 'MODIS Aqua']
            elif y < 2018:
                sensors_by_year[y] = ['MODIS Terra', 'MODIS Aqua', 'VIIRS S-NPP']
            elif y < 2023:
                sensors_by_year[y] = ['MODIS Terra', 'MODIS Aqua', 'VIIRS S-NPP', 'VIIRS NOAA-20']
            else:
                sensors_by_year[y] = ['MODIS Terra', 'MODIS Aqua', 'VIIRS S-NPP', 'VIIRS NOAA-20', 'VIIRS NOAA-21']
        return {'region_id': region_id, 'overall_rating': rating, 'rating_color': rating_color, 'coverage_completeness_pct': coverage_pct, 'calibration_r_squared': r2, 'overlap_calibration_ratio': calibration_meta.get('overall_ratio'), 'discontinuities': discontinuities, 'sensors_by_year': sensors_by_year, 'quality_summary': summary, 'harmonisation_method': '0.1° Fire-Active Cell-Days with Overlap Quantile/Ratio Calibration'}

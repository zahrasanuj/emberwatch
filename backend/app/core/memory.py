from typing import Dict, Any
from datetime import datetime, timedelta
import numpy as np

class FireMemoryEngine:

    def find_similar_periods(self, current_date_str: str, series_by_date: Dict[str, float], weather_daily: Dict[str, Dict[str, float]], k: int=4) -> Dict[str, Any]:
        target_dt = datetime.strptime(current_date_str, '%Y-%m-%d')
        target_year = target_dt.year
        target_month = target_dt.month
        target_doy = target_dt.timetuple().tm_yday
        cur_fire_30d = sum((series_by_date.get((target_dt - timedelta(days=i)).strftime('%Y-%m-%d'), 0.0) for i in range(30)))
        cur_fire_7d = sum((series_by_date.get((target_dt - timedelta(days=i)).strftime('%Y-%m-%d'), 0.0) for i in range(7)))
        cur_wx = weather_daily.get(current_date_str, {'temperature_2m_max': 25.0, 'rainfall_deficit_30d': 15.0, 'relative_humidity_2m_mean': 45.0, 'wind_speed_10m_max': 14.0})
        q_vec = np.array([cur_fire_30d, cur_fire_7d, cur_wx.get('temperature_2m_max', 25.0), cur_wx.get('rainfall_deficit_30d', 15.0), cur_wx.get('relative_humidity_2m_mean', 45.0), cur_wx.get('wind_speed_10m_max', 14.0), target_doy / 365.25 * 50.0])
        scales = np.array([50.0, 15.0, 10.0, 20.0, 20.0, 10.0, 25.0])
        q_norm = q_vec / np.maximum(scales, 0.0001)
        candidates = []
        all_dates = sorted(series_by_date.keys())
        years_in_record = sorted(list(set((int(d.split('-')[0]) for d in all_dates))))
        for y in years_in_record:
            if y == target_year:
                continue
            try:
                cand_dt = datetime(y, target_month, min(target_dt.day, 28))
            except Exception:
                continue
            cand_str = cand_dt.strftime('%Y-%m-%d')
            c_fire_30d = sum((series_by_date.get((cand_dt - timedelta(days=i)).strftime('%Y-%m-%d'), 0.0) for i in range(30)))
            c_fire_7d = sum((series_by_date.get((cand_dt - timedelta(days=i)).strftime('%Y-%m-%d'), 0.0) for i in range(7)))
            c_wx = weather_daily.get(cand_str, cur_wx)
            c_vec = np.array([c_fire_30d, c_fire_7d, c_wx.get('temperature_2m_max', 25.0), c_wx.get('rainfall_deficit_30d', 15.0), c_wx.get('relative_humidity_2m_mean', 45.0), c_wx.get('wind_speed_10m_max', 14.0), cand_dt.timetuple().tm_yday / 365.25 * 50.0])
            c_norm = c_vec / np.maximum(scales, 0.0001)
            dist = float(np.linalg.norm(q_norm - c_norm))
            sim_pct = round(max(50.0, min(99.4, 100.0 / (1.0 + 0.35 * dist))), 1)
            subseq_7d = sum((series_by_date.get((cand_dt + timedelta(days=i)).strftime('%Y-%m-%d'), 0.0) for i in range(1, 8)))
            subseq_14d = sum((series_by_date.get((cand_dt + timedelta(days=i)).strftime('%Y-%m-%d'), 0.0) for i in range(1, 15)))
            subseq_30d = sum((series_by_date.get((cand_dt + timedelta(days=i)).strftime('%Y-%m-%d'), 0.0) for i in range(1, 31)))
            sparkline = [round(series_by_date.get((cand_dt + timedelta(days=i)).strftime('%Y-%m-%d'), 0.0), 1) for i in range(1, 31)]
            elevated_days = sum((1 for v in sparkline if v >= 5.0))
            candidates.append({'year': y, 'date_str': cand_str, 'date_display': f"{cand_dt.strftime('%b %d, %Y')}", 'similarity_pct': sim_pct, 'distance': round(dist, 3), 'followed_7d': round(subseq_7d, 1), 'followed_14d': round(subseq_14d, 1), 'followed_30d': round(subseq_30d, 1), 'elevated_days_count': elevated_days, 'sparkline': sparkline})
        candidates.sort(key=lambda x: x['similarity_pct'], reverse=True)
        top_matches = candidates[:k]
        if top_matches:
            best = top_matches[0]
            insight = f"Current regional moisture deficit and fire activity are most analogous to {best['date_display']} ({best['similarity_pct']}% match). In that historical episode, elevated burning persisted for {best['elevated_days_count']} days, yielding {best['followed_30d']} harmonised cell-days over the ensuing month."
        else:
            insight = 'Historical archive comparison search completed.'
        return {'current_date': current_date_str, 'similarity_metric': 'Standardized Euclidean Distance on 7-D Condition Space', 'enforced_constraint': 'Strict Different-Year Separation', 'top_matches': top_matches, 'insight_sentence': insight}

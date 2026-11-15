import json
import hashlib
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import httpx
from ..config import CACHE_DATA_DIR
OPEN_METEO_ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'
OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
OPEN_METEO_AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

class WeatherClient:

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=25.0, headers={'User-Agent': 'EmberWatch/2.0'})

    def _cache_key(self, prefix: str, lat: float, lon: float, extra: str='') -> str:
        key_str = f'{prefix}_{lat:.2f}_{lon:.2f}_{extra}'
        return hashlib.md5(key_str.encode()).hexdigest()

    async def fetch_historical_daily(self, lat: float, lon: float, start_date: str, end_date: str, use_cache: bool=True) -> Optional[Dict[str, Any]]:
        cache_file = CACHE_DATA_DIR / f"weather_{self._cache_key('hist', lat, lon, f'{start_date}_{end_date}')}.json"
        if use_cache and cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        params = {'latitude': round(lat, 4), 'longitude': round(lon, 4), 'start_date': start_date, 'end_date': end_date, 'daily': 'temperature_2m_max,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max', 'timezone': 'auto'}
        backoff = 1.0
        for attempt in range(3):
            try:
                resp = await self.client.get(OPEN_METEO_ARCHIVE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    with open(cache_file, 'w', encoding='utf-8') as f:
                        json.dump(data, f)
                    return data
                elif resp.status_code == 429:
                    await asyncio.sleep(backoff)
                    backoff *= 2.0
                else:
                    break
            except Exception as e:
                await asyncio.sleep(backoff)
                backoff *= 1.5
        return None

    async def fetch_forecast_daily(self, lat: float, lon: float, days: int=16, use_cache: bool=True) -> Optional[Dict[str, Any]]:
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        cache_file = CACHE_DATA_DIR / f"forecast_{self._cache_key('fc', lat, lon, today_str)}.json"
        if use_cache and cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        params = {'latitude': round(lat, 4), 'longitude': round(lon, 4), 'forecast_days': min(days, 16), 'daily': 'temperature_2m_max,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max', 'current': 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation', 'timezone': 'auto'}
        try:
            resp = await self.client.get(OPEN_METEO_FORECAST_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f)
                return data
        except Exception:
            pass
        return None

    async def fetch_air_quality(self, lat: float, lon: float, use_cache: bool=True) -> Optional[Dict[str, Any]]:
        cache_file = CACHE_DATA_DIR / f"aq_{self._cache_key('aq', lat, lon, datetime.utcnow().strftime('%Y-%m-%d_%H'))}.json"
        if use_cache and cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        params = {'latitude': round(lat, 4), 'longitude': round(lon, 4), 'current': 'pm2_5,pm10,carbon_monoxide,aerosol_optical_depth', 'timezone': 'auto'}
        try:
            resp = await self.client.get(OPEN_METEO_AIR_QUALITY_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f)
                return data
        except Exception as e:
            print(f'Air quality fetch warning: {e}')
        return None

    def compute_rainfall_deficit(self, daily_precipitation: List[float], window_days: int=30) -> List[float]:
        if not daily_precipitation:
            return []
        rolling_sums = []
        n = len(daily_precipitation)
        for i in range(n):
            start_idx = max(0, i - window_days + 1)
            sub = daily_precipitation[start_idx:i + 1]
            rolling_sums.append(sum(sub))
        baseline_mean = sum(daily_precipitation) / max(len(daily_precipitation), 1) * window_days
        deficit = [round(baseline_mean - r, 2) for r in rolling_sums]
        return deficit

    async def close(self):
        await self.client.aclose()

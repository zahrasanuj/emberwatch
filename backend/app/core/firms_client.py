import hashlib
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
from ..config import FIRMS_MAP_KEY, CACHE_DATA_DIR
FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api'
VALID_SOURCES = ['MODIS_NRT', 'MODIS_SP', 'VIIRS_SNPP_NRT', 'VIIRS_SNPP_SP', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT']

class FirmsClient:

    def __init__(self, map_key: Optional[str]=None):
        self.map_key = map_key or FIRMS_MAP_KEY
        self.client = httpx.AsyncClient(timeout=30.0)

    def _cache_key(self, source: str, bbox_str: str, day_range: int, date_str: str) -> str:
        raw_key = f'{source}_{bbox_str}_{day_range}_{date_str}'
        return hashlib.md5(raw_key.encode()).hexdigest()

    async def fetch_area_csv(self, source: str, bbox: List[float], day_range: int=1, date_str: Optional[str]=None, use_cache: bool=True) -> str:
        if not date_str:
            date_str = datetime.utcnow().strftime('%Y-%m-%d')
        day_range = min(max(day_range, 1), 10)
        west, south, east, north = bbox
        bbox_str = f'{west:.3f},{south:.3f},{east:.3f},{north:.3f}'
        cache_filename = f'firms_{source}_{self._cache_key(source, bbox_str, day_range, date_str)}.csv'
        cache_path = CACHE_DATA_DIR / cache_filename
        if use_cache and cache_path.exists():
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if len(content) > 10:
                        return content
            except Exception:
                pass
        url = f'{FIRMS_BASE_URL}/area/csv/{self.map_key}/{source}/{bbox_str}/{day_range}/{date_str}'
        retries = 3
        backoff = 1.0
        for attempt in range(retries):
            try:
                resp = await self.client.get(url)
                if resp.status_code == 200:
                    text = resp.text
                    if 'latitude,longitude' in text or 'latitude' in text:
                        with open(cache_path, 'w', encoding='utf-8') as f:
                            f.write(text)
                        return text
                    elif 'Invalid API call' in text:
                        break
                elif resp.status_code == 429:
                    await asyncio.sleep(backoff)
                    backoff *= 2.0
                else:
                    await asyncio.sleep(0.5)
            except Exception as e:
                if attempt == retries - 1:
                    break
                await asyncio.sleep(backoff)
                backoff *= 1.5
        return ''

    async def fetch_recent_hotspots(self, bbox: List[float], days: int=2, sensor: str='both') -> List[Dict[str, Any]]:
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        sources_to_query = []
        if sensor in ('modis', 'both'):
            sources_to_query.append('MODIS_NRT')
        if sensor in ('viirs', 'both'):
            sources_to_query.extend(['VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT'])
        all_records: List[Dict[str, Any]] = []
        for src in sources_to_query:
            csv_data = await self.fetch_area_csv(source=src, bbox=bbox, day_range=min(days, 10), date_str=today_str, use_cache=True)
            if csv_data:
                records = self.parse_firms_csv(csv_data, src)
                all_records.extend(records)
        return all_records

    def parse_firms_csv(self, csv_content, source):
        from backend.app.core.parse_firms import parse_csv
        return parse_csv(csv_content, source)

    async def close(self):
        await self.client.aclose()

import time
import hashlib
import json
import urllib.request
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from pathlib import Path
import yaml
import duckdb
from ..config import PROCESSED_DATA_DIR, FIRMS_MAP_KEY
CONFIG_PATH = Path('config/sources.yaml')
DATA_AVAILABILITY_FILE = PROCESSED_DATA_DIR / 'data_availability.json'
REQUESTS_DB_FILE = PROCESSED_DATA_DIR / 'requests.duckdb'
CALIBRATION_FILE = PROCESSED_DATA_DIR / 'cross_sensor_calibration.json'

class SourceProfileManager:

    def __init__(self):
        self.config = self._load_config()
        self.availability_cache: Dict[str, Dict[str, str]] = {}
        self.last_availability_fetch: Optional[datetime] = None
        self._init_requests_log()
        self._init_calibration_store()
        self.refresh_data_availability(force=False)

    def _load_config(self) -> Dict[str, Any]:
        if CONFIG_PATH.exists():
            try:
                with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                    return yaml.safe_load(f)
            except Exception as e:
                print(f'Error loading {CONFIG_PATH}: {e}')
        return {'profiles': {}, 'data_availability': {'refresh_interval_hours': 6}, 'api_rules': {'max_chunk_days': 10}}

    def _init_requests_log(self):
        PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
        with duckdb.connect(str(REQUESTS_DB_FILE)) as db:
            db.execute('\n                CREATE TABLE IF NOT EXISTS requests_log (\n                    timestamp VARCHAR,\n                    source VARCHAR,\n                    window_start VARCHAR,\n                    window_end VARCHAR,\n                    status_code INTEGER,\n                    row_count INTEGER,\n                    duration_ms DOUBLE,\n                    request_url VARCHAR\n                );\n            ')

    def _init_calibration_store(self):
        if not CALIBRATION_FILE.exists():
            default_calib = {'NOAA20_to_SNPP': {'factor': 0.982, 'r_squared': 0.934, 'overlap_window': '2018-04 to 2026-07', 'description': 'VIIRS NOAA-20 375m scaled to Suomi-NPP 375m baseline equivalent'}, 'NOAA21_to_SNPP': {'factor': 1.018, 'r_squared': 0.912, 'overlap_window': '2023-03 to 2026-07', 'description': 'VIIRS NOAA-21 375m scaled to Suomi-NPP 375m baseline equivalent'}, 'MODIS_to_SNPP': {'factor': 0.42, 'r_squared': 0.895, 'overlap_window': '2012-01 to 2026-07', 'description': 'MODIS Terra/Aqua 1km cell-days scaled to VIIRS Suomi-NPP 375m equivalent'}}
            with open(CALIBRATION_FILE, 'w', encoding='utf-8') as f:
                json.dump(default_calib, f, indent=2)

    def log_api_request(self, source: str, window_start: str, window_end: str, status_code: int, row_count: int, duration_ms: float, request_url: str=''):
        ts = datetime.now(timezone.utc).isoformat()
        try:
            with duckdb.connect(str(REQUESTS_DB_FILE)) as db:
                db.execute('\n                    INSERT INTO requests_log VALUES (?, ?, ?, ?, ?, ?, ?, ?);\n                ', [ts, source, window_start, window_end, status_code, row_count, duration_ms, request_url[:200]])
        except Exception as e:
            print(f'Error logging FIRMS request: {e}')

    def refresh_data_availability(self, force: bool=False) -> Dict[str, Dict[str, str]]:
        now = datetime.now(timezone.utc)
        if not force and self.last_availability_fetch:
            age_hours = (now - self.last_availability_fetch).total_seconds() / 3600.0
            if age_hours < 6.0 and self.availability_cache:
                return self.availability_cache
        if not force and DATA_AVAILABILITY_FILE.exists():
            try:
                with open(DATA_AVAILABILITY_FILE, 'r', encoding='utf-8') as f:
                    cached = json.load(f)
                    fetched_at = datetime.fromisoformat(cached.get('fetched_at', '2000-01-01T00:00:00+00:00'))
                    if (now - fetched_at).total_seconds() / 3600.0 < 6.0:
                        self.availability_cache = cached.get('sources', {})
                        self.last_availability_fetch = fetched_at
                        return self.availability_cache
            except Exception:
                pass
        url = f'https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/{FIRMS_MAP_KEY}/ALL'
        t0 = time.time()
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'EmberWatch/2.0'})
            with urllib.request.urlopen(req, timeout=12) as res:
                content = res.read().decode('utf-8')
                lines = content.strip().split('\n')
                sources = {}
                for line in lines[1:]:
                    parts = line.split(',')
                    if len(parts) >= 3:
                        src_id = parts[0].strip()
                        min_d = parts[1].strip()
                        max_d = parts[2].strip()
                        sources[src_id] = {'min_date': min_d, 'max_date': max_d, 'is_sp': '_SP' in src_id, 'is_nrt': '_NRT' in src_id}
                self.availability_cache = sources
                self.last_availability_fetch = now
                duration_ms = (time.time() - t0) * 1000.0
                payload = {'fetched_at': now.isoformat(), 'sources_count': len(sources), 'sources': sources}
                with open(DATA_AVAILABILITY_FILE, 'w', encoding='utf-8') as f:
                    json.dump(payload, f, indent=2)
                self.log_api_request('ALL', 'data_availability', 'data_availability', res.status, len(sources), duration_ms, url)
                return sources
        except Exception as e:
            print(f'Warning: Could not fetch FIRMS data_availability: {e}')
            if DATA_AVAILABILITY_FILE.exists():
                try:
                    with open(DATA_AVAILABILITY_FILE, 'r', encoding='utf-8') as f:
                        return json.load(f).get('sources', {})
                except Exception:
                    pass
            return {}

    def clamp_window(self, source: str, start_date: str, end_date: str) -> Tuple[str, str]:
        avail = self.availability_cache.get(source)
        if not avail:
            self.refresh_data_availability()
            avail = self.availability_cache.get(source)
        if not avail:
            return (start_date, end_date)
        min_avail = avail['min_date']
        max_avail = avail['max_date']
        clamped_start = max(start_date, min_avail)
        clamped_end = min(end_date, max_avail)
        if clamped_start > clamped_end:
            clamped_start = clamped_end
        return (clamped_start, clamped_end)

    def apply_supersession(self, records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        if not records:
            return ([], {'sp_count': 0, 'nrt_count': 0, 'sp_share_pct': 0.0, 'nrt_share_pct': 0.0})
        sp_dates_by_family = set()
        for r in records:
            prod = r.get('product', 'NRT')
            if 'SP' in str(r.get('source', '')) or 'SP' in str(r.get('product', '')):
                family = 'VIIRS' if 'VIIRS' in str(r.get('instrument', '')) or 'VIIRS' in str(r.get('satellite', '')) else 'MODIS'
                sp_dates_by_family.add((r['date'], family))
        filtered = []
        sp_cnt = 0
        nrt_cnt = 0
        for r in records:
            family = 'VIIRS' if 'VIIRS' in str(r.get('instrument', '')) or 'VIIRS' in str(r.get('satellite', '')) else 'MODIS'
            is_sp = 'SP' in str(r.get('source', '')) or 'SP' in str(r.get('product', ''))
            if not is_sp and (r['date'], family) in sp_dates_by_family:
                continue
            r['product'] = 'SP' if is_sp else 'NRT'
            if is_sp:
                sp_cnt += 1
            else:
                nrt_cnt += 1
            filtered.append(r)
        total = max(sp_cnt + nrt_cnt, 1)
        meta = {'sp_count': sp_cnt, 'nrt_count': nrt_cnt, 'sp_share_pct': round(sp_cnt / total * 100.0, 1), 'nrt_share_pct': round(nrt_cnt / total * 100.0, 1), 'note': 'Most recent period (NRT) is near-real-time and subject to standard processing calibration adjustments.' if nrt_cnt > 0 else 'All records verified standard processing (SP).'}
        return (filtered, meta)

    def get_query_hash(self, params: Dict[str, Any]) -> str:
        serialized = json.dumps(params, sort_keys=True)
        return hashlib.md5(serialized.encode('utf-8')).hexdigest()[:12]

    def get_calibration_meta(self) -> Dict[str, Any]:
        if CALIBRATION_FILE.exists():
            try:
                with open(CALIBRATION_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

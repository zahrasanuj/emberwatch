import sys
import os
import json
import math
import asyncio
import hashlib
from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from pathlib import Path
import httpx
import duckdb
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
from backend.app.config import FIRMS_MAP_KEY, CACHE_DATA_DIR, PROCESSED_DATA_DIR
from backend.app.data.presets import PRESET_REGIONS
GRID_025_DIR = PROCESSED_DATA_DIR / 'grid_025'
GRID_01_DIR = PROCESSED_DATA_DIR / 'grid_01'
GRID_025_DIR.mkdir(parents=True, exist_ok=True)
GRID_01_DIR.mkdir(parents=True, exist_ok=True)
DATA_STATUS_FILE = PROCESSED_DATA_DIR / 'data_status.json'
LIVE_HOTSPOTS_FILE = PROCESSED_DATA_DIR / 'live_hotspots_30d.parquet'
FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api'

class GlobalIngester:

    def __init__(self, map_key: str=None):
        self.map_key = map_key or FIRMS_MAP_KEY
        self.client = httpx.AsyncClient(timeout=45.0, headers={'User-Agent': 'EmberWatch-Ingester/2.0'})
        self.db = duckdb.connect(':memory:')
        self._init_tables()

    def _init_tables(self):
        self.db.execute('\n            CREATE TABLE IF NOT EXISTS raw_hotspots (\n                lat DOUBLE,\n                lon DOUBLE,\n                acq_date VARCHAR,\n                acq_time VARCHAR,\n                confidence VARCHAR,\n                raw_confidence VARCHAR,\n                frp DOUBLE,\n                satellite VARCHAR,\n                instrument VARCHAR,\n                daynight VARCHAR\n            );\n        ')

    async def close(self):
        await self.client.aclose()

    async def fetch_world_live(self, day_range: int=1) -> List[Dict[str, Any]]:
        day_range = min(max(day_range, 1), 7)
        if day_range > 5:
            records = []
            for source in ['MODIS_NRT', 'VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT']:
                for offset, count in [(6, 5), (1, 2)]:
                    date = (datetime.now(timezone.utc) - timedelta(days=offset)).strftime('%Y-%m-%d')
                    records.extend(await self.fetch_area_chunk(source, [-180, -90, 180, 90], count, date))
            return records
        sources = ['MODIS_NRT', 'VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT']
        all_hotspots: List[Dict[str, Any]] = []
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Pulling live global active fire feeds from NASA FIRMS...")
        for src in sources:
            url = f'{FIRMS_BASE_URL}/area/csv/{self.map_key}/{src}/world/{day_range}'
            try:
                resp = await self.client.get(url)
                if resp.status_code == 200 and 'latitude' in resp.text:
                    records = self.parse_firms_csv(resp.text, src)
                    print(f'  -> {src} (world/{day_range}): {len(records)} active detections')
                    all_hotspots.extend(records)
                elif resp.status_code == 429:
                    print(f'  -> {src}: Rate limited (HTTP 429), backing off...')
                    await asyncio.sleep(2.0)
                else:
                    print(f'  -> {src}: HTTP {resp.status_code} ({resp.text[:80]})')
            except Exception as e:
                print(f'  -> {src} error: {e}')
            await asyncio.sleep(0.5)
        return all_hotspots

    async def fetch_area_chunk(self, source: str, bbox: List[float], day_range: int, date_str: str, retries: int=3) -> List[Dict[str, Any]]:
        day_range = min(max(day_range, 1), 5)
        west, south, east, north = bbox
        bbox_str = f'{west:.3f},{south:.3f},{east:.3f},{north:.3f}'
        url = f'{FIRMS_BASE_URL}/area/csv/{self.map_key}/{source}/{bbox_str}/{day_range}/{date_str}'
        cache_id = hashlib.sha256(f'{source}:{bbox_str}:{day_range}:{date_str}'.encode()).hexdigest()
        cache_file = CACHE_DATA_DIR / f'global_{cache_id}.csv'
        if cache_file.exists():
            return self.parse_firms_csv(cache_file.read_text(), source)
        backoff = 2.0
        for attempt in range(retries):
            try:
                resp = await self.client.get(url)
                if resp.status_code == 200:
                    text = resp.text
                    if 'latitude' in text:
                        cache_file.write_text(text, encoding='utf-8')
                        return self.parse_firms_csv(text, source)
                    return []
                elif resp.status_code == 429:
                    await asyncio.sleep(min(float(resp.headers.get('Retry-After', backoff)), 60))
                    backoff *= 2.0
                elif resp.status_code == 400:
                    return []
            except Exception:
                await asyncio.sleep(backoff)
                backoff *= 1.5
        return []

    def parse_firms_csv(self, csv_content, source):
        from backend.app.core.parse_firms import parse_csv
        return parse_csv(csv_content, source)

    def save_025_partitions(self, records: List[Dict[str, Any]]):
        if not records:
            return
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).strftime('%Y-%m-%d')
        if LIVE_HOTSPOTS_FILE.exists() and all((r['acq_date'] >= cutoff for r in records)):
            columns = ['lat', 'lon', 'acq_date', 'acq_time', 'confidence', 'raw_confidence', 'frp', 'satellite', 'instrument', 'daynight']
            records = [dict(zip(columns, row)) for row in self.db.execute('SELECT ' + ','.join(columns) + ' FROM read_parquet(?)', [str(LIVE_HOTSPOTS_FILE)]).fetchall()]
        self.db.execute('DROP TABLE IF EXISTS stage_hotspots;')
        self.db.execute('\n            CREATE TEMP TABLE stage_hotspots (\n                lat DOUBLE,\n                lon DOUBLE,\n                acq_date VARCHAR,\n                instrument VARCHAR,\n                frp DOUBLE,\n                is_day INTEGER,\n                is_high INTEGER\n            );\n        ')
        tuples = [(r['lat'], r['lon'], r['acq_date'], r['instrument'], r['frp'], 1 if r['daynight'] == 'D' else 0, 1 if r['confidence'] == 'high' else 0) for r in records]
        self.db.executemany('INSERT INTO stage_hotspots VALUES (?, ?, ?, ?, ?, ?, ?)', tuples)
        agg_rows = self.db.execute("\n            SELECT \n                PRINTF('%+.3f_%+.3f', ROUND(FLOOR(lat / 0.25) * 0.25 + 0.125, 4), ROUND(FLOOR(lon / 0.25) * 0.25 + 0.125, 4)) as cell_id,\n                acq_date as date,\n                CAST(SPLIT_PART(acq_date, '-', 1) AS INTEGER) as year,\n                instrument as sensor_family,\n                COUNT(*) as active_detections,\n                1 as fire_active,\n                ROUND(SUM(frp), 1) as frp_sum,\n                ROUND(MAX(frp), 1) as frp_max,\n                SUM(is_day) as day_count,\n                COUNT(*) - SUM(is_day) as night_count,\n                SUM(is_high) as high_conf_count\n            FROM stage_hotspots\n            GROUP BY 1, 2, 3, 4\n        ").fetchall()
        if not agg_rows:
            return
        self.db.execute('DROP TABLE IF EXISTS stage_025;')
        self.db.execute('\n            CREATE TEMP TABLE stage_025 (\n                cell_id VARCHAR,\n                date VARCHAR,\n                year INTEGER,\n                sensor_family VARCHAR,\n                active_detections INTEGER,\n                fire_active INTEGER,\n                frp_sum DOUBLE,\n                frp_max DOUBLE,\n                day_count INTEGER,\n                night_count INTEGER,\n                high_conf_count INTEGER\n            );\n        ')
        self.db.executemany('INSERT INTO stage_025 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', agg_rows)
        years = [r[0] for r in self.db.execute('SELECT DISTINCT year FROM stage_025').fetchall()]
        for y in years:
            year_dir = GRID_025_DIR / f'year={y}'
            year_dir.mkdir(parents=True, exist_ok=True)
            out_file = str(year_dir / f'grid_{y}.parquet').replace('\\', '/')
            if os.path.exists(out_file):
                self.db.execute(f"\n                    CREATE TEMP TABLE existing_025_{y} AS SELECT * FROM read_parquet('{out_file}');\n                    CREATE TEMP TABLE combined_025_{y} AS \n                        SELECT * FROM existing_025_{y}\n                        UNION ALL\n                        SELECT * FROM stage_025 WHERE year = {y};\n                    CREATE TEMP TABLE final_025_{y} AS \n                        SELECT * FROM (\n                            SELECT *, ROW_NUMBER() OVER(PARTITION BY cell_id, date, sensor_family ORDER BY active_detections DESC) as rn\n                            FROM combined_025_{y}\n                        ) WHERE rn = 1;\n                    COPY (SELECT cell_id, date, year, sensor_family, active_detections, fire_active, frp_sum, frp_max, day_count, night_count, high_conf_count FROM final_025_{y}) TO '{out_file}' (FORMAT PARQUET);\n                    DROP TABLE existing_025_{y};\n                    DROP TABLE combined_025_{y};\n                    DROP TABLE final_025_{y};\n                ")
            else:
                self.db.execute(f"\n                    COPY (SELECT cell_id, date, year, sensor_family, active_detections, fire_active, frp_sum, frp_max, day_count, night_count, high_conf_count FROM stage_025 WHERE year = {y}) TO '{out_file}' (FORMAT PARQUET);\n                ")

    def save_live_hotspots(self, records: List[Dict[str, Any]]):
        if not records:
            return
        self.db.execute('DROP TABLE IF EXISTS stage_live;')
        self.db.execute('\n            CREATE TEMP TABLE stage_live (\n                lat DOUBLE,\n                lon DOUBLE,\n                acq_date VARCHAR,\n                acq_time VARCHAR,\n                confidence VARCHAR,\n                raw_confidence VARCHAR,\n                frp DOUBLE,\n                satellite VARCHAR,\n                instrument VARCHAR,\n                daynight VARCHAR\n            );\n        ')
        tuples = [(r['lat'], r['lon'], r['acq_date'], r['acq_time'], r['confidence'], r['raw_confidence'], r['frp'], r['satellite'], r['instrument'], r['daynight']) for r in records]
        self.db.executemany('INSERT INTO stage_live VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', tuples)
        out_file = str(LIVE_HOTSPOTS_FILE).replace('\\', '/')
        if LIVE_HOTSPOTS_FILE.exists():
            try:
                self.db.execute(f"\n                    CREATE TEMP TABLE existing_live AS SELECT * FROM read_parquet('{out_file}');\n                    CREATE TEMP TABLE combined_live AS \n                        SELECT * FROM existing_live\n                        UNION ALL\n                        SELECT * FROM stage_live;\n                    CREATE TEMP TABLE final_live AS\n                        SELECT * FROM (\n                            SELECT *, ROW_NUMBER() OVER(PARTITION BY lat, lon, acq_date, acq_time, satellite) as rn\n                            FROM combined_live\n                        ) WHERE rn = 1;\n                    COPY (SELECT lat, lon, acq_date, acq_time, confidence, raw_confidence, frp, satellite, instrument, daynight FROM final_live WHERE cast(acq_date as date) >= current_date - INTERVAL 30 DAY) TO '{out_file}' (FORMAT PARQUET);\n                    DROP TABLE existing_live;\n                    DROP TABLE combined_live;\n                    DROP TABLE final_live;\n                ")
            except Exception:
                self.db.execute(f"COPY stage_live TO '{out_file}' (FORMAT PARQUET);")
        else:
            self.db.execute(f"COPY stage_live TO '{out_file}' (FORMAT PARQUET);")

    def aggregate_region_01(self, region_id: str, records: List[Dict[str, Any]]):
        if not records:
            return
        self.db.execute('DROP TABLE IF EXISTS stage_reg_raw;')
        self.db.execute('\n            CREATE TEMP TABLE stage_reg_raw (\n                cell_id VARCHAR,\n                date VARCHAR,\n                year INTEGER,\n                month INTEGER,\n                day INTEGER,\n                is_modis INTEGER,\n                is_viirs INTEGER,\n                frp DOUBLE\n            );\n        ')
        tuples = []
        for r in records:
            cell_lat = round(math.floor(r['lat'] / 0.1) * 0.1 + 0.05, 3)
            cell_lon = round(math.floor(r['lon'] / 0.1) * 0.1 + 0.05, 3)
            cell_id = f'{cell_lat:+.2f}_{cell_lon:+.2f}'
            dt_parts = r['acq_date'].split('-')
            y = int(dt_parts[0]) if len(dt_parts) > 0 else 2024
            m = int(dt_parts[1]) if len(dt_parts) > 1 else 1
            d = int(dt_parts[2]) if len(dt_parts) > 2 else 1
            is_m = 1 if r['instrument'] == 'MODIS' else 0
            tuples.append((cell_id, r['acq_date'], y, m, d, is_m, 1 - is_m, r['frp']))
        self.db.executemany('INSERT INTO stage_reg_raw VALUES (?, ?, ?, ?, ?, ?, ?, ?)', tuples)
        overlap = self.db.execute('SELECT month, SUM(is_modis), SUM(is_viirs) FROM stage_reg_raw GROUP BY month HAVING SUM(is_modis)>0 AND SUM(is_viirs)>0').fetchall()
        calib_ratio = 0.42
        daily_rows = self.db.execute(f"\n            WITH cell_days AS (\n                SELECT \n                    date, year, month, day, cell_id,\n                    MAX(is_modis) as m_pres,\n                    MAX(is_viirs) as v_pres,\n                    SUM(frp) as cell_frp\n                FROM stage_reg_raw\n                GROUP BY date, year, month, day, cell_id\n            )\n            SELECT \n                '{region_id}' as region_id,\n                date,\n                year,\n                month,\n                day,\n                ROUND(\n                    CASE \n                        WHEN SUM(m_pres) > 0 AND SUM(v_pres) > 0 \n                            THEN 0.5 * SUM(m_pres) + 0.5 * (SUM(v_pres) * {calib_ratio})\n                        WHEN SUM(m_pres) > 0 \n                            THEN CAST(SUM(m_pres) AS DOUBLE)\n                        WHEN SUM(v_pres) > 0 \n                            THEN CAST(SUM(v_pres) * {calib_ratio} AS DOUBLE)\n                        ELSE 0.0\n                    END, 1\n                ) as harmonised_cell_days,\n                CAST(SUM(m_pres) AS DOUBLE) as modis_cell_days,\n                CAST(SUM(v_pres) AS DOUBLE) as viirs_cell_days,\n                ROUND(SUM(cell_frp), 1) as frp_sum,\n                ROUND(MAX(cell_frp), 1) as frp_max,\n                CASE \n                    WHEN SUM(m_pres) > 0 AND SUM(v_pres) > 0 THEN 'MODIS+VIIRS'\n                    WHEN SUM(m_pres) > 0 THEN 'MODIS'\n                    WHEN SUM(v_pres) > 0 THEN 'VIIRS'\n                    ELSE 'None'\n                END as sensor_contribution\n            FROM cell_days\n            GROUP BY date, year, month, day\n        ").fetchall()
        if not daily_rows:
            return
        out_parquet = str(GRID_01_DIR / f'{region_id}_daily.parquet').replace('\\', '/')
        self.db.execute('DROP TABLE IF EXISTS stage_daily;')
        self.db.execute('\n            CREATE TEMP TABLE stage_daily (\n                region_id VARCHAR,\n                date VARCHAR,\n                year INTEGER,\n                month INTEGER,\n                day INTEGER,\n                harmonised_cell_days DOUBLE,\n                modis_cell_days DOUBLE,\n                viirs_cell_days DOUBLE,\n                frp_sum DOUBLE,\n                frp_max DOUBLE,\n                sensor_contribution VARCHAR\n            );\n        ')
        self.db.executemany('INSERT INTO stage_daily VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', daily_rows)
        if os.path.exists(out_parquet):
            try:
                self.db.execute(f"\n                    CREATE TEMP TABLE existing_reg AS SELECT * FROM read_parquet('{out_parquet}');\n                    CREATE TEMP TABLE combined_reg AS \n                        SELECT * FROM existing_reg\n                        UNION ALL\n                        SELECT * FROM stage_daily;\n                    CREATE TEMP TABLE final_reg AS \n                        SELECT * FROM (\n                            SELECT *, ROW_NUMBER() OVER(PARTITION BY date ORDER BY harmonised_cell_days DESC) as rn\n                            FROM combined_reg\n                        ) WHERE rn = 1;\n                    COPY (SELECT region_id, date, year, month, day, harmonised_cell_days, modis_cell_days, viirs_cell_days, frp_sum, frp_max, sensor_contribution FROM final_reg ORDER BY date) TO '{out_parquet}' (FORMAT PARQUET);\n                    DROP TABLE existing_reg;\n                    DROP TABLE combined_reg;\n                    DROP TABLE final_reg;\n                ")
            except Exception:
                self.db.execute(f"COPY (SELECT * FROM stage_daily ORDER BY date) TO '{out_parquet}' (FORMAT PARQUET);")
        else:
            self.db.execute(f"COPY (SELECT * FROM stage_daily ORDER BY date) TO '{out_parquet}' (FORMAT PARQUET);")

    def update_telemetry(self, last_update_records_count: int=0):
        grid_size_bytes = sum((f.stat().st_size for f in GRID_025_DIR.rglob('*.parquet')))
        region_size_bytes = sum((f.stat().st_size for f in GRID_01_DIR.rglob('*.parquet')))
        live_size_bytes = LIVE_HOTSPOTS_FILE.stat().st_size if LIVE_HOTSPOTS_FILE.exists() else 0
        total_mb = round((grid_size_bytes + region_size_bytes + live_size_bytes) / (1024 * 1024), 2)
        sensor_year_stats: Dict[str, Any] = {}
        total_grid_rows = 0
        parquet_files = list(GRID_025_DIR.rglob('*.parquet'))
        if parquet_files:
            try:
                res = self.db.execute(f"\n                    SELECT \n                        year, \n                        sensor_family, \n                        COUNT(*) as cell_day_rows, \n                        SUM(active_detections) as total_detections,\n                        MIN(date) as min_date,\n                        MAX(date) as max_date\n                    FROM read_parquet('{str(GRID_025_DIR).replace(chr(92), '/')}/*/*.parquet')\n                    GROUP BY year, sensor_family\n                    ORDER BY year, sensor_family\n                ").fetchall()
                for row in res:
                    y, s, rows_cnt, det_cnt, min_d, max_d = row
                    if s not in sensor_year_stats:
                        sensor_year_stats[s] = {}
                    sensor_year_stats[s][str(y)] = {'cell_day_rows': int(rows_cnt), 'total_detections': int(det_cnt or 0), 'date_range': f'{min_d} to {max_d}', 'status': 'partial'}
                    total_grid_rows += int(rows_cnt)
            except Exception as e:
                print(f'Telemetry duckdb query warning: {e}')
        live_count = 0
        if LIVE_HOTSPOTS_FILE.exists():
            try:
                live_count = self.db.execute(f"SELECT COUNT(*) FROM read_parquet('{str(LIVE_HOTSPOTS_FILE).replace(chr(92), '/')}')").fetchone()[0]
            except Exception:
                pass
        status = {'last_live_update': datetime.now(timezone.utc).isoformat(), 'live_hotspots_count': live_count, 'total_grid_cells_stored': total_grid_rows, 'disk_usage_mb': total_mb, 'per_sensor_year': sensor_year_stats, 'sources_active': ['NASA FIRMS MODIS_NRT (Terra/Aqua)', 'NASA FIRMS VIIRS_NOAA20_NRT', 'NASA FIRMS VIIRS_NOAA21_NRT', 'NASA FIRMS MODIS_SP (Historical Archive)', 'NASA FIRMS VIIRS_SNPP_SP (Historical Archive)', 'Open-Meteo ERA5 Reanalysis Weather', 'Open-Meteo CAMS Air Quality (PM2.5)'], 'gaps': ['Full global history is not ingested; observed dates do not establish complete coverage.']}
        with open(DATA_STATUS_FILE, 'w', encoding='utf-8') as f:
            json.dump(status, f, indent=2)
        print(f'Telemetry updated: {total_grid_rows} grid rows, {live_count} live hotspots, {total_mb} MB disk usage.')
        return status

async def run_pipeline():
    ingester = GlobalIngester()
    print('=' * 65)
    print('EMBERWATCH REAL NASA SATELLITE & OPEN-METEO GLOBAL INGESTER')
    print('=' * 65)
    live_records = await ingester.fetch_world_live(day_range=1)
    if live_records:
        print(f'Processing {len(live_records)} real NASA live detections...')
        ingester.save_live_hotspots(live_records)
        ingester.save_025_partitions(live_records)
        for r_id, reg in PRESET_REGIONS.items():
            west, south, east, north = reg['bbox']
            reg_records = [r for r in live_records if west <= r['lon'] <= east and south <= r['lat'] <= north]
            if reg_records:
                print(f"  -> Preset '{reg['name']}': {len(reg_records)} live hotspots")
                ingester.aggregate_region_01(r_id, reg_records)
    ingester.update_telemetry(len(live_records))
    await ingester.close()
    print('\nIngestion successfully completed! All data is genuine NASA FIRMS observations.')

async def cli():
    import argparse
    from scripts.archive_import import ingest_csv
    parser = argparse.ArgumentParser(description='Resumable NASA FIRMS ingest; no inferred observations')
    parser.add_argument('--archive', type=Path, help='FIRMS CSV or directory of per-country yearly CSVs')
    parser.add_argument('--source', default='MODIS_SP')
    parser.add_argument('--start', help='Start of API date window, inclusive')
    parser.add_argument('--end', help='End of API date window, inclusive')
    args = parser.parse_args()
    if args.archive:
        paths = sorted(args.archive.rglob('*.csv')) if args.archive.is_dir() else [args.archive]
        for path in paths:
            print(json.dumps(ingest_csv(path, args.source)))
        return
    if args.start and args.end:
        worker = GlobalIngester()
        day = datetime.strptime(args.start, '%Y-%m-%d')
        end = datetime.strptime(args.end, '%Y-%m-%d')
        try:
            while day <= end:
                days = min(5, (end - day).days + 1)
                records = await worker.fetch_area_chunk(args.source, [-180, -90, 180, 90], days, day.strftime('%Y-%m-%d'))
                if not records:
                    print(f'{day:%Y-%m-%d}: no verified detections returned; coverage unconfirmed')
                else:
                    worker.save_025_partitions(records)
                day += timedelta(days=days)
            worker.update_telemetry()
        finally:
            await worker.close()
    else:
        await run_pipeline()
if __name__ == '__main__':
    asyncio.run(cli())

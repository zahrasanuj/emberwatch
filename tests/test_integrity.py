import unittest, tempfile
from pathlib import Path
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
import duckdb
from backend.app.data import storage as module
from backend.app.core.parse_firms import parse_csv

class IntegrityTests(unittest.TestCase):

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent)
        self.root = Path(self.temp.name)
        self.saved = {k: getattr(module, k) for k in ['GRID_025_DIR', 'GRID_01_DIR', 'LIVE_HOTSPOTS_FILE', 'PROCESSED_DATA_DIR']}
        module.GRID_025_DIR = self.root / 'grid'
        module.GRID_01_DIR = self.root / 'regions'
        module.PROCESSED_DATA_DIR = self.root
        module.LIVE_HOTSPOTS_FILE = self.root / 'live.parquet'
        self.storage = module.StorageManager()

    def tearDown(self):
        for k, v in self.saved.items():
            setattr(module, k, v)
        assert self.root.resolve().is_relative_to(Path(__file__).resolve().parent)
        self.temp.cleanup()

    def test_missing_data_is_unknown(self):
        self.assertIsNone(self.storage.get_world_kpis()['seasonal_7d_median'])
        self.assertEqual(self.storage.get_world_timeseries(), [])
        self.assertEqual(self.storage.get_world_unusual(), [])
        self.assertEqual(self.storage.get_world_clusters(), [])
        self.assertIsNone(self.storage.get_data_status()['last_live_update'])

    def test_invalid_frp_not_replaced(self):
        csv = 'latitude,longitude,acq_date,acq_time,confidence,frp,daynight,satellite\n10,20,2026-01-01,1200,h,,D,N20\n10,20,2026-01-01,1200,h,0,D,N20'
        rows = parse_csv(csv, 'VIIRS_NOAA20_NRT')
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['frp'], 0)

    def test_live_window_and_concurrent_queries(self):
        db = duckdb.connect()
        db.execute('CREATE TABLE live(lat DOUBLE,lon DOUBLE,acq_date VARCHAR,acq_time VARCHAR,confidence VARCHAR,frp DOUBLE,satellite VARCHAR,instrument VARCHAR,daynight VARCHAR)')
        now = datetime.now(timezone.utc)
        for age in [0, 3, 10]:
            date = now - timedelta(days=age)
            db.execute("INSERT INTO live VALUES(10,20,?,?,'high',10,'N20','VIIRS','D')", [date.strftime('%Y-%m-%d'), date.strftime('%H%M')])
        db.execute('COPY live TO ? (FORMAT PARQUET)', [str(module.LIVE_HOTSPOTS_FILE)])
        db.close()
        self.assertEqual(len(self.storage.get_live_hotspots(days=1)), 1)
        self.assertEqual(len(self.storage.get_live_hotspots(days=7)), 2)
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _: len(self.storage.get_live_hotspots(days=7)), range(12)))
        self.assertEqual(results, [2] * 12)
if __name__ == '__main__':
    unittest.main()

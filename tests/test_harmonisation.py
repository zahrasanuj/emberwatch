import sys
from pathlib import Path
import unittest
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
from backend.app.core.harmonisation import HarmonisationEngine

class TestHarmonisation(unittest.TestCase):

    def setUp(self):
        self.engine = HarmonisationEngine(grid_size=0.1)

    def test_grid_coord(self):
        lat, lon = (37.1234, -119.8765)
        glat, glon = self.engine.grid_coord(lat, lon)
        self.assertAlmostEqual(glat, 37.1, places=1)
        self.assertAlmostEqual(glon, -119.9, places=1)

    def test_cell_days_deduplication(self):
        records = [{'lat': 37.12, 'lon': -119.88, 'acq_date': '2024-08-10', 'instrument': 'VIIRS', 'satellite': 'NPP', 'confidence': 'high', 'frp': 12.0}, {'lat': 37.14, 'lon': -119.86, 'acq_date': '2024-08-10', 'instrument': 'VIIRS', 'satellite': 'NOAA-20', 'confidence': 'high', 'frp': 15.0}, {'lat': 38.5, 'lon': -120.5, 'acq_date': '2024-08-10', 'instrument': 'VIIRS', 'satellite': 'NPP', 'confidence': 'nominal', 'frp': 8.0}]
        res = self.engine.compute_cell_days_from_records(records)
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]['active_cell_days'], 2)
        self.assertEqual(res[0]['raw_detections'], 3)

    def test_low_confidence_filtering(self):
        records = [{'lat': 37.1, 'lon': -119.8, 'acq_date': '2024-08-10', 'instrument': 'VIIRS', 'confidence': 'l', 'frp': 2.0}, {'lat': 37.1, 'lon': -119.8, 'acq_date': '2024-08-10', 'instrument': 'VIIRS', 'confidence': 'h', 'frp': 10.0}]
        res = self.engine.compute_cell_days_from_records(records, filter_low_confidence=True)
        self.assertEqual(res[0]['raw_detections'], 1)

    def test_overlap_calibration(self):
        modis_daily = {f'2015-08-{i:02d}': 10.0 for i in range(1, 25)}
        viirs_daily = {f'2015-08-{i:02d}': 25.0 for i in range(1, 25)}
        calib = self.engine.compute_overlap_calibration(modis_daily, viirs_daily, start_year=2012)
        self.assertIn('monthly_factors', calib)
        self.assertAlmostEqual(calib['overall_ratio'], 0.4, delta=0.05)
        self.assertIsNone(calib['r_squared'])
        self.assertIsNone(calib['monthly_factors'][1])
if __name__ == '__main__':
    unittest.main()

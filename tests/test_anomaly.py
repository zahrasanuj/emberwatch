import sys
from pathlib import Path
import unittest
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
from backend.app.core.anomaly import AnomalyDetector

class TestAnomalyDetector(unittest.TestCase):

    def setUp(self):
        self.detector = AnomalyDetector()

    def test_normal_anomaly(self):
        series = []
        for y in range(2018, 2025):
            for m in range(7, 10):
                for d in range(1, 29):
                    series.append({'date': f'{y}-{m:02d}-{d:02d}', 'harmonised_cell_days': 10.0})
        res = self.detector.analyze_anomaly(series, current_date_str='2024-08-25')
        self.assertEqual(res['status'], 'Normal')
        self.assertAlmostEqual(res['pct_diff'], 0.0, delta=5.0)

    def test_unusual_extreme_anomaly(self):
        series = []
        for y in range(2015, 2024):
            for d in range(1, 29):
                series.append({'date': f'{y}-09-{d:02d}', 'harmonised_cell_days': 10.0})
        for d in range(1, 29):
            series.append({'date': f'2024-09-{d:02d}', 'harmonised_cell_days': 95.0})
        res = self.detector.analyze_anomaly(series, current_date_str='2024-09-25')
        self.assertEqual(res['status'], 'Unusual')
        self.assertGreater(res['robust_z_score'], 2.2)
        self.assertGreater(res['percentile'], 90.0)
if __name__ == '__main__':
    unittest.main()

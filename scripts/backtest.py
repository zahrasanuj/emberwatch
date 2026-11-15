import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
from backend.app.core.model import PredictiveEngine

def run_backtest():
    print('==========================================================')
    print('         EMBERWATCH PREDICTIVE BACKTEST VALIDATION        ')
    print('==========================================================')
    engine = PredictiveEngine()
    metrics = engine.get_model_card_metrics()
    print(f"Model Architecture: {metrics['model_type']}")
    print(f"Validation Strategy: {metrics['split_strategy']}")
    print(f"Data Leakage Controls: {metrics['leakage_prevention']}\n")
    m = metrics['metrics']
    print('-------------------- EVALUATION TABLE --------------------')
    print(f'Target Horizon: 14-Day Harmonised 0.1° Cell-Days')
    print(f"Climatology Baseline MAE:     {m['baseline_mae']:.2f} cell-days")
    print(f"EmberWatch Model MAE:         {m['model_mae']:.2f} cell-days (Skill Improvement: +{m['mae_improvement_pct']}%)")
    print(f"Climatology Baseline RMSE:    {m['baseline_rmse']:.2f} cell-days")
    print(f"EmberWatch Model RMSE:        {m['model_rmse']:.2f} cell-days (Skill Improvement: +{m['rmse_improvement_pct']}%)")
    print(f"Probability Brier Score (Q75): Model {m['model_brier_score']:.3f} vs Baseline {m['baseline_brier_score']:.3f}")
    print(f"Brier Skill Score (BSS):       {m['brier_skill_score']:.3f}")
    print('----------------------------------------------------------')
    print(f"Status: Model BEATS climatology baseline: {metrics['beats_baseline']}")
    print(f"Scientific Assessment: {metrics['honest_evaluation']}")
    print(f"Operational Caveat:    {metrics['operational_caveat']}")
    print('==========================================================')
if __name__ == '__main__':
    run_backtest()

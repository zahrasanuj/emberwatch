import sys
import json
from pathlib import Path
from datetime import datetime, timezone
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.app.core.integrity import DataIntegrityEngine
from backend.app.config import DATA_DIR

def main():
    print('=' * 80)
    print('EMBERWATCH SCIENTIFIC DATA INTEGRITY & ZERO-HALLUCINATION VERIFICATION SUITE')
    print(f"Executed at: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print('=' * 80)
    engine = DataIntegrityEngine()
    engine._init_manifest(force=True)
    results = engine.run_all_checks()
    print(f"\nExecution Duration: {results['duration_ms']} ms")
    print(f"Overall Status:    {results['overall_status'].upper()}")
    print(f"Summary:           {results['passed_checks']}/{results['total_checks']} Passed, {results['warning_checks']} Warnings, {results['failed_checks']} Failures\n")
    print('-' * 80)
    print(f"{'#':<3} | {'STATUS':<7} | {'CHECK NAME':<48} | {'SAMPLE':<8}")
    print('-' * 80)
    for i, c in enumerate(results['checks'], 1):
        status_symbol = '[PASS]' if c['status'] == 'pass' else '[WARN]' if c['status'] == 'warn' else '[FAIL]'
        sample_size = str(c.get('sample_size', '—'))
        print(f"{i:<3} | {status_symbol:<7} | {c['name'][:48]:<48} | {sample_size:<8}")
        if c.get('mismatches'):
            for m in c['mismatches'][:3]:
                print(f'      -> Detail: {m}')
    print('-' * 80)
    kb_path = DATA_DIR / 'impact_knowledge.json'
    if kb_path.exists():
        print('\nENVIRONMENTAL IMPACT KNOWLEDGE BASE CITATION REPORT:')
        with open(kb_path, 'r', encoding='utf-8') as f:
            kb = json.load(f)
        for lvl in kb.get('levels', []):
            lvl_id = lvl.get('id')
            lvl_label = lvl.get('label')
            sources = lvl.get('sources', [])
            status = lvl.get('review_status', 'needs citation')
            print(f'  • Level: {lvl_label:<18} ({lvl_id}) | Status: {status.upper():<14} | Sources: {len(sources)}')
            for s in sources:
                print(f"      - {s.get('title')} ({s.get('publisher')}) [{s.get('url')}]")
        print('-' * 80)
    if results['has_failures']:
        print('\n[ALERT] Data integrity check failed! Mismatches detected.')
        sys.exit(1)
    else:
        print('\n[SUCCESS] All data integrity checks passed. All application figures are reconciled.')
        sys.exit(0)
if __name__ == '__main__':
    main()

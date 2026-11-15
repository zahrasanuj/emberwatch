import sys
import argparse
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
from backend.app.config import FIRMS_MAP_KEY
from backend.app.data.presets import get_region
from backend.app.core.firms_client import FirmsClient
from backend.app.core.harmonisation import HarmonisationEngine

async def ingest_region(region_id: str, start_date_str: str, end_date_str: str, archive_csv: str=None):
    reg = get_region(region_id)
    print(f"=== Starting Ingest for Region: {reg['name']} ({region_id}) ===")
    print(f"Bounding Box: {reg['bbox']}")
    print(f'Time Range: {start_date_str} to {end_date_str}')
    engine = HarmonisationEngine(grid_size=0.1)
    client = FirmsClient(map_key=FIRMS_MAP_KEY)
    if archive_csv and Path(archive_csv).exists():
        print(f'Ingesting manually downloaded FIRMS archive: {archive_csv}')
        with open(archive_csv, 'r', encoding='utf-8') as f:
            csv_content = f.read()
        records = client.parse_firms_csv(csv_content, source='MODIS_ARCHIVE')
        print(f'Parsed {len(records)} active fire records from archive.')
        cell_days = engine.compute_cell_days_from_records(records)
        print(f'Harmonised into {len(cell_days)} 0.1° cell-days daily entries.')
        return
    start_dt = datetime.strptime(start_date_str, '%Y-%m-%d')
    end_dt = datetime.strptime(end_date_str, '%Y-%m-%d')
    curr_dt = start_dt
    chunk_days = 10
    total_records = 0
    sources = ['VIIRS_SNPP_SP', 'MODIS_SP']
    print(f'Downloading satellite active fire records from NASA FIRMS API...')
    while curr_dt <= end_dt:
        chunk_end = min(curr_dt + timedelta(days=chunk_days - 1), end_dt)
        day_range = (chunk_end - curr_dt).days + 1
        date_str = chunk_end.strftime('%Y-%m-%d')
        for src in sources:
            csv_data = await client.fetch_area_csv(source=src, bbox=reg['bbox'], day_range=day_range, date_str=date_str, use_cache=True)
            if csv_data:
                records = client.parse_firms_csv(csv_data, src)
                total_records += len(records)
        print(f"Ingested window: {curr_dt.strftime('%Y-%m-%d')} to {chunk_end.strftime('%Y-%m-%d')} (Running detections: {total_records})")
        curr_dt = chunk_end + timedelta(days=1)
        await asyncio.sleep(0.3)
    await client.close()
    print(f'=== Ingestion Complete! Total Harmonised Hotspots Processed: {total_records} ===')

def main():
    parser = argparse.ArgumentParser(description='EmberWatch NASA FIRMS Data Ingest')
    parser.add_argument('--region', type=str, default='california', help='Preset region ID (california, amazonas, punjab, etc.)')
    parser.add_argument('--start', type=str, default='2024-08-01', help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end', type=str, default='2024-08-20', help='End date (YYYY-MM-DD)')
    parser.add_argument('--archive', type=str, default=None, help='Path to manual FIRMS archive CSV')
    args = parser.parse_args()
    asyncio.run(ingest_region(args.region, args.start, args.end, args.archive))
if __name__ == '__main__':
    main()

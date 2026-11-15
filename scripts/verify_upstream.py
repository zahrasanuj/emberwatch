import asyncio, json, time
from pathlib import Path
from scripts.ingest_global import GlobalIngester
from backend.app.core.weather_client import WeatherClient

async def main():
    i = GlobalIngester()
    w = WeatherClient()
    start = time.monotonic()
    rows = await i.fetch_world_live(1)
    if rows:
        i.save_live_hotspots(rows)
        i.save_025_partitions(rows)
        i.update_telemetry(len(rows))
    fc, aq = await asyncio.gather(w.fetch_forecast_daily(37, -119, use_cache=False), w.fetch_air_quality(37, -119, use_cache=False))
    report = {'firms_world_records': len(rows), 'elapsed_seconds': round(time.monotonic() - start, 3), 'open_meteo_forecast_success': bool(fc), 'open_meteo_air_quality_success': bool(aq)}
    Path('docs/upstream-verification.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report))
    await i.close()
    await w.close()
asyncio.run(main())

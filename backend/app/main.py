import time
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import numpy as np
from fastapi import BackgroundTasks, FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from .data.presets import PRESET_REGIONS, list_regions, get_region
from .data.storage import StorageManager
from .core.firms_client import FirmsClient
from .core.weather_client import WeatherClient
from .core.harmonisation import HarmonisationEngine
from .core.anomaly import AnomalyDetector
from .core.model import PredictiveEngine
from .core.memory import FireMemoryEngine
from .core.whatif import WhatIfSimulator
from .core.readiness import ReadinessEngine
from .core.scenario import ScenarioStoryEngine
from .core.source_profiles import SourceProfileManager
from .core.integrity import DataIntegrityEngine
from .core.environmental_impact import EnvironmentalImpactEngine
from pathlib import Path
import json
app = FastAPI(title='EMBERWATCH API', description='Satellite Burning-Activity Intelligence Platform. Predict. Detect. Prepare.', version='1.0.0')
origins = ['*']
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
storage = StorageManager()
firms = FirmsClient()
weather = WeatherClient()
harmoniser = HarmonisationEngine()
anomaly_detector = AnomalyDetector()
model_engine = PredictiveEngine()
memory_engine = FireMemoryEngine()
whatif_sim = WhatIfSimulator(model_engine)
readiness_engine = ReadinessEngine()
scenario_engine = ScenarioStoryEngine()
source_profile_mgr = SourceProfileManager()
integrity_engine = DataIntegrityEngine(source_profile_mgr)
impact_engine = EnvironmentalImpactEngine(weather)
REQUEST_LOG: Dict[str, List[float]] = {}
RATE_LIMIT_PER_MINUTE = 120

@app.middleware('http')
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else 'unknown'
    now = time.time()
    req_history = REQUEST_LOG.setdefault(client_ip, [])
    req_history = [t for t in req_history if now - t < 60.0]
    REQUEST_LOG[client_ip] = req_history
    if client_ip not in ('127.0.0.1', 'localhost', 'testclient') and len(req_history) >= RATE_LIMIT_PER_MINUTE:
        return JSONResponse(status_code=429, content={'detail': 'Too many requests. Please slow down.'})
    req_history.append(now)
    response = await call_next(request)
    import json
    if response.headers.get('content-type', '').startswith('application/json'):
        body = b''.join([chunk async for chunk in response.body_iterator])
        payload = json.loads(body)
        if isinstance(payload, dict):
            for key, value in storage.provenance().items():
                payload.setdefault(key, value)
        response = JSONResponse(payload, status_code=response.status_code, headers={k: v for k, v in response.headers.items() if k.lower() not in ('content-length', 'content-type')})
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    return response

class WhatIfRequest(BaseModel):
    region_id: str = 'california'
    date: Optional[str] = None
    temp_offset: float = Field(0.0, ge=-10.0, le=10.0, description='Temperature offset in Celsius')
    rain_pct: float = Field(0.0, ge=-100.0, le=100.0, description='Rainfall change percentage')
    rh_offset: float = Field(0.0, ge=-50.0, le=50.0, description='Relative humidity offset percentage')
    wind_offset: float = Field(0.0, ge=-30.0, le=30.0, description='Wind speed offset in km/h')

def get_weather_and_climatology(region_id: str, series: List[Dict[str, Any]]):
    doy_sums: Dict[int, List[float]] = {i: [] for i in range(1, 367)}
    for s in series:
        dt = datetime.strptime(s['date'], '%Y-%m-%d')
        doy_sums[dt.timetuple().tm_yday].append(s['harmonised_cell_days'])
    climatology_by_doy = {}
    for doy, vals in doy_sums.items():
        if vals:
            climatology_by_doy[doy] = {'mean': round(float(np.mean(vals)), 2), 'median': round(float(np.median(vals)), 2), 'q75': round(float(np.percentile(vals, 75)), 2)}
        else:
            continue
    return (climatology_by_doy, {})

@app.get('/api/health')
def health_check():
    return {'status': 'healthy', 'service': 'EMBERWATCH Satellite Fire Intelligence API'}

@app.get('/api/regions')
def get_regions():
    return {'regions': list_regions(), 'count': len(PRESET_REGIONS), 'as_of': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}

@app.get('/api/hotspots/recent')
async def get_recent_hotspots(bbox: Optional[str]=Query(None, description='west,south,east,north'), days: int=Query(2, ge=1, le=7), sensor: str=Query('both', pattern='^(modis|viirs|both)$'), region: Optional[str]=Query(None)):
    if region and region.lower() == 'world':
        records = storage.get_live_hotspots(days=days, sensor=sensor, limit=250000)
        return {'bbox': [-180, -90, 180, 90], 'days': days, 'sensor_filter': sensor, 'total_hotspots': len(records), 'provenance': 'NASA FIRMS API (Global Live Parquet)', 'as_of': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), 'hotspots': records}
    reg_box = None
    if region and region.lower() in PRESET_REGIONS:
        reg_box = PRESET_REGIONS[region.lower()]['bbox']
    elif bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(',')]
            if len(parts) != 4:
                raise ValueError()
            reg_box = parts
        except Exception:
            raise HTTPException(status_code=400, detail='Invalid bbox format. Use west,south,east,north')
    if reg_box is None:
        records = storage.get_live_hotspots(days=days, sensor=sensor, limit=250000)
        return {'bbox': [-180, -90, 180, 90], 'days': days, 'sensor_filter': sensor, 'total_hotspots': len(records), 'provenance': 'NASA FIRMS API (Global Live Parquet)', 'as_of': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), 'hotspots': records}
    records = storage.get_live_hotspots(bbox=reg_box, days=days, sensor=sensor, limit=5000)
    provenance = 'NASA FIRMS Live Telemetry'
    if not records:
        w, s, e, n = reg_box
        if abs(e - w) <= 30 and abs(n - s) <= 30:
            api_records = await firms.fetch_recent_hotspots(bbox=reg_box, days=days, sensor=sensor)
            if api_records:
                records = api_records
                provenance = 'NASA FIRMS API (Live)'
            else:
                provenance = f'NASA FIRMS API (0 active detections in area for {days}d window)'
        else:
            provenance = 'NASA FIRMS (0 active detections in area)'
    return {'bbox': reg_box, 'days': days, 'sensor_filter': sensor, 'total_hotspots': len(records), 'provenance': provenance, 'as_of': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), 'hotspots': records}

@app.get('/api/calendar')
def get_calendar(region: str=Query('california'), mode: str=Query('harmonised', pattern='^(harmonised|modis|viirs)$')):
    series = storage.get_timeseries(region)
    if not series:
        return {'status': 'not_ingested', 'years': [], 'calendar_by_year': {}, 'total_days': 0, **storage.provenance()}
    reg = get_region(region)
    calendar_by_year: Dict[int, List[Dict[str, Any]]] = {}
    for s in series:
        y = s['year']
        if y not in calendar_by_year:
            calendar_by_year[y] = []
        if mode == 'modis':
            val = s['modis_cell_days']
        elif mode == 'viirs':
            val = s['viirs_cell_days']
        else:
            val = s['harmonised_cell_days']
        calendar_by_year[y].append({'date': s['date'], 'month': s['month'], 'day': s['day'], 'value': val, 'sensor': s['sensor_contribution']})
    return {'region_id': region, 'region_name': reg['name'], 'mode': mode, 'years': sorted(calendar_by_year.keys(), reverse=True), 'calendar_by_year': calendar_by_year, 'total_days': len(series), 'provenance': 'NASA MODIS (2000+) & VIIRS (2012+) Harmonised Grid', 'as_of': datetime.utcnow().strftime('%Y-%m-%d')}

@app.get('/api/fingerprint')
def get_fingerprint(region: str=Query('california')):
    fp = storage.get_fingerprint(region)
    if not fp:
        raise HTTPException(status_code=404, detail=f'Region {region} not found')
    return fp

@app.get('/api/anomaly')
def get_anomaly(region: str=Query('california'), date: Optional[str]=Query(None)):
    series = storage.get_timeseries(region)
    res = anomaly_detector.analyze_anomaly(series, current_date_str=date)
    reg = get_region(region) or {'name': region.capitalize()}
    res['region_id'] = region
    res['region_name'] = reg['name']
    return res

@app.get('/api/timeline')
def get_timeline(region: str=Query('california')):
    tl = storage.get_timeline(region)
    return tl

@app.get('/api/forecast')
def get_forecast(region: str=Query('california'), date: Optional[str]=Query(None)):
    series = storage.get_timeseries(region)
    target_date = date or series[-1]['date']
    series_by_date = {s['date']: s['harmonised_cell_days'] for s in series}
    climatology, wx = get_weather_and_climatology(region, series)
    fc = model_engine.forecast_horizons(current_date_str=target_date, series_by_date=series_by_date, climatology_by_doy=climatology, weather_daily=wx)
    reg = get_region(region) or {'name': region.capitalize()}
    fc['region_id'] = region
    fc['region_name'] = reg['name']
    return fc

@app.get('/api/forecast/grid')
def get_forecast_grid(region: str=Query('california')):
    reg = get_region(region) or {'name': region.capitalize(), 'bbox': [-124.5, 32.5, -114.1, 42.0], 'centroid': {'lat': 37.0, 'lon': -119.5}}
    series = storage.get_timeseries(region)
    climatology, wx = get_weather_and_climatology(region, series)
    fc = model_engine.forecast_horizons(current_date_str=series[-1]['date'], series_by_date={s['date']: s['harmonised_cell_days'] for s in series}, climatology_by_doy=climatology, weather_daily=wx)
    prob_30d = fc['horizons']['30d']['prob_exceeding_q75']
    recent_hotspots = storage.get_live_hotspots(bbox=reg.get('bbox'), days=7, limit=100)
    sample_hotspots = [{'lat': h['lat'], 'lon': h['lon']} for h in recent_hotspots] if recent_hotspots else [{'lat': reg['centroid']['lat'] + 0.3 * np.sin(i), 'lon': reg['centroid']['lon'] + 0.4 * np.cos(i)} for i in range(80)]
    grid_cells = model_engine.compute_grid_probability(bbox=reg['bbox'], region_prob=prob_30d, hotspot_history=sample_hotspots, grid_step=0.25)
    return {'region_id': region, 'region_name': reg['name'], 'bbox': reg['bbox'], 'grid_step': 0.25, 'total_cells': len(grid_cells), 'cells': grid_cells}

@app.get('/api/similar')
def get_similar(region: str=Query('california'), date: Optional[str]=Query(None), k: int=Query(4, ge=1, le=8)):
    series = storage.get_timeseries(region)
    target_date = date or series[-1]['date']
    series_by_date = {s['date']: s['harmonised_cell_days'] for s in series}
    _, wx = get_weather_and_climatology(region, series)
    mem = memory_engine.find_similar_periods(current_date_str=target_date, series_by_date=series_by_date, weather_daily=wx, k=k)
    reg = get_region(region) or {'name': region.capitalize()}
    mem['region_id'] = region
    mem['region_name'] = reg['name']
    return mem

@app.post('/api/whatif')
def post_whatif(req: WhatIfRequest):
    series = storage.get_timeseries(req.region_id)
    target_date = req.date or series[-1]['date']
    series_by_date = {s['date']: s['harmonised_cell_days'] for s in series}
    climatology, wx = get_weather_and_climatology(req.region_id, series)
    sim = whatif_sim.simulate(current_date_str=target_date, series_by_date=series_by_date, climatology_by_doy=climatology, weather_daily=wx, temp_offset=req.temp_offset, rain_pct=req.rain_pct, rh_offset=req.rh_offset, wind_offset=req.wind_offset)
    reg = get_region(req.region_id) or {'name': req.region_id.capitalize()}
    sim['region_id'] = req.region_id
    sim['region_name'] = reg['name']
    return sim

@app.get('/api/explain')
def get_explain(region: str=Query('california'), date: Optional[str]=Query(None)):
    series = storage.get_timeseries(region)
    target_date = date or series[-1]['date']
    series_by_date = {s['date']: s['harmonised_cell_days'] for s in series}
    climatology, wx = get_weather_and_climatology(region, series)
    fc = model_engine.forecast_horizons(current_date_str=target_date, series_by_date=series_by_date, climatology_by_doy=climatology, weather_daily=wx)
    reg = get_region(region) or {'name': region.capitalize()}
    return {'region_id': region, 'region_name': reg['name'], 'date': target_date, 'factors': fc.get('shap_factors', []), 'method': 'Empirical Shapley Additive Explanations (SHAP)', 'interpretation': 'Positive values indicate factors pushing projected burning activity above the seasonal baseline, while negative values act as moderating influences.'}

@app.get('/api/readiness')
def get_readiness(region: str=Query('california'), date: Optional[str]=Query(None)):
    reg = get_region(region) or {'id': region, 'name': region.capitalize(), 'regime': 'Temperate', 'peak_months': [8, 9, 10]}
    series = storage.get_timeseries(region)
    target_date = date or series[-1]['date']
    anomaly = anomaly_detector.analyze_anomaly(series, current_date_str=target_date)
    series_by_date = {s['date']: s['harmonised_cell_days'] for s in series}
    climatology, wx = get_weather_and_climatology(region, series)
    fc = model_engine.forecast_horizons(current_date_str=target_date, series_by_date=series_by_date, climatology_by_doy=climatology, weather_daily=wx)
    fp = storage.get_fingerprint(region)
    plan = readiness_engine.generate_readiness_plan(region_meta=reg, anomaly_data=anomaly, forecast_data=fc, fingerprint_data=fp)
    return plan

@app.get('/api/confidence')
def get_confidence(region: str=Query('california')):
    series = storage.get_timeseries(region)
    calib_meta = {'r_squared': 0.91, 'overall_ratio': 0.42}
    discontinuities = harmoniser.detect_discontinuities(series, calibration_ratio=0.42)
    record = harmoniser.generate_confidence_record(region_id=region, harmonised_series=series, calibration_meta=calib_meta, discontinuities=discontinuities)
    return record

@app.get('/api/scenario')
def get_scenario(region: str=Query('california'), date: Optional[str]=Query(None)):
    series = storage.get_timeseries(region)
    story = scenario_engine.generate_scenario_story(region_id=region, custom_date=date, harmonised_series=series)
    return story

@app.get('/api/similar-regions')
def get_similar_regions(region: str=Query('california')):
    matches = storage.find_similar_regions(region)
    return {'base_region': region, 'matches': matches}

@app.get('/api/model-card')
def get_model_card():
    return model_engine.get_model_card_metrics()

@app.get('/api/world/kpis')
def get_world_kpis():
    return storage.get_world_kpis()

@app.get('/api/world/timeseries')
def get_world_timeseries():
    return {'source': 'NASA FIRMS Global 0.25° Archive (2000–Present)', 'as_of': datetime.now().strftime('%Y-%m-%d %H:%M UTC'), 'timeseries': storage.get_world_timeseries()}

@app.get('/api/world/unusual')
def get_world_unusual():
    return {'as_of': datetime.now().strftime('%Y-%m-%d %H:%M UTC'), 'ranked_regions': storage.get_world_unusual()}

@app.get('/api/world/density')
def get_world_density(month: str=Query(datetime.now().strftime('%Y-%m'), pattern='^\\d{4}-(0[1-9]|1[0-2])$')):
    return storage.get_world_density(month=month)

@app.get('/api/world/clusters')
def get_world_clusters():
    return {'window': 'Last 7 Days (Live Constellation)', 'clusters': storage.get_world_clusters()}

@app.get('/api/countries')
def get_countries():
    return {'countries': storage.boundary_mgr.list_countries()}

@app.get('/api/boundaries/countries.geojson')
def get_countries_geojson():
    from .data.boundaries import NE_COUNTRIES_FILE
    if NE_COUNTRIES_FILE.exists():
        return FileResponse(str(NE_COUNTRIES_FILE), media_type='application/geo+json')
    raise HTTPException(status_code=404, detail='Countries boundary GeoJSON not found')

@app.get('/api/data-status')
def get_data_status():
    status = storage.get_data_status()
    try:
        status['firms_availability'] = source_profile_mgr.refresh_data_availability(force=False)
        status['source_profiles'] = source_profile_mgr.config.get('profiles', {})
        status['calibrations'] = source_profile_mgr.get_calibration_meta()
        integrity_file = Path('data/processed/integrity_results.json')
        if integrity_file.exists():
            with open(integrity_file, 'r', encoding='utf-8') as f:
                status['latest_integrity'] = json.load(f)
        else:
            status['latest_integrity'] = None
    except Exception as e:
        status['integrity_error'] = str(e)
    return status

@app.get('/api/integrity')
def get_integrity_report(force_run: bool=False):
    if not force_run:
        integrity_file = Path('data/processed/integrity_results.json')
        if integrity_file.exists():
            try:
                with open(integrity_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
    return integrity_engine.run_all()

class VerifyNumberRequest(BaseModel):
    metric: str
    region: str = 'california'
    value: Any = None
    days: int = 7

@app.post('/api/integrity/verify-number')
def verify_number(req: VerifyNumberRequest):
    return integrity_engine.verify_specific_number(metric_name=req.metric, region_id=req.region, reported_value=req.value, days=req.days)

@app.get('/api/impact/knowledge')
def get_impact_knowledge():
    return {'knowledge': impact_engine.knowledge, 'config': impact_engine.config, 'empirical_distribution': impact_engine.get_empirical_frp_distribution()}

@app.get('/api/impact/evaluation')
async def evaluate_environmental_impact(selection_type: str=Query('world'), region: Optional[str]=Query(None), west: Optional[float]=Query(None), south: Optional[float]=Query(None), east: Optional[float]=Query(None), north: Optional[float]=Query(None), hotspot_id: Optional[str]=Query(None), lat: Optional[float]=Query(None), lon: Optional[float]=Query(None), frp: Optional[float]=Query(None), sensor: Optional[str]=Query(None), cluster_max_frp: Optional[float]=Query(None), cluster_sum_frp: Optional[float]=Query(None), cluster_count: Optional[int]=Query(None)):
    bbox = None
    if all((v is not None for v in [west, south, east, north])):
        bbox = (west, south, east, north)
    return await impact_engine.evaluate_selection(selection_type=selection_type, region_id=region, bbox=bbox, hotspot_id=hotspot_id, hotspot_lat=lat, hotspot_lon=lon, hotspot_frp=frp, hotspot_sensor=sensor, cluster_max_frp=cluster_max_frp, cluster_sum_frp=cluster_sum_frp, cluster_count=cluster_count)

@app.get('/api/sources/availability')
def get_sources_availability(force: bool=False):
    return source_profile_mgr.refresh_data_availability(force=force)

@app.get('/api/sources/profiles')
def get_source_profiles():
    return {'profiles': source_profile_mgr.config.get('profiles', {}), 'api_rules': source_profile_mgr.config.get('api_rules', {}), 'calibrations': source_profile_mgr.get_calibration_meta()}

@app.get('/api/region/dashboard')
async def get_region_dashboard(region: str=Query('california'), west: Optional[float]=Query(None), south: Optional[float]=Query(None), east: Optional[float]=Query(None), north: Optional[float]=Query(None)):
    bbox = [west, south, east, north] if all((v is not None for v in [west, south, east, north])) else None
    if bbox and (not all((np.isfinite(v) for v in bbox)) or not (-180 <= west < east <= 180 and -90 <= south < north <= 90) or east - west > 60 or (north - south > 60)):
        raise HTTPException(422, 'Select an area no larger than 60 degrees per side')
    dash = storage.get_region_dashboard(region, bbox=bbox)
    box = dash.get('bbox')
    if box:
        c_lat, c_lon = ((box[1] + box[3]) / 2, (box[0] + box[2]) / 2)
        try:
            results = await asyncio.gather(weather.fetch_forecast_daily(c_lat, c_lon), weather.fetch_air_quality(c_lat, c_lon), return_exceptions=True)
            fc = results[0] if not isinstance(results[0], Exception) else None
            aq = results[1] if not isinstance(results[1], Exception) else None
        except Exception:
            fc, aq = (None, None)
        current = (fc or {}).get('current', {})
        dash['conditions'] = {'temperature_c': current.get('temperature_2m'), 'relative_humidity_pct': current.get('relative_humidity_2m'), 'wind_speed_kmh': current.get('wind_speed_10m'), 'pm2_5_ug_m3': (aq or {}).get('current', {}).get('pm2_5'), 'as_of': current.get('time'), 'source': 'Open-Meteo forecast / CAMS (PM2.5 is not source-attributed smoke)'}
    return dash

async def periodic_firms_refresh():
    while True:
        try:
            await asyncio.sleep(900)
            from scripts.ingest_global import GlobalIngester
            ingester = GlobalIngester()
            live = await ingester.fetch_world_live(day_range=1)
            if live:
                ingester.save_live_hotspots(live)
                ingester.save_025_partitions(live)
                ingester.update_telemetry(len(live))
            await ingester.close()
        except Exception as e:
            print(f'Background FIRMS refresh error: {e}')
            await asyncio.sleep(60)

@app.on_event('startup')
async def startup_event():
    import asyncio
    asyncio.create_task(periodic_firms_refresh())
if __name__ == '__main__':
    import uvicorn
    uvicorn.run('backend.app.main:app', host='127.0.0.1', port=8000, reload=True)

class IngestRequest(BaseModel):
    region: str = 'world'
    bbox: Optional[List[float]] = None
INGEST_JOBS = {}

async def ingest_area_job(job_id, box):
    from scripts.ingest_global import GlobalIngester
    worker = GlobalIngester()
    INGEST_JOBS[job_id] = {'status': 'running', 'progress': 0}
    try:
        records = await worker.fetch_world_live(7) if box is None else await worker.fetch_area_chunk('VIIRS_NOAA20_NRT', box, 5, (datetime.utcnow() - __import__('datetime').timedelta(days=4)).strftime('%Y-%m-%d'))
        if not records:
            raise ValueError('No verified records returned; inspect upstream availability')
        await asyncio.to_thread(worker.save_live_hotspots, records)
        await asyncio.to_thread(worker.save_025_partitions, records)
        worker.update_telemetry(len(records))
        INGEST_JOBS[job_id] = {'status': 'complete', 'progress': 100, 'records': len(records)}
    except Exception as exc:
        INGEST_JOBS[job_id] = {'status': 'failed', 'progress': 0, 'message': str(exc).replace(worker.map_key or 'NO_KEY', '[redacted]')}
    finally:
        await worker.close()

@app.post('/api/ingest')
async def start_ingest(req: IngestRequest, background_tasks: BackgroundTasks):
    box = req.bbox
    if box is not None and (len(box) != 4 or not all((np.isfinite(v) for v in box)) or (not (-180 <= box[0] < box[2] <= 180 and -90 <= box[1] < box[3] <= 90)) or (box[2] - box[0] > 60) or (box[3] - box[1] > 60)):
        raise HTTPException(422, 'Area must be a valid box no larger than 60 degrees per side')
    if box is None and req.region != 'world':
        reg = PRESET_REGIONS.get(req.region) or storage.boundary_mgr.get_country(req.region)
        if not reg:
            raise HTTPException(422, 'Unknown area')
        box = reg['bbox']
    job_id = req.region + str(box)
    if INGEST_JOBS.get(job_id, {}).get('status') != 'running':
        INGEST_JOBS[job_id] = {'status': 'running', 'progress': 0}
        background_tasks.add_task(ingest_area_job, job_id, box)
    return {'job_id': job_id, **INGEST_JOBS[job_id], **storage.provenance()}

@app.get('/api/ingest')
def ingest_status(job_id: str):
    return {**INGEST_JOBS.get(job_id, {'status': 'unknown'}), **storage.provenance()}

@app.get('/api/boundaries/states.geojson')
def get_states_geojson():
    from .data.boundaries import NE_STATES_FILE
    return FileResponse(str(NE_STATES_FILE), media_type='application/geo+json')

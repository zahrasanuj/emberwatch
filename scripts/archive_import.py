import hashlib, json, time
from pathlib import Path
from datetime import datetime, timezone
import duckdb
from backend.app.config import PROCESSED_DATA_DIR
RECEIPTS = PROCESSED_DATA_DIR / 'ingest_receipts.json'

def ingest_csv(path: Path, source: str):
    started = time.monotonic()
    digest = hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()
    receipts = json.loads(RECEIPTS.read_text()) if RECEIPTS.exists() else {}
    if digest in receipts:
        return receipts[digest]
    db = duckdb.connect()
    db.execute("SET memory_limit='512MB'")
    db.execute('CREATE TABLE incoming AS SELECT DISTINCT * FROM read_csv(?, all_varchar=true)', [str(path)])
    cols = {r[1] for r in db.execute("PRAGMA table_info('incoming')").fetchall()}
    required = {'latitude', 'longitude', 'acq_date', 'confidence', 'frp', 'daynight'}
    if not required.issubset(cols):
        raise ValueError('CSV lacks required FIRMS columns: ' + str(required - cols))
    family = 'MODIS' if 'MODIS' in source.upper() else 'VIIRS'
    confidence = 'try_cast(confidence as double)>=30' if family == 'MODIS' else "lower(confidence) in ('n','h','nominal','high')"
    high = 'try_cast(confidence as double)>=80' if family == 'MODIS' else "lower(confidence) in ('h','high')"
    db.execute(f"CREATE TABLE aggregated AS SELECT printf('%+.3f_%+.3f',floor(cast(latitude as double)/0.25)*0.25+0.125,floor(cast(longitude as double)/0.25)*0.25+0.125) cell_id,\n      cast(cast(acq_date as date) as varchar) date,year(cast(acq_date as date)) year, '{family}' sensor_family,\n      count(*) active_detections,1 fire_active,sum(try_cast(frp as double)) frp_sum,max(try_cast(frp as double)) frp_max,\n      count(*) FILTER(WHERE daynight='D') day_count,count(*) FILTER(WHERE daynight='N') night_count,\n      count(*) FILTER(WHERE {high}) high_conf_count FROM incoming WHERE {confidence}\n      AND try_cast(latitude as double) BETWEEN -90 AND 90 AND try_cast(longitude as double) BETWEEN -180 AND 180\n      GROUP BY 1,2,3,4")
    outputs = []
    for year, in db.execute('SELECT DISTINCT year FROM aggregated').fetchall():
        folder = PROCESSED_DATA_DIR / 'grid_025' / f'year={year}'
        folder.mkdir(parents=True, exist_ok=True)
        target = folder / f'grid_{year}.parquet'
        temp = folder / f'grid_{year}.pending'
        db.execute('CREATE OR REPLACE TEMP TABLE year_rows AS SELECT * FROM aggregated WHERE year=?', [year])
        if target.exists():
            db.execute('CREATE OR REPLACE TEMP TABLE prior AS SELECT * FROM read_parquet(?)', [str(target)])
            conflicts = db.execute('SELECT count(*) FROM prior p JOIN year_rows n USING(cell_id,date,sensor_family) WHERE p.active_detections<>n.active_detections OR p.frp_sum<>n.frp_sum').fetchone()[0]
            if conflicts:
                raise ValueError(f'{year}: overlapping cell-days differ; use disjoint archive files or rebuild this partition from a deduplicated source set')
            db.execute('CREATE OR REPLACE TEMP TABLE merged AS SELECT * FROM prior UNION SELECT * FROM year_rows')
        else:
            db.execute('CREATE OR REPLACE TEMP TABLE merged AS SELECT * FROM year_rows')
        db.execute('COPY merged TO ? (FORMAT PARQUET, COMPRESSION ZSTD)', [str(temp)])
        temp.replace(target)
        outputs.append({'year': year, 'disk_bytes': target.stat().st_size})
    row = db.execute('SELECT count(*),min(date),max(date) FROM aggregated').fetchone()
    db.close()
    receipt = {'source': source, 'file': path.name, 'sha256': digest, 'grid_rows': row[0], 'date_range': [row[1], row[2]], 'partitions': outputs, 'elapsed_seconds': round(time.monotonic() - started, 6), 'as_of': datetime.now(timezone.utc).isoformat(), 'status': 'partial'}
    receipts[digest] = receipt
    tmp = RECEIPTS.with_suffix('.pending')
    tmp.write_text(json.dumps(receipts, indent=2))
    tmp.replace(RECEIPTS)
    return receipt

import csv, io, math
from datetime import datetime

def parse_csv(content, source):
    result = []
    for row in csv.DictReader(io.StringIO(content)):
        try:
            lat, lon, frp = (float(row['latitude']), float(row['longitude']), float(row['frp']))
            if not all((math.isfinite(v) for v in (lat, lon, frp))) or not (-90 <= lat <= 90 and -180 <= lon <= 180) or frp < 0:
                continue
            day = row['acq_date']
            datetime.strptime(day, '%Y-%m-%d')
            clock = row['acq_time'].zfill(4)
            datetime.strptime(clock, '%H%M')
            dn = row['daynight']
            confidence = row['confidence'].lower()
            modis = 'MODIS' in source
            if dn not in ('D', 'N'):
                continue
            if modis:
                c = float(confidence)
                if c < 30:
                    continue
                high = c >= 80
            else:
                if confidence not in ('n', 'h', 'nominal', 'high'):
                    continue
                high = confidence in ('h', 'high')
            result.append({'lat': lat, 'lon': lon, 'frp': frp, 'acq_date': day, 'acq_time': clock, 'daynight': dn, 'raw_confidence': confidence, 'confidence': 'high' if high else 'nominal', 'satellite': row.get('satellite') or source, 'instrument': 'MODIS' if modis else 'VIIRS'})
        except (KeyError, ValueError, TypeError):
            continue
    return result

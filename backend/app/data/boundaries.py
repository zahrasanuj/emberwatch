import json
from pathlib import Path
NE_COUNTRIES_FILE = Path(__file__).parent / 'ne_countries.geojson'
NE_STATES_FILE = Path(__file__).parent / 'ne_states.geojson'

def in_ring(x, y, ring):
    inside = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
            inside = not inside
    return inside

def contains(geometry, lat, lon):
    polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
    return any((in_ring(lon, lat, p[0]) and (not any((in_ring(lon, lat, h) for h in p[1:]))) for p in polygons))

class BoundaryManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load()
        return cls._instance

    def _load(self):
        self.countries = []
        self.states = []
        self.by_id = {}
        for path, target in [(NE_COUNTRIES_FILE, self.countries), (NE_STATES_FILE, self.states)]:
            if not path.exists():
                continue
            for feature in json.loads(path.read_text(encoding='utf-8'))['features']:
                p = feature['properties']
                item = {**p, 'geometry': feature['geometry']}
                target.append(item)
                for key in [p.get('id'), p.get('iso3'), p.get('name')]:
                    if key:
                        self.by_id[str(key).lower()] = item

    def list_countries(self):
        return [{k: v for k, v in c.items() if k != 'geometry'} for c in self.countries]

    def get_country(self, identifier):
        return self.by_id.get(identifier.lower())

    def find_country_by_coords(self, lat, lon):
        for c in self.countries:
            w, s, e, n = c['bbox']
            if w <= lon <= e and s <= lat <= n and contains(c['geometry'], lat, lon):
                return c
        return None

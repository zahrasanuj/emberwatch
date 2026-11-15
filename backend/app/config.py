import os
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / 'data'
RAW_DATA_DIR = DATA_DIR / 'raw'
PROCESSED_DATA_DIR = DATA_DIR / 'processed'
CACHE_DATA_DIR = DATA_DIR / 'cache'

def load_env_file():
    env_file = BASE_DIR / '.env'
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and (not line.startswith('#')) and ('=' in line):
                    key, val = line.split('=', 1)
                    os.environ.setdefault(key.strip(), val.strip())
load_env_file()
FIRMS_MAP_KEY = os.environ.get('FIRMS_MAP_KEY', 'd6bd75be3589768e1c8cec8bfe261307')
HOST = os.environ.get('HOST', '127.0.0.1')
PORT = int(os.environ.get('PORT', '8000'))
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
for d in [DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, CACHE_DATA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

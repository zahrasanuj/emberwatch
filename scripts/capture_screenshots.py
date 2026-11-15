import subprocess
import os
import time
import tempfile
import shutil

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT_DIR = r"C:\Users\zahra\.gemini\antigravity\brain\f90c6747-ebec-4064-a4df-5578b5988e51"
os.makedirs(OUT_DIR, exist_ok=True)

targets = [
    {
        "name": "screen_10_heatmap_live_both_1440.png",
        "url": "http://127.0.0.1:5173/?page=map&heatmap=both&settings=open",
        "width": 1440,
        "height": 900
    },
    {
        "name": "screen_11_heatmap_pure_dark_1440.png",
        "url": "http://127.0.0.1:5173/?page=map&heatmap=heatmap&theme=dark",
        "width": 1440,
        "height": 900
    },
    {
        "name": "screen_12_data_integrity_light_1440.png",
        "url": "http://127.0.0.1:5173/?page=map&view=data-integrity",
        "width": 1440,
        "height": 900
    },
    {
        "name": "screen_13_data_integrity_dark_1440.png",
        "url": "http://127.0.0.1:5173/?page=map&view=data-integrity&theme=dark",
        "width": 1440,
        "height": 900
    },
    {
        "name": "screen_14_data_status_firms_avail_1440.png",
        "url": "http://127.0.0.1:5173/?page=map&view=data-status",
        "width": 1440,
        "height": 900
    },
    {
        "name": "screen_15_fingerprint_light_1440.png",
        "url": "http://127.0.0.1:5173/?page=map&region=california&view=fingerprint",
        "width": 1440,
        "height": 900
    },
    {
        "name": "screen_16_anomaly_radar_1440.png",
        "url": "http://127.0.0.1:5173/?page=map&region=california&view=anomaly",
        "width": 1440,
        "height": 900
    },
    {
        "name": "screen_17_region_dashboard_verify_1440.png",
        "url": "http://127.0.0.1:5173/?page=map&region=california",
        "width": 1440,
        "height": 900
    },
    {
        "name": "screen_18_heatmap_mobile_390.png",
        "url": "http://127.0.0.1:5173/?page=map&heatmap=both",
        "width": 390,
        "height": 844
    },
    {
        "name": "screen_19_drawer_navigation_1440.png",
        "url": "http://127.0.0.1:5173/?page=map&drawer=open",
        "width": 1440,
        "height": 900
    }
]

for t in targets:
    out_path = os.path.join(OUT_DIR, t["name"])
    temp_dir = tempfile.mkdtemp(prefix="chrome_shot_")
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--user-data-dir={temp_dir}",
        f"--screenshot={out_path}",
        f"--window-size={t['width']},{t['height']}",
        "--virtual-time-budget=4000",
        t["url"]
    ]
    print(f"Capturing {t['name']} at {t['width']}x{t['height']} from {t['url']}...")
    try:
        res = subprocess.run(cmd, timeout=16, capture_output=True)
        if os.path.exists(out_path):
            size = os.path.getsize(out_path)
            print(f"  -> Generated {t['name']}: {size:,} bytes")
        else:
            print(f"  -> FAILED to create {t['name']}")
    except Exception as e:
        print(f"  -> Error capturing {t['name']}: {e}")
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass

print("All captures completed.")

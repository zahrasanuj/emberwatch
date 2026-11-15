# EMBERWATCH: Satellite Burning-Activity Intelligence Platform

> **Predict. Detect. Prepare.**  
> Harmonising 20+ years of NASA MODIS (2000–present) and VIIRS (2012–present) active fire detections into one continuous, physically consistent burning activity calendar, paired with climatological anomaly detection, predictive quantile forecasting, explainability, and operational preparedness guidance.

---

## 🛰️ System Architecture

```
                                  EMBERWATCH ARCHITECTURE
                                  
 +-----------------------+        +------------------------+
 |    NASA FIRMS API     |        |    Open-Meteo ERA5     |
 | (MODIS Terra/Aqua SP) |        | (Historical Archive &  |
 | (VIIRS SNPP/NOAA NRT) |        | Forecast Daily Weather)|
 +-----------+-----------+        +------------+-----------+
             |                                 |
             +----------------+----------------+
                              |
                              v
             +---------------------------------+
             |   EmberWatch Ingest Pipeline    |
             |   - Chunked Resumable Ingest    |
             |   - Raw CSV Disk Cache          |
             +----------------+----------------+
                              |
                              v
             +---------------------------------+
             |   DuckDB Harmonisation Engine   |
             |   - 0.1° Fire-Active Cell-Days  |
             |   - Multi-Sensor De-duplication |
             |   - Overlap Ratio Calibration   |
             |   - Parquet Columnar Storage    |
             +----------------+----------------+
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
+-----------------+   +-----------------+   +------------------+
| Robust Anomaly  |   | Quantile Model  |   | Fire Memory &    |
| Radar (MAD/IQR) |   | (7/14/30d Strip)|   | What-If Engine   |
+--------+--------+   +-------+---------+   +--------+---------+
         |                    |                      |
         +--------------------+----------------------+
                              |
                              v
             +---------------------------------+
             |    FastAPI REST Backend (8000)  |
             |    - Rate Limiting (120 req/m)  |
             |    - Bounded Input Validation   |
             +----------------+----------------+
                              |
                              v
             +---------------------------------+
             | React 19 + TypeScript Frontend  |
             | - MapLibre GL JS (CARTO Basemap)|
             | - Recharts & Zustand Store      |
             | - Frosted Glass & Dark/Light    |
             +---------------------------------+
```

---

## ⚡ Features Overview

1. **Global Fire Map (Live)**: Free CARTO vector/raster styles (Positron & Dark Matter). WebGL rendering of active hotspots with 24h / 48h / 7d temporal filters, FRP vs Sensor color coding, click inspection popups, and a 0.25° spatial elevated burning probability grid layer.
2. **Burning Activity Calendar**: Multi-decadal GitHub-style heatmap (years as rows, months/days as columns) displaying harmonised fire-active cell-days with instant toggle between **Harmonised**, **MODIS-Only**, and **VIIRS-Only** views.
3. **Burning Fingerprint**: 12-month climatological seasonal profile, peak month, season boundaries, inter-annual consistency correlation score ($r$), most active weekday distribution, and side-by-side comparative profiling against any other preset region.
4. **Fire Anomaly Radar**: Compares rolling 30-day activity against the multi-decadal baseline for the identical calendar window using Median Absolute Deviation (MAD) robust z-scores and percentile ranking. Generates plain-English climatological interpretations.
5. **What Changed? Timeline**: Year playhead slider from 2000 to present updating annual aggregates, accompanied by period-over-period comparisons (2003–2013 vs 2014–2024) and sensor transition warnings.
6. **Predictive Burning Calendar**: Quantile regression forecast (p10, p50, p90) predicting expected burning activity for 7, 14, and 30-day horizons. Features a 4-week rolling outlook strip labeled Below Normal / Normal / Elevated / High with exceedance probabilities ($P(Y > Q_{75})$).
7. **Model Card & Skill Evaluation**: Out-of-sample chronological test set evaluation metrics (MAE, RMSE, Brier Score) currently unavailable until verified historical training windows are ingested.
8. **Fire Memory (Historical Similarity Search)**: 7-dimensional condition vector search finding analogous historical episodes in the same region under a strict **different-year constraint**, complete with sparklines and subsequent 30-day fire trajectories.
9. **What-If? Climate Simulator**: Interactive sliders for temperature offsets, precipitation changes, humidity offsets, and wind perturbations to explore atmospheric forcing elasticity.
10. **Explainable AI (SHAP)**: Decomposes forecast drivers into directional contributions with plain-English rationales.
11. **Response Readiness Window**: 12-month vigilance calendar paired with phased, domain-specific action protocols (Monitoring frequency, Response plans, Inter-agency communications, Resource staging, Public-safety messaging, Smoke/air-quality advisories).
12. **One-Click Printable Briefing Sheet**: Generates high-contrast printable/PDF situational briefings with official disclaimers.
13. **Sensor Trust & Data Confidence Panel**: Audits temporal completeness, overlap cross-calibration ($R^2$), and constellation milestones with an objective High/Medium/Low confidence rating.
14. **Explore a Fire Scenario**: Guided 7-step narrative walkthrough reconstructing historic conflagrations with out-of-sample backtests and preparedness audits.

---

## 🌍 The 6 Preset Regions

- **California, USA**: Mediterranean chaparral & pine conifer forests, autumnal Diablo/Santa Ana wind conflagrations (Peak: Aug–Nov).
- **Amazonas & Pará, Brazil**: Tropical rainforest and Arc of Deforestation agricultural clearing (Peak: Aug–Oct).
- **Punjab, India**: Intensive post-monsoon paddy stubble burning and pre-monsoon wheat clearing (Peak: Oct–Nov & Apr–May).
- **Victoria & NSW, Australia**: Temperate eucalyptus sclerophyll forests, Black Summer megadrought extremes (Peak: Dec–Feb).
- **Central Africa Savanna (DRC / Zambia)**: Miombo woodland pastoralist and savanna burning (Peak: Jun–Aug).
- **Portugal & Western Spain (Iberia)**: Atlantic/Mediterranean pine and eucalyptus plantations subject to Iberian heat domes (Peak: Jul–Sep).

---

##  Quickstart & Run Instructions

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ & npm

### 2. Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `FIRMS_MAP_KEY` is present in `.env`:
```ini
FIRMS_MAP_KEY=d6bd75be3589768e1c8cec8bfe261307
HOST=127.0.0.1
PORT=8000
DATA_DIR=data
```

### 3. Start Backend Server
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 4. Start Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173` in your browser.

---

##  Testing & Verification

Run the unit test suite:
```bash
# Test Harmonisation Engine & 0.1° Cell-Days Deduplication
python -m unittest tests/test_harmonisation.py

# Test Robust Anomaly Radar & MAD Z-Scores
python -m unittest tests/test_anomaly.py

# Run Out-of-Sample Predictive Model Backtest Validation
python scripts/backtest.py
```

Run manual or scheduled data ingestion:
```bash
python scripts/ingest.py --region california --start 2024-08-01 --end 2024-08-20
```

---

##  Security & Provenance
- Bounding box dimension guards prevent compute exhaustion ($< 30^\circ \times 30^\circ$).
- Rate limiting restricts requests to 120 calls/minute per IP.
- All numbers trace directly to real NASA FIRMS and Open-Meteo ERA5 observations.

---

## Further Scientific Documentation
- Detailed sensor harmonization method: [docs/harmonisation.md](docs/harmonisation.md)
- Data provenance and operational caveats: [docs/methods-and-limitations.md](docs/methods-and-limitations.md)

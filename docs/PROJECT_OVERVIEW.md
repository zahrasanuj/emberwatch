# EMBERWATCH: Planetary Fire Intelligence Platform
### Scientific Architecture, Technical Methodology, and Global Significance

---

## 1. Executive Summary

Wildfires have emerged as one of the most volatile and destructive symptoms of global climate instability. Across boreal forests, Mediterranean chaparral, temperate rainforests, and tropical peatlands, wildfire seasons are starting earlier, burning longer, and generating unprecedented fire radiative power (FRP). 

**EmberWatch** is an enterprise-grade planetary fire intelligence and wildfire analytics platform designed to solve the critical data integrity, sensor calibration, and transparency problems that plague modern wildfire dashboards. Built on 26 years of continuous NASA Earth observation satellite observations (2000-2026) coupled with high-resolution atmospheric reanalysis and atmospheric chemistry models, EmberWatch delivers a scientifically sound, zero-hallucination operating picture of global fire activity.

Rather than relying on opaque black-box machine learning that hallucinates fire perimeters or misleads responders with uncalibrated raw hotspot counts, EmberWatch applies physical satellite sensor harmonisation, strict spatial gridding (Fire-Active Cell-Days), verifiable data provenance, and multi-system environmental impact evaluation.

---

## 2. Global Significance: Why EmberWatch Matters

### 2.1 The Crisis of Planetary Fire Regimes
Over the past two decades, wildfires have transitioned from localized ecological renewal events to global atmospheric and humanitarian disasters:
- **Peatland & Permafrost "Zombie" Fires:** High-latitude boreal and sub-arctic peat fires smoulder underground throughout the winter beneath snow cover, releasing gigatonnes of ancient carbon reserves ($CO_2$, $CH_4$) and toxic mercury.
- **Stratospheric Smoke Injection:** Extreme pyrocumulonimbus (pyroCb) convective storms inject smoke plumes and black carbon into the stratosphere, altering planetary albedo and damaging the ozone layer.
- **Transboundary Public Health Emergencies:** Wildfire smoke plumes laden with fine particulate matter ($PM_{2.5}$) travel thousands of kilometres across state and international borders, degrading air quality for hundreds of millions of people and driving surges in asthma, cardiovascular mortality, and healthcare expenditure.
- **Extreme Fire Weather Amplification:** Deepening vapor pressure deficits (VPD) and prolonged rainfall deficits desiccate heavy forest fuels (100-hour and 1000-hour dead fuels), priming biomes for catastrophic ignition.

### 2.2 The "Sensor Shift Fallacy" in Modern Dashboards
A pervasive flaw across nearly all public and commercial wildfire tracking applications is the **Sensor Comparability Problem**:
- In 2000, NASA launched the **MODIS** instrument aboard the Terra and Aqua satellites, providing active fire monitoring at a nadir spatial resolution of **1,000 metres (1 km)**.
- In 2012, NASA and NOAA launched the **VIIRS** instrument aboard the Suomi-NPP, NOAA-20, and NOAA-21 satellites, offering active fire imaging at **375 metres** resolution.
- The spatial area of a VIIRS 375 m pixel is approximately **one-seventh** that of a 1 km MODIS pixel ($0.14\text{ km}^2$ versus $1.0\text{ km}^2$). As a result, VIIRS detects substantially smaller, lower-intensity ground fires, and a single fire front that appeared as 1 or 2 MODIS pixels commonly registers as 10 to 25 contiguous VIIRS detections.
- **The Pitfall:** When naive platforms concatenate raw MODIS records (2000-2011) with raw VIIRS records (2012-present), the resulting time series exhibits an artificial $+300\%$ to $+600\%$ spike in fire counts. This artifact corrupts climate trend analysis, invalidates machine learning models, and creates false panics in public reporting.

EmberWatch is the first open platform to implement an end-to-end **Multi-Decadal Harmonisation Engine**, bridging MODIS and VIIRS data across 26 years into a single, standardized, and cross-calibrated metric: **Harmonised 0.1-Degree Fire-Active Cell-Days**.

### 2.3 The Zero-Hallucination Standard
In high-stakes emergency management and climate science, false precision is dangerous. EmberWatch enforces strict data integrity rules:
- **No Mock or Interpolated Data:** When satellite coverage is hindered by cloud decks or when historical data is absent, the system explicitly reports "No Data" or "Unknown" rather than generating synthetic fill.
- **Interactive Verification Drawer:** Every KPI, trend metric, and percentile figure on the platform features a "Verify this number" action. Clicking it opens a verification slide-out presenting the underlying SQL query, raw parquet data rows, satellite sensor names, temporal bounding window, and an independent recomputation script.
- **Distinction Between Satellite FRP and Energy Recovery:** The platform explicitly separates Fire Radiative Power (radiative heat emitted into space) from usable mechanical or thermal energy, preventing misleading claims regarding wildfire energy capture.

---

## 3. Data Feeds and Upstream Architecture

EmberWatch synthesizes multi-terabyte observational records from premier international scientific agencies into a high-performance, real-time analytics pipeline:

```
+---------------------------------------------------------------------------------------+
|                                  UPSTREAM DATA FEEDS                                  |
+---------------------------+-------------------------------+---------------------------+
| NASA FIRMS Active Fires   | Open-Meteo ERA5 Reanalysis    | Open-Meteo CAMS Quality   |
| - MODIS (Terra / Aqua)    | - 2m Temperature & Dewpoint   | - Surface PM2.5 now       |
| - VIIRS (S-NPP, N20, N21) | - Relative Humidity & VPD     | - 3-day forecast          |
| - FRP (MW), Scan / Track  | - 10m Wind Speed & Gusts      | - WHO threshold tags      |
| - Confidence & Flags      | - 30-day cumulative precip    |                           |
+---------------------------+-------------------------------+---------------------------+
                                          |
                                          v
+---------------------------------------------------------------------------------------+
|                          EMBERWATCH CORE PROCESSING ENGINE                            |
+---------------------------------------------------------------------------------------+
| - 0.1° and 0.25° Spatial Cell Gridding (Cell Centroid Quantization)                   |
| - Intra-Day Constellation Deduplication (Terra + Aqua, S-NPP + N20 + N21)             |
| - Quantile Mapping Calibration across Overlap Period (2012-2026)                      |
| - Structural Changepoint Auditing & Sensor Break Detection                            |
| - Stationary vs. Transient Heat Source Inference (0.01° spatial recurrence)           |
| - DuckDB Vectorized Parquet Storage & Query Engine                                    |
+---------------------------------------------------------------------------------------+
                                          |
                                          v
+---------------------------------------------------------------------------------------+
|                          EMBERWATCH USER INTERFACES                                   |
+-----------------------------+-----------------------------+---------------------------+
| Minimalist Landing Portal   | Interactive Map Canvas      | Analytics Workspace       |
| - Instant Omnibox (Ctrl+K)  | - MapLibre GL Vector Engine | - 13 telemetry modules    |
| - Clean Centered Layout     | - Draggable / Resizable UI  | - Multi-decadal matrix    |
| - One-Click Global Access   | - FRP Impact Knowledge Base | - Analog search engine    |
+-----------------------------+-----------------------------+---------------------------+
```

### 3.1 NASA FIRMS (Fire Information for Resource Management System)
- **MODIS (Moderate Resolution Imaging Spectroradiometer):** Onboard NASA Terra (10:30 AM/PM local equator crossing) and Aqua (01:30 AM/PM local equator crossing). Provides continuous thermal infrared coverage ($4\,\mu\text{m}$ and $11\,\mu\text{m}$) from 2000 to the present at 1 km nadir resolution.
- **VIIRS (Visible Infrared Imaging Radiometer Suite):** Onboard Suomi-NPP, NOAA-20, and NOAA-21. Features high-sensitivity 375 m I-band channels capable of detecting small fires and piercing light haze.
- **Fire Radiative Power (FRP):** Measures instantaneous radiant heat output in Megawatts (MW), providing a physical proxy for fuel consumption rates and smoke emission volume.

### 3.2 Atmospheric Dynamics (Open-Meteo ERA5 & Forecasts)
- **Vapor Pressure Deficit (VPD):** Calculated from 2-metre air temperature and dew point, representing atmospheric evaporative demand. High VPD strongly correlates with rapid fire spread rates.
- **30-Day Precipitation Deficit:** Serves as a physics-grounded proxy for deep fuel dryness (100-hour and 1000-hour dead fuels), replacing high-latency satellite vegetation indices.
- **Wind Speed and Maximum Gusts:** 10-metre wind velocities critical for spotting distance and fire run prediction.

### 3.3 Atmospheric Chemistry (Open-Meteo CAMS Air Quality)
- **Fine Particulate Matter ($PM_{2.5}$):** Real-time ground-level concentrations and 72-hour forward forecasts from the Copernicus Atmosphere Monitoring Service (CAMS), classified into World Health Organization (WHO) exposure categories (Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy, Very Unhealthy, Hazardous).

### 3.4 Geographic & Biome Baselines
- **Natural Earth Geometries:** Global administrative boundaries, sovereign territories, and standardized regional polygons.
- **Boreal & Peatland Ecoregion Overlays:** Coarse biome classifications used to dynamically contextualize fire impacts on cryosphere albedo and permafrost stability.

---

## 4. Key Methodologies and Scientific Innovations

### 4.1 The 6-Step Multi-Decadal Harmonisation Pipeline
To establish a statistically consistent 2000-2026 climate baseline, EmberWatch processes raw satellite telemetry through a deterministic six-stage pipeline:
1. **Ingestion & Quality Filtering:** Filters out low-confidence detections (MODIS confidence $< 30$; VIIRS confidence flagged as 'low') and solar glare anomalies.
2. **Standardized 0.1-Degree Spatial Gridding:** Maps continuous latitude and longitude coordinates into fixed $0.1^\circ \times 0.1^\circ$ geographic grid cells.
3. **Intra-Day Constellation Deduplication:** Collapses multiple satellite overpasses within a 24-hour window (e.g. Terra morning pass + Aqua afternoon pass) into a single unified binary metric: the **Fire-Active Cell-Day**. This prevents satellite constellation upgrades from falsely inflating fire counts.
4. **Overlap Period Calibration Mapping:** For the 2012-2026 overlapping epoch where both MODIS and VIIRS operate concurrently, computes per-region, per-month empirical calibration ratios ($k_{r,m} = \text{median}(\text{MODIS} / \text{VIIRS})$), mapping high-resolution VIIRS cell-days into standardized MODIS-equivalent baselines.
5. **Structural Break Detection:** Monitors known satellite timeline milestones (2002 Aqua launch, 2012 VIIRS launch, 2018 NOAA-20 addition) using changepoint detection to flag false trend shifts.
6. **Region Data Confidence Scoring:** Computes completeness ratios, overlap $R^2$ correlation, and temporal coverage to assign transparent Data Confidence Badges (High, Medium, Low).

### 4.2 Environmental Impact Knowledge Base & FRP Classification
EmberWatch categorizes fire thermal intensity according to validated project thresholds:
- **Extreme ($> 50\text{ MW}$):** Massive crown fires, firestorms, industrial gas flares, and active volcanic rifts. Causes stratospheric smoke injection, black carbon deposition on snow/ice (lowering planetary albedo), severe soil sterilization, and post-fire debris flows.
- **High ($15 - 50\text{ MW}$):** Large landscape fires, peatland deforestation fronts, and industrial clusters. Drives rapid carbon sink loss, heavy nutrient runoff into river systems, and severe regional smog.
- **Moderate ($5 - 15\text{ MW}$):** Seasonal savanna fires, controlled rangeland burning, and agricultural crop residue clearing. Contributes to chronic seasonal haze, topsoil nutrient depletion, and photochemical smog.
- **Low or Smouldering ($< 5\text{ MW}$):** Underground coal seam fires, Arctic "zombie" peat fires, and residual smouldering logs. Produces dangerous ground-level emissions (carbon monoxide, methane, mercury, polycyclic aromatic hydrocarbons) and risks delayed seasonal re-ignition.

### 4.3 Stationary vs. Transient Heat Source Inference
Not all thermal hotspots are wildfires. Gas flaring in oil fields and volcanic vents often trigger false wildfire alarms. EmberWatch inspects spatial recurrence at $0.01^\circ$ resolution across a 12-month trailing window:
- If a coordinate exhibits detections on **60 or more separate days** per year, with a significant nighttime share, it is flagged as:
  `Likely stationary heat source (persistent detections)`.
- Otherwise, it is designated as:
  `Likely transient fire (seasonal or episodic)`.
Every designation displays observed supporting evidence (number of detection days and night fraction) accompanied by clear scientific caveats.

### 4.4 Multi-Decadal Burning Activity Calendar
The analytics dashboard features an interactive 26-year matrix (2000-2026) breaking down monthly cell-days for any chosen region. Users can toggle between **Harmonised**, **MODIS**, and **VIIRS** views with instantaneous quantile binning, allowing climatologists and emergency planners to visually spot shifts in fire season start, peak, and duration over quarter of a century.

### 4.5 Fire Memory Analog Search Engine
When evaluating current fire risk in a region, EmberWatch calculates a multi-dimensional feature vector combining 30-day precipitation deficit, vapor pressure deficit, temperature anomaly, and current cell-day counts. The Fire Memory engine scans the historical 26-year archive to surface the top three closest historical analog years, empowering incident commanders with concrete precedent for how similar seasons evolved.

---

## 5. Technology Stack and Engineering Architecture

| Layer | Technologies | Role & Implementation Details |
|---|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite | Fast client-side rendering with strict type safety and sub-second bundle builds. |
| **Spatial Mapping Canvas** | MapLibre GL, Deck.gl, GeoJSON | Hardware-accelerated WebGL vector rendering of global active hotspots, clusters, and terrain. |
| **Styling & Design System** | Tailwind CSS, Custom CSS Variables | High-contrast, off-white editorial aesthetic (`--bg`, `--surface`, `--border`, `--text`), dark mode support. |
| **Animation & Motion** | Framer Motion | Smooth 60fps transitions, respecting `prefers-reduced-motion` settings. |
| **Window Management** | Custom Draggable / Resizable Window Engine | Floating glass surfaces that initialize on the left side of the screen and support unrestricted dragging, resizing, minimizing, and maximizing across the map canvas. |
| **Data Visualizations** | Recharts, Custom SVG Grids | Responsive anomaly bar charts, 26-year matrix heatmaps, and air quality gauges. |
| **Iconography & Fonts** | Lucide React, Geist Mono, Inter | Clean typographic hierarchy with monospace data callouts for coordinates, timestamps, and Megawatt values. |
| **Backend API Server** | Python 3.12, FastAPI, Uvicorn | Asynchronous REST endpoints serving spatial queries, regional rankings, weather telemetry, and verification logs. |
| **High-Performance Storage** | DuckDB, PyArrow, Apache Parquet | Columnar spatial database executing vectorized SQL queries across partitioned 0.1° and 0.25° grid files in milliseconds without requiring heavy relational database instances. |
| **Audit & Verification** | Python `unittest`, Custom Verifier Scripts | Automated test suites auditing row counts, timestamp integrity, sensor tags, and lack of synthetic interpolation. |

---

## 6. User Experience Design Principles

1. **Focused Landing Experience:** A clean, centered welcome portal inspired by modern search interfaces. Users are greeted with the EmberWatch emblem, the "Predict. Detect. Prepare." ethos, an interactive omnibox with keyboard shortcuts (`Ctrl+K`), and a direct call to action to launch the planetary map.
2. **Flexible Canvas Ergonomics:** Map analytical panels (Planetary Fire Activity and Environmental Impact) default to non-overlapping positions on the right side of the viewport, preserving an unobstructed view of global fire activity while allowing users to freely drag, reposition, or resize windows anywhere across the screen.
3. **Ergonomic Shortcuts:** 
   - `Ctrl+K`: Global location search.
   - `I`: Toggle Insights / Planetary Fire Activity panel.
   - `E`: Toggle Environmental Impact panel.
   - `Esc`: Dismiss drawers, search dropdowns, and modals.
4. **Accessible Micro-Copy:** Eliminates ambiguous punctuation such as em-dashes across the platform, maintaining concise, unambiguous technical documentation and clear provenance notices.

---

## 7. Real-World Applications and Stakeholder Utility

### 7.1 Wildfire Incident Command and First Responders
- Rapidly ascertain whether an emerging detection is a transient landscape fire or a stationary flare.
- Check 30-day dryness proxies and local wind conditions before dispatching ground crews.
- Reference historical analog seasons to anticipate fire behavior over the following two to four weeks.

### 7.2 Public Health and Municipal Authorities
- Monitor real-time CAMS surface $PM_{2.5}$ plumes alongside satellite fire detections.
- Issue timely air quality advisories based on WHO hazard categories before smoke reaches vulnerable urban centers.

### 7.3 Climate Scientists and Environmental Researchers
- Access 26 years of harmonised fire activity records free from artificial sensor transition spikes.
- Evaluate the impact of climate change on fire season duration across diverse biomes.
- Audit every data point down to raw satellite coordinates, confidence ratings, and SQL queries.

### 7.4 Industrial Safety and Policy Regulators
- Identify recurring stationary flaring sites and quantify persistent thermal emissions.
- Explore reported response options (e.g. flare gas recovery units, organic Rankine cycle waste-heat recovery, and fuel load reduction) without speculative energy generation claims.

---

## 8. Conclusion

EmberWatch bridges the gap between raw orbital astrophysics and ground-level planetary stewardship. By marrying 26 years of NASA satellite observations with rigorous statistical harmonisation, high-resolution meteorological models, and an uncompromising commitment to transparent, zero-hallucination data integrity, EmberWatch equips scientists, emergency managers, and citizens with the truthful intelligence required to predict, detect, and prepare for wildfires in a changing climate.

# EMBERWATCH: Scientific Harmonisation Engine Specification

## 1. Executive Summary & Problem Formulation
The NASA Fire Information for Resource Management System (FIRMS) delivers near-real-time and archive active fire detections derived from moderate-resolution polar-orbiting imaging spectroradiometers:
- **MODIS** (Moderate Resolution Imaging Spectroradiometer) aboard NASA Terra (1999–present, 10:30 AM/PM overpass) and Aqua (2002–present, 01:30 AM/PM overpass) with **1,000 m (1 km)** nadir pixel resolution in thermal channels ($4\,\mu\text{m}$ and $11\,\mu\text{m}$).
- **VIIRS** (Visible Infrared Imaging Radiometer Suite) aboard Suomi-NPP (2012–present), NOAA-20 (2018–present), and NOAA-21 (2023–present) with **375 m** I-band active fire pixel resolution ($I_4$ and $I_5$).

### The Sensor Comparability Problem
Raw hotspot counts between MODIS and VIIRS are **physically and statistically non-comparable**. The spatial footprint of a VIIRS 375 m pixel is approximately **one-seventh** that of a 1 km MODIS pixel ($\approx 0.14\,\text{km}^2$ vs $1.0\,\text{km}^2$). Consequently:
1. VIIRS detects small, low-intensity flaming fronts (e.g., understory burns, agricultural residue) undetected by MODIS.
2. A single continuous wildfire that registers as 1 or 2 MODIS pixels frequently fragments into 10–25 contiguous VIIRS detections.
3. Simply concatenating MODIS (2000–2011) with VIIRS (2012–present) creates a catastrophic artificial upward trend of $+300\%$ to $+600\%$ that corrupts decadal trend detection, machine learning models, and emergency management baselines.

---

## 2. The 6-Step EmberWatch Harmonisation Pipeline

```
  +-----------------------------------------------------------+
  | 1. Ingestion & Quality Filtering                          |
  |    - Drop MODIS confidence < 30                           |
  |    - Drop VIIRS confidence 'l' (low)                      |
  +-----------------------------+-----------------------------+
                                |
                                v
  +-----------------------------------------------------------+
  | 2. Standardized 0.1-Degree Spatial Gridding               |
  |    - Map continuous coordinates to 0.1° cell centroids    |
  |    - Cell ID: floor(lat * 10)/10, floor(lon * 10)/10      |
  +-----------------------------+-----------------------------+
                                |
                                v
  +-----------------------------------------------------------+
  | 3. Intra-Day Constellation De-Duplication                 |
  |    - Deduplicate multiple passes (Terra + Aqua)           |
  |    - Deduplicate multiple VIIRS (S-NPP + NOAA-20 + N-21)  |
  |    - Define primary unit: Fire-Active Cell-Day            |
  +-----------------------------+-----------------------------+
                                |
                                v
  +-----------------------------------------------------------+
  | 4. Overlap Period (2012–Present) Calibration Mapping      |
  |    - Calculate per-region, per-month empirical ratio:     |
  |      k_{r,m} = median(MODIS_cell_days / VIIRS_cell_days)  |
  |    - Scale VIIRS into MODIS-equivalent units:             |
  |      C_harm = C_viirs * k_{r,m}                           |
  +-----------------------------+-----------------------------+
                                |
                                v
  +-----------------------------------------------------------+
  | 5. Known Timeline & Structural Break Detection            |
  |    - Audit 2002 (Aqua), 2012 (VIIRS), 2018 (NOAA-20)      |
  |    - Flag statistical changepoints on annual aggregates   |
  +-----------------------------+-----------------------------+
                                |
                                v
  +-----------------------------------------------------------+
  | 6. Region Data Confidence Record                          |
  |    - Audit completeness, overlap R^2, sensor timeline     |
  |    - Assign High / Medium / Low quality badge             |
  +-----------------------------------------------------------+
```

### Step 1: Schema Normalisation & Low-Confidence Filtering
Raw detection feeds are ingested into DuckDB. Low-confidence detections are pruned:
$$\text{Filter}_{\text{MODIS}}: \text{confidence} \ge 30$$
$$\text{Filter}_{\text{VIIRS}}: \text{confidence} \in \{\text{'nominal'}, \text{'high'}\}$$

### Step 2 & 3: The 0.1° "Fire-Active Cell-Day" Metric
Instead of counting raw pixels, the landscape is partitioned into a fixed $0.1^\circ \times 0.1^\circ$ geographic grid ($\approx 11\,\text{km} \times 11\,\text{km}$ at the equator). 

A **Fire-Active Cell-Day** is defined as binary indicator:
$$\mathbf{1}_{\text{active}}(c, d) = \begin{cases} 1 & \text{if at least 1 validated detection in cell } c \text{ on day } d \\ 0 & \text{otherwise} \end{cases}$$

**Why this works scientifically:**
While a flaming perimeter yields 25 VIIRS pixels vs 2 MODIS pixels, both sensors register active burning within the identical $0.1^\circ$ grid cell. Cell-days compress resolution-dependent pixel fragmentation by over **$85\%$**, providing an intrinsically stable physical foundation.

### Step 4: Empirical Overlap Calibration (2012 to Present)
During the concurrent operational overlap period (2012–present), both MODIS and VIIRS observe the exact same Earth targets daily. For each geographic region $r$ and calendar month $m \in \{1,\dots,12\}$:
$$k_{r,m} = \mathrm{median}\left( \frac{C_{\text{MODIS}}(d)}{C_{\text{VIIRS}}(d)} \;\middle|\; d \in \text{Overlap}_{r,m},\, C_{\text{VIIRS}}(d) > 0 \right)$$

For the continuous long-term historical series (2000–present):
- **Pre-2012 Era:** $C_{\text{harmonised}}(d) = C_{\text{MODIS}}(d)$
- **Overlap Era (both present):** $C_{\text{harmonised}}(d) = 0.5 \cdot C_{\text{MODIS}}(d) + 0.5 \cdot \left( C_{\text{VIIRS}}(d) \times k_{r,m} \right)$
- **VIIRS-Only Era / Overpass Gap:** $C_{\text{harmonised}}(d) = C_{\text{VIIRS}}(d) \times k_{r,m}$

### Step 5: Discontinuity Auditing
Known constellation milestones are catalogued:
1. **2002:** Aqua deployment (added 13:30 diurnal peak overpass).
2. **2012:** Suomi-NPP VIIRS deployment (375 m band launch).
3. **2018:** NOAA-20 addition (orbit phased 50 minutes from S-NPP).
4. **2023:** NOAA-21 operational commissioning.

### Step 6: Data Confidence Record
Confidence measures observational completeness and cross-calibration strength ($R^2$), **never hotspot volume**:
- **High:** Complete temporal record ($\ge 90\%$ days), sensor overlap $R^2 \ge 0.80$.
- **Medium:** Minor cloud obscuration gaps or overlap $R^2 \in [0.65, 0.80)$.
- **Low:** Significant observation gaps or sparse satellite revisit geometry.

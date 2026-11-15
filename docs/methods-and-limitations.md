# EMBERWATCH: Methods, Data Provenance & Scientific Limitations

## 1. What Hotspot Counts Are and Are Not
- **Active Fire Hotspots Are NOT Burned Area:** Hotspots represent instantaneous thermal infrared radiation detected at the time of an orbital satellite overpass. A hotspot confirms flaming or smoldering combustion with radiative brightness above ambient thresholds; it does not measure final acreage, burned tree mortality, or soil burn severity.
- **Overpass Sampling Geometry:** Polar-orbiting spacecraft (Terra, Aqua, Suomi-NPP, NOAA-20, NOAA-21) pass over a given region 2 to 4 times every 24 hours. Fast-moving fires that ignite and self-extinguish between overpasses may be under-sampled.
- **Cloud & Pyrocumulus Obscuration:** Heavy overcast cloud decks, dense fog, or thick convective pyrocumulonimbus clouds reflect or attenuate thermal infrared emissions ($4\,\mu\text{m}$), preventing sensor detection during active burning.
- **Canopy Interception:** In dense tropical rainforests (such as the Amazon understory), dense multi-tier canopy cover can absorb low-intensity ground fires, leading to satellite under-detection until fires breach the upper crown.

---

## 2. Atmospheric & Dryness Proxies
- **Rolling Rainfall Deficit Proxy:** In place of high-latency NDVI vegetation datasets, EmberWatch uses Open-Meteo ERA5 30-day cumulative precipitation deficits as a physics-grounded proxy for dead 100-hour and 1000-hour fuel moisture depletion.
- **What-If Sensitivity:** The What-If Climate Simulator runs model perturbations to examine forecast elasticity. It is an explanatory sensitivity tool, not a certified downscaled climate projection.

---

## 3. Machine Learning & Predictive Disclaimers
- **Detectability vs Ignition:** The predictive model forecasts **satellite-detectable burning activity** (active 0.1° cell-days). It does not forecast arson, accidental sparks, lightning discharge points, or individual perimeter coordinates.
There is no validated forecast skill yet; models are unavailable pending verified historical coverage.
- **Emergency Management Notice:** EmberWatch metrics and readiness action checklists are based on historical patterns and predictive models. They do not constitute official emergency evacuation orders or real-time tactical dispatch authorizations.
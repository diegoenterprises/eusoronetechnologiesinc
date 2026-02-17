# Ultimate Crude Oil Specification Guide
## SPECTRA-MATCH™ Reference Database — Eusoro Technologies

> **Version:** 2.0  
> **Last Updated:** February 2026  
> **Classification:** Proprietary — Just Empower LLC / Eusoro Technologies  
> **Purpose:** Primary knowledge base for the SPECTRA-MATCH™ Adaptive Parameter Weighting (APW) algorithm

---

## Table of Contents

1. [Global Benchmark Crudes](#1-global-benchmark-crudes)
2. [OPEC Member Crudes (Daily Pricing)](#2-opec-member-crudes-daily-pricing)
3. [International Crudes by Country](#3-international-crudes-by-country)
4. [Canadian Blends](#4-canadian-blends)
5. [United States Blends by State](#5-united-states-blends-by-state)
6. [OPEC Members (Monthly Pricing)](#6-opec-members-monthly-pricing)
7. [Refined & Non-Crude Products](#7-refined--non-crude-products)
8. [Parameter Definitions & Tolerances](#8-parameter-definitions--tolerances)
9. [Data Source Notes](#9-data-source-notes)

---

## Key

| Abbreviation | Meaning |
|---|---|
| API | API Gravity (°) |
| S% | Sulfur Content (weight %) |
| BS&W | Basic Sediment & Water (volume %) |
| Salt | Salt Content (PTB — Pounds per Thousand Barrels) |
| RVP | Reid Vapor Pressure (psi) |
| PP | Pour Point (°C) |
| FP | Flash Point (°C) |
| Visc | Kinematic Viscosity (cSt @ 40°C unless noted) |
| TAN | Total Acid Number (mg KOH/g) |
| N/A | Data not publicly available or not applicable |
| ~ | Approximate / typical value |

---

## 1. Global Benchmark Crudes

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WTI Crude | 39.6 | 0.24 | <0.5 | 5-10 | 7.0-8.5 | -30 to -24 | -18 to -12 | 3.0-5.0 | 0.04-0.07 | Cushing, Oklahoma, USA | Light Sweet |
| WTI Light | 47.5 | 0.05 | <0.3 | <5 | 8.2 | -30 | -21 | 1.7 | 0.07 | Texas, USA | Extra Light Sweet |
| WTI Midland | 41.0-43.0 | 0.15-0.30 | <0.5 | 5-10 | 7.5-9.0 | -27 to -21 | -18 to -10 | 2.5-4.0 | 0.04-0.08 | Midland, Texas, USA | Light Sweet |
| Brent Crude | 38.0-38.3 | 0.37-0.40 | <0.5 | 5-10 | 6.5-7.5 | -6 to 0 | -10 to -4 | 4.0-6.0 | 0.04-0.10 | North Sea, UK/Norway | Light Sweet |
| Dubai Crude | 30.0-31.0 | 2.00-2.10 | <0.5 | 10-15 | 5.0-6.5 | -15 to -9 | -10 to -4 | 8.0-12.0 | 0.10-0.20 | Dubai, UAE | Medium Sour |
| Murban Crude | 39.0-40.5 | 0.74-0.78 | <0.2 | 3-8 | 6.0-7.5 | -18 to -12 | -15 to -6 | 3.5-5.5 | 0.02-0.05 | Abu Dhabi, UAE | Light Sour |
| OPEC Basket | 30.0-33.0 | 1.20-1.80 | <0.5 | 8-15 | 5.0-7.0 | -15 to -3 | -10 to 0 | 6.0-15.0 | 0.05-0.30 | Various (Composite) | Composite Index |
| DME Oman | 30.5-33.0 | 1.40-1.60 | <0.5 | 8-12 | 5.0-6.5 | -12 to -6 | -8 to 0 | 7.0-11.0 | 0.05-0.15 | Oman | Medium Sour |
| Mexican Basket | 22.0-28.0 | 2.50-3.50 | <1.0 | 15-40 | 4.0-6.0 | -24 to -6 | -5 to 10 | 15.0-150.0 | 0.20-0.50 | Mexico (Composite) | Composite Index |
| Indian Basket | 30.0-35.0 | 1.20-2.00 | <0.5 | 8-15 | 5.5-7.0 | -12 to -3 | -8 to 2 | 5.0-12.0 | 0.05-0.20 | India (Composite) | Composite Index |
| Urals | 31.0-32.0 | 1.20-1.50 | <0.5 | 8-15 | 5.0-6.5 | -18 to -9 | -10 to -2 | 6.0-10.0 | 0.05-0.15 | Russia | Medium Sour |
| Western Canadian Select | 19.0-22.0 | 3.30-3.90 | <0.5 | 20-50 | 2.0-4.0 | -30 to -21 | 5 to 15 | 200-500 | 0.80-1.10 | Hardisty, Alberta, Canada | Heavy Sour |
| Brent Weighted Average | 37.5-38.5 | 0.37-0.42 | <0.5 | 5-10 | 6.5-7.5 | -6 to 0 | -10 to -4 | 4.0-6.5 | 0.04-0.10 | North Sea | Light Sweet |
| Louisiana Light | 35.0-37.0 | 0.20-0.45 | <0.5 | 5-10 | 7.0-8.5 | -18 to -9 | -12 to -4 | 4.0-7.0 | 0.05-0.15 | Louisiana, USA | Light Sweet |
| Domestic Swt. @ Cushing | 40.0-42.9 | 0.30-0.43 | <0.5 | 5-10 | 7.0-9.0 | -24 to -15 | -15 to -8 | 2.5-4.5 | 0.03-0.08 | Cushing, Oklahoma, USA | Light Sweet |
| Giddings | 37.0-40.0 | 0.20-0.35 | <0.5 | 5-10 | 7.0-8.5 | -21 to -12 | -12 to -4 | 3.5-6.0 | 0.03-0.10 | Texas, USA | Light Sweet |
| ANS West Coast | 31.0-32.5 | 0.90-1.00 | <0.5 | 10-18 | 6.0-7.5 | -18 to -9 | -10 to -2 | 7.0-12.0 | 0.10-0.25 | Alaska North Slope, USA | Medium Sour |
| Mars | 28.0-31.0 | 1.80-2.20 | <0.5 | 10-20 | 5.0-6.5 | -15 to -6 | -8 to 2 | 10.0-20.0 | 0.20-0.50 | Gulf of Mexico, USA | Medium Sour |

---

## 2. OPEC Member Crudes (Daily Pricing)

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Iran Heavy | 29.0-31.0 | 1.70-1.90 | <0.5 | 8-15 | 5.0-6.5 | -15 to -6 | -8 to 2 | 8.0-15.0 | 0.10-0.25 | Iran | Medium Sour |
| Saharan Blend | 44.0-46.0 | 0.05-0.10 | <0.2 | 3-6 | 8.0-10.0 | -30 to -21 | -20 to -12 | 2.0-3.5 | 0.02-0.05 | Algeria | Light Sweet |
| Bonny Light | 32.9-37.0 | 0.12-0.16 | <0.3 | 3-8 | 5.5-7.5 | -9 to 4 | -6 to 5 | 4.0-7.0 | 0.10-0.30 | Nigeria | Light Sweet |
| Girassol | 29.0-31.0 | 0.30-0.40 | <0.3 | 5-10 | 4.5-6.0 | -18 to -9 | -8 to 2 | 8.0-15.0 | 0.20-0.40 | Angola | Medium Sweet |
| Arab Light | 32.0-34.0 | 1.70-1.90 | <0.5 | 8-15 | 5.5-7.0 | -30 to -21 | -15 to -6 | 6.0-10.0 | 0.05-0.12 | Saudi Arabia | Medium Sour |
| Kuwait Export Blend | 30.0-31.5 | 2.50-2.70 | <0.5 | 10-20 | 5.0-6.5 | -15 to -6 | -8 to 2 | 8.0-14.0 | 0.08-0.20 | Kuwait | Medium Sour |

---

## 3. International Crudes by Country

### AUSTRALIA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cossack | 48.0-50.5 | 0.01-0.04 | <0.1 | <3 | 8.5-10.0 | -36 to -27 | -25 to -15 | 1.0-2.0 | 0.01-0.03 | NW Shelf, Australia | Extra Light Sweet |
| NWS Condensate | 55.0-60.0 | 0.01-0.02 | <0.1 | <3 | 10.0-12.0 | -45 to -36 | -30 to -20 | 0.5-1.2 | 0.01-0.02 | NW Shelf, Australia | Condensate |
| Ichthys Condensate | 52.0-56.0 | 0.01-0.03 | <0.1 | <3 | 9.0-11.0 | -40 to -30 | -28 to -18 | 0.6-1.5 | 0.01-0.02 | Browse Basin, Australia | Condensate |

### ANGOLA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cabinda | 31.0-33.0 | 0.14-0.20 | <0.3 | 3-8 | 4.5-6.0 | -21 to -12 | -10 to 0 | 6.0-10.0 | 0.10-0.25 | Cabinda, Angola | Medium Sweet |
| Nemba | 37.0-39.5 | 0.18-0.28 | <0.2 | 3-6 | 5.5-7.0 | -24 to -15 | -15 to -6 | 3.5-6.0 | 0.08-0.20 | Offshore Angola | Light Sweet |
| Dalia | 22.0-24.0 | 0.48-0.55 | <0.3 | 5-12 | 3.5-5.0 | -24 to -15 | -5 to 5 | 25.0-50.0 | 0.30-0.60 | Block 17, Angola | Heavy Sweet |

### NIGERIA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Brass River | 40.0-42.5 | 0.06-0.10 | <0.2 | 3-6 | 6.0-8.0 | -15 to -6 | -12 to -4 | 2.5-4.5 | 0.10-0.25 | Niger Delta, Nigeria | Light Sweet |
| Qua Iboe | 35.5-37.5 | 0.10-0.14 | <0.2 | 3-8 | 5.5-7.0 | -12 to -3 | -8 to 2 | 3.5-6.5 | 0.15-0.30 | Akwa Ibom, Nigeria | Light Sweet |

### SAUDI ARABIA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Arab Extra Light | 36.0-40.0 | 0.50-1.30 | <0.3 | 5-10 | 6.0-8.0 | -30 to -18 | -18 to -8 | 3.0-6.0 | 0.02-0.06 | Saudi Arabia | Light Sweet/Sour |
| Arab Light | 32.0-34.0 | 1.70-1.90 | <0.5 | 8-15 | 5.5-7.0 | -30 to -21 | -15 to -6 | 6.0-10.0 | 0.05-0.12 | Ghawar Field, Saudi Arabia | Medium Sour |
| Arab Medium | 28.5-31.0 | 2.40-2.80 | <0.5 | 10-20 | 5.0-6.5 | -21 to -12 | -10 to 0 | 10.0-18.0 | 0.08-0.18 | Saudi Arabia | Medium Sour |
| Arab Heavy | 27.0-29.0 | 2.80-3.20 | <0.5 | 12-25 | 4.5-6.0 | -18 to -9 | -6 to 4 | 14.0-25.0 | 0.10-0.25 | Safaniyah, Saudi Arabia | Heavy Sour |

### IRAQ

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Basrah Heavy | 23.0-24.5 | 3.80-4.20 | <0.5 | 15-30 | 3.5-5.0 | -15 to -6 | -2 to 8 | 30.0-60.0 | 0.15-0.35 | Southern Iraq | Heavy Sour |
| Basrah Medium | 29.0-31.0 | 2.80-3.10 | <0.5 | 10-20 | 4.5-6.0 | -18 to -9 | -8 to 2 | 8.0-15.0 | 0.10-0.25 | Southern Iraq | Medium Sour |

### UAE

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Das | 38.0-40.0 | 1.10-1.40 | <0.3 | 5-10 | 6.0-7.5 | -18 to -9 | -12 to -4 | 3.5-6.0 | 0.02-0.06 | Das Island, Abu Dhabi | Light Sour |
| Umm Lulu | 35.0-38.0 | 1.00-1.30 | <0.3 | 5-10 | 5.5-7.0 | -15 to -6 | -10 to 0 | 4.0-7.0 | 0.03-0.08 | Offshore Abu Dhabi | Light Sour |
| Upper Zakum | 32.0-34.0 | 1.80-2.10 | <0.5 | 8-15 | 5.0-6.5 | -12 to -3 | -6 to 4 | 6.0-11.0 | 0.05-0.15 | Offshore Abu Dhabi | Medium Sour |

### QATAR

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Qatar Marine | 34.0-36.0 | 1.30-1.60 | <0.3 | 5-10 | 5.5-7.0 | -18 to -9 | -12 to -4 | 4.5-7.5 | 0.03-0.08 | Offshore Qatar | Light Sour |
| Qatar Land | 40.0-42.0 | 1.10-1.30 | <0.2 | 3-8 | 6.5-8.0 | -21 to -12 | -15 to -8 | 3.0-5.0 | 0.02-0.05 | Onshore Qatar | Light Sour |
| Al Shaheen | 25.0-28.0 | 2.30-2.70 | <0.5 | 10-18 | 4.0-5.5 | -9 to 0 | -2 to 8 | 15.0-30.0 | 0.10-0.25 | Offshore Qatar | Medium Sour |
| Deodorized Field Condensate | 60.0-65.0 | 0.05-0.15 | <0.1 | <3 | 10.0-13.0 | -50 to -40 | -35 to -25 | 0.4-0.8 | 0.01-0.02 | Qatar | Condensate |
| Low Sulfur Condensate | 62.0-67.0 | 0.02-0.08 | <0.1 | <3 | 10.5-13.5 | -52 to -42 | -38 to -28 | 0.3-0.7 | 0.01-0.02 | Qatar | Condensate |

### ECUADOR

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Oriente Crude | 28.0-30.0 | 0.80-1.00 | <0.5 | 8-15 | 4.5-6.0 | -18 to -9 | -8 to 2 | 9.0-15.0 | 0.10-0.25 | Amazon Region, Ecuador | Medium Sour |
| Napo Crude | 17.0-19.5 | 1.80-2.20 | <0.5 | 15-30 | 3.0-4.5 | -9 to 0 | 5 to 15 | 80.0-200.0 | 0.30-0.60 | Amazon Region, Ecuador | Heavy Sour |

### MEXICO — Deliveries to U.S. Gulf Coast

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Maya (USGC) | 21.0-22.0 | 3.30-3.50 | <1.0 | 20-40 | 3.5-5.0 | -18 to -6 | -2 to 10 | 40.0-100.0 | 0.25-0.50 | Campeche, Mexico → USGC | Heavy Sour |
| Isthmus (USGC) | 32.0-33.0 | 1.70-1.90 | <0.5 | 10-18 | 5.0-6.5 | -21 to -12 | -10 to 0 | 6.0-10.0 | 0.08-0.18 | Veracruz, Mexico → USGC | Medium Sour |
| Olmeca (USGC) | 38.0-39.5 | 0.73-0.95 | <0.3 | 5-10 | 6.0-7.5 | -27 to -18 | -15 to -6 | 3.0-5.5 | 0.03-0.08 | Tabasco, Mexico → USGC | Light Sour |

### MEXICO — Deliveries to U.S. West Coast

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Maya (USWC) | 21.0-22.0 | 3.30-3.50 | <1.0 | 20-40 | 3.5-5.0 | -18 to -6 | -2 to 10 | 40.0-100.0 | 0.25-0.50 | Campeche, Mexico → USWC | Heavy Sour |
| Isthmus (USWC) | 32.0-33.0 | 1.70-1.90 | <0.5 | 10-18 | 5.0-6.5 | -21 to -12 | -10 to 0 | 6.0-10.0 | 0.08-0.18 | Veracruz, Mexico → USWC | Medium Sour |

### MEXICO — Deliveries to the Far East

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Maya (Far East) | 21.0-22.0 | 3.30-3.50 | <1.0 | 20-40 | 3.5-5.0 | -18 to -6 | -2 to 10 | 40.0-100.0 | 0.25-0.50 | Campeche, Mexico → Far East | Heavy Sour |
| Isthmus (Far East) | 32.0-33.0 | 1.70-1.90 | <0.5 | 10-18 | 5.0-6.5 | -21 to -12 | -10 to 0 | 6.0-10.0 | 0.08-0.18 | Veracruz, Mexico → Far East | Medium Sour |

### IRAN — Deliveries to North West Europe

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Iran Light (NWE) | 33.0-34.0 | 1.35-1.50 | <0.5 | 8-15 | 5.5-7.0 | -21 to -12 | -12 to -4 | 5.0-8.0 | 0.05-0.12 | Kharg Island → NW Europe | Medium Sour |
| Iran Heavy (NWE) | 29.0-31.0 | 1.70-1.90 | <0.5 | 8-15 | 5.0-6.5 | -15 to -6 | -8 to 2 | 8.0-15.0 | 0.10-0.25 | Kharg Island → NW Europe | Medium Sour |
| Forozan Blend (NWE) | 29.0-31.5 | 2.30-2.60 | <0.5 | 10-18 | 4.5-6.0 | -12 to -3 | -6 to 4 | 9.0-16.0 | 0.08-0.20 | Kharg Island → NW Europe | Medium Sour |

### IRAN — Deliveries to Mediterranean

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Iran Light (Med) | 33.0-34.0 | 1.35-1.50 | <0.5 | 8-15 | 5.5-7.0 | -21 to -12 | -12 to -4 | 5.0-8.0 | 0.05-0.12 | Kharg Island → Mediterranean | Medium Sour |
| Iran Heavy (Med) | 29.0-31.0 | 1.70-1.90 | <0.5 | 8-15 | 5.0-6.5 | -15 to -6 | -8 to 2 | 8.0-15.0 | 0.10-0.25 | Kharg Island → Mediterranean | Medium Sour |
| Forozan Blend (Med) | 29.0-31.5 | 2.30-2.60 | <0.5 | 10-18 | 4.5-6.0 | -12 to -3 | -6 to 4 | 9.0-16.0 | 0.08-0.20 | Kharg Island → Mediterranean | Medium Sour |
| Soroosh (Med) | 17.0-19.5 | 3.30-3.60 | <0.5 | 15-30 | 3.0-4.5 | -6 to 3 | 5 to 15 | 80.0-200.0 | 0.30-0.60 | Iran → Mediterranean | Heavy Sour |

### IRAN — Deliveries to Sidi Kerir

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Iran Light (Sidi Kerir) | 33.0-34.0 | 1.35-1.50 | <0.5 | 8-15 | 5.5-7.0 | -21 to -12 | -12 to -4 | 5.0-8.0 | 0.05-0.12 | Iran → Sidi Kerir | Medium Sour |
| Iran Heavy (Sidi Kerir) | 29.0-31.0 | 1.70-1.90 | <0.5 | 8-15 | 5.0-6.5 | -15 to -6 | -8 to 2 | 8.0-15.0 | 0.10-0.25 | Iran → Sidi Kerir | Medium Sour |
| Forozan Blend (Sidi Kerir) | 29.0-31.5 | 2.30-2.60 | <0.5 | 10-18 | 4.5-6.0 | -12 to -3 | -6 to 4 | 9.0-16.0 | 0.08-0.20 | Iran → Sidi Kerir | Medium Sour |

### IRAN — Deliveries to South Africa

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Iran Light (S. Africa) | 33.0-34.0 | 1.35-1.50 | <0.5 | 8-15 | 5.5-7.0 | -21 to -12 | -12 to -4 | 5.0-8.0 | 0.05-0.12 | Iran → South Africa | Medium Sour |
| Iran Heavy (S. Africa) | 29.0-31.0 | 1.70-1.90 | <0.5 | 8-15 | 5.0-6.5 | -15 to -6 | -8 to 2 | 8.0-15.0 | 0.10-0.25 | Iran → South Africa | Medium Sour |
| Forozan Blend (S. Africa) | 29.0-31.5 | 2.30-2.60 | <0.5 | 10-18 | 4.5-6.0 | -12 to -3 | -6 to 4 | 9.0-16.0 | 0.08-0.20 | Iran → South Africa | Medium Sour |

### CHINA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Daqing | 32.0-33.0 | 0.08-0.12 | <0.3 | 3-8 | 3.5-5.0 | 27 to 33 | 18 to 28 | 8.0-15.0 | 0.03-0.08 | Daqing, Heilongjiang, China | Medium Sweet (Waxy) |
| Shengli | 23.0-25.0 | 0.70-1.00 | <0.5 | 8-15 | 3.5-5.0 | 18 to 27 | 10 to 20 | 20.0-50.0 | 0.10-0.25 | Shandong, China | Heavy Sour (Waxy) |
| South China Sea | 35.0-38.0 | 0.04-0.08 | <0.2 | 3-6 | 5.5-7.0 | -18 to -9 | -12 to -2 | 3.5-6.5 | 0.02-0.06 | South China Sea | Light Sweet |

### INDONESIA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cinta | 32.0-34.0 | 0.07-0.12 | <0.3 | 3-8 | 4.5-6.0 | 9 to 15 | 5 to 15 | 6.0-10.0 | 0.05-0.12 | Java Sea, Indonesia | Medium Sweet (Waxy) |
| Duri | 20.0-22.0 | 0.16-0.22 | <0.5 | 5-12 | 2.5-4.0 | 33 to 42 | 25 to 35 | 40.0-120.0 | 0.20-0.50 | Sumatra, Indonesia | Heavy Sweet (Waxy) |
| Minas | 34.0-36.0 | 0.05-0.10 | <0.3 | 3-8 | 5.0-6.5 | 33 to 39 | 25 to 33 | 5.0-9.0 | 0.02-0.05 | Sumatra, Indonesia | Light Sweet (Waxy) |

### RUSSIA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sokol | 36.0-38.0 | 0.18-0.25 | <0.2 | 3-6 | 5.5-7.0 | -24 to -15 | -15 to -6 | 3.5-6.0 | 0.02-0.06 | Sakhalin Island, Russia | Light Sweet |

### AZERBAIJAN

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Azeri Light | 34.0-36.0 | 0.15-0.20 | <0.2 | 3-6 | 5.5-7.0 | -15 to -6 | -10 to 0 | 4.0-7.0 | 0.03-0.08 | Caspian Sea, Azerbaijan | Light Sweet |

### BRAZIL

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lula | 28.0-30.0 | 0.30-0.50 | <0.3 | 5-10 | 4.5-6.0 | -15 to -6 | -6 to 4 | 8.0-15.0 | 0.15-0.35 | Santos Basin, Brazil | Medium Sweet |

### KAZAKHSTAN

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CPC Blend | 44.0-47.0 | 0.50-0.60 | <0.2 | 3-8 | 7.5-9.5 | -39 to -30 | -25 to -15 | 1.5-3.0 | 0.02-0.05 | Tengiz/Karachaganak → Novorossiysk | Light Sweet |

---

## 4. Canadian Blends

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Central Alberta | 37.0-39.0 | 0.40-0.60 | <0.5 | 5-10 | 6.0-7.5 | -30 to -21 | -18 to -8 | 3.0-6.0 | 0.04-0.10 | Central Alberta, Canada | Light Sour |
| Light Sour Blend | 34.0-36.0 | 1.20-1.80 | <0.5 | 8-15 | 5.0-6.5 | -27 to -18 | -15 to -6 | 4.0-7.0 | 0.05-0.12 | Alberta, Canada | Light Sour |
| Peace Sour | 33.0-35.0 | 1.80-2.50 | <0.5 | 10-18 | 5.0-6.5 | -27 to -18 | -15 to -6 | 5.0-8.0 | 0.06-0.15 | Peace River, Alberta | Medium Sour |
| Syncrude Sweet Premium | 30.0-33.0 | 0.10-0.20 | <0.2 | <5 | 4.0-5.5 | -40 to -30 | -20 to -10 | 5.0-8.0 | 0.01-0.03 | Fort McMurray, Alberta | Synthetic (Sweet) |
| Sweet Crude | 38.0-40.0 | 0.25-0.45 | <0.3 | 5-10 | 6.5-8.0 | -30 to -21 | -18 to -8 | 3.0-5.5 | 0.03-0.08 | Alberta, Canada | Light Sweet |
| US High Sweet Clearbrook | 38.0-40.5 | 0.20-0.35 | <0.3 | 5-8 | 7.0-8.5 | -30 to -21 | -18 to -8 | 3.0-5.5 | 0.03-0.08 | Clearbrook, Minnesota (Canadian origin) | Light Sweet |
| Midale | 28.5-31.0 | 2.00-2.50 | <0.5 | 10-18 | 4.5-6.0 | -21 to -12 | -10 to 0 | 8.0-14.0 | 0.08-0.18 | Saskatchewan, Canada | Medium Sour |
| Albian Heavy Synthetic | 19.0-21.0 | 0.10-0.20 | <0.2 | <5 | 2.5-4.0 | -30 to -20 | -5 to 5 | 30.0-60.0 | 0.02-0.05 | Fort McMurray, Alberta | Heavy Synthetic |
| Access Western Blend | 20.0-22.0 | 3.50-4.00 | <0.5 | 20-40 | 2.5-4.0 | -30 to -20 | 0 to 10 | 150.0-400.0 | 0.80-1.10 | Alberta, Canada | Heavy Sour (Dilbit) |

---

## 5. United States Blends by State

### ARKANSAS

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Arkansas Sweet | 38.0-41.0 | 0.15-0.30 | <0.5 | 5-10 | 7.0-8.5 | -24 to -15 | -15 to -6 | 3.0-5.5 | 0.03-0.08 | Arkansas, USA | Light Sweet |
| Arkansas Sour | 32.0-35.0 | 1.20-1.80 | <0.5 | 8-15 | 5.5-7.0 | -18 to -9 | -10 to 0 | 5.0-9.0 | 0.05-0.15 | Arkansas, USA | Medium Sour |
| Arkansas Ex Heavy | 14.0-18.0 | 2.50-3.50 | <1.0 | 20-40 | 2.0-3.5 | -3 to 6 | 8 to 18 | 200.0-800.0 | 0.30-0.70 | Arkansas, USA | Extra Heavy Sour |

### TEXAS

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| West Texas Sour | 32.0-34.0 | 1.50-2.00 | <0.5 | 10-18 | 5.5-7.0 | -21 to -12 | -12 to -4 | 5.0-8.0 | 0.05-0.12 | West Texas, USA | Medium Sour |
| West Texas Intermediate | 39.0-40.5 | 0.22-0.30 | <0.5 | 5-10 | 7.0-8.5 | -30 to -24 | -18 to -12 | 3.0-5.0 | 0.04-0.07 | Permian Basin, Texas, USA | Light Sweet |
| Upper Texas Gulf Coast | 35.0-38.0 | 0.20-0.40 | <0.5 | 5-10 | 6.5-8.0 | -21 to -12 | -15 to -6 | 4.0-6.5 | 0.03-0.10 | Upper Texas Gulf Coast, USA | Light Sweet |
| Texas Gulf Coast Light | 38.0-41.0 | 0.15-0.35 | <0.5 | 5-10 | 7.0-8.5 | -24 to -15 | -18 to -8 | 3.0-5.5 | 0.03-0.08 | Texas Gulf Coast, USA | Light Sweet |
| South Texas Sour | 30.0-33.0 | 1.50-2.20 | <0.5 | 10-18 | 5.0-6.5 | -18 to -9 | -10 to 0 | 6.0-10.0 | 0.06-0.15 | South Texas, USA | Medium Sour |
| North Texas Sweet | 37.0-40.0 | 0.20-0.40 | <0.5 | 5-10 | 7.0-8.5 | -24 to -15 | -15 to -6 | 3.5-6.0 | 0.03-0.08 | North Texas, USA | Light Sweet |
| Eagle Ford | 42.0-48.0 | 0.10-0.25 | <0.3 | 3-8 | 8.0-10.0 | -30 to -21 | -21 to -12 | 2.0-4.0 | 0.02-0.06 | Eagle Ford Shale, Texas, USA | Light Sweet |
| Tx. Upper Gulf Coast | 35.0-38.0 | 0.20-0.40 | <0.5 | 5-10 | 6.5-8.0 | -21 to -12 | -15 to -6 | 4.0-6.5 | 0.03-0.10 | Upper Gulf Coast, Texas, USA | Light Sweet |
| South Texas Light | 36.0-39.0 | 0.15-0.35 | <0.5 | 5-10 | 6.5-8.0 | -21 to -12 | -15 to -6 | 3.5-6.0 | 0.03-0.08 | South Texas, USA | Light Sweet |
| W. Tx./N. Mex. Inter. | 37.0-40.0 | 0.30-0.60 | <0.5 | 5-12 | 6.5-8.0 | -24 to -15 | -15 to -6 | 3.5-6.0 | 0.03-0.10 | W. Texas / N. New Mexico, USA | Light Sweet/Sour |
| South Texas Heavy | 24.0-28.0 | 1.80-2.50 | <0.5 | 12-25 | 4.0-5.5 | -12 to -3 | -2 to 8 | 15.0-35.0 | 0.12-0.30 | South Texas, USA | Heavy Sour |
| W. Cen. Tx. Inter. | 35.0-38.0 | 0.40-0.80 | <0.5 | 5-12 | 6.0-7.5 | -21 to -12 | -12 to -4 | 4.0-7.0 | 0.04-0.12 | West Central Texas, USA | Light Sour |
| East Texas Sweet | 38.0-41.0 | 0.25-0.40 | <0.5 | 5-10 | 7.0-8.5 | -24 to -15 | -15 to -6 | 3.0-5.5 | 0.03-0.08 | East Texas, USA | Light Sweet |

### OKLAHOMA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Oklahoma Sweet | 39.0-42.0 | 0.20-0.35 | <0.5 | 5-10 | 7.0-8.5 | -27 to -18 | -18 to -8 | 3.0-5.0 | 0.03-0.07 | Oklahoma, USA | Light Sweet |
| Oklahoma Sour | 33.0-36.0 | 1.20-1.80 | <0.5 | 8-15 | 5.5-7.0 | -21 to -12 | -12 to -4 | 5.0-8.0 | 0.05-0.12 | Oklahoma, USA | Medium Sour |
| Western Oklahoma Swt. | 39.0-42.0 | 0.20-0.35 | <0.5 | 5-10 | 7.0-8.5 | -27 to -18 | -18 to -8 | 3.0-5.0 | 0.03-0.07 | Western Oklahoma, USA | Light Sweet |
| Oklahoma Intermediate | 35.0-38.0 | 0.50-0.90 | <0.5 | 5-12 | 6.0-7.5 | -24 to -15 | -15 to -6 | 4.0-7.0 | 0.04-0.10 | Oklahoma, USA | Light Sour |

### WYOMING

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Wyoming General Sour | 32.0-35.0 | 1.50-2.50 | <0.5 | 10-18 | 5.0-7.0 | -21 to -12 | -12 to -4 | 5.0-9.0 | 0.06-0.15 | Wyoming, USA | Medium Sour |
| Wyoming General Sweet | 38.0-41.0 | 0.15-0.35 | <0.5 | 5-10 | 7.0-8.5 | -27 to -18 | -18 to -8 | 3.0-5.5 | 0.03-0.08 | Wyoming, USA | Light Sweet |

### COLORADO

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Colorado South East | 35.0-39.0 | 0.20-0.45 | <0.5 | 5-10 | 6.5-8.5 | -24 to -15 | -15 to -6 | 3.5-6.0 | 0.03-0.10 | SE Colorado, USA | Light Sweet |

### NEBRASKA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Nebraska Sweet | 37.0-40.0 | 0.15-0.30 | <0.5 | 5-10 | 6.5-8.0 | -24 to -15 | -15 to -6 | 3.5-6.0 | 0.03-0.08 | Nebraska, USA | Light Sweet |

### MICHIGAN

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Michigan Sour | 28.0-31.0 | 1.50-2.00 | <0.5 | 10-18 | 5.0-6.5 | -18 to -9 | -10 to 0 | 7.0-12.0 | 0.08-0.18 | Michigan, USA | Medium Sour |
| Michigan Sweet | 38.0-41.0 | 0.20-0.40 | <0.5 | 5-10 | 7.0-8.5 | -24 to -15 | -15 to -6 | 3.5-6.0 | 0.03-0.08 | Michigan, USA | Light Sweet |

### LOUISIANA

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Delhi/N. Louisiana | 38.0-42.0 | 0.10-0.25 | <0.3 | 3-8 | 7.0-8.5 | -24 to -15 | -18 to -8 | 3.0-5.5 | 0.03-0.08 | Northern Louisiana, USA | Light Sweet |
| South Louisiana | 33.0-36.0 | 0.20-0.45 | <0.5 | 5-10 | 6.5-8.0 | -18 to -9 | -12 to -4 | 4.5-7.5 | 0.05-0.12 | South Louisiana, USA | Light Sweet |

### KANSAS

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Kansas Common | 33.0-36.0 | 0.40-0.80 | <0.5 | 5-12 | 6.0-7.5 | -21 to -12 | -12 to -4 | 4.5-7.5 | 0.04-0.10 | Kansas, USA | Light Sour |
| NW Kansas Sweet | 39.0-42.0 | 0.15-0.30 | <0.5 | 5-10 | 7.0-8.5 | -27 to -18 | -18 to -8 | 3.0-5.0 | 0.03-0.07 | NW Kansas, USA | Light Sweet |
| SW Kansas Sweet | 39.0-42.0 | 0.15-0.30 | <0.5 | 5-10 | 7.0-8.5 | -27 to -18 | -18 to -8 | 3.0-5.0 | 0.03-0.07 | SW Kansas, USA | Light Sweet |

---

## 6. OPEC Members (Monthly Pricing)

| Grade | API (°) | S% | BS&W (%) | Salt (PTB) | RVP (psi) | PP (°C) | FP (°C) | Visc (cSt@40°C) | TAN (mg KOH/g) | Region/Location | Type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Arab Light | 32.0-34.0 | 1.70-1.90 | <0.5 | 8-15 | 5.5-7.0 | -30 to -21 | -15 to -6 | 6.0-10.0 | 0.05-0.12 | Saudi Arabia | Medium Sour |
| Basrah Light | 30.0-33.0 | 2.80-3.10 | <0.5 | 10-20 | 4.5-6.0 | -18 to -9 | -8 to 2 | 7.0-12.0 | 0.10-0.22 | Southern Iraq | Medium Sour |
| Bonny Light | 32.9-37.0 | 0.12-0.16 | <0.3 | 3-8 | 5.5-7.5 | -9 to 4 | -6 to 5 | 4.0-7.0 | 0.10-0.30 | Nigeria | Light Sweet |
| Es Sider | 36.0-38.0 | 0.40-0.50 | <0.3 | 3-8 | 5.5-7.0 | -15 to -6 | -10 to 0 | 3.5-6.0 | 0.03-0.10 | Libya | Light Sweet |
| Iran Heavy | 29.0-31.0 | 1.70-1.90 | <0.5 | 8-15 | 5.0-6.5 | -15 to -6 | -8 to 2 | 8.0-15.0 | 0.10-0.25 | Iran | Medium Sour |
| Kuwait Export | 30.0-31.5 | 2.50-2.70 | <0.5 | 10-20 | 5.0-6.5 | -15 to -6 | -8 to 2 | 8.0-14.0 | 0.08-0.20 | Kuwait | Medium Sour |
| Merey | 16.0-18.0 | 2.40-2.70 | <0.5 | 20-40 | 2.5-4.0 | -20 to -10 | 5 to 15 | 300.0-600.0 | 0.60-0.90 | Venezuela | Heavy Sour |
| Murban | 39.0-40.5 | 0.74-0.78 | <0.2 | 3-8 | 6.0-7.5 | -18 to -12 | -15 to -6 | 3.5-5.5 | 0.02-0.05 | Abu Dhabi, UAE | Light Sour |
| Saharan Blend | 44.0-46.0 | 0.05-0.10 | <0.2 | 3-6 | 8.0-10.0 | -30 to -21 | -20 to -12 | 2.0-3.5 | 0.02-0.05 | Algeria | Light Sweet |

---

## 7. Refined & Non-Crude Products

> **Note:** The following products are NOT crude oils but are tracked alongside crude oil pricing. Their specifications are included for completeness in logistics and hazmat transport contexts relevant to EusoTrip.

| Product | Key Specifications | Region/Location | Type |
|---|---|---|---|
| Natural Gas | Methane >85%, BTU 950-1050/scf, H₂S <4 ppm, CO₂ <2% | Global | Gas |
| Gasoline (RBOB) | API ~58-65, Sulfur <10 ppm, RVP 7.0-15.0 psi (seasonal), Octane 87-93 | USA | Refined Product |
| Heating Oil (No. 2) | API ~35-38, Sulfur <0.0015% (ULSD), FP >52°C (125°F), Visc 2.0-5.8 cSt@40°C, PP -18°C | USA | Refined Product |
| Gulf Coast HSFO | API ~12-15, Sulfur 2.0-3.5%, Visc 180-380 cSt@50°C, FP >60°C, PP 12-24°C | US Gulf Coast | Residual Fuel Oil |
| Ethanol (Fuel Grade) | Not petroleum-based. Purity >99.0%, Density 0.789 g/cm³, FP 13°C (55°F) | USA | Biofuel |
| AECO C Natural Gas | Methane >85%, BTU 950-1050/scf, H₂S <4 ppm, CO₂ <2% | Alberta, Canada | Gas |
| Dutch TTF Natural Gas | Methane >85%, Wobbe Index 47.2-54.7 MJ/m³, H₂S <5 mg/m³ | Netherlands/EU | Gas |
| LNG Japan/Korea Marker | Methane >85% (liquefied at -162°C), BTU ~1000/scf, Density ~450 kg/m³ | Asia Pacific | LNG |

---

## 8. Parameter Definitions & Tolerances

### Primary Parameters (High APW Weight)

| Parameter | Unit | Description | Typical Range (All Crudes) | SPECTRA-MATCH™ Tolerance |
|---|---|---|---|---|
| **API Gravity** | ° (degrees) | Density measure; higher = lighter oil. Formula: (141.5/SG) - 131.5 | 10-65 | ±1.0° |
| **Sulfur Content** | wt% | Total sulfur by mass. Sweet <0.5%, Sour >1.0% | 0.01-5.5 | ±0.10% |
| **BS&W** | vol% | Basic Sediment & Water. Pipeline max typically 0.5-1.0% | 0.0-1.0 | ±0.20% |

### Secondary Parameters (Medium APW Weight)

| Parameter | Unit | Description | Typical Range (All Crudes) | SPECTRA-MATCH™ Tolerance |
|---|---|---|---|---|
| **Salt Content** | PTB | Pounds of NaCl equivalent per thousand barrels | 0-50 | ±3.0 PTB |
| **RVP** | psi | Reid Vapor Pressure — volatility indicator | 0.5-13.0 | ±0.5 psi |

### Tertiary Parameters (Lower APW Weight)

| Parameter | Unit | Description | Typical Range (All Crudes) | SPECTRA-MATCH™ Tolerance |
|---|---|---|---|---|
| **Pour Point** | °C | Lowest temp at which oil flows | -52 to +42 | ±3.0°C |
| **Flash Point** | °C | Lowest temp at which vapors ignite | -38 to +35 | ±3.0°C |
| **Viscosity** | cSt @ 40°C | Kinematic viscosity (resistance to flow) | 0.3-11,000+ | ±10% of value |
| **TAN** | mg KOH/g | Total Acid Number — corrosivity indicator | 0.01-3.9 | ±0.05 mg KOH/g |

### Temperature Correction

| Condition | Correction Applied |
|---|---|
| Temperature < 15°C (59°F) | API adjusted +0.01° per °F below 60°F |
| Temperature > 15°C (59°F) | API adjusted -0.01° per °F above 60°F |
| Extreme cold (< -20°C) | Viscosity correction via Arrhenius model |
| Extreme heat (> 50°C) | RVP correction per ASTM D323 |

---

## 9. Data Source Notes

### Sources & Methodology

This guide compiles specification data from the following sources:

- **ExxonMobil Crude Oil Assay Library** — Published assay summaries with API, sulfur, pour point, viscosity, and TAN data
- **Saudi Aramco Crude Oil Assay Program** — Arabian grade classifications and ranges
- **ADNOC (Abu Dhabi National Oil Company)** — Murban, Das, Upper Zakum specifications
- **PMI Comercio Internacional (Pemex)** — Maya, Isthmus, Olmeca grade specifications
- **TotalEnergies Crude Oil Data Sheets** — Bonny Light, Murban, and other international grades
- **U.S. Energy Information Administration (EIA)** — API gravity and sulfur content benchmarks
- **U.S. Strategic Petroleum Reserve Crude Oil Assay Manual (5th Edition)** — Testing standards
- **Industry-standard ASTM methods** — D1298 (API), D4294/D2622 (Sulfur), D4928 (Water), D97 (Pour Point), D93 (Flash Point), D445 (Viscosity), D664 (TAN)

### Important Disclaimers

1. **Ranges, not absolutes.** Crude oil is a natural product. Specifications vary by batch, season, reservoir depletion, and blending practices. Ranges represent typical commercial values.
2. **BS&W and Salt values** are contractual/pipeline spec limits rather than inherent crude properties. Actual field values may differ.
3. **Temperature corrections** are essential. All API and viscosity values assume standard conditions (15°C/60°F) unless noted.
4. **N/A entries** indicate data not publicly available from primary assay sources. These gaps represent opportunities for field calibration via SPECTRA-MATCH™ sensor integration.
5. **Delivery-point variants** (e.g., Maya to USGC vs. Maya to Far East) share identical crude specifications but may differ in contractual terms and blending at terminal.

---

*© 2026 Eusoro Technologies / Just Empower LLC. All rights reserved. SPECTRA-MATCH™ is a trademark of Eusoro Technologies.*

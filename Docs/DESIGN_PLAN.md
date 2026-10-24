# CoolTown: Youth Climate Resilience Simulation & Civic Action Engine
### Comprehensive Product Specification, Plain-Language Engine & Implementation Blueprint

---

## 1. Executive Summary & Purpose

**CoolTown** is a lightweight, responsive 2D Single Page Application (SPA) designed to empower youth aged 15–24—particularly those from resource-constrained, remote, or developing communities—to master urban climate resilience through gamified spatial decision-making. 

Over a 5-year planning horizon (5 turns), players manage a fixed budget, convert vulnerable concrete zones into living green infrastructure, witness simulated biophysical feedback, and generate a concrete, 1-page **Youth Civic Planning Resolution** ready for local council or community presentation.

The application bridges the gap between rigorous geospatial science (ESA WorldCover, Stanford InVEST, UNCCD SDG 15.3.1) and non-technical players by wrapping complex environmental data in intuitive physical analogies and universal everyday metaphors.

---

## 2. Audience Profile & Accessibility Principles

| Audience Characteristic | Design Response & Guardrail |
| :--- | :--- |
| **Education Level** | No prior knowledge of GIS, geography, or ecology required. Sentences are kept short, direct, and active. |
| **Language Fluency** | Accessible, plain-language English (approx. 5th–6th grade reading level). Free of academic jargon. |
| **Device & Bandwidth** | Strict single-file or lightweight client architecture (<500 KB asset footprint). Zero 3D engines (no Unity/Unreal). Works on low-spec Android devices and intermittent connections. |
| **Cognitive Accessibility** | High icon reliance (☀️ for heat, 💧 for floods, 🪙 for budget, 😊 for neighbor happiness). Dual-layered explanations: simple analogies first, scientific citations hidden in an on-demand slide drawer. |

---

## 3. The Plain-Language "Translation Engine"

The frontend translates technical outputs received from the underlying MCP tools into everyday, relatable concepts:

```
[Raw MCP Tool Output] 
        ↓ 
[Translation Middleware (Rules Engine)]
        ↓ 
[Player UI Display: Simple Words + Universal Real-World Analogy]
```

### Translation Dictionary

| Technical GIS / Biophysical Term | Player-Facing Metric | Universal Real-World Analogy |
| :--- | :--- | :--- |
| **Impervious Surface Ratio (ISR)** | **Hard Ground vs. Living Soil** | *"Concrete acts like a plastic rain jacket: water slides right off it into your doorway. Living soil acts like a dry washcloth: it drinks up the puddle."* |
| **Stormwater Runoff Retention ($CN$ Curve Numbers)** | **Puddle Danger / Flood Risk** | *"A town covered in asphalt is like pouring a bucket of water over a tin roof. A town with gardens is like pouring water into a bucket of soft sand."* |
| **Evapotranspiration ($ET_r$) & Canopy Decay** | **Tree Shade & Natural Breeze** | *"Standing on asphalt at midday is like standing on an iron cooking pan. Big trees work like a giant sun umbrella paired with a wet cloth on your forehead."* |
| **ESA WorldCover 10m Classes (50, 10, 20)** | **Gray Blocks, Shady Trees, Soft Grass** | Visual grid transformation: cracked gray stone turns into leafy green crowns or open gold-green meadows. |
| **SDG Indicator 15.3.1 (Land Degradation Neutrality)** | **Town Health Balance** | *"We gave back more living soil and green trees to our community than the concrete roads took away."* |

---

## 4. End-to-End Game Flow & Step-by-Step Experience

```
+--------------------------------------------------------------------------+
| Turn 0: Neighborhood Selection & 2-Question Baseline Micro-Assessment   |
+--------------------------------------------------------------------------+
                                     ↓
+--------------------------------------------------------------------------+
| Turns 1–5: Annual Planning Turn Loop                                     |
|  - Review yearly budget (Coins 🪙) & community status                   |
|  - Select & place interventions (Trees, Sponges, Cool Roofs)             |
|  - Submit turn → MCP biophysical simulation updates temperature & runoff |
|  - Optional: Inspect "Why Did This Happen?" science drawer               |
+--------------------------------------------------------------------------+
                                     ↓
+--------------------------------------------------------------------------+
| Turn 5 Conclusion: Post-Simulation Micro-Assessment                      |
|  - Identical 2-question assessment records normalized learning gain      |
+--------------------------------------------------------------------------+
                                     ↓
+--------------------------------------------------------------------------+
| Civic Payoff: Downloadable 1-Page "Youth Town Planning Resolution"       |
|  - Concrete data evidence + 3 actionable demands for local leaders       |
+--------------------------------------------------------------------------+
```

### Turn 0: Baseline Setup & Pre-Assessment
1. **Context Choice:** The player chooses their community type:
   * *Option A: Crowded Market District* (High asphalt, dense tin roofs, high heat).
   * *Option B: Riverside Valley Town* (Low elevation, packed dirt/pavement, severe flood risk).
2. **Pre-Assessment Questions (Stored via `record_assessment_score`):**
   * *Question 1 (Flooding):* "When a heavy storm hits, do trees and open dirt help stop neighborhood flooding, or does concrete do a better job?"  
     *(Slider: 1 = Concrete keeps it drier $\to$ 5 = Trees and soil soak it up best)*
   * *Question 2 (Heatwaves):* "On the hottest summer afternoon, how much cooler is a street shaded by large trees compared to an open paved road?"  
     *(Slider: 1 = Exactly the same $\to$ 5 = Much cooler and breezy)*

---

### Turns 1 through 5: The Strategic Planning Loop

Each turn represents 1 calendar year. The player receives **100 Coins** per turn.

#### Available Interventions

1. **🌳 Plant Shady Street Trees (Urban Canopy Expansion)**
   * *Cost:* 25 Coins per parcel.
   * *Analogy:* Natural sun umbrellas that cool the air by releasing invisible water droplets.
   * *Gameplay Impact:* High cooling (`-0.4°C` per parcel), modest flood capture (`-10%` runoff).
2. **🧽 Open Soil & Rain Gardens (Permeable Plazas & Bioswales)**
   * *Cost:* 30 Coins per parcel.
   * *Analogy:* Swapping waterproof stone for giant earth sponges that swallow rain before it floods homes.
   * *Gameplay Impact:* High flood protection (`-30%` runoff), moderate cooling (`-0.15°C`).
3. **🏠 Paint Cool Roofs & Green Mats (Surface Albedo Retrofits)**
   * *Cost:* 15 Coins per parcel.
   * *Analogy:* Putting a wide-brim white hat on top of buildings so they bounce sunlight away.
   * *Gameplay Impact:* Quick localized heat reduction (`-0.25°C`), high community happiness boost.

#### Heads-Up Display (HUD) Layout

```
+--------------------------------------------------------------------------+
| 🗓️ Year: 3 of 5   | 🪙 Budget Remaining: 45 Coins                        |
+--------------------------------------------------------------------------+
| 🌡️ Street Heat: -1.3°C Cooler   | 💧 Flood Risk: Down 38%               |
| 😊 Community Trust: 82%          | 🌿 Restored Soil: +4 Parcels          |
+--------------------------------------------------------------------------+
|                      |                                                   |
|   [4x4 TOWN GRID]    |                 [ACTION PALETTE]                  |
|                      |                                                   |
|  [ 🏢 ] [ 🌳 ] [ 🏢 ]|  [🌳] Plant Shady Trees      (25 🪙)              |
|  [ 🛣️ ] [ 🧽 ] [ 🛣️ ]|  [🧽] Build Rain Sponges     (30 🪙)              |
|  [ 🏢 ] [ 🏢 ] [ 🏠 ]|  [🏠] Cool White Roofs       (15 🪙)              |
|                      |                                                   |
| (Tap grid square)    |  [ ✔️ End Year & Run Simulation ]                 |
+--------------------------------------------------------------------------+
| 💡 Tap any metric or parcel to open the "Why Did This Happen?" drawer    |
+--------------------------------------------------------------------------+
```

---

### The "Why Did This Happen?" Science Slide-Out Drawer

Triggered whenever a player taps a metric card or an updated parcel on the grid. It calls `get_science_explanation` and formats the answer in two clear tiers:

```
+------------------------------------------------------------+
| 🔬 The Science Behind the Change                           |
+------------------------------------------------------------+
|                                                            |
| 💡 The Simple Reason:                                      |
| Tree leaves "sweat" water into the air, just like your     |
| skin does when you run. When that water evaporates into    |
| the sky, it steals heat right out of the street air.       |
|                                                            |
| 📖 Scientific Proof & Source:                              |
| Modeled using the Stanford InVEST Urban Cooling Model.     |
| Converts ESA WorldCover Class 50 (Built-up) to             |
| Class 10 (Tree Cover), decreasing localized heat island    |
| severity in accordance with UN SDG 15.3.1 guidelines.      |
|                                                            |
| [ Close Drawer ✖ ]                                         |
+------------------------------------------------------------+
```

---

### Turn 5 Conclusion: Civic Payoff & Real-World Translation

1. **Post-Simulation Micro-Assessment:** The player answers the identical two questions from Turn 0. The app calls `record_assessment_score` to compute normalized cognitive learning gains ($g$).
2. **1-Page Youth Community Planning Resolution:** Calling `generate_youth_resolution` creates an authoritative, easy-to-read printable advocacy document formatted for municipal councils, community elders, or school committees.

#### Printable Resolution Layout Preview

```
============================================================================
              YOUTH COMMUNITY CLIMATE RESILIENCE RESOLUTION
============================================================================
District / Neighborhood : Riverside Market Ward
Youth Representative    : Amara K.
Simulation Period       : 5-Year Planning Cycle (2026–2031)

1. THE PROBLEM WE FACE
   Our neighborhood suffers from severe heat and sudden storm flooding 
   because over 70% of our natural ground has been sealed beneath concrete, 
   asphalt, and corrugated metal.

2. WHAT OUR EVIDENCE PROVED
   By replacing 35% of hard pavement with living shade trees and soil-based 
   rain gardens:
   • Summer midday heat dropped by 1.8°C across residential streets.
   • Dangerous rainwater puddles and runoff decreased by 44%.
   • Community living conditions improved without displacing local homes.

3. OUR THREE CALLS TO ACTION FOR LOCAL LEADERS
   [1] Stop paving over public schoolyards and dirt squares; plant native 
       shade canopy trees along all main walking routes.
   [2] Dig bioswales ("rain sponges") along unpaved and paved road edges 
       to catch stormwater before it enters homes and businesses.
   [3] Subsidize reflective white roof paint and community garden roofs 
       for tin-roof residential structures.

Verified against UN Sustainable Development Goal 15.3.1 & Stanford InVEST Models
============================================================================
```

---

## 5. Technical Architecture & Integration Plan

### System Component Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser (Client)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Single Page Application (React / Tailwind / Canvas)   │  │
│  │ - 2D Interactive Parcel Grid                          │  │
│  │ - HUD Metric Indicators & Animation Engine            │  │
│  │ - Translation Engine (Plain-Language Middleware)      │  │
│  │ - One-Click Print/PDF Resolution Generator            │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ JSON-RPC / REST API Bridge
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Local FastMCP Server (`TurnGreen`)              │
│                                                             │
│  [Tool 1: simulate_policy_turn]                             │
│   • Input: turn, policy_id, budget, grid_state              │
│   • Logic: InVEST cooling + USDA-SCS Curve Number hydrology │
│                                                             │
│  [Tool 2: get_science_explanation]                          │
│   • Input: metric_key ("cooling", "runoff", "soil")         │
│   • Output: Dual-tier explanation (analogy + citations)     │
│                                                             │
│  [Tool 3: record_assessment_score]                          │
│   • Input: pre/post slider values (1–5)                     │
│   • Output: Normalized learning gain delta ($g$)            │
│                                                             │
│  [Tool 4: generate_youth_resolution]                        │
│   • Input: session_history, author_name, district           │
│   • Output: Formatted 1-page civic mandate text             │
└─────────────────────────────────────────────────────────────┘
```

### Data Contract Examples

#### MCP Tool 1: `simulate_policy_turn`
* **Request:**
  ```json
  {
    "turn": 2,
    "policy_id": "tree_canopy",
    "budget_allocated": 50,
    "parcel_coordinates": [[1, 2], [2, 2]]
  }
  ```
* **Raw MCP Response:**
  ```json
  {
    "temp_delta_celsius": -0.42,
    "runoff_reduction_pct": 12.5,
    "budget_remaining": 50,
    "converted_classes": {"from": 50, "to": 10, "count": 2},
    "invest_cooling_coefficient": 0.38
  }
  ```
* **Client Translation Middleware Output (Displayed to User):**
  * *Heat Metric:* "Street feels **0.4°C cooler** (like stepping into porch shade)."
  * *Flood Metric:* "Puddle danger down by **12%**."

---

## 6. Hackathon Delivery Roadmap (<48 Hours)

| Phase | Duration | Key Milestones | Success Criteria |
| :--- | :--- | :--- | :--- |
| **Phase 1: MCP Validation** | Hours 1–6 | Verify local FastMCP server running with all 4 tools responding to JSON-RPC payloads. | All 4 tools return mock/InVEST mathematical data without throwing errors. |
| **Phase 2: Core Grid & HUD** | Hours 7–18 | Scaffold 2D grid ($4 \times 4$ parcels) with CSS/Canvas. Render HUD metrics and action buttons. | Tapping a parcel and spending budget updates the grid color and budget state. |
| **Phase 3: Middleware & Drawer** | Hours 19–30 | Connect UI to `simulate_policy_turn` and `get_science_explanation`. Implement the plain-language translation layer and side drawer. | All GIS terms are replaced with plain analogies; clicking "See Science" opens verified citations. |
| **Phase 4: Assessments & PDF** | Hours 31–42 | Build pre/post slider dialogues connected to `record_assessment_score`. Implement print CSS for the 1-page Resolution. | App calculates learning delta; prints clean, single-page PDF formatted for local officials. |
| **Phase 5: Polish & Testing** | Hours 43–48 | Low-bandwidth optimization, mobile touch responsiveness, font legibility checks. | App loads in <1.5s on throttled connections with zero external auth barriers. |
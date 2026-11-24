# Solar Data Platform — Self-Service Portal UX/UI Prototype

Interactive UX/UI prototype and design specification for the **Solar Data Platform Self-Service Portal**, designed around an **Industrial Precision Workbench** aesthetic (Dark Slate default + True Light Mode) covering workshop feedback `PW-01`–`PW-10`.

## Repository Structure

```text
.
├── index.html                          # Interactive single-file HTML/CSS/JS prototype
├── docs/
│   └── solar_portal_ux_ui_spec.md      # Full UX/UI design specification & frontend blueprint
└── README.md
```

## Key Highlights

- **Industrial Precision Workbench Design System**: Dark Slate (`#020617`) default with a dedicated True Light Mode, hairline borders, tabular monospace metrics (`tabular-nums`), and context-aware ambient glow.
- **7 Core Workspace Screens**:
  1. **Overview** — Operational ribbon, quick-launch saved parameter groups (`PW-03`), data source contracts matrix, and Gate A semantic notices.
  2. **Data Explorer** — Split workbench with dynamic multi-resolution controls (`PW-01`), backend ACL site scope (`PW-02`), SolarEdge irradiance pending-validation warnings (`PW-04`), live pre-flight query cost guardrail (`PW-07`), and row provenance inspector.
  3. **Trend Analysis** — Gap-honest multi-series visualization (`PW-08`) with explicit `NULL` breaks, export limitation overlay bands, and crosshair readout bar.
  4. **Reporting Center** — 4-layer coverage semantics separating telemetry coverage, inverters running, operational condition (`PW-06`), and quality/provenance.
  5. **My Parameters** — Personal and team-shared parameter groups with ACL badges (`PW-03`).
  6. **Data Catalog** — Canonical metric dictionary shared across Portal, Power BI, and PI Vision (`PW-04`, `PW-10`).
  7. **My Exports** — Async export queue with progress, TTL countdown, cancellation, and audited downloads.

## Preview Locally

Open `index.html` directly in a browser, or run a lightweight local HTTP server from the repository root:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Documentation

See the full design specification, semantic color tokens, workflow map, system state matrix, and React/TypeScript frontend architecture plan in [`docs/solar_portal_ux_ui_spec.md`](docs/solar_portal_ux_ui_spec.md).

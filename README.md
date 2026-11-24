# Solar Data Platform — Self-Service Portal UX/UI Prototype

Interactive UX/UI prototype and design specification for the **Solar Data Platform Self-Service Portal**, designed around an **Industrial Precision Workbench** aesthetic (Dark Slate default + True Light Mode) covering workshop feedback `PW-01`–`PW-10`.

> **Demo-only prototype:** All rows, trends, timestamps, jobs, status and access labels are illustrative. No live SQL Server, authentication, enforced ACL, backend query or export file is connected. The UX refinement work is isolated to `feature/ux-ui-professional-refinement`.

## Repository Structure

```text
.
├── index.html                          # Prototype shell and original behaviors
├── assets/
│   ├── ux-refinement.css               # Contrast, focus, density, demo status
│   └── ux-refinement.js                # Site selection, query state, shared trend, keyboard UX
├── tests/
│   └── ux-refinement.spec.mjs          # Seven Chromium UI smoke tests
├── .github/workflows/ux-prototype-qa.yml
├── docs/
│   ├── solar_portal_ux_ui_spec.md
│   └── UX_REFINEMENT_WAVE1.md          # Changes, QA walkthrough and known limitations
├── package.json
├── playwright.config.mjs
└── README.md
```

## Key Highlights

- **Industrial Precision Workbench Design System**: Dark Slate (`#020617`) default with a dedicated True Light Mode, hairline borders, tabular monospace metrics (`tabular-nums`), and context-aware ambient glow.
- **9 Workspace Screens (prototype)**:
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

## UX Refinement QA

Run locally at the repository root with Node.js and Python installed:

```bash
npm install
npx playwright install chromium
npm run test:syntax
npm run test:ui
```

GitHub Actions also runs syntax checks and 7 Chromium interaction tests on the refinement branch. See [Wave 1 review checklist](docs/UX_REFINEMENT_WAVE1.md). These tests do not replace manual accessibility and usability acceptance.

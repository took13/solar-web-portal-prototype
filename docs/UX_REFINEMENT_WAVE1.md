# UX Refinement — Wave 1 (Branch Review)

Branch: \`feature/ux-ui-professional-refinement\`  
Status: **Implementation on branch; browser usability acceptance pending.**  
Base: standalone HTML/CSS/JS prototype, **no live SQL, API, SSO, ACL, export worker, or actual telemetry**.

## Changes

| Area | Implemented in this branch | Production implication |
|---|---|---|
| Data trust | Persistent demo warning, removed misleading live freshness, demo viewer, synthetic export disclaimer | Bind freshness and role to authenticated API response |
| Data Explorer | Vendor filter plus individual illustrative plant checkboxes | Replace static site list using server-authorized site scope |
| Preview workflow | Draft changes invalidate results; explicit Run creates a simulated preview and records query context | Fetch server-side parameterized results with loading/error/timeout |
| Query guardrail | Clearly labeled illustrative row estimate; removed pretend 0.4s timings | Obtain server-preflight estimate/caps and enforce them on API |
| Trend | Uses *last executed preview's* plant IDs, supports 4 sample series, preserves SE null gaps, keyboard arrow inspection, accessible data table | Replace synthesized curves with real time-bucket series and provenance |
| Exports | Demo queue and cancel clearly indicate **no worker or downloadable file** | Implement job APIs, ACL, TTL, audit and secure download |
| Accessible navigation | Named collapsed-rail buttons, focus on destination heading, command palette & mobile drawer focus loop, hash history | Validate with automated WCAG checks and keyboard-only UAT |
| Visual system | Improved contrast/density, focus ring, reduced-motion behavior | Validate WCAG AA using a rendered page and actual user environments |
| Theme | Browser preference persisted with safe storage failure handling | Integrate with per-user preferences if needed |

## Quick browser walkthrough

Open \`index.html\` from this branch through a local HTTP server, or preview in GitHub Pages if configured. **Do not compare its numbers to SolarDataDB.**

1. Overview: visible "DEMO / SYNTHETIC DATA" banner; no live freshness implication.
2. Data Explorer: choose **Huawei** source, then *Plant-HW-04* only. Select active power. Notice **Query not run**.
3. Run Demo Preview: see rows only after clicking. Select one row and check its UTC/provenance note.
4. Switch to Trend: chart should show **HW-04 only**, with illustrative export-limit band.
5. Return to Explorer: the completed preview should remain unless a filter changes.
6. Choose SolarEdge + Plant-SE-02; run preview; open Trend; check NULL break and arrow-key inspection. Expand the accessible data table.
7. Choose Glow; 5-minute resolution must disable. Run preview and check Trend label.
8. Change to Light Mode and reload; persisted selection of Light Mode should remain.
9. Open command palette (Ctrl+K or Cmd+K). Check Escape, Tab cycling and focus return. Check mobile navigation at 390px.
10. Queue a demo export: status explicitly says no backend/worker; cancelling must not claim a real worker stopped.

## Important limits and open items

- This prototype is **not wired to DEV-02** and cannot confirm SQL permission, data freshness, unit validation, query enforcement or ACL.
- Date-range selection affects **illustrative cost**, not historical sample rows.
- Trend is rendered from **synthetic curves** at fixed illustrative 15-minute buckets, including selected HW-01 and Glow; requested time-resolution is displayed but does not resample the underlying sample trend.
- Source picker contains four examples only. Production site list must come from ACL-scoped API.
- Chart and table accessibility must be manually checked with screen readers and browser rendering; code review alone is not a certification.
- The original index.html remains intentionally standalone in the \`main\` branch; this branch loads additive files in \`assets/\`.
- Review/merge only after browser QA and workflow tests pass. **No production deployment performed.**

## API integration decision

Carry forward **executed query context** (site IDs, metric codes, grain, time range, source) as a typed request model. Do not make the Portal accept raw SQL from the browser. Align the first live endpoint with existing read-only \`dash.vw_site_current\` contracts; distinguish observation timestamp, server query time, freshness, and semantic certification.

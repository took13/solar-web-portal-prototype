/* Wave 1 UX refinement for the static prototype.
   Browser-only simulation. No API, SQL, authentication, or production export. */
(function () {
  "use strict";
  const byId = id => document.getElementById(id);
  const sites = [
    { id: "Plant-HW-04", source: "huawei", label: "Plant-HW-04", meta: "Huawei · Demo" },
    { id: "Plant-HW-01", source: "huawei", label: "Plant-HW-01", meta: "Huawei · Demo" },
    { id: "Plant-SE-02", source: "solaredge", label: "Plant-SE-02", meta: "SolarEdge · Demo" },
    { id: "Glow Solar Farm", source: "glow", label: "Glow Solar Farm", meta: "Utility · Demo" }
  ];
  const getSource = () => byId("sourceFilter").value;
  const eligibleInputs = () => Array.from(document.querySelectorAll(".site-chk")).filter(el => getSource() === "all" || el.dataset.source === getSource());
  const chosenSites = () => eligibleInputs().filter(el => el.checked).map(el => el.value);
  const chosenParams = () => Array.from(document.querySelectorAll(".param-chk:checked")).map(el => el.value);
  const labelSite = id => (sites.find(site => site.id === id) || { label: id }).label;
  const htmlEscape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const selector = document.createElement("div");
  selector.innerHTML = '<label for="sourceFilter" class="field-label">Data Source (demo)</label>' +
    '<select id="sourceFilter" class="input-ctrl ux-source-filter" aria-describedby="sourceFilterHelp">' +
    '<option value="all">All demo sources</option><option value="huawei">Huawei</option>' +
    '<option value="solaredge">SolarEdge</option><option value="glow">Glow Solar Farm</option></select>' +
    '<p class="ux-helper" id="sourceFilterHelp">Select individual demo sites below. No actual authorization or SQL connection is active.</p>';
  byId("siteChecklist").before(selector);
  byId("sourceFilter").addEventListener("change", () => {
    byId("expGroupSelect").value = "custom";
    window.recalcExplorer();
  });

  byId("siteChecklist").innerHTML = sites.map(site =>
    '<label class="check-row" for="ux-site-' + htmlEscape(site.id.replace(/[^a-z0-9]/gi, "-")) + '">' +
    '<span class="check-row-left"><input id="ux-site-' + htmlEscape(site.id.replace(/[^a-z0-9]/gi, "-")) +
    '" type="checkbox" class="chk site-chk" data-source="' + site.source +
    '" value="' + htmlEscape(site.id) + '" checked /> ' +
    '<span>' + htmlEscape(site.label) + '</span></span><span class="ux-site-meta">' +
    htmlEscape(site.meta) + "</span></label>"
  ).join("");
  document.querySelectorAll(".site-chk").forEach(input =>
    input.addEventListener("change", () => {
      byId("expGroupSelect").value = "custom";
      window.recalcExplorer();
    })
  );

  const allSitesLabel = byId("chkAllSites").closest("label");
  allSitesLabel.querySelector(".check-row-left").lastChild.textContent = " All filtered demo sites";
  const sourceText = allSitesLabel.querySelector(".text-cyan");
  if (sourceText) sourceText.textContent = "NOT LIVE ACL";

  const stateBar = document.createElement("div");
  stateBar.id = "explorerQueryState";
  stateBar.className = "ux-info-bar is-dirty";
  stateBar.setAttribute("role", "status");
  stateBar.setAttribute("aria-live", "polite");
  byId("explorerTable").closest(".grid-scroll").before(stateBar);
  const gridMeta = byId("gridMetaCount");
  byId("explorerOpenTrendBtn").disabled = true;
  byId("explorerOpenTrendBtn").title = "Run Preview first to establish the selected query context";
  byId("runPreviewBtn").textContent = "Run Demo Preview";
  byId("explorerQueueExportBtn").title = "Create a simulated export job, not a real file";

  const seriesDefinitions = [
    { id: "Plant-HW-04", label: "HW-04", colorDark: "#22D3EE", colorLight: "#0891B2", value: p => p.hw },
    { id: "Plant-HW-01", label: "HW-01", colorDark: "#34D399", colorLight: "#047857", value: p => +(p.hw * 1.31).toFixed(1) },
    { id: "Plant-SE-02", label: "SE-02", colorDark: "#A5B4FC", colorLight: "#4338CA", value: p => p.se },
    { id: "Glow Solar Farm", label: "Glow", colorDark: "#FBBF24", colorLight: "#B45309", value: p => +(p.hw * 6.4).toFixed(1) }
  ];

  state.previewRows = [];
  state.previewContext = null;
  state.queryEstimate = 0;
  state.lastPreviewAt = null;

  const legacySwitchView = window.switchView;
  window.switchView = function (viewId, options) {
    if (!byId("view-" + viewId)) return;
    legacySwitchView(viewId);
    if (!options || options.history !== false) {
      const next = "#/" + viewId;
      if (location.hash !== next) history.pushState({ view: viewId }, "", next);
    }
    const nav = document.querySelector('[data-view="' + viewId + '"]');
    if (nav) nav.setAttribute("aria-label", (viewTitles[viewId] || viewId) + " workspace");
    if (!options || options.focus !== false) {
      const heading = byId("view-" + viewId).querySelector("h2") || byId("pageTitle");
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    if (viewId === "trends") window.requestAnimationFrame(() => window.drawTrendChart());
  };
  window.addEventListener("popstate", () => {
    const id = location.hash.replace(/^#\//, "");
    if (byId("view-" + id)) window.switchView(id, { history: false, focus: false });
  });

  window.onAllSitesToggle = function () {
    const checked = byId("chkAllSites").checked;
    eligibleInputs().forEach(input => { input.checked = checked; });
    byId("expGroupSelect").value = "custom";
    window.recalcExplorer();
  };
  window.onManualFilterChange = function () {
    byId("expGroupSelect").value = "custom";
    window.recalcExplorer();
  };
  window.applyExplorerGroup = function (key) {
    const settings = {
      om_morning: { source: "all", ids: ["Plant-HW-04", "Plant-HW-01", "Plant-SE-02"], res: "15m", params: ["active_power_kw", "energy_today_kwh", "vendor_status_code"] },
      export_limit: { source: "huawei", ids: ["Plant-HW-04"], res: "5m", params: ["active_power_kw", "vendor_status_code"] },
      glow_meter: { source: "glow", ids: ["Glow Solar Farm"], res: "15m", params: ["active_power_kw", "energy_today_kwh"] }
    }[key];
    if (!settings) { window.recalcExplorer(); return; }
    byId("sourceFilter").value = settings.source;
    document.querySelectorAll(".site-chk").forEach(el => { el.checked = settings.ids.includes(el.value); });
    document.querySelectorAll(".param-chk").forEach(el => { el.checked = settings.params.includes(el.value); });
    state.resolution = settings.res;
    window.recalcExplorer();
    showToast("Loaded demo group. Review filters, then run the preview.");
  };
  window.syncResolutionAvailability = function () {
    const glowSelected = chosenSites().includes("Glow Solar Farm");
    const btn5m = byId("res-5m");
    btn5m.disabled = glowSelected;
    if (glowSelected && state.resolution === "5m") state.resolution = "15m";
    ["5m", "15m", "1h", "1d"].forEach(r => {
      const el = byId("res-" + r);
      el.classList.toggle("active", r === state.resolution);
      el.setAttribute("aria-pressed", String(r === state.resolution));
    });
    byId("resHint").textContent = glowSelected
      ? "5m unavailable when Glow is selected (15m native demo contract; no upsampling)."
      : "Resolution is illustrative; live availability comes from the verified data contract.";
    byId("resHint").className = glowSelected ? "text-warn" : "text-secondary";
  };

  window.recalcExplorer = function () {
    const selectedSites = chosenSites(), selectedParams = chosenParams();
    document.querySelectorAll(".site-chk").forEach(el => {
      el.closest("label").classList.toggle("hidden", getSource() !== "all" && el.dataset.source !== getSource());
    });
    const filtered = eligibleInputs();
    const checked = filtered.filter(el => el.checked).length;
    byId("chkAllSites").checked = filtered.length > 0 && checked === filtered.length;
    byId("chkAllSites").indeterminate = checked > 0 && checked < filtered.length;
    byId("paramCountLbl").textContent = selectedParams.length + " selected";
    const cols = { thPower: "active_power_kw", thEnergy: "energy_today_kwh", thStatus: "vendor_status_code", thIrradiance: "poa_irradiance" };
    Object.keys(cols).forEach(id => byId(id).classList.toggle("hidden", !selectedParams.includes(cols[id])));
    byId("irradianceWarnBox").classList.toggle("hidden", !selectedParams.includes("poa_irradiance"));
    window.syncResolutionAvailability();

    const bucketCount = { "5m": 288, "15m": 96, "1h": 24, "1d": 1 }[state.resolution];
    const est = selectedSites.length * selectedParams.length * state.rangeDays * bucketCount;
    state.queryEstimate = est;
    state.lastEstimatedRows = est;
    byId("estRowsVal").textContent = "~" + est.toLocaleString() + " estimated sample rows";
    byId("estTimeVal").textContent = "No backend timing";
    const badge = byId("guardrailBadge"), msg = byId("guardrailMsg");
    const noSelection = !selectedSites.length || !selectedParams.length;
    if (noSelection) {
      badge.className = "tag tag-neutral"; badge.textContent = "Select scope";
      msg.textContent = "Choose at least one site and one parameter.";
    } else if (est <= 80000) {
      badge.className = "tag tag-ok"; badge.textContent = "Demo estimate: small";
      msg.textContent = "Illustrative estimate only. Server-side ACL, cost control and timeout are not running in this prototype.";
    } else if (est <= 300000) {
      badge.className = "tag tag-warn"; badge.textContent = "Demo estimate: large";
      msg.textContent = "Illustrative estimate; narrow sites, time range, or resolution before querying a real backend.";
    } else {
      badge.className = "tag tag-danger"; badge.textContent = "Demo estimate: over cap";
      msg.textContent = "Illustrative cap exceeded. A real implementation must validate and route large jobs server-side.";
    }
    byId("runPreviewBtn").disabled = noSelection;
    byId("runPreviewBtn").textContent = est > 300000 ? "Run Demo Sample (no export)" : "Run Demo Preview";
    document.querySelectorAll(".range-btn").forEach(btn => btn.setAttribute("aria-pressed", String(Number(btn.dataset.days) === state.rangeDays)));
    const selected = chosenSites();
    byId("explorerViewBadge").textContent = selected.length === 1 && selected[0] === "Glow Solar Farm" ? "DEMO · Glow meter boundary" : "DEMO · illustrative rows";

    state.previewRows = [];
    state.previewContext = null;
    byId("explorerOpenTrendBtn").disabled = true;
    stateBar.className = "ux-info-bar is-dirty";
    stateBar.innerHTML = "<span><strong>Query not run</strong> · " + selectedSites.length + " demo site(s), " + selectedParams.length +
      " parameter(s), " + htmlEscape(state.resolution) + "</span><span>Filters changed — click Run Demo Preview</span>";
    gridMeta.textContent = "No current results";
    window.renderExplorerTable();
  };

  window.renderExplorerTable = function () {
    const tbody = byId("explorerTbody");
    const context = state.previewContext;
    const p = context ? context.params : chosenParams();
    const hasPower = p.includes("active_power_kw"), hasEnergy = p.includes("energy_today_kwh");
    const hasStatus = p.includes("vendor_status_code"), hasIrr = p.includes("poa_irradiance");
    const colCount = 4 + Number(hasPower) + Number(hasEnergy) + Number(hasStatus) + Number(hasIrr);
    if (!context || !state.previewRows.length) {
      const title = context ? "No matching sample rows" : "Ready to explore";
      const desc = context
        ? "No illustrative rows matched this demo scope. This is not a statement about live data availability."
        : "Choose your demo source, sites, metrics and time range, then click Run Demo Preview.";
      tbody.innerHTML = '<tr><td class="ux-placeholder" colspan="' + colCount +
        '"><strong>' + title + "</strong>" + desc + "</td></tr>";
      byId("provRowId").textContent = "No selected result";
      byId("provDetails").textContent = "No data provenance until a demo preview is run.";
      return;
    }
    tbody.innerHTML = state.previewRows.map((r, idx) => {
      const number = v => v === null ? '<span class="italic text-tertiary">NULL</span>' : Number(v).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
      const tagClass = r.statusType === "ok" ? "tag-ok" : r.statusType === "warn" ? "tag-warn" : "tag-danger";
      return '<tr class="row-clickable ' + (idx === 0 ? "selected-row" : "") +
        '" tabindex="0" role="button" aria-label="Inspect provenance for ' + htmlEscape(r.site) + " at " + htmlEscape(r.ts) +
        '" data-preview-row="' + idx + '"><td class="font-mono-tech">' + htmlEscape(r.ts) +
        '</td><td class="font-medium">' + htmlEscape(r.site) +
        '</td><td class="font-mono-tech text-secondary">' + htmlEscape(r.source) +
        '</td><td class="text-right font-mono-tech ' + (hasPower ? "" : "hidden") + '">' + number(r.kw) +
        '</td><td class="text-right font-mono-tech ' + (hasEnergy ? "" : "hidden") + '">' + number(r.kwh) +
        '</td><td class="text-right font-mono-tech ' + (hasIrr ? "" : "hidden") + '">' + (r.irr === null ? number(null) : htmlEscape(r.irr)) +
        '</td><td class="' + (hasStatus ? "" : "hidden") + '"><span class="tag ' + tagClass + '">' + htmlEscape(r.status) +
        '</span></td><td class="font-mono-tech text-secondary">' + htmlEscape(r.quality) + "</td></tr>";
    }).join("");
    tbody.querySelectorAll("[data-preview-row]").forEach(tr => {
      const index = Number(tr.dataset.previewRow);
      tr.addEventListener("click", () => window.selectProvenanceRow(index, tr));
      tr.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.selectProvenanceRow(index, tr); }
      });
    });
    window.updateProvenance(state.previewRows[0]);
  };
  window.selectProvenanceRow = function (idx, tr) {
    byId("explorerTbody").querySelectorAll(".selected-row").forEach(row => row.classList.remove("selected-row"));
    tr.classList.add("selected-row");
    window.updateProvenance(state.previewRows[idx]);
  };
  window.updateProvenance = function (row) {
    if (!row) return;
    byId("provRowId").textContent = row.site + " · " + row.ts + " ICT (DEMO)";
    byId("provDetails").textContent = "UTC: " + row.utc +
      " · Grain: " + state.previewContext.resolution +
      " · Sample contract label: " + row.view + " · Quality: " + row.quality +
      " · NULL values preserved; not verified against SQL";
  };
  window.runExplorerPreview = function () {
    const selected = chosenSites(), params = chosenParams();
    if (!selected.length || !params.length) { window.recalcExplorer(); return; }
    state.previewContext = {
      sites: selected.slice(), params: params.slice(), resolution: state.resolution,
      rangeDays: state.rangeDays, source: getSource()
    };
    state.previewRows = sampleRows.filter(row => selected.includes(row.site)).slice(0, 500);
    byId("explorerOpenTrendBtn").disabled = false;
    stateBar.className = "ux-info-bar is-complete";
    stateBar.innerHTML = '<span><strong>Demo preview ready</strong> · ' + selected.length +
      " selected site(s) · " + params.length + " metrics</span><span>Illustrative · not queried from SQL</span>";
    gridMeta.textContent = "Showing " + state.previewRows.length + " illustrative rows · no backend query";
    window.renderExplorerTable();
    showToast("Demo preview updated. No live SQL query was executed.");
  };

  // A prototype export is an example entry only: never claim files, workers, or audits exist.
  exportJobs.forEach(j => {
    j.status = "example"; j.statusLabel = "Illustrative only"; j.ttl = "No backend / no file";
  });
  window.triggerAsyncExport = function (origin) {
    if (origin === "explorer" && !state.previewContext) {
      showToast("Run Demo Preview before queueing an illustrative export."); return;
    }
    const id = "DEMO-" + String(nextExportSeq++).padStart(3, "0");
    exportJobs.unshift({
      id, filename: "Not generated (demo)", rows: 0,
      scope: origin === "report" ? "Illustrative report export" : "Illustrative Explorer selection",
      status: "queued", statusLabel: "DEMO QUEUED · no worker", ttl: "No file / no TTL"
    });
    renderExports();
    showToast("Simulated export created. No file or worker was started.");
  };
  window.cancelExportJob = function (jobId) {
    const job = exportJobs.find(j => j.id === jobId);
    if (!job) return;
    job.status = "cancelled"; job.statusLabel = "Demo cancelled"; job.ttl = "No real worker";
    renderExports(); showToast("Simulated export cancelled.");
  };
  const exportHead = byId("view-exports").querySelector("h2");
  if (exportHead) exportHead.textContent = "My Exports — Simulation Only";
  const exportSub = byId("view-exports").querySelector(".section-subtitle");
  if (exportSub) exportSub.textContent = "Demonstration of queue states. There are no backend workers, generated files, downloads or audit logs in this prototype.";
  const reportSub = byId("view-reports").querySelector(".section-subtitle");
  if (reportSub) reportSub.textContent += " · All values on this page are synthetic examples.";

  // Trend inherits the last executed Explorer preview (not unsaved draft filters).
  const chart = byId("trendCanvas"), chartWrap = byId("trendCanvasWrap");
  chart.setAttribute("tabindex", "0");
  chart.setAttribute("role", "img");
  chart.setAttribute("aria-label", "Simulated trend. Use left or right arrow keys to inspect time buckets; details also available as a table.");
  chart.setAttribute("aria-describedby", "trendReadout");
  const trendHint = document.createElement("div");
  trendHint.id = "uxTrendHint";
  trendHint.className = "ux-trend-hint";
  byId("view-trends").querySelector(".trend-controls").after(trendHint);
  const trendDetails = document.createElement("details");
  trendDetails.className = "ux-trend-details";
  trendDetails.innerHTML = '<summary>View selected demo trend values in an accessible data table</summary><div class="ux-details-scroll"><table id="uxTrendTable"><caption class="sr-only">Sample trend values by selected plant and ICT time bucket</caption></table></div>';
  byId("view-trends").querySelector(".trend-plot-area").after(trendDetails);
  const dynLegend = document.createElement("div");
  dynLegend.id = "uxSeriesLegend";
  dynLegend.className = "demo-evidence";
  const legend = byId("view-trends").querySelector(".trend-legend");
  legend.querySelectorAll(".legend-item").forEach(el => el.classList.add("hidden"));
  legend.prepend(dynLegend);
  let pointerIndex = -1;
  const activeSeries = () => {
    const ids = state.previewContext ? state.previewContext.sites : [];
    return seriesDefinitions.filter(s => ids.includes(s.id));
  };
  const chartColor = s => state.theme === "dark" ? s.colorDark : s.colorLight;
  const seriesValue = (s, point) => s.value(point);
  const maxAxis = value => {
    if (!(value > 0)) return 100;
    const unit = Math.pow(10, Math.floor(Math.log10(value)));
    return Math.ceil(value / unit * 2) * unit / 2;
  };
  function renderTrendCompanion(series) {
    if (!series.length) {
      trendHint.innerHTML = "<strong>No executed Explorer selection.</strong> Run a demo preview, then choose Open in Trend.";
      dynLegend.textContent = "No series selected";
      byId("uxTrendTable").innerHTML = "";
      byId("view-trends").querySelector(".trend-summary-strip").textContent = "No demo query selection. Run Explorer Preview first.";
      return;
    }
    trendHint.textContent = "SIMULATED TREND · " + series.length + " selected site(s) · " +
      state.previewContext.resolution + " requested · illustration plotted at 15-minute intervals. No SQL data is displayed.";
    dynLegend.innerHTML = series.map(s => '<span class="legend-item"><span class="legend-swatch" style="background:' +
      chartColor(s) + '"></span>' + htmlEscape(s.label) + "</span>").join("");
    const heading = '<thead><tr><th>ICT time</th>' + series.map(s => "<th>" + htmlEscape(s.label) + " (kW)</th>").join("") + "</tr></thead>";
    const body = trendData.map(p => "<tr><td>" + htmlEscape(p.label) + "</td>" +
      series.map(s => "<td>" + (seriesValue(s, p) === null ? "NULL" : seriesValue(s, p).toFixed(1)) + "</td>").join("") + "</tr>").join("");
    byId("uxTrendTable").innerHTML = heading + "<tbody>" + body + "</tbody>";
    const peak = series.reduce((max, s) => Math.max(max, ...trendData.map(p => seriesValue(s, p) || 0)), 0);
    const hasGap = series.some(s => s.id === "Plant-SE-02");
    const hasLimit = series.some(s => s.id === "Plant-HW-04");
    byId("view-trends").querySelector(".trend-summary-strip").innerHTML =
      '<div><div class="summary-label">Demo series</div><div class="summary-val font-mono-tech">' + series.length + "</div></div>" +
      '<div><div class="summary-label">Sample peak (kW)</div><div class="summary-val font-mono-tech">' + peak.toFixed(1) + "</div></div>" +
      '<div><div class="summary-label">Telemetry gaps</div><div class="summary-val font-mono-tech">' + (hasGap ? "3 sample buckets (SE-02)" : "No flagged demo gaps") + "</div></div>" +
      '<div><div class="summary-label">Export limitation</div><div class="summary-val font-mono-tech">' + (hasLimit ? "HW-04 · demo event" : "No selected demo event") + "</div></div>";
  }
  window.drawTrendChart = function () {
    if (!chartWrap || chartWrap.offsetParent === null) return;
    const rect = chartWrap.getBoundingClientRect();
    const W = Math.floor(rect.width), H = Math.floor(rect.height);
    if (W < 120 || H < 120) return;
    const dpr = window.devicePixelRatio || 1;
    chart.width = Math.floor(W * dpr); chart.height = Math.floor(H * dpr);
    const ctx = chart.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const series = activeSeries();
    renderTrendCompanion(series);
    if (!series.length) {
      ctx.fillStyle = state.theme === "dark" ? "#CBD5E1" : "#475569";
      ctx.font = "14px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Run a demo query in Data Explorer to see a sample trend.", W / 2, H / 2);
      byId("trendReadout").textContent = "No selected query. Go to Data Explorer and run a demo preview.";
      return;
    }
    const values = series.flatMap(s => trendData.map(p => seriesValue(s, p))).filter(v => v !== null);
    const maxY = maxAxis(Math.max(...values, 100));
    const pad = { top: 30, right: 22, bottom: 34, left: 72 };
    const pw = W - pad.left - pad.right, ph = H - pad.top - pad.bottom;
    const x = i => pad.left + i / (trendData.length - 1) * pw;
    const y = v => pad.top + ph - v / maxY * ph;
    const textColor = state.theme === "dark" ? "#CBD5E1" : "#475569";
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (let step = 0; step <= 5; step++) {
      const val = maxY * step / 5, pos = y(val);
      ctx.strokeStyle = state.theme === "dark" ? "#243047" : "#D9E2EA";
      ctx.beginPath(); ctx.moveTo(pad.left, pos); ctx.lineTo(W - pad.right, pos); ctx.stroke();
      ctx.fillStyle = textColor; ctx.fillText(val.toLocaleString(undefined, { maximumFractionDigits: 0 }), pad.left - 8, pos);
    }
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let i = 0; i < trendData.length; i += 8) {
      ctx.fillStyle = textColor; ctx.fillText(trendData[i].label, x(i), H - pad.bottom + 9);
    }
    if (series.some(s => s.id === "Plant-SE-02") && byId("toggleGapBand").checked) {
      ctx.fillStyle = state.theme === "dark" ? "rgba(251,113,133,.14)" : "rgba(225,29,72,.1)";
      ctx.fillRect(x(20.5), pad.top, x(23.5) - x(20.5), ph);
    }
    if (series.some(s => s.id === "Plant-HW-04") && byId("toggleCurtailBand").checked) {
      ctx.fillStyle = state.theme === "dark" ? "rgba(251,191,36,.12)" : "rgba(180,83,9,.12)";
      ctx.fillRect(x(28), pad.top, x(33) - x(28), ph);
    }
    for (const s of series) {
      ctx.strokeStyle = chartColor(s); ctx.lineWidth = 2.2; ctx.beginPath();
      let drawing = false;
      trendData.forEach((p, i) => {
        const v = seriesValue(s, p);
        if (v === null) { drawing = false; return; }
        if (drawing) ctx.lineTo(x(i), y(v)); else { ctx.moveTo(x(i), y(v)); drawing = true; }
      });
      ctx.stroke();
    }
    if (pointerIndex >= 0 && pointerIndex < trendData.length) {
      ctx.strokeStyle = textColor; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(x(pointerIndex), pad.top); ctx.lineTo(x(pointerIndex), pad.top + ph); ctx.stroke();
      series.forEach(s => {
        const v = seriesValue(s, trendData[pointerIndex]); if (v === null) return;
        ctx.fillStyle = chartColor(s); ctx.beginPath(); ctx.arc(x(pointerIndex), y(v), 4, 0, Math.PI * 2); ctx.fill();
      });
    }
  };
  window.updateChartPointer = function (clientX) {
    if (!activeSeries().length) return;
    const r = chart.getBoundingClientRect(), pw = Math.max(1, r.width - 94);
    pointerIndex = Math.round(Math.max(0, Math.min(1, (clientX - r.left - 72) / pw)) * (trendData.length - 1));
    updateReadout(); window.drawTrendChart();
  };
  function updateReadout() {
    if (pointerIndex < 0 || !activeSeries().length) return;
    const p = trendData[pointerIndex];
    byId("trendReadout").textContent = "DEMO · 2026-11-24 " + p.label + " ICT · " +
      activeSeries().map(s => s.label + ": " + (seriesValue(s, p) === null ? "NULL" : seriesValue(s, p).toFixed(1) + " kW")).join(" · ");
  }
  chart.addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    if (e.key === "Home") pointerIndex = 0;
    else if (e.key === "End") pointerIndex = trendData.length - 1;
    else if (e.key === "ArrowRight") pointerIndex = Math.min(trendData.length - 1, Math.max(-1, pointerIndex) + 1);
    else pointerIndex = Math.max(0, (pointerIndex < 0 ? trendData.length : pointerIndex) - 1);
    updateReadout(); window.drawTrendChart();
  });
  const baseReadout = "SIMULATED DATA · Use mouse or arrow keys to inspect. Data table is below the plot.";
  byId("trendReadout").textContent = baseReadout;

  // Keyboard and focus behavior for navigation and command palette.
  document.querySelectorAll(".nav-item").forEach(btn => {
    const title = viewTitles[btn.dataset.view] || btn.dataset.view;
    btn.setAttribute("aria-label", title + " workspace");
    btn.title = title;
  });
  const sidebar = byId("sidebar");
  const mobileMenu = byId("mobileMenuBtn");
  const modal = byId("cmdModal");
  modal.addEventListener("keydown", e => {
    if (e.key !== "Tab" || !modal.classList.contains("open")) return;
    const focusables = Array.from(modal.querySelectorAll("input:not([disabled]),button:not([disabled])"));
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  sidebar.addEventListener("keydown", e => {
    if (e.key !== "Tab" || !sidebar.classList.contains("mobile-open")) return;
    const focusables = Array.from(sidebar.querySelectorAll("button:not([disabled])")).filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  mobileMenu.addEventListener("click", () => {
    if (sidebar.classList.contains("mobile-open")) {
      const first = sidebar.querySelector(".nav-item"); if (first) first.focus();
    } else mobileMenu.focus();
  });
  // Store theme preference only on this browser. Graceful fallback for restrictive browsers.
  try {
    const savedTheme = localStorage.getItem("solar-prototype-theme");
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    if ((savedTheme === "light" || (!savedTheme && prefersLight)) && state.theme !== "light") byId("themeToggleBtn").click();
    byId("themeToggleBtn").addEventListener("click", () => localStorage.setItem("solar-prototype-theme", state.theme));
  } catch (_) { /* localStorage may be blocked on restricted corporate browsers */ }

  // Initial state: sample-only, explicit run required; no silent query on page load.
  renderExports();
  byId("expGroupSelect").value = "om_morning";
  window.applyExplorerGroup("om_morning");
  if (location.hash.startsWith("#/")) {
    const requested = location.hash.slice(2);
    if (byId("view-" + requested)) window.switchView(requested, { history: false, focus: false });
  }
})();

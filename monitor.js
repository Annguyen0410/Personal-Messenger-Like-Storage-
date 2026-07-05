console.log("[Monitor] JS loaded");
console.log("[Monitor] Checking window.monitorApi...");

(function () {
  "use strict";

  var api = window.monitorApi;
  if (!api) {
    alert("ERROR: window.monitorApi not found!");
    document.title = "ERROR: API missing";
    return;
  }
  console.log("[Monitor] monitorApi found:", Object.keys(api));

  /* ===== MOCK DATA ===== */
  var MOCK = { features: [
    { geometry: { coordinates: [140.5, 37.2, 15] }, properties: { mag: 5.1, place: "Fukushima, Japan", time: Date.now() - 300000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [-71.2, -33.4, 35] }, properties: { mag: 4.3, place: "Santiago, Chile", time: Date.now() - 900000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [26.5, 38.2, 8] }, properties: { mag: 3.8, place: "Aegean Sea, Turkey", time: Date.now() - 1800000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [-122.4, 37.8, 10] }, properties: { mag: 2.9, place: "San Francisco, CA", time: Date.now() - 3600000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [100.5, 13.7, 5] }, properties: { mag: 4.7, place: "Bangkok, Thailand", time: Date.now() - 5400000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [37.0, 55.7, 12] }, properties: { mag: 3.2, place: "Moscow, Russia", time: Date.now() - 7200000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [-0.1, 51.5, 20] }, properties: { mag: 2.1, place: "London, UK", time: Date.now() - 9000000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [151.2, -33.9, 25] }, properties: { mag: 3.5, place: "Sydney, Australia", time: Date.now() - 10800000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [-43.2, -22.9, 40] }, properties: { mag: 4.0, place: "Rio de Janeiro, Brazil", time: Date.now() - 12600000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [77.2, 28.6, 18] }, properties: { mag: 3.6, place: "New Delhi, India", time: Date.now() - 14400000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [139.7, 35.7, 30] }, properties: { mag: 2.8, place: "Tokyo, Japan", time: Date.now() - 16200000, url: "#", tsunami: 0 } },
    { geometry: { coordinates: [-99.1, 19.4, 50] }, properties: { mag: 3.9, place: "Mexico City, Mexico", time: Date.now() - 18000000, url: "#", tsunami: 0 } }
  ] };

  var NEWS = [
    "Global seismic activity up 12% this week compared to monthly average",
    "New deep-sea sensor network deployed across Pacific Ring of Fire",
    "AI-powered early warning system achieves 94% detection accuracy",
    "Undersea cable damage linked to tectonic shift near Iceland",
    "Volcanic activity increases at Mount Etna — monitoring elevated",
    "Satellite data reveals new fault line beneath Western Pacific",
    "Emergency response teams on standby for coastal regions",
    "International seismic cooperation treaty signed by 40 nations",
    "Record number of micro-tremors detected along San Andreas Fault",
    "Deep earthquake swarm detected beneath Yellowstone Caldera"
  ];

  var THREATS = [
    { lvl: "info", msg: "Port scan detected from {ip} — blocked by firewall" },
    { lvl: "warn", msg: "Unusual outbound traffic spike on port {port}" },
    { lvl: "crit", msg: "Brute force attempt on SSH from {ip} — {n} failed logins" },
    { lvl: "ok", msg: "Firewall rule updated — {ip} permanently banned" },
    { lvl: "warn", msg: "DNS tunneling signature detected — analyzing payload" },
    { lvl: "info", msg: "TLS handshake anomaly from {ip}:{port}" },
    { lvl: "crit", msg: "Zero-day exploit signature matched in network packet" },
    { lvl: "ok", msg: "IDS signature database updated — {n} new rules loaded" },
    { lvl: "warn", msg: "Lateral movement detected — host {ip} flagged" },
    { lvl: "info", msg: "Honeypot interaction from {ip} — logging payload" },
    { lvl: "crit", msg: "Ransomware C2 beacon pattern identified — isolating host" },
    { lvl: "ok", msg: "Threat quarantined — malware sample sent to sandbox" },
    { lvl: "warn", msg: "Anomalous API call frequency from internal service" },
    { lvl: "info", msg: "GeoIP mismatch — traffic from {ip} routed via {country}" },
    { lvl: "crit", msg: "Privilege escalation attempt on node-{n} — denied" }
  ];

  /* ===== HELPERS ===== */
  function $(id) { return document.getElementById(id); }
  function rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function rndIp() { return rng(1,223) + "." + rng(0,255) + "." + rng(0,255) + "." + rng(1,254); }
  function pad(n) { return String(n).padStart(2, "0"); }

  function depthColor(d) {
    if (d < 10) return "#ff2222"; if (d < 30) return "#ff6600"; if (d < 70) return "#ffaa00";
    if (d < 150) return "#aacc00"; if (d < 300) return "#00aa44"; if (d < 500) return "#0088ff"; return "#7700cc";
  }
  function magBg(m) {
    if (m >= 6) return "#ff2222"; if (m >= 5) return "#ff6600"; if (m >= 4) return "#ffaa00"; if (m >= 3) return "#44aa44"; return "#557755";
  }
  function fmtTime(t) { return new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

  /* ===== STEP 1: CLOSE BUTTON (must work unconditionally) ===== */
  function closeMonitor() {
    console.log("[Monitor] Closing...");
    api.close();
  }
  var btn = $("closeBtn");
  if (btn) {
    btn.onclick = closeMonitor;
    console.log("[Monitor] Close button wired");
  } else {
    console.error("[Monitor] Close button NOT FOUND");
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMonitor(); });

  /* ===== STEP 2: LIVE CLOCK ===== */
  function tickClock() {
    var el = $("clock");
    if (!el) return;
    var now = new Date();
    el.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + " UTC";
  }
  tickClock();
  setInterval(tickClock, 1000);
  console.log("[Monitor] Clock started");

  /* ===== STEP 3: BREAKING NEWS ===== */
  (function () {
    var el = $("newsTrack");
    if (!el) return;
    var html = "";
    for (var i = 0; i < NEWS.length; i++) {
      html += '<span><span class="news-dot"></span>' + NEWS[i] + '</span>';
    }
    el.innerHTML = html + html;
    console.log("[Monitor] News ticker populated");
  })();

  /* ===== STEP 4: THREAT LOG ===== */
  function addThreatLine() {
    var body = $("threatLog");
    if (!body) return;
    var tpl = THREATS[rng(0, THREATS.length - 1)];
    var now = new Date();
    var ts = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    var msg = tpl.msg
      .replace("{ip}", rndIp())
      .replace("{port}", String(rng(1024, 65535)))
      .replace("{n}", String(rng(3, 999)))
      .replace("{country}", ["RU", "CN", "KP", "IR", "BR", "NG", "RO", "UA"][rng(0, 7)]);
    var line = document.createElement("div");
    line.className = "threat-line";
    line.innerHTML = '<span class="t-time">[' + ts + ']</span> <span class="t-' + tpl.lvl + '">[' + tpl.lvl.toUpperCase() + ']</span> ' + msg;
    body.appendChild(line);
    if (body.children.length > 50) body.removeChild(body.firstChild);
    body.scrollTop = body.scrollHeight;
  }
  for (var t = 0; t < 8; t++) addThreatLine();
  setInterval(function () { addThreatLine(); }, rng(2000, 5000));
  console.log("[Monitor] Threat log started");

  /* ===== STEP 5: STATS PANEL ===== */
  function renderStats(features) {
    var st = $("stats");
    if (!st) return;
    var total = features.length, maxMag = 0, significant = 0, avgDepth = 0;
    for (var i = 0; i < features.length; i++) {
      var m = features[i].properties.mag, d = features[i].geometry.coordinates[2];
      if (m > maxMag) maxMag = m;
      if (m >= 4.5) significant++;
      avgDepth += d;
    }
    avgDepth = total ? (avgDepth / total).toFixed(1) : "0";
    st.innerHTML =
      '<div class="stat-row"><span class="stat-label">Total (24h)</span><span class="stat-value">' + total + '</span></div>' +
      '<div class="stat-row"><span class="stat-label">Max Magnitude</span><span class="stat-value mag">' + maxMag.toFixed(1) + '</span></div>' +
      '<div class="stat-row"><span class="stat-label">Significant (4.5+)</span><span class="stat-value">' + significant + '</span></div>' +
      '<div class="stat-row"><span class="stat-label">Avg Depth</span><span class="stat-value">' + avgDepth + ' km</span></div>';
  }
  renderStats(MOCK.features);
  console.log("[Monitor] Stats rendered");

  /* ===== STEP 6: TICKER ===== */
  function renderTicker(features) {
    var tk = $("ticker");
    if (!tk) return;
    var sorted = features.slice().sort(function (a, b) { return b.properties.time - a.properties.time; });
    var html = "";
    for (var i = 0; i < sorted.length; i++) {
      var q = sorted[i];
      var m = q.properties.mag;
      var p = (q.properties.place || "?").replace(/,?\s*region of/i, "").trim();
      var d = q.geometry.coordinates[2];
      html += '<span class="tq-item"><span class="tq-mag" style="background:' + magBg(m) + '">M' + m.toFixed(1) + '</span><span class="tq-place">' + p + '</span><span class="tq-depth">' + d.toFixed(0) + 'km</span></span>';
    }
    tk.innerHTML = html + html;
  }
  renderTicker(MOCK.features);
  console.log("[Monitor] Ticker rendered");

  /* ===== STEP 7: MAP (last, guarded) ===== */
  var map = null, quakeLayer = null;
  try {
    if (typeof L !== "undefined" && $("map")) {
      map = L.map("map", { center: [20, 0], zoom: 2, zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OSM &copy; CARTO', subdomains: "abcd", maxZoom: 19
      }).addTo(map);
      quakeLayer = L.layerGroup().addTo(map);
      console.log("[Monitor] Map initialized");
    } else {
      console.warn("[Monitor] Leaflet not available — skipping map");
    }
  } catch (e) {
    console.error("[Monitor] Map init error:", e);
  }

  function renderMap(features) {
    if (!map || !quakeLayer) return;
    quakeLayer.clearLayers();
    for (var i = 0; i < features.length; i++) {
      var f = features[i];
      var lng = f.geometry.coordinates[0], lat = f.geometry.coordinates[1];
      var depth = f.geometry.coordinates[2];
      var mag = f.properties.mag;
      var color = depthColor(depth);
      var circle = L.circleMarker([lat, lng], {
        radius: Math.min(28, Math.max(4, mag * 3.2)),
        fillColor: color, color: "#000", weight: 1, opacity: 0.8, fillOpacity: 0.55
      });
      circle.bindPopup(
        '<div class="popup-mag" style="color:' + color + '">M ' + mag.toFixed(1) + '</div>' +
        '<div class="popup-place">' + (f.properties.place || "Unknown") + '</div>' +
        '<div class="popup-row"><span class="popup-label">Depth</span><span class="popup-value">' + depth.toFixed(1) + ' km</span></div>' +
        '<div class="popup-row"><span class="popup-label">Time</span><span class="popup-value">' + fmtTime(f.properties.time) + '</span></div>' +
        (f.properties.tsunami ? '<div class="popup-row"><span class="popup-label">Tsunami</span><span class="popup-value" style="color:#ff4444">Yes</span></div>' : '')
      );
      quakeLayer.addLayer(circle);
    }
  }
  try { renderMap(MOCK.features); } catch (e) {}

  /* ===== STEP 8: LIVE DATA FETCH ===== */
  function populate(d) {
    try { renderStats(d.features); } catch (e) {}
    try { renderTicker(d.features); } catch (e) {}
    try { renderMap(d.features); } catch (e) {}
    var ut = $("updateTime");
    if (ut) ut.textContent = "Updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  async function fetchQuakes() {
    try {
      var live = await api.fetchQuakes();
      if (live && live.features && live.features.length) { populate(live); return; }
    } catch (e) {
      console.warn("[Monitor] Live fetch failed:", e);
    }
    populate(MOCK);
  }

  fetchQuakes();
  setInterval(fetchQuakes, 60000);

  console.log("[Monitor] FULLY INITIALIZED");
})();

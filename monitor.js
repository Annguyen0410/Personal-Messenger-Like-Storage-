console.log("[Monitor] JS loaded");

(function () {
  "use strict";

  var api = window.monitorApi;
  if (!api) {
    alert("ERROR: window.monitorApi not found!");
    document.title = "ERROR: API missing";
    return;
  }
  console.log("[Monitor] monitorApi found:", Object.keys(api));

  /* ===== WIDGET TOGGLE SYSTEM ===== */
  var WIDGETS = [
    { id: "finTicker", name: "Markets Ticker", color: "#00ff88", default: true },
    { id: "stats", name: "Seismic Stats", color: "#00ff88", default: true },
    { id: "tzPanel", name: "Global Time", color: "#0088ff", default: true },
    { id: "sysPanel", name: "System Status", color: "#ffaa00", default: true },
    { id: "threatLevel", name: "Threat Level", color: "#ff6600", default: true },
    { id: "uptimePanel", name: "Uptime", color: "#00ff88", default: true },
    { id: "satPanel", name: "Satellites", color: "#0088ff", default: true },
    { id: "alertPanel", name: "Alert Counter", color: "#ff4444", default: true },
    { id: "threatPanel", name: "Threat Log", color: "#ff4444", default: true },
    { id: "netPanel", name: "Network I/O", color: "#ffaa00", default: true },
    { id: "devicesPanel", name: "Connected Nodes", color: "#0088ff", default: true },
    { id: "layerBar", name: "Map Layers", color: "#ff6600", default: true },
    { id: "newsTicker", name: "Breaking News", color: "#cc0000", default: true },
    { id: "quakeTicker", name: "Quake Ticker", color: "#ff6600", default: true }
  ];

  function isVisible(id) {
    var key = "wm_widget_" + id;
    var stored = localStorage.getItem(key);
    if (stored === null) return true;
    return stored === "1";
  }

  function toggleWidget(id) {
    var visible = isVisible(id);
    var newVisible = !visible;
    localStorage.setItem("wm_widget_" + id, newVisible ? "1" : "0");
    var el = document.querySelector('[data-widget="' + id + '"]');
    if (el) {
      if (newVisible) el.classList.remove("widget-collapsed");
      else el.classList.add("widget-collapsed");
    }
    // Sidebar toggles are handled by the sbCollapse click handler
    buildWidgetMenu();
  }

  function updateTickerLayout() {
    var newsWrap = document.querySelector('[data-widget="newsTicker"]');
    var quakeWrap = document.querySelector('[data-widget="quakeTicker"]');
    var sidebar = document.getElementById("sidebar");

    // Tickers follow ONLY the sidebar — nothing else
    var indent = 0;
    if (sidebar) {
      indent = sidebar.getBoundingClientRect().right + 6;
    }

    // Clamp: never eat more than 55% of screen
    indent = Math.min(indent, window.innerWidth * 0.55);

    if (newsWrap) newsWrap.style.left = indent + "px";
    if (quakeWrap) quakeWrap.style.left = indent + "px";
  }

  function buildWidgetMenu() {
    var menu = document.getElementById("widgetsMenu");
    if (!menu) return;
    var html = "";
    for (var i = 0; i < WIDGETS.length; i++) {
      var w = WIDGETS[i];
      var vis = isVisible(w.id);
      html += '<div class="widgets-menu-item' + (vis ? '' : ' off') + '" data-w="' + w.id + '">' +
        '<span><span class="wm-dot" style="background:' + w.color + '"></span>' + w.name + '</span>' +
        '<span class="wm-check">' + (vis ? '✓' : '') + '</span></div>';
      if (i === 7) html += '<div class="widgets-menu-divider"></div>';
    }
    menu.innerHTML = html;
    // Wire clicks
    var items = menu.querySelectorAll(".widgets-menu-item");
    for (var i = 0; i < items.length; i++) {
      (function (item) {
        item.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleWidget(item.getAttribute("data-w"));
        });
      })(items[i]);
    }
  }

  // Initialize all widgets from localStorage
  for (var i = 0; i < WIDGETS.length; i++) {
    var w = WIDGETS[i];
    if (!isVisible(w.id)) {
      var el = document.querySelector('[data-widget="' + w.id + '"]');
      if (el) el.classList.add("widget-collapsed");
    }
  }
  buildWidgetMenu();
  updateTickerLayout();

  // Wire toggle buttons via delegation (fixed on document, survives innerHTML changes)
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".widget-toggle");
    if (!btn) {
      // Click on a collapsed widget itself (not the toggle button) = restore it
      var collapsedEl = e.target.closest(".widget-collapsed");
      if (collapsedEl) {
        var wid = collapsedEl.getAttribute("data-widget");
        if (wid) toggleWidget(wid);
      }
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    var target = btn.getAttribute("data-target");
    if (target) toggleWidget(target);
  });

  // Re-measure tickers on window resize
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateTickerLayout, 150);
  });

  // Widget menu button
  var widgetsBtn = document.getElementById("widgetsBtn");
  var widgetsMenu = document.getElementById("widgetsMenu");
  if (widgetsBtn && widgetsMenu) {
    widgetsBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      buildWidgetMenu();
      widgetsMenu.classList.toggle("open");
    });
    document.addEventListener("click", function () {
      widgetsMenu.classList.remove("open");
    });
  }

  console.log("[Monitor] Widget toggle system initialized");

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

  /* ===== COUNTRY RISK DATA ===== */
  var COUNTRIES = [
    { iso: "US", name: "United States", flag: "\uD83C\uDDFA\uD83C\uDDF8", lat: 39, lng: -98, ii: 22, ri: 82, domains: [78,85,72,91,88,80] },
    { iso: "CN", name: "China", flag: "\uD83C\uDDE8\uD83C\uDDF3", lat: 35, lng: 105, ii: 48, ri: 68, domains: [72,65,58,81,75,62] },
    { iso: "RU", name: "Russia", flag: "\uD83C\uDDF7\uD83C\uDDFA", lat: 60, lng: 90, ii: 67, ri: 45, domains: [55,42,38,50,61,38] },
    { iso: "IN", name: "India", flag: "\uD83C\uDDEE\uD83C\uDDF3", lat: 21, lng: 78, ii: 41, ri: 55, domains: [58,52,48,60,62,50] },
    { iso: "BR", name: "Brazil", flag: "\uD83C\uDDE7\uD83C\uDDF7", lat: -10, lng: -55, ii: 52, ri: 48, domains: [50,45,42,55,48,40] },
    { iso: "GB", name: "United Kingdom", flag: "\uD83C\uDDEC\uD83C\uDDE7", lat: 54, lng: -2, ii: 18, ri: 85, domains: [80,88,78,90,85,82] },
    { iso: "DE", name: "Germany", flag: "\uD83C\uDDE9\uD83C\uDDEA", lat: 51, lng: 10, ii: 15, ri: 88, domains: [82,90,85,88,92,84] },
    { iso: "FR", name: "France", flag: "\uD83C\uDDEB\uD83C\uDDF7", lat: 46, lng: 2, ii: 20, ri: 84, domains: [80,86,80,85,88,78] },
    { iso: "JP", name: "Japan", flag: "\uD83C\uDDEF\uD83C\uDDF5", lat: 36, lng: 138, ii: 25, ri: 80, domains: [78,82,75,88,80,76] },
    { iso: "KR", name: "South Korea", flag: "\uD83C\uDDF0\uD83C\uDDF7", lat: 36, lng: 128, ii: 30, ri: 76, domains: [75,78,72,82,76,70] },
    { iso: "IR", name: "Iran", flag: "\uD83C\uDDEE\uD83C\uDDF7", lat: 32, lng: 53, ii: 74, ri: 32, domains: [38,30,28,35,42,25] },
    { iso: "KP", name: "North Korea", flag: "\uD83C\uDDF0\uD83C\uDDF5", lat: 40, lng: 127, ii: 89, ri: 18, domains: [22,15,12,18,28,10] },
    { iso: "SA", name: "Saudi Arabia", flag: "\uD83C\uDDF8\uD83C\uDDE6", lat: 24, lng: 45, ii: 38, ri: 58, domains: [55,62,48,60,65,52] },
    { iso: "TR", name: "Turkey", flag: "\uD83C\uDDF9\uD83C\uDDF7", lat: 39, lng: 35, ii: 55, ri: 42, domains: [45,40,38,48,52,35] },
    { iso: "NG", name: "Nigeria", flag: "\uD83C\uDDF3\uD83C\uDDEC", lat: 9, lng: 8, ii: 68, ri: 28, domains: [32,28,22,35,38,20] },
    { iso: "ZA", name: "South Africa", flag: "\uD83C\uDDFF\uD83C\uDDE6", lat: -29, lng: 24, ii: 45, ri: 48, domains: [50,45,42,55,48,40] },
    { iso: "EG", name: "Egypt", flag: "\uD83C\uDDEA\uD83C\uDDEC", lat: 27, lng: 30, ii: 58, ri: 38, domains: [42,38,35,45,40,32] },
    { iso: "MX", name: "Mexico", flag: "\uD83C\uDDF2\uD83C\uDDFD", lat: 23, lng: -102, ii: 50, ri: 45, domains: [48,42,40,50,45,38] },
    { iso: "ID", name: "Indonesia", flag: "\uD83C\uDDEE\uD83C\uDDE9", lat: -5, lng: 120, ii: 42, ri: 52, domains: [55,50,48,58,52,45] },
    { iso: "AU", name: "Australia", flag: "\uD83C\uDDE6\uD83C\uDDFA", lat: -25, lng: 133, ii: 12, ri: 90, domains: [85,92,88,90,88,86] },
    { iso: "CA", name: "Canada", flag: "\uD83C\uDDE8\uD83C\uDDE6", lat: 56, lng: -106, ii: 10, ri: 92, domains: [88,94,90,92,90,88] },
    { iso: "AR", name: "Argentina", flag: "\uD83C\uDDE6\uD83C\uDDF7", lat: -34, lng: -64, ii: 48, ri: 42, domains: [45,40,38,48,42,35] },
    { iso: "PK", name: "Pakistan", flag: "\uD83C\uDDF5\uD83C\uDDF0", lat: 30, lng: 70, ii: 62, ri: 35, domains: [38,32,28,42,35,25] },
    { iso: "BD", name: "Bangladesh", flag: "\uD83C\uDDE7\uD83C\uDDE9", lat: 24, lng: 90, ii: 55, ri: 38, domains: [40,35,32,45,38,30] },
    { iso: "VN", name: "Vietnam", flag: "\uD83C\uDDFB\uD83C\uDDF3", lat: 16, lng: 108, ii: 35, ri: 55, domains: [58,52,48,60,55,50] },
    { iso: "TH", name: "Thailand", flag: "\uD83C\uDDF9\uD83C\uDDED", lat: 15, lng: 100, ii: 40, ri: 50, domains: [52,48,45,55,50,42] },
    { iso: "MY", name: "Malaysia", flag: "\uD83C\uDDF2\uD83C\uDDFE", lat: 4, lng: 102, ii: 28, ri: 68, domains: [70,65,62,72,68,60] },
    { iso: "SG", name: "Singapore", flag: "\uD83C\uDDF8\uD83C\uDDEC", lat: 1.3, lng: 103.8, ii: 8, ri: 94, domains: [90,95,92,94,92,90] },
    { iso: "AE", name: "UAE", flag: "\uD83C\uDDE6\uD83C\uDDEA", lat: 24, lng: 54, ii: 22, ri: 75, domains: [72,78,68,75,80,70] },
    { iso: "IL", name: "Israel", flag: "\uD83C\uDDEE\uD83C\uDDF1", lat: 31, lng: 35, ii: 55, ri: 62, domains: [65,60,55,68,62,58] },
    { iso: "UA", name: "Ukraine", flag: "\uD83C\uDDFA\uD83C\uDDE6", lat: 49, lng: 32, ii: 72, ri: 35, domains: [38,32,28,42,35,28] },
    { iso: "PL", name: "Poland", flag: "\uD83C\uDDF5\uD83C\uDDF1", lat: 52, lng: 20, ii: 25, ri: 72, domains: [72,68,65,75,70,68] },
    { iso: "IT", name: "Italy", flag: "\uD83C\uDDEE\uD83C\uDDF9", lat: 42, lng: 12, ii: 22, ri: 78, domains: [75,82,78,80,76,74] },
    { iso: "ES", name: "Spain", flag: "\uD83C\uDDEA\uD83C\uDDF8", lat: 40, lng: -3, ii: 20, ri: 76, domains: [74,80,75,78,72,70] },
    { iso: "VE", name: "Venezuela", flag: "\uD83C\uDDFB\uD83C\uDDEA", lat: 8, lng: -66, ii: 82, ri: 22, domains: [28,20,18,25,22,15] },
    { iso: "SY", name: "Syria", flag: "\uD83C\uDDF8\uD83C\uDDFE", lat: 35, lng: 38, ii: 85, ri: 15, domains: [20,15,12,18,15,10] },
    { iso: "AF", name: "Afghanistan", flag: "\uD83C\uDDE6\uD83C\uDDEB", lat: 33, lng: 65, ii: 92, ri: 12, domains: [18,10,8,15,12,8] },
    { iso: "MM", name: "Myanmar", flag: "\uD83C\uDDF2\uD83C\uDDF2", lat: 22, lng: 96, ii: 78, ri: 28, domains: [32,28,22,35,28,20] },
    { iso: "ET", name: "Ethiopia", flag: "\uD83C\uDDEA\uD83C\uDDF9", lat: 9, lng: 40, ii: 65, ri: 30, domains: [35,30,25,38,32,22] },
    { iso: "CO", name: "Colombia", flag: "\uD83C\uDDE8\uD83C\uDDF4", lat: 4, lng: -72, ii: 48, ri: 42, domains: [45,40,38,48,42,38] },
    { iso: "PH", name: "Philippines", flag: "\uD83C\uDDF5\uD83C\uDDED", lat: 13, lng: 122, ii: 42, ri: 48, domains: [50,45,42,52,48,42] },
    { iso: "KE", name: "Kenya", flag: "\uD83C\uDDF0\uD83C\uDDEA", lat: -1, lng: 38, ii: 52, ri: 40, domains: [42,38,35,45,40,35] }
  ];

  var DOMAIN_NAMES = ["Political", "Governance", "Economic", "Social", "Security", "Environment"];
  var DOMAIN_COLORS = ["#0088ff","#aa00ff","#ff8800","#00cc88","#ff4444","#88cc00"];

  /* ===== FINANCIAL DATA ===== */
  var FIN_COMMODITIES = [
    { name: "Brent Crude", sym: "BRENT", price: 82.45, chg: 1.2 },
    { name: "WTI Crude", sym: "WTI", price: 78.30, chg: -0.8 },
    { name: "Natural Gas", sym: "NG", price: 3.42, chg: 2.1 },
    { name: "Gold", sym: "XAU", price: 2342.80, chg: 15.4 },
    { name: "Silver", sym: "XAG", price: 27.65, chg: 0.45 },
    { name: "Copper", sym: "HG", price: 4.52, chg: -0.12 },
    { name: "Wheat", sym: "ZW", price: 612.25, chg: 8.5 },
    { name: "Corn", sym: "ZC", price: 447.50, chg: -3.25 }
  ];

  var FIN_CURRENCIES = [
    { name: "EUR/USD", price: 1.0845, chg: 0.0025 },
    { name: "GBP/USD", price: 1.2630, chg: -0.0040 },
    { name: "USD/JPY", price: 151.42, chg: 0.65 },
    { name: "USD/CNY", price: 7.2350, chg: 0.0080 },
    { name: "USD/INR", price: 83.45, chg: -0.12 },
    { name: "USD/BRL", price: 5.0850, chg: 0.0150 },
    { name: "USD/RUB", price: 92.50, chg: -1.20 },
    { name: "USD/TRY", price: 32.15, chg: 0.35 }
  ];

  var FIN_RATES = [
    { name: "Fed Funds", val: "5.50%", chg: 0 },
    { name: "ECB Deposit", val: "4.00%", chg: 0 },
    { name: "BoE Base", val: "5.25%", chg: 0 },
    { name: "BoJ Policy", val: "0.10%", chg: 0.15 },
    { name: "PBOC LPR 1Y", val: "3.45%", chg: 0 },
    { name: "RBI Repo", val: "6.50%", chg: 0 },
    { name: "CBR Key", val: "16.00%", chg: 0 },
    { name: "CBRT 1W Repo", val: "50.00%", chg: 5.00 }
  ];

  var FIN_PREDICTION = [
    { name: "Recession 2026", val: "28%", chg: -3 },
    { name: "Biden wins 2024", val: "42%", chg: 2 },
    { name: "EU breakup", val: "8%", chg: -1 },
    { name: "China GDP < 4%", val: "55%", chg: 5 },
    { name: "Oil > $100", val: "35%", chg: 8 },
    { name: "BTC > $100k", val: "62%", chg: -4 },
    { name: "Fed cut by Jul", val: "71%", chg: 12 },
    { name: "NATO Art.5 invoked", val: "6%", chg: 1 },
    { name: "Taiwan conflict '26", val: "14%", chg: 3 },
    { name: "AI stock bubble pop", val: "31%", chg: 7 }
  ];

  var FIN_TICKER = [
    { sym: "S&P500", price: 5280.15, chg: "+0.62%" },
    { sym: "NASDAQ", price: 18642.30, chg: "+1.12%" },
    { sym: "FTSE100", price: 8420.55, chg: "-0.18%" },
    { sym: "NIKKEI", price: 38250.40, chg: "+0.84%" },
    { sym: "GOLD", price: 2342.80, chg: "+0.65%" },
    { sym: "BRENT", price: 82.45, chg: "-1.43%" },
    { sym: "BTC", price: 68420, chg: "+2.31%" },
    { sym: "ETH", price: 3510, chg: "-0.82%" },
    { sym: "SOL", price: 178.45, chg: "+4.12%" },
    { sym: "XRP", price: 2.38, chg: "-1.55%" },
    { sym: "EURUSD", price: 1.0845, chg: "+0.23%" },
    { sym: "VIX", price: 14.22, chg: "+5.18%" },
    { sym: "US10Y", price: 4.312, chg: "-1.2bp" },
    { sym: "SHCOMP", price: 3150.80, chg: "-0.45%" },
    { sym: "US2Y", price: 4.065, chg: "-0.8bp" }
  ];

  var FIN_CRYPTO = [
    { name: "Bitcoin", sym: "BTC", icon: "₿", price: 68420, chg: 2.31, dom: "52.8%" },
    { name: "Ethereum", sym: "ETH", icon: "Ξ", price: 3510, chg: -0.82, dom: "17.4%" },
    { name: "Solana", sym: "SOL", icon: "◎", price: 178.45, chg: 4.12, dom: "3.6%" },
    { name: "XRP", sym: "XRP", icon: "✕", price: 2.38, chg: -1.55, dom: "2.8%" },
    { name: "BNB", sym: "BNB", icon: "⬡", price: 612.30, chg: 1.04, dom: "2.5%" },
    { name: "Cardano", sym: "ADA", icon: "▲", price: 0.72, chg: -3.20, dom: "1.1%" },
    { name: "Avalanche", sym: "AVAX", icon: "◈", price: 38.15, chg: 5.40, dom: "0.9%" },
    { name: "Polygon", sym: "MATIC", icon: "⬡", price: 0.46, chg: -2.10, dom: "0.5%" }
  ];

  var FIN_STOCKS = [
    { name: "S&P 500", sym: "S&P500", price: 5280.15, chg: 0.62 },
    { name: "NASDAQ", sym: "NASDAQ", price: 18642.30, chg: 1.12 },
    { name: "FTSE 100", sym: "FTSE100", price: 8420.55, chg: -0.18 },
    { name: "Nikkei 225", sym: "NIKKEI", price: 38250.40, chg: 0.84 },
    { name: "Shanghai Comp.", sym: "SHCOMP", price: 3150.80, chg: -0.45 },
    { name: "VIX", sym: "VIX", price: 14.22, chg: 5.18 },
    { name: "US 10Y Yield", sym: "US10Y", price: 4.312, chg: -0.12 },
    { name: "US 2Y Yield", sym: "US2Y", price: 4.065, chg: -0.08 }
  ];

  var FIN_YIELD = [
    { name: "US 2Y-10Y Spread", val: "24.7bp", chg: -3.2 },
    { name: "US 3M-10Y Spread", val: "-18.5bp", chg: -2.1 },
    { name: "DE 2Y-10Y Spread", val: "-12.3bp", chg: -1.5 },
    { name: "UK 2Y-10Y Spread", val: "8.4bp", chg: 1.2 },
    { name: "JP 2Y-10Y Spread", val: "31.2bp", chg: 0.8 }
  ];

  var FG_INDEX = { val: 72, label: "GREED", prev: 65 };

  var FIN_GDP = [
    { name: "US GDP Growth", val: "2.8%", chg: 0.3 },
    { name: "CN GDP Growth", val: "4.6%", chg: -0.2 },
    { name: "EU GDP Growth", val: "0.9%", chg: 0.1 },
    { name: "US CPI (YoY)", val: "3.2%", chg: -0.1 },
    { name: "CN CPI (YoY)", val: "0.5%", chg: 0.2 },
    { name: "EU CPI (YoY)", val: "2.4%", chg: -0.3 },
    { name: "US Unemployment", val: "4.1%", chg: 0.1 },
    { name: "CN Unemployment", val: "5.2%", chg: 0.0 }
  ];

  var INFRA_CABLES = [
    { name: "SEA-ME-WE 5", path: "Asia-Europe", status: "ok", fault: "None" },
    { name: "FLAG Atlantic-1", path: "US-Europe", status: "ok", fault: "None" },
    { name: "AAE-1", path: "Asia-Africa-Europe", status: "warn", fault: "Segment latency spike" },
    { name: "SEACOM/Tata", path: "Africa-Asia", status: "crit", fault: "Repair ship en route, ETA 4d" },
    { name: "Southern Cross", path: "US-Australia-NZ", status: "ok", fault: "None" },
    { name: "2Africa", path: "Circum-Africa", status: "warn", fault: "Partial fault near Lagos" },
    { name: "Grace Hopper", path: "US-UK-Spain", status: "ok", fault: "None" },
    { name: "Asia-America Gateway", path: "SE Asia-US", status: "ok", fault: "None" }
  ];

  var INFRA_PORTS = [
    { name: "Shanghai", lat: 31, lng: 121.5, congestion: 78, status: "high" },
    { name: "Singapore", lat: 1.3, lng: 103.8, congestion: 62, status: "mod" },
    { name: "Rotterdam", lat: 52, lng: 4, congestion: 45, status: "low" },
    { name: "Los Angeles", lat: 33.7, lng: -118, congestion: 72, status: "high" },
    { name: "Jebel Ali", lat: 25, lng: 55, congestion: 38, status: "low" },
    { name: "Busan", lat: 35, lng: 129, congestion: 55, status: "mod" },
    { name: "Antwerp", lat: 51.3, lng: 4.4, congestion: 50, status: "mod" },
    { name: "Santos", lat: -23.9, lng: -46, congestion: 85, status: "crit" }
  ];

  var INFRA_ENERGY = [
    { name: "US Crude Stockpile", val: 448.2, unit: "M bbl", pct: 42, status: "ok" },
    { name: "EU Gas Storage", val: 62.4, unit: "%", pct: 62, status: "ok" },
    { name: "US Natural Gas", val: 2.48, unit: "Tcf", pct: 55, status: "ok" },
    { name: "SPR (US Strategic)", val: 368, unit: "M bbl", pct: 52, status: "warn" },
    { name: "China SPR", val: 412, unit: "M bbl", pct: 76, status: "ok" },
    { name: "Japan LNG Reserve", val: 2.1, unit: "Mt", pct: 32, status: "warn" }
  ];

  var INFRA_PIPES = [
    { name: "Nord Stream 1/2", status: "crit", detail: "Sabotaged — inoperable" },
    { name: "Druzhba Pipeline", status: "warn", detail: "Reduced flow — sanctions" },
    { name: "Keystone XL", status: "crit", detail: "Cancelled — no flow" },
    { name: "Trans-Saharan Gas", status: "ok", detail: "Operational — normal flow" },
    { name: "BTC Pipeline (Baku-Tbilisi-Ceyhan)", status: "ok", detail: "Operational — 1.2M bbl/day" },
    { name: "Trans-Mountain (Canada)", status: "warn", detail: "Expansion delayed — legal" }
  ];

  // Sanctions level per country (OFAC-style)
  var SANCTIONS = {
    "RU": { level: "crit", label: "Comprehensive" },
    "IR": { level: "crit", label: "Full embargo" },
    "KP": { level: "crit", label: "Full embargo" },
    "CN": { level: "high", label: "Sectoral — tech" },
    "VE": { level: "high", label: "Sectoral — oil" },
    "BY": { level: "high", label: "Sectoral — finance" },
    "MM": { level: "high", label: "Military entities" },
    "CU": { level: "high", label: "Full embargo" },
    "SY": { level: "crit", label: "Full embargo" },
    "TR": { level: "mod", label: "CAATSA warning" },
    "NG": { level: "low", label: "Targeted — Boko Haram" },
    "IN": { level: "low", label: "None active" },
    "SA": { level: "mod", label: "Khashoggi — limited" }
  };

  // Travel advisory levels
  var TRAVEL = {
    "UA": { level: "crit", label: "Do Not Travel" },
    "RU": { level: "crit", label: "Do Not Travel" },
    "IR": { level: "crit", label: "Do Not Travel" },
    "KP": { level: "crit", label: "Do Not Travel" },
    "MM": { level: "high", label: "Reconsider" },
    "VE": { level: "high", label: "Reconsider" },
    "TR": { level: "mod", label: "Exercise Caution" },
    "BR": { level: "mod", label: "Exercise Caution" },
    "NG": { level: "high", label: "Reconsider" },
    "EG": { level: "mod", label: "Exercise Caution" },
    "PH": { level: "mod", label: "Exercise Caution" },
    "KE": { level: "mod", label: "Exercise Caution" },
    "SA": { level: "mod", label: "Exercise Caution" },
    "ID": { level: "low", label: "Normal Precautions" },
    "ZA": { level: "mod", label: "Exercise Caution" }
  };

  // Cable paths for map (approximate)
  var CABLE_PATHS = [
    [{ lat: 50, lng: -4 }, { lat: 40, lng: -70 }, { lat: 37, lng: -76 }], // Grace Hopper
    [{ lat: 1, lng: 104 }, { lat: 7, lng: 80 }, { lat: 12, lng: 45 }, { lat: 30, lng: 32 }, { lat: 36, lng: -5 }], // SEA-ME-WE 5
    [{ lat: 50, lng: -4 }, { lat: 36, lng: -8 }, { lat: -34, lng: 18 }, { lat: -34, lng: 151 }], // FLAG/Southern Cross
    [{ lat: 22, lng: 114 }, { lat: 1, lng: 104 }, { lat: 7, lng: 80 }, { lat: -4, lng: 39 }], // SEACOM
    [{ lat: 6, lng: 3 }, { lat: -5, lng: 12 }, { lat: -29, lng: 31 }, { lat: -34, lng: 18 }], // 2Africa
    [{ lat: 35, lng: 129 }, { lat: 25, lng: 123 }, { lat: 21, lng: 158 }, { lat: 37, lng: -122 }] // Asia-America Gateway
  ];

  /* ===== SCENARIO DATA ===== */
  var SCENARIOS = {
    taiwan:  { name: "Taiwan Strait Crisis", emoji: "🇹🇼", color: "#ff4444", severity: "CRITICAL", prob: 32, timeToImpact: "Days to weeks", regions: [{ lat: 25, lng: 121, r: 3.5 },{ lat: 26, lng: 122, r: 2.5 },{ lat: 31, lng: 122, r: 2 }], chokes: ["Taiwan Strait","South China Sea","Luzon Strait"], sectors: ["Semiconductors","Shipping","Insurance","Defense"], impact: "CRITICAL - 40% global chip supply disrupted", econImpact: "~$2.3T global GDP impact" },
    redsea:  { name: "Red Sea Blockade", emoji: "🚢", color: "#ff8800", severity: "SEVERE", prob: 55, timeToImpact: "Ongoing", regions: [{ lat: 15, lng: 42, r: 4 },{ lat: 22, lng: 38, r: 3 },{ lat: 12, lng: 45, r: 3 }], chokes: ["Bab el-Mandeb","Suez Canal","Strait of Hormuz"], sectors: ["Container Shipping","Energy","Insurance"], impact: "SEVERE - 12% global trade rerouted", econImpact: "~$1.1T trade disruption" },
    ukraine: { name: "Ukraine-Russia Sanctions", emoji: "⚔️", color: "#ff4400", severity: "HIGH", prob: 70, timeToImpact: "Ongoing", regions: [{ lat: 49, lng: 32, r: 5 },{ lat: 55, lng: 37, r: 4 },{ lat: 52, lng: 15, r: 2 }], chokes: ["Black Sea","Turkish Straits","Baltic Sea"], sectors: ["Energy","Agriculture","Metals"], impact: "HIGH - grain/energy prices elevated 15-30%", econImpact: "~$800B cumulative sanctions" },
    hormuz:  { name: "Hormuz Closure", emoji: "🛢️", color: "#ff0000", severity: "CRITICAL", prob: 18, timeToImpact: "Hours to days", regions: [{ lat: 26, lng: 56, r: 3 },{ lat: 25, lng: 55, r: 2.5 },{ lat: 22, lng: 60, r: 3.5 }], chokes: ["Strait of Hormuz","Bab el-Mandeb","Suez Canal"], sectors: ["Crude Oil","LNG","Petrochemicals","Diesel"], impact: "CRITICAL - 21% global oil supply at risk", econImpact: "~$3.8T energy shock" },
    tariffs: { name: "US-China Tariff Shock", emoji: "📦", color: "#ffaa00", severity: "HIGH", prob: 45, timeToImpact: "Months", regions: [{ lat: 39, lng: -98, r: 6 },{ lat: 35, lng: 105, r: 5 }], chokes: ["Panama Canal","South China Sea","Malacca Strait"], sectors: ["Electronics","Agriculture","Automotive","Consumer Goods"], impact: "HIGH - 60% tariff on $300B Chinese goods", econImpact: "~$500B trade displacement" },
    malacca: { name: "Malacca Piracy Surge", emoji: "🛳️", color: "#ff6600", severity: "MODERATE", prob: 25, timeToImpact: "Weeks", regions: [{ lat: 2, lng: 102, r: 2 },{ lat: 1, lng: 104, r: 1.5 }], chokes: ["Malacca Strait","Sunda Strait","Lombok Strait"], sectors: ["Shipping","Energy","Manufacturing"], impact: "MODERATE - 30% of global shipping affected", econImpact: "~$200B insurance spike" },
    panama:  { name: "Panama Canal Drought", emoji: "🌊", color: "#dd8800", severity: "HIGH", prob: 60, timeToImpact: "Ongoing", regions: [{ lat: 9, lng: -80, r: 2 },{ lat: 8, lng: -79, r: 1.5 }], chokes: ["Panama Canal","Suez Canal"], sectors: ["Shipping","LNG","Agriculture","Consumer Goods"], impact: "HIGH - Canal capacity reduced 40%", econImpact: "~$350B trade rerouting" },
    covid:   { name: "Pandemic Resurgence", emoji: "🦠", color: "#ffdd00", severity: "SEVERE", prob: 14, timeToImpact: "Weeks to months", regions: [{ lat: 35, lng: 105, r: 5 },{ lat: 21, lng: 78, r: 4 },{ lat: -5, lng: 120, r: 3 }], chokes: ["All major ports","Air cargo hubs"], sectors: ["All sectors","Healthcare","Travel","Hospitality"], impact: "GLOBAL - supply chains disrupted", econImpact: "~$4T global GDP impact" },
    cyber:   { name: "Global Cyber Attack", emoji: "💻", color: "#aa00ff", severity: "CRITICAL", prob: 22, timeToImpact: "Hours to days", regions: [{ lat: 39, lng: -98, r: 6 },{ lat: 35, lng: 135, r: 4 },{ lat: 52, lng: 13, r: 3 }], chokes: ["Digital infrastructure","Port logistics systems","SWIFT network"], sectors: ["Finance","Energy","Logistics","Government"], impact: "CRITICAL - port operations halted globally", econImpact: "~$1.5T digital disruption" },
    solar:   { name: "Solar Storm / EMP", emoji: "☀️", color: "#ffffff", severity: "CRITICAL", prob: 3, timeToImpact: "Minutes to hours", regions: [{ lat: 60, lng: -100, r: 8 },{ lat: 55, lng: 15, r: 7 },{ lat: -40, lng: 145, r: 5 }], chokes: ["All satellite comms","GPS navigation","Power grids"], sectors: ["All sectors","Aviation","Maritime","Communications"], impact: "CATASTROPHIC - global navigation disabled", econImpact: "~$10T+ civilizational disruption" }
  };

  /* ===== MAP LAYER EVENT DATA ===== */
  function genEvents() {
    var ev = { military: [], naval: [], wildfire: [], cyber: [], disease: [], satellites: [] };
    var mp = [
      { lat: 38, lng: 127 }, { lat: 36, lng: 126 }, { lat: 35, lng: 139 }, { lat: 34, lng: 132 },
      { lat: 25, lng: 121 }, { lat: 31, lng: 121 }, { lat: 55, lng: 37 }, { lat: 52, lng: 20 },
      { lat: 48, lng: 2 }, { lat: 50, lng: 8 }, { lat: 33, lng: 44 }, { lat: 32, lng: 35 },
      { lat: 39, lng: -76 }, { lat: 37, lng: -122 }, { lat: 30, lng: -81 }, { lat: 32, lng: -117 },
      { lat: 23, lng: 57 }, { lat: 25, lng: 55 }
    ];
    for (var i = 0; i < mp.length; i++) {
      ev.military.push({ lat: mp[i].lat + rng(-2,2), lng: mp[i].lng + rng(-2,2), label: "M" });
    }
    var np = [
      { lat: 15, lng: 42 }, { lat: 26, lng: 56 }, { lat: 1, lng: 104 }, { lat: 10, lng: 107 },
      { lat: 22, lng: 114 }, { lat: 35, lng: 25 }, { lat: 38, lng: 15 }, { lat: 9, lng: -80 },
      { lat: 31, lng: 32 }, { lat: 12, lng: 45 }, { lat: -6, lng: 39 }, { lat: 40, lng: 28 }
    ];
    for (var i = 0; i < np.length; i++) {
      ev.naval.push({ lat: np[i].lat + rng(-3,3), lng: np[i].lng + rng(-3,3), label: "N" });
    }
    for (var i = 0; i < 18; i++) {
      var lat = rng(-55, 70), lng = rng(-170, 170);
      ev.wildfire.push({ lat: lat, lng: lng, label: "F" });
      if (Math.random() > 0.5) ev.cyber.push({ lat: rng(-50, 60), lng: rng(-170, 170), label: "C" });
      if (Math.random() > 0.6) ev.disease.push({ lat: rng(-50, 60), lng: rng(-170, 170), label: "D" });
    }
    for (var i = 0; i < 30; i++) {
      ev.satellites.push({ lat: rng(-70, 70), lng: rng(-170, 170), label: "\u{1F6F0}" });
    }
    return ev;
  }

  /* ===== LIVE DATA APIS ===== */
  var liveAircraft = null, liveEONET = null, liveISS = null;
  var API_OPENSKY = "https://opensky-network.org/api/states/all";
  var API_EONET = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=80";
  var API_ISS = "https://api.wheretheiss.at/v1/satellites/25544";
var API_COINGECKO = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin,cardano,avalanche-2,matic-network,tether-gold&vs_currencies=usd&include_24h_change=true";
var API_FOREX = "https://open.er-api.com/v6/latest/USD";
var liveCryptoPrices = null;
var liveForexRates = null;

  function fetchAircraft() {
    fetch(API_OPENSKY)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.states) {
          liveAircraft = data.states.filter(function (s) { return s[5] && s[6] && !s[8]; });
          renderAircraftLayer();
        }
      })
      .catch(function (e) { console.warn("[Monitor] OpenSky fetch failed:", e.message); });
  }

  function renderAircraftLayer() {
    var lg = layerGroups.military;
    if (!lg || !map) return;
    lg.clearLayers();
    var states = liveAircraft || [];
    for (var i = 0; i < states.length; i++) {
      var s = states[i];
      var lng = s[5], lat = s[6], alt = s[7] || 0;
      var callsign = (s[1] || "").trim();
      var country = s[2] || "";
      var isMilitary = /^(RU|CN|IR|KP|R\d|MIL|NAVY|AIRFORCE|FALCON|VIPER|EAGLE|HAWK|LIGHTNING)/i.test(callsign) ||
        ["Russia","China","Iran","North Korea","Belarus","Syria"].indexOf(country) >= 0;
      var color = isMilitary ? "#0088ff" : "#ffffff";
      var marker = L.circleMarker([lat, lng], { radius: isMilitary ? 4 : 2.5, fillColor: color, color: isMilitary ? "#0055aa" : "#666", weight: 0.5, fillOpacity: 0.55 });
      var altFt = Math.round(alt * 3.28084);
      var spd = Math.round((s[9] || 0) * 1.944);
      marker.bindPopup(
        '<span style="color:' + color + ';font-weight:700">' + (isMilitary ? "⚠ Military" : "✈ Civil") + '</span><br>' +
        '<span style="color:#888;font-size:9px">' + (callsign || s[0]) + '</span><br>' +
        '<span style="color:#555;font-size:9px">' + altFt.toLocaleString() + ' ft • ' + spd + ' kts</span>' +
        (country ? '<br><span style="color:#555;font-size:9px">Origin: ' + country + '</span>' : '')
      );
      lg.addLayer(marker);
    }
  }

  function fetchEONET() {
    fetch(API_EONET)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.events) {
          liveEONET = data.events;
          renderEONETLayers();
        }
      })
      .catch(function (e) { console.warn("[Monitor] EONET fetch failed:", e.message); });
  }

  function renderEONETLayers() {
    var events = liveEONET || [];
    var wildfires = [], otherHazards = [];
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      var isFire = false;
      if (ev.categories) {
        for (var j = 0; j < ev.categories.length; j++) {
          if (ev.categories[j].id === "wildfires") { isFire = true; break; }
        }
      }
      (isFire ? wildfires : otherHazards).push(ev);
    }
    // Wildfire layer
    if (layerGroups.wildfire) {
      layerGroups.wildfire.clearLayers();
      for (var i = 0; i < wildfires.length; i++) {
        var ev = wildfires[i];
        if (!ev.geometries || !ev.geometries.length) continue;
        var g = ev.geometries[ev.geometries.length - 1];
        if (g.type !== "Point") continue;
        var lng = g.coordinates[0], lat = g.coordinates[1];
        var circle = L.circle([lat, lng], { radius: rng(25000, 100000), fillColor: "#ff4444", color: "#cc0000", weight: 1, fillOpacity: 0.25 });
        circle.bindPopup('<span style="color:#ff4444;font-weight:700">🔥 ' + ev.title + '</span><br><span style="color:#888;font-size:9px">' + (new Date(g.date)).toLocaleDateString() + '</span>');
        layerGroups.wildfire.addLayer(circle);
      }
    }
    // Disease/other events layer
    if (layerGroups.disease) {
      layerGroups.disease.clearLayers();
      for (var i = 0; i < otherHazards.length; i++) {
        var ev = otherHazards[i];
        if (!ev.geometries || !ev.geometries.length) continue;
        var g = ev.geometries[ev.geometries.length - 1];
        if (g.type !== "Point") continue;
        var lng = g.coordinates[0], lat = g.coordinates[1];
        var catNames = ev.categories ? ev.categories.map(function (c) { return c.title; }).join(", ") : "Event";
        var color = catNames.indexOf("Volcano") >= 0 ? "#ff4400" :
          catNames.indexOf("Flood") >= 0 ? "#44aaff" :
          catNames.indexOf("Storm") >= 0 ? "#00cccc" :
          catNames.indexOf("Drought") >= 0 ? "#ccaa00" : "#ffdd00";
        var circle = L.circle([lat, lng], { radius: rng(20000, 80000), fillColor: color, color: color, weight: 1, fillOpacity: 0.18 });
        circle.bindPopup('<span style="color:#ffdd00;font-weight:700">⚠ ' + ev.title + '</span><br><span style="color:#888;font-size:9px">' + catNames + '</span>');
        layerGroups.disease.addLayer(circle);
      }
    }
  }

  function fetchISS() {
    fetch(API_ISS)
      .then(function (r) { return r.json(); })
      .then(function (data) { liveISS = data; renderSatelliteLayer(); })
      .catch(function (e) { console.warn("[Monitor] ISS fetch failed:", e.message); });
  }

  function renderSatelliteLayer() {
    var lg = layerGroups.satellites;
    if (!lg || !map) return;
    lg.clearLayers();
    if (liveISS) {
      var iss = liveISS;
      var m = L.circleMarker([iss.latitude, iss.longitude], { radius: 6, fillColor: "#ffffff", color: "#aaaaaa", weight: 1.5, fillOpacity: 0.9 });
      m.bindPopup('<span style="color:#fff;font-weight:700">🛰 ISS</span><br><span style="color:#555;font-size:9px">Alt: ' + Math.round(iss.altitude) + ' km • ' + Math.round(iss.velocity) + ' km/h</span>');
      lg.addLayer(m);
    }
    var now = Date.now() / 1000;
    var orbits = [
      { inc: 0, raan: 0, period: 5400 }, { inc: 98, raan: 30, period: 5700 },
      { inc: 51.6, raan: 60, period: 5560 }, { inc: 63.4, raan: 90, period: 6000 },
      { inc: 30, raan: 120, period: 5300 }, { inc: 82, raan: 150, period: 5600 },
      { inc: 15, raan: 180, period: 5100 }, { inc: 99, raan: 210, period: 5750 },
      { inc: 45, raan: 240, period: 5450 }, { inc: 70, raan: 270, period: 5550 },
      { inc: 10, raan: 300, period: 5200 }, { inc: 85, raan: 330, period: 5650 }
    ];
    for (var i = 0; i < orbits.length; i++) {
      var o = orbits[i];
      var ma = (now % o.period) / o.period * 360;
      var incRad = o.inc * Math.PI / 180;
      var raanRad = o.raan * Math.PI / 180;
      var maRad = ma * Math.PI / 180;
      var lat = Math.asin(Math.sin(incRad) * Math.sin(maRad)) * 180 / Math.PI;
      var lng = (Math.atan2(Math.cos(incRad) * Math.sin(maRad), Math.cos(maRad)) + raanRad) * 180 / Math.PI;
      lng = ((lng % 360) + 540) % 360 - 180;
      var sm = L.circleMarker([lat, lng], { radius: 2.5, fillColor: "#888", color: "#555", weight: 0.3, fillOpacity: 0.65 });
      sm.bindPopup('<span style="color:#888;font-weight:700">🛰 Satellite</span><br><span style="color:#555;font-size:9px">Orbit: ' + Math.round(o.period / 60) + ' min • Inc: ' + o.inc + '°</span>');
      lg.addLayer(sm);
    }
  }

  function updateNavalLayer() {
    var lg = layerGroups.naval;
    if (!lg || !map) return;
    lg.clearLayers();
    var bases = [
      { lat: 36.9, lng: -76.3 }, { lat: 32.7, lng: -117.2 }, { lat: 21.3, lng: -157.9 },
      { lat: 35.3, lng: 139.7 }, { lat: 69.1, lng: 33.4 }, { lat: 43.1, lng: 131.9 },
      { lat: 36.1, lng: 120.4 }, { lat: 18.2, lng: 109.5 }, { lat: 50.8, lng: -1.1 },
      { lat: 18.9, lng: 72.8 }, { lat: 15.3, lng: 42.0 }, { lat: 12.0, lng: 45.0 },
      { lat: 38.4, lng: 26.1 }, { lat: 14.5, lng: 121.0 }, { lat: -33.9, lng: 18.4 }
    ];
    var types = ["DDG", "FFG", "CG", "LHD", "SSN", "SSK", "LPD", "AOR"];
    var t = Date.now() / 60000;
    for (var i = 0; i < bases.length * 2; i++) {
      var b = bases[i % bases.length];
      var spread = 7 + Math.sin(t * 0.3 + i) * 3;
      var lat = b.lat + Math.cos(t * 0.5 + i * 2.7) * spread;
      var lng = b.lng + Math.sin(t * 0.5 + i * 2.7) * spread * 1.5;
      var marker = L.circleMarker([lat, lng], { radius: 5, fillColor: "#00ccaa", color: "#008866", weight: 0.8, fillOpacity: 0.65 });
      marker.bindPopup('<span style="color:#00ccaa;font-weight:700">🚢 ' + types[i % types.length] + '</span><br><span style="color:#555;font-size:9px">Naval vessel • ' + Math.round(8 + Math.random() * 22) + ' kts</span>');
      lg.addLayer(marker);
    }
  }

  function updateCyberLayer() {
    var lg = layerGroups.cyber;
    if (!lg || !map) return;
    lg.clearLayers();
    var hubs = [
      { lat: 39, lng: -77 }, { lat: 37, lng: -122 }, { lat: 51, lng: -0.1 },
      { lat: 35, lng: 139 }, { lat: 55, lng: 37 }, { lat: 31, lng: 121 },
      { lat: 19, lng: 72 }, { lat: -26, lng: 28 }, { lat: -33, lng: 151 }
    ];
    var threats = ["DDoS Wave", "Ransomware", "Zero-Day", "Supply Chain", "APT Exfil", "Phishing", "DNS Poison", "BGP Hijack"];
    var t = Date.now() / 300000;
    for (var i = 0; i < 8; i++) {
      var h = hubs[i];
      var lat = h.lat + Math.cos(t * 0.7 + i * 1.3) * 4;
      var lng = h.lng + Math.sin(t * 0.6 + i * 1.3) * 6;
      var targets = Math.round(50 + Math.abs(Math.sin(t + i)) * 50000);
      var marker = L.circleMarker([lat, lng], { radius: 6, fillColor: "#aa00ff", color: "#6600aa", weight: 0.8, fillOpacity: 0.5 });
      marker.bindPopup('<span style="color:#aa00ff;font-weight:700">💻 ' + threats[i] + '</span><br><span style="color:#555;font-size:9px">~' + targets.toLocaleString() + ' targets</span>');
      lg.addLayer(marker);
    }
  }

  /* ===== LIVE FINANCE DATA ===== */
  function fetchLiveCrypto() {
    fetch(API_COINGECKO)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data) return;
        var prices = {};
        var idMap = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", ripple: "XRP", binancecoin: "BNB", cardano: "ADA", "avalanche-2": "AVAX", "matic-network": "MATIC", "tether-gold": "XAU" };
        for (var id in idMap) {
          if (data[id]) prices[idMap[id]] = { price: data[id].usd, chg: data[id].usd_24h_change || 0 };
        }
        liveCryptoPrices = prices;
        applyLivePrices();
      })
      .catch(function (e) { console.warn("[Monitor] CoinGecko fetch failed:", e.message); });
  }

  function fetchLiveForex() {
    fetch(API_FOREX)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.result !== "success" || !data.rates) return;
        var r = data.rates;
        liveForexRates = {};
        var pairs = [
          { key: "EURUSD", calc: function () { return +(1 / r.EUR).toFixed(4); } },
          { key: "GBPUSD", calc: function () { return +(1 / r.GBP).toFixed(4); } },
          { key: "USDJPY", calc: function () { return r.JPY; } },
          { key: "USDCNY", calc: function () { return r.CNY; } },
          { key: "USDINR", calc: function () { return r.INR; } },
          { key: "USDBRL", calc: function () { return r.BRL; } },
          { key: "USDRUB", calc: function () { return r.RUB; } },
          { key: "USDTRY", calc: function () { return r.TRY; } }
        ];
        for (var i = 0; i < pairs.length; i++) {
          liveForexRates[pairs[i].key] = { price: pairs[i].calc(), chg: 0 };
        }
        applyLivePrices();
      })
      .catch(function (e) { console.warn("[Monitor] Forex API fetch failed:", e.message); });
  }

  function fetchLiveIndices() {
    if (!api.fetchIndices) return;
    api.fetchIndices().then(function (data) {
      if (!data || !data.quoteResponse || !data.quoteResponse.result) return;
      var results = data.quoteResponse.result;
      var indexMap = {};
      var symMap = { "^GSPC": "S&P500", "^IXIC": "NASDAQ", "^FTSE": "FTSE100", "^N225": "NIKKEI", "000001.SS": "SHCOMP", "^VIX": "VIX", "^TNX": "US10Y" };
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var sym = symMap[r.symbol] || r.symbol;
        if (r.regularMarketPrice != null) {
          indexMap[sym] = { price: r.regularMarketPrice, chg: r.regularMarketChangePercent || 0 };
        }
      }
      for (var i = 0; i < FIN_TICKER.length; i++) {
        if (indexMap[FIN_TICKER[i].sym]) {
          var ld = indexMap[FIN_TICKER[i].sym];
          FIN_TICKER[i].price = ld.price;
          FIN_TICKER[i].chg = (ld.chg >= 0 ? "+" : "") + ld.chg.toFixed(2) + "%";
        }
      }
      for (var i = 0; i < FIN_STOCKS.length; i++) {
        if (indexMap[FIN_STOCKS[i].sym]) {
          FIN_STOCKS[i].price = indexMap[FIN_STOCKS[i].sym].price;
          FIN_STOCKS[i].chg = indexMap[FIN_STOCKS[i].sym].chg;
        }
      }
      renderFinTicker();
      if (finRendered) {
        renderStocksTable();
        var sd = $("finStockDot");
        if (sd) sd.style.display = "inline-block";
      }
    }).catch(function () {});
    if (api.fetch2YYield) {
      api.fetch2YYield().then(function (data) {
        if (!data || !data.chart || !data.chart.result) return;
        var meta = data.chart.result[0].meta;
        if (meta && meta.regularMarketPrice) {
          var y2 = meta.regularMarketPrice;
          for (var i = 0; i < FIN_TICKER.length; i++) {
            if (FIN_TICKER[i].sym === "US2Y") {
              FIN_TICKER[i].price = y2;
              FIN_TICKER[i].chg = (meta.regularMarketChangePercent >= 0 ? "+" : "") + meta.regularMarketChangePercent.toFixed(2) + "%";
            }
          }
          for (var i = 0; i < FIN_STOCKS.length; i++) {
            if (FIN_STOCKS[i].sym === "US2Y") {
              FIN_STOCKS[i].price = y2;
              FIN_STOCKS[i].chg = meta.regularMarketChangePercent || 0;
            }
          }
          renderFinTicker();
          if (finRendered) renderStocksTable();
        }
      }).catch(function () {});
    }
  }

  function applyLivePrices() {
    // Update FIN_TICKER with live crypto prices
    if (liveCryptoPrices) {
      var cryptoMap = { BTC: true, ETH: true, SOL: true, XRP: true, BNB: true, ADA: true, AVAX: true, MATIC: true };
      for (var i = 0; i < FIN_TICKER.length; i++) {
        var sym = FIN_TICKER[i].sym;
        if (liveCryptoPrices[sym]) {
          var ld = liveCryptoPrices[sym];
          FIN_TICKER[i].price = ld.price;
          FIN_TICKER[i].chg = (ld.chg >= 0 ? "+" : "") + ld.chg.toFixed(2) + "%";
        }
        // Gold tracked via tether-gold (XAU)
        if (sym === "GOLD" && liveCryptoPrices.XAU) {
          FIN_TICKER[i].price = liveCryptoPrices.XAU.price;
          FIN_TICKER[i].chg = (liveCryptoPrices.XAU.chg >= 0 ? "+" : "") + liveCryptoPrices.XAU.chg.toFixed(2) + "%";
        }
      }
    }
    // Update FIN_TICKER with live forex rates
    if (liveForexRates) {
      for (var i = 0; i < FIN_TICKER.length; i++) {
        var sym = FIN_TICKER[i].sym;
        if (liveForexRates[sym]) {
          FIN_TICKER[i].price = liveForexRates[sym].price;
        }
      }
    }
    // Update FIN_CRYPTO table
    if (liveCryptoPrices) {
      for (var i = 0; i < FIN_CRYPTO.length; i++) {
        if (liveCryptoPrices[FIN_CRYPTO[i].sym]) {
          FIN_CRYPTO[i].price = liveCryptoPrices[FIN_CRYPTO[i].sym].price;
          FIN_CRYPTO[i].chg = liveCryptoPrices[FIN_CRYPTO[i].sym].chg;
        }
      }
    }
    // Update FIN_CURRENCIES table
    if (liveForexRates) {
      for (var i = 0; i < FIN_CURRENCIES.length; i++) {
        var sym = FIN_CURRENCIES[i].name.replace("/", "");
        if (liveForexRates[sym]) FIN_CURRENCIES[i].price = liveForexRates[sym].price;
      }
    }
    // Update Gold in FIN_COMMODITIES
    if (liveCryptoPrices && liveCryptoPrices.XAU) {
      for (var i = 0; i < FIN_COMMODITIES.length; i++) {
        if (FIN_COMMODITIES[i].sym === "XAU") {
          FIN_COMMODITIES[i].price = liveCryptoPrices.XAU.price;
          FIN_COMMODITIES[i].chg = liveCryptoPrices.XAU.chg;
        }
      }
    }
    renderFinTicker();
    if (finRendered) renderFinanceTables();
    var ld = $("finLiveDot");
    if (ld) ld.style.display = "inline-block";
    var fd = $("finFxDot");
    if (fd) fd.style.display = "inline-block";
  }

  function startAllLiveData() {
    fetchAircraft();
    fetchEONET();
    fetchISS();
    fetchLiveCrypto();
    fetchLiveForex();
    fetchLiveIndices();
    if (layerGroups.naval) updateNavalLayer();
    if (layerGroups.cyber) updateCyberLayer();
    setInterval(fetchAircraft, 30000);
    setInterval(fetchEONET, 300000);
    setInterval(fetchISS, 10000);
    setInterval(fetchLiveCrypto, 60000);
    setInterval(fetchLiveForex, 120000);
    setInterval(fetchLiveIndices, 120000);
    setInterval(updateNavalLayer, 120000);
    setInterval(updateCyberLayer, 90000);
  }

  /* ===== HELPERS ===== */
  function $(id) { return document.getElementById(id); }
  function rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function rndIp() { return rng(1,223) + "." + rng(0,255) + "." + rng(0,255) + "." + rng(1,254); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function drng(base, pct) { return base + base * (Math.random() - 0.5) * pct; }

  function depthColor(d) {
    if (d < 10) return "#ff2222"; if (d < 30) return "#ff6600"; if (d < 70) return "#ffaa00";
    if (d < 150) return "#aacc00"; if (d < 300) return "#00aa44"; if (d < 500) return "#0088ff"; return "#7700cc";
  }
  function magBg(m) {
    if (m >= 6) return "#ff2222"; if (m >= 5) return "#ff6600"; if (m >= 4) return "#ffaa00"; if (m >= 3) return "#44aa44"; return "#557755";
  }
  function fmtTime(t) { return new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

  /* ===== STEP 1: CLOSE BUTTON ===== */
  function closeMonitor() { api.close(); }
  var btn = $("closeBtn");
  if (btn) btn.onclick = closeMonitor;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMonitor(); });
  console.log("[Monitor] Close button wired");

  /* ===== STEP 2: LIVE CLOCK ===== */
  function tickClock() {
    var el = $("clock");
    if (!el) return;
    var now = new Date();
    el.textContent = pad(now.getUTCHours()) + ":" + pad(now.getUTCMinutes()) + ":" + pad(now.getUTCSeconds()) + " UTC";
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ===== STEP 3: BREAKING NEWS ===== */
  (function () {
    var el = $("newsTrack");
    if (!el) return;
    var html = "";
    for (var i = 0; i < NEWS.length; i++) {
      html += '<span><span class="news-dot"></span>' + NEWS[i] + '</span>';
    }
    el.innerHTML = html + html;
  })();

  /* ===== STEP 4: THREAT LOG (more frequent, more entries) ===== */
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
    if (body.children.length > 60) body.removeChild(body.firstChild);
    body.scrollTop = body.scrollHeight;
  }
  for (var t = 0; t < 10; t++) addThreatLine();
  setInterval(addThreatLine, rng(1500, 3500));

  /* ===== STEP 5: GLOBAL TIME ZONES ===== */
  var TIMEZONES = [
    { city: "New York", tz: "America/New_York" },
    { city: "London", tz: "Europe/London" },
    { city: "Tokyo", tz: "Asia/Tokyo" },
    { city: "Sydney", tz: "Australia/Sydney" },
    { city: "Dubai", tz: "Asia/Dubai" },
    { city: "Moscow", tz: "Europe/Moscow" }
  ];
  function updateTimeZones() {
    var el = $("tzList");
    if (!el) return;
    var html = "";
    for (var i = 0; i < TIMEZONES.length; i++) {
      var z = TIMEZONES[i];
      var time = new Date().toLocaleTimeString("en-US", { timeZone: z.tz, hour: "2-digit", minute: "2-digit", hour12: false });
      html += '<div class="tz-row"><span class="tz-city">' + z.city + '</span><span class="tz-time">' + time + '</span></div>';
    }
    el.innerHTML = html;
  }
  updateTimeZones();
  setInterval(updateTimeZones, 1000);

  /* ===== STEP 6: SYSTEM STATUS (1s updates, natural patterns) ===== */
  var sysData = { cpu: 23, mem: 45, net: 12, disk: 67 };
  var sysTrend = { cpu: 0.5, mem: 0.1, net: 0.3, disk: 0.05 };
  function updateSystemStatus() {
    sysTrend.cpu += (Math.random() - 0.5) * 0.8;
    sysTrend.mem += (Math.random() - 0.5) * 0.3;
    sysTrend.net += (Math.random() - 0.5) * 3;
    sysTrend.disk += (Math.random() - 0.5) * 0.1;
    sysTrend.cpu = Math.max(-4, Math.min(4, sysTrend.cpu));
    sysTrend.mem = Math.max(-2, Math.min(2, sysTrend.mem));
    sysTrend.net = Math.max(-10, Math.min(10, sysTrend.net));
    sysTrend.disk = Math.max(-1, Math.min(1, sysTrend.disk));
    sysData.cpu = Math.max(3, Math.min(96, sysData.cpu + sysTrend.cpu));
    sysData.mem = Math.max(18, Math.min(92, sysData.mem + sysTrend.mem));
    sysData.net = Math.max(5, Math.min(250, sysData.net + sysTrend.net));
    sysData.disk = Math.max(38, Math.min(96, sysData.disk + sysTrend.disk));
    function setBar(id, val, max, suffix) {
      var fill = $(id + "Fill");
      var label = $(id + "Val");
      if (!fill || !label) return;
      var pct = Math.round((val / max) * 100);
      fill.style.width = pct + "%";
      fill.style.background = pct > 80 ? "#ff4444" : pct > 60 ? "#ffaa00" : "#00ff88";
      label.textContent = val + (suffix || "%");
    }
    setBar("cpu", sysData.cpu, 100);
    setBar("mem", sysData.mem, 100);
    setBar("net", sysData.net, 200, "ms");
    setBar("disk", sysData.disk, 100);
  }
  updateSystemStatus();
  setInterval(updateSystemStatus, 1000);

  /* ===== STEP 7: THREAT LEVEL ===== */
  var THREAT_LEVELS = ["low", "moderate", "elevated", "high", "critical"];
  var currentThreat = 2;
  function updateThreatLevel() {
    var badge = $("tlBadge");
    if (!badge) return;
    var level = THREAT_LEVELS[currentThreat];
    badge.textContent = level.toUpperCase();
    badge.className = "tl-badge " + level;
  }
  updateThreatLevel();
  setInterval(function () {
    currentThreat = rng(0, THREAT_LEVELS.length - 1);
    updateThreatLevel();
  }, 12000);

  /* ===== STEP 8: UPTIME COUNTER ===== */
  var startTime = Date.now();
  function updateUptime() {
    var el = $("uptimeValue");
    if (!el) return;
    var s = Math.floor((Date.now() - startTime) / 1000);
    var h = pad(Math.floor(s / 3600));
    var m = pad(Math.floor((s % 3600) / 60));
    var sec = pad(s % 60);
    el.textContent = h + ":" + m + ":" + sec;
  }
  updateUptime();
  setInterval(updateUptime, 1000);

  /* ===== STEP 9: SATELLITES ===== */
  var satBase = rng(4200, 4800);
  function updateSatellites() {
    var el = $("satCount");
    if (!el) return;
    satBase += rng(-5, 5);
    el.textContent = satBase.toLocaleString();
  }
  updateSatellites();
  setInterval(updateSatellites, 2000);

  /* ===== STEP 10: ALERT COUNTER (more dynamic) ===== */
  var alertCount = rng(12, 47);
  var alertBurst = 0;
  function updateAlerts() {
    var el = $("alertCount");
    if (!el) return;
    if (alertBurst > 0) { alertCount += rng(1, 4); alertBurst--; }
    else if (Math.random() > 0.65) { alertCount += rng(1, 3); }
    else if (Math.random() < 0.08) { alertBurst = rng(2, 5); alertCount += rng(1, 6); }
    el.textContent = alertCount;
  }
  updateAlerts();
  setInterval(updateAlerts, 4000);

  /* ===== STEP 11: NETWORK ACTIVITY GRAPH (1s, smoother) ===== */
  var netBars = 24;
  var netHistory = [];
  for (var i = 0; i < netBars; i++) netHistory.push(rng(5, 25));
  var txRate = 0, rxRate = 0;
  function renderNetGraph() {
    var el = $("netGraph");
    if (!el) return;
    var html = "";
    for (var i = 0; i < netHistory.length; i++) {
      var h = Math.max(2, netHistory[i]);
      html += '<div class="net-bar" style="height:' + h + 'px"></div>';
    }
    el.innerHTML = html;
    var tx = $("txRate"), rx = $("rxRate");
    if (tx) tx.textContent = txRate;
    if (rx) rx.textContent = rxRate;
  }
  var netPhase = 0;
  function updateNetwork() {
    netHistory.shift();
    netPhase += 0.3;
    var base = 12 + Math.sin(netPhase) * 8 + Math.sin(netPhase * 3.7) * 3;
    netHistory.push(Math.max(2, Math.min(28, Math.round(base + (Math.random() - 0.5) * 8))));
    txRate = Math.round(100 + Math.abs(Math.sin(netPhase * 1.3)) * 700 + Math.random() * 100);
    rxRate = Math.round(200 + Math.abs(Math.sin(netPhase * 0.9)) * 1000 + Math.random() * 200);
    renderNetGraph();
  }
  renderNetGraph();
  setInterval(updateNetwork, 1000);

  /* ===== STEP 12: CONNECTED DEVICES (live status changes) ===== */
  var DEVICES = [
    { name: "gateway-01", ip: "10.0.1.1", online: true },
    { name: "sensor-alpha", ip: "10.0.2.14", online: true },
    { name: "relay-node", ip: "10.0.3.7", online: true },
    { name: "db-primary", ip: "10.0.1.50", online: true },
    { name: "edge-proxy", ip: "10.0.4.22", online: true },
    { name: "monitor-hub", ip: "10.0.1.100", online: true }
  ];
  function renderDevices() {
    var el = $("devicesList");
    if (!el) return;
    var html = "";
    for (var i = 0; i < DEVICES.length; i++) {
      var d = DEVICES[i];
      var cls = d.online ? "online" : "offline";
      html += '<div class="device-row"><span class="device-status ' + cls + '"></span><span class="device-name">' + d.name + '</span><span class="device-ip">' + d.ip + '</span></div>';
    }
    el.innerHTML = html;
  }
  function updateDeviceStatus() {
    for (var i = 0; i < DEVICES.length; i++) {
      if (Math.random() < 0.05) {
        DEVICES[i].online = !DEVICES[i].online;
        if (!DEVICES[i].online) {
          var body = $("threatLog");
          if (body) {
            var line = document.createElement("div");
            line.className = "threat-line";
            var now = new Date();
            var ts = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
            line.innerHTML = '<span class="t-time">[' + ts + ']</span> <span class="t-warn">[WARN]</span> Node ' + DEVICES[i].name + ' lost connection — retrying';
            body.appendChild(line);
            body.scrollTop = body.scrollHeight;
          }
        } else {
          var body2 = $("threatLog");
          if (body2) {
            var line2 = document.createElement("div");
            line2.className = "threat-line";
            var now2 = new Date();
            var ts2 = pad(now2.getHours()) + ":" + pad(now2.getMinutes()) + ":" + pad(now2.getSeconds());
            line2.innerHTML = '<span class="t-time">[' + ts2 + ']</span> <span class="t-ok">[OK]</span> Node ' + DEVICES[i].name + ' reconnected';
            body2.appendChild(line2);
            body2.scrollTop = body2.scrollHeight;
          }
        }
      }
    }
    renderDevices();
  }
  renderDevices();
  setInterval(updateDeviceStatus, 3000);

  /* ===== STEP 13: FINANCIAL TICKER (2s updates, live prices) ===== */
  function renderFinTicker() {
    var el = $("finTicker");
    if (!el) return;
    var html = "";
    for (var i = 0; i < FIN_TICKER.length; i++) {
      var f = FIN_TICKER[i];
      var up = f.chg.charAt(0) === "+";
      html += '<span class="fin-item"><span class="fin-sym">' + f.sym + '</span> <span class="fin-price">' + f.price.toLocaleString() + '</span> <span class="fin-chg ' + (up ? "up" : "down") + '">' + f.chg + '</span></span>';
    }
    el.innerHTML = '<div class="fin-track">' + html + html + '</div>';
  }
  renderFinTicker();
  setInterval(function () {
    for (var i = 0; i < FIN_TICKER.length; i++) {
      var sym = FIN_TICKER[i].sym;
      var isLiveCrypto = liveCryptoPrices && (liveCryptoPrices[sym] || (sym === "GOLD" && liveCryptoPrices.XAU));
      var isLiveForex = liveForexRates && liveForexRates[sym];
      if (isLiveCrypto || isLiveForex) continue;
      var p = FIN_TICKER[i].price;
      var chg = (Math.random() - 0.48) * (p * 0.003);
      FIN_TICKER[i].price = +(p + chg).toFixed(p > 100 ? 2 : 4);
      var chgPct = (chg / p * 100);
      FIN_TICKER[i].chg = (chgPct >= 0 ? "+" : "") + chgPct.toFixed(2) + "%";
    }
    renderFinTicker();
    for (var s = 0; s < FIN_STOCKS.length; s++) {
      for (var t = 0; t < FIN_TICKER.length; t++) {
        if (FIN_TICKER[t].sym === FIN_STOCKS[s].sym) {
          FIN_STOCKS[s].price = FIN_TICKER[t].price;
          FIN_STOCKS[s].chg = parseFloat(FIN_TICKER[t].chg) || 0;
          break;
        }
      }
    }
    var sd = $("finStockDot");
    if (sd) sd.style.display = "inline-block";
    if (finRendered) renderStocksTable();
  }, 2000);

  /* ===== STEP 14: SIDEBAR TAB SWITCHING ===== */
  (function () {
    var tabs = document.querySelectorAll(".sb-tab[data-tab]");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function () {
        var tab = this.getAttribute("data-tab");
        document.querySelectorAll(".sb-tab[data-tab]").forEach(function (t) { t.classList.remove("active"); });
        this.classList.add("active");
        document.querySelectorAll(".sb-content").forEach(function (c) { c.classList.remove("active"); });
        var content = $("sb" + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (content) content.classList.add("active");
        if (tab === "risk") renderRiskList();
        if (tab === "finance") { renderFinanceTables(); renderStocksTable(); }
      });
    }
    var collapseBtn = $("sbCollapse");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", function () {
        var sb = $("sidebar");
        if (sb) {
          sb.classList.toggle("collapsed");
          this.innerHTML = sb.classList.contains("collapsed") ? "&#x25B6;" : "&#x25C0;";
          updateTickerLayout();
        }
      });
    }
  })();

  /* ===== STEP 15: COUNTRY RISK LIST (sortable, pinnable, trend indicators) ===== */
  var riskSortBy = "name"; // name | ii | ri
  var riskSortAsc = true;
  var riskPins = []; // ISO codes of pinned countries

  // Load pins from localStorage
  try {
    var storedPins = localStorage.getItem("wm_pins");
    if (storedPins) riskPins = JSON.parse(storedPins);
  } catch (e) { riskPins = []; }

  function savePins() {
    try { localStorage.setItem("wm_pins", JSON.stringify(riskPins)); } catch (e) {}
  }

  // Generate per-country trend (simulated, stable per session)
  var countryTrends = {};
  for (var ti = 0; ti < COUNTRIES.length; ti++) {
    var tc = COUNTRIES[ti];
    var r = Math.random();
    countryTrends[tc.iso] = { ii: r < 0.3 ? "up" : r < 0.6 ? "down" : "flat", ri: r < 0.25 ? "up" : r < 0.55 ? "down" : "flat" };
  }

  function renderRiskList(filter) {
    var el = $("riskList");
    if (!el) return;
    filter = (filter || "").toLowerCase();

    // Sort
    var filtered = COUNTRIES.slice();
    if (filter) filtered = filtered.filter(function (c) {
      return c.name.toLowerCase().indexOf(filter) >= 0 || c.iso.toLowerCase().indexOf(filter) >= 0;
    });
    filtered.sort(function (a, b) {
      // Pinned always first
      var aPin = riskPins.indexOf(a.iso) >= 0 ? 0 : 1;
      var bPin = riskPins.indexOf(b.iso) >= 0 ? 0 : 1;
      if (aPin !== bPin) return aPin - bPin;
      // Then by selected sort
      var av, bv;
      if (riskSortBy === "ii") { av = a.ii; bv = b.ii; }
      else if (riskSortBy === "ri") { av = a.ri; bv = b.ri; }
      else { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      if (av < bv) return riskSortAsc ? -1 : 1;
      if (av > bv) return riskSortAsc ? 1 : -1;
      return 0;
    });

    var html = "";
    var inPinned = false;
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i];
      var isPinned = riskPins.indexOf(c.iso) >= 0;
      // Separator between pinned and unpinned
      if (!isPinned && !inPinned && riskPins.length > 0) {
        html += '<div class="pin-sep">PINNED ABOVE — ALL COUNTRIES BELOW</div>';
        inPinned = true;
      }
      if (isPinned && i === 0) inPinned = false;
      var iiColor = c.ii > 70 ? "#ff4444" : c.ii > 50 ? "#ff8800" : c.ii > 30 ? "#ffaa00" : "#44aa44";
      var riColor = c.ri < 30 ? "#ff4444" : c.ri < 50 ? "#ffaa00" : c.ri < 70 ? "#0088ff" : "#00ff88";
      var tr = countryTrends[c.iso];
      var iiTrend = tr.ii === "up" ? "▲" : tr.ii === "down" ? "▼" : "–";
      var riTrend = tr.ri === "up" ? "▲" : tr.ri === "down" ? "▼" : "–";
      html +=
        '<div class="risk-row' + (isPinned ? ' pinned' : '') + '" data-iso="' + c.iso + '">' +
        '<span class="risk-pin' + (isPinned ? ' pinned' : '') + '" data-iso="' + c.iso + '" title="' + (isPinned ? 'Unpin' : 'Pin') + '">' + (isPinned ? '★' : '☆') + '</span>' +
        '<span class="risk-flag">' + c.flag + '</span>' +
        '<span class="risk-name">' + c.name + '</span>' +
        '<span class="risk-trend ' + tr.ii + '">' + iiTrend + '</span>' +
        '<span class="risk-ii" style="color:' + iiColor + '">' + c.ii + '</span>' +
        '<span class="risk-trend ' + tr.ri + '">' + riTrend + '</span>' +
        '<span class="risk-ri" style="color:' + riColor + '">' + c.ri + '</span>' +
        (function () {
          var s = SANCTIONS[c.iso];
          if (s) return '<span class="risk-sanc lvl-' + s.level + '" title="Sanctions: ' + s.label + '">' + (s.level === "crit" ? "🔴" : s.level === "high" ? "🟠" : s.level === "mod" ? "🟡" : "🟢") + '</span>';
          return '<span class="risk-sanc">–</span>';
        })() +
        (function () {
          var t = TRAVEL[c.iso];
          if (t) return '<span class="risk-trvl lvl-' + t.level + '" title="Travel: ' + t.label + '">' + (t.level === "crit" ? "⛔" : t.level === "high" ? "⚠" : t.level === "mod" ? "🔶" : "✓") + '</span>';
          return '<span class="risk-trvl">–</span>';
        })() +
        '</div>';
    }
    el.innerHTML = html || '<div style="color:#555;font-size:10px;padding:8px">No countries match</div>';

    // Wire risk-row clicks (open modal) + pin clicks
    el.querySelectorAll(".risk-row").forEach(function (row) {
      row.addEventListener("click", function (e) {
        // Don't open modal if clicking the pin star
        if (e.target.closest(".risk-pin")) return;
        var iso = this.getAttribute("data-iso");
        window._showRiskDetail(iso);
      });
    });
    el.querySelectorAll(".risk-pin").forEach(function (pin) {
      pin.addEventListener("click", function (e) {
        e.stopPropagation();
        var iso = this.getAttribute("data-iso");
        var idx = riskPins.indexOf(iso);
        if (idx >= 0) riskPins.splice(idx, 1);
        else riskPins.push(iso);
        savePins();
        renderRiskList(riskSearch ? riskSearch.value : "");
      });
    });
  }

  // Update sort header visuals
  function updateSortHeaders() {
    ["ii", "ri", "name"].forEach(function (s) {
      var el = document.getElementById("sort" + s.toUpperCase());
      if (!el) return;
      if (riskSortBy === s) {
        el.classList.add("active");
        el.textContent = (s === "name" ? "COUNTRY " : s.toUpperCase()) + (riskSortAsc ? "▲" : "▼");
      } else {
        el.classList.remove("active");
        var labels = { name: "COUNTRY", ii: "II", ri: "RI" };
        el.textContent = labels[s];
      }
    });
  }

  // Wire sort header clicks
  ["ii", "ri", "name"].forEach(function (s) {
    var el = document.getElementById("sort" + s.toUpperCase());
    if (!el) return;
    el.addEventListener("click", function () {
      if (riskSortBy === s) riskSortAsc = !riskSortAsc;
      else { riskSortBy = s; riskSortAsc = (s === "name"); }
      updateSortHeaders();
      renderRiskList(riskSearch ? riskSearch.value : "");
    });
  });

  // Pin toggle button in header
  var sortPinned = document.getElementById("sortPinned");
  if (sortPinned) {
    sortPinned.addEventListener("click", function () {
      if (riskPins.length > 0) {
        riskPins = [];
        savePins();
        renderRiskList(riskSearch ? riskSearch.value : "");
      }
      sortPinned.classList.toggle("active", riskPins.length > 0);
    });
  }

  var riskSearch = $("riskSearch");
  if (riskSearch) riskSearch.addEventListener("input", function () { renderRiskList(this.value); });
  renderRiskList();
  updateSortHeaders();

  /* ===== STEP 16: RISK DETAIL MODAL ===== */
  window._showRiskDetail = function (iso) {
    var c = COUNTRIES.find(function (x) { return x.iso === iso; });
    if (!c) return;
    var modal = $("riskModal");
    var title = $("riskModalTitle");
    var scores = $("riskModalScores");
    var domains = $("riskModalDomains");
    if (!modal || !title || !scores || !domains) return;
    // Add slight live fluctuation to indices
    var iif = c.ii + rng(-3, 3);
    var rif = c.ri + rng(-3, 3);
    title.innerHTML = c.flag + " " + c.name;
    var iiColor = iif > 70 ? "#ff4444" : iif > 50 ? "#ff8800" : iif > 30 ? "#ffaa00" : "#44aa44";
    var riColor = rif < 30 ? "#ff4444" : rif < 50 ? "#ffaa00" : rif < 70 ? "#0088ff" : "#00ff88";
    scores.innerHTML =
      '<div class="modal-score"><div class="modal-score-label">Instability Index</div><div class="modal-score-val" style="color:' + iiColor + '">' + iif + '</div></div>' +
      '<div class="modal-score"><div class="modal-score-label">Resilience Index</div><div class="modal-score-val" style="color:' + riColor + '">' + rif + '</div></div>';
    // Sanctions + Travel info
    var sanc = SANCTIONS[c.iso];
    var trav = TRAVEL[c.iso];
    var infoHtml = "";
    if (sanc) {
      var scolor = sanc.level === "crit" ? "#ff4444" : sanc.level === "high" ? "#ff6600" : sanc.level === "mod" ? "#ffaa00" : "#00ff88";
      infoHtml += '<div class="modal-info-row"><span class="modal-info-label">OFAC Sanctions</span><span class="modal-info-val" style="color:' + scolor + '">' + sanc.level.toUpperCase() + ' — ' + sanc.label + '</span></div>';
    }
    if (trav) {
      var tcolor = trav.level === "crit" ? "#ff4444" : trav.level === "high" ? "#ff6600" : trav.level === "mod" ? "#ffaa00" : "#00ff88";
      infoHtml += '<div class="modal-info-row"><span class="modal-info-label">Travel Advisory</span><span class="modal-info-val" style="color:' + tcolor + '">' + trav.label + '</span></div>';
    }
    var dhtml = infoHtml;
    for (var i = 0; i < DOMAIN_NAMES.length; i++) {
      var v = Math.max(0, Math.min(100, c.domains[i] + rng(-4, 4)));
      var dColor = v > 70 ? "#00ff88" : v > 50 ? "#ffaa00" : v > 30 ? "#ff8800" : "#ff4444";
      dhtml += '<div class="domain-row"><span class="domain-name">' + DOMAIN_NAMES[i] + '</span><div class="domain-bar"><div class="domain-fill" style="width:' + v + '%;background:' + dColor + '"></div></div><span class="domain-val" style="color:' + dColor + '">' + v + '</span></div>';
    }
    domains.innerHTML = dhtml;
    modal.style.display = "flex";
    if (map) map.setView([c.lat, c.lng], 5, { animate: true });
  };
  var modalClose = $("riskModalClose");
  if (modalClose) modalClose.addEventListener("click", function () { $("riskModal").style.display = "none"; });
  var modalOverlay = $("riskModal");
  if (modalOverlay) modalOverlay.addEventListener("click", function (e) { if (e.target === modalOverlay) modalOverlay.style.display = "none"; });

  /* ===== STEP 17: ROUTE EXPLORER ===== */
  var routeLine = null;
  function calcRoute() {
    var from = ($("routeFrom").value || "Shanghai").toLowerCase();
    var to = ($("routeTo").value || "Rotterdam").toLowerCase();
    var cargo = $("routeCargo").value;
    var vessel = $("routeVessel") ? $("routeVessel").value : "Ultra-Large Container";
    var result = $("routeResult");
    if (!result || !map) return;
    var routes = {
      "shanghai": { lat: 31, lng: 121 }, "rotterdam": { lat: 52, lng: 4 },
      "singapore": { lat: 1.3, lng: 103.8 }, "houston": { lat: 29.7, lng: -95 },
      "dubai": { lat: 25, lng: 55 }, "los angeles": { lat: 33.7, lng: -118 },
      "mumbai": { lat: 19, lng: 72 }, "london": { lat: 51.5, lng: -0.1 },
      "istanbul": { lat: 41, lng: 28 }, "sydney": { lat: -33.9, lng: 151 },
      "suez": { lat: 30, lng: 32 }, "panama": { lat: 9, lng: -80 },
      "malacca": { lat: 2, lng: 102 }, "hormuz": { lat: 26, lng: 56 },
      "busan": { lat: 35, lng: 129 }, "santos": { lat: -23.9, lng: -46 },
      "tianjin": { lat: 38.9, lng: 117.7 }, "antwerp": { lat: 51.3, lng: 4.4 },
      "jeddah": { lat: 21.5, lng: 39.2 }, "karachi": { lat: 24.9, lng: 66.9 },
      "tokyo": { lat: 35.6, lng: 139.8 }, "new york": { lat: 40.6, lng: -74 },
      "vancouver": { lat: 49.2, lng: -123.1 }, "rotan": { lat: 8.5, lng: -80 },
      "algeciras": { lat: 36.1, lng: -5.4 }, "gibraltar": { lat: 36.1, lng: -5.4 },
      "odessa": { lat: 46.5, lng: 30.7 }, "aden": { lat: 12.8, lng: 45.0 },
      "mombasa": { lat: -4.0, lng: 39.6 }, "capetown": { lat: -33.9, lng: 18.4 },
      "valparaiso": { lat: -33.0, lng: -71.6 }, "colombo": { lat: 6.9, lng: 79.8 }
    };
    var fromPt = null, toPt = null;
    for (var k in routes) {
      if (from.indexOf(k) >= 0) fromPt = routes[k];
      if (to.indexOf(k) >= 0) toPt = routes[k];
    }
    if (!fromPt) fromPt = { lat: 31, lng: 121 };
    if (!toPt) toPt = { lat: 52, lng: 4 };
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    var waypoints = [fromPt];
    var steps = 8;
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      waypoints.push([fromPt.lat + (toPt.lat - fromPt.lat) * t + (Math.random() - 0.5) * 10, fromPt.lng + (toPt.lng - fromPt.lng) * t + (Math.random() - 0.5) * 15]);
    }
    waypoints.push(toPt);
    routeLine = L.polyline(waypoints, { color: "#00ff88", weight: 2, dashArray: "8 4", opacity: 0.7 }).addTo(map);
    var chokeData = [
      { name: "Malacca Strait", lat: 2, lng: 102, sev: "HIGH", sevCls: "sev-high", sevColor: "#ff6600" },
      { name: "Suez Canal", lat: 30, lng: 32, sev: "SEVERE", sevCls: "sev-sev", sevColor: "#ff4400" },
      { name: "Strait of Hormuz", lat: 26, lng: 56, sev: "CRITICAL", sevCls: "sev-crit", sevColor: "#ff0000" },
      { name: "Bab el-Mandeb", lat: 12.5, lng: 43, sev: "CRITICAL", sevCls: "sev-crit", sevColor: "#ff0000" },
      { name: "Panama Canal", lat: 9, lng: -80, sev: "HIGH", sevCls: "sev-high", sevColor: "#dd8800" },
      { name: "Turkish Straits", lat: 41, lng: 29, sev: "MODERATE", sevCls: "sev-mod", sevColor: "#0088ff" },
      { name: "South China Sea", lat: 15, lng: 115, sev: "HIGH", sevCls: "sev-high", sevColor: "#ff6600" },
      { name: "Taiwan Strait", lat: 25, lng: 121, sev: "CRITICAL", sevCls: "sev-crit", sevColor: "#ff4444" },
      { name: "Lombok Strait", lat: -8.5, lng: 116, sev: "LOW", sevCls: "sev-mod", sevColor: "#0088ff" }
    ];
    var nearChokes = [];
    for (var i = 0; i < 4; i++) {
      var c = chokeData[rng(0, chokeData.length - 1)];
      if (nearChokes.indexOf(c) < 0) nearChokes.push(c);
    }
    var allSevs = ["LOW","MODERATE","HIGH","CRITICAL"];
    var overallRisk = allSevs[rng(0,3)];
    var riskColor = overallRisk === "CRITICAL" ? "#ff4444" : overallRisk === "HIGH" ? "#ff6600" : overallRisk === "MODERATE" ? "#ffaa00" : "#0088ff";
    var transitDays = rng(18, 45);
    var distanceNm = rng(8500, 21000);
    var fuelCost = rng(2800000, 12000000);
    var co2Tons = rng(2800, 15000);
    var altCorridors = [
      "Via Cape of Good Hope (+" + rng(6,14) + " days, +" + rng(15,35) + "% cost)",
      "Rail via China-Europe Railway Express (" + rng(18,28) + " days)",
      "Via India-Middle East-Europe Corridor (" + rng(5,10) + " days)",
      "Northern Sea Route (seasonal, " + rng(20,35) + " days)"
    ];
    var chokesHtml = "";
    for (var i = 0; i < nearChokes.length; i++) {
      var ch = nearChokes[i];
      chokesHtml += '<div class="route-choke-severity"><span class="choke-sev-dot" style="background:' + ch.sevColor + '"></span><span class="choke-sev-name">' + ch.name + '</span><span class="choke-sev-level ' + ch.sevCls + '" style="color:' + ch.sevColor + '">' + ch.sev + '</span></div>';
    }
    result.innerHTML =
      '<div class="route-path"><span>' + from.charAt(0).toUpperCase()+from.slice(1) + '</span><span class="route-arrow">→</span><span>' + to.charAt(0).toUpperCase()+to.slice(1) + '</span></div>' +
      '<div class="route-seg"><div class="route-seg-title">OVERALL RISK</div><div class="route-seg-text" style="font-size:14px;font-weight:700;color:' + riskColor + '">' + overallRisk + '</div></div>' +
      '<div class="route-choke"><div class="route-choke-title">CHOKEPOINT SEVERITY</div>' + chokesHtml + '</div>' +
      '<div class="route-seg"><div class="route-seg-title">ESTIMATED TRANSIT</div><div class="route-seg-text">' + transitDays + ' days — ' + distanceNm.toLocaleString() + ' nm</div></div>' +
      '<div class="route-seg"><div class="route-seg-title">CARGO / VESSEL</div><div class="route-seg-text">' + cargo + ' • ' + vessel + '</div></div>' +
      '<div class="route-seg"><div class="route-seg-title">EST. FUEL COST</div><div class="route-seg-text">$' + (fuelCost/1e6).toFixed(1) + 'M — ' + co2Tons.toLocaleString() + ' tons CO₂</div></div>' +
      '<div class="route-seg"><div class="route-seg-title">INSURANCE PREMIUM</div><div class="route-seg-text" style="color:' + (overallRisk==="CRITICAL"?"#ff4444":"#ffaa00") + '">' + (overallRisk==="CRITICAL"?"5-8x standard rate":"1.5-2x standard rate") + '</div></div>' +
      '<div class="route-seg"><div class="route-seg-title">ALTERNATIVE CORRIDORS</div><div class="route-seg-text">' + altCorridors.map(function(a){return '• '+a}).join('<br>') + '</div></div>' +
      '<div class="route-seg"><div class="route-seg-title">COUNTRY RISK IMPACT</div><div class="route-seg-text">' +
        (nearChokes.some(function(c){return c.name.indexOf("Malacca")>=0})?'<span style="color:#ff6600">Indonesia/Malaysia — moderate instability</span><br>':'') +
        (nearChokes.some(function(c){return c.name.indexOf("Suez")>=0})?'<span style="color:#ff4400">Egypt — elevated risk, transit fees surging</span><br>':'') +
        (nearChokes.some(function(c){return c.name.indexOf("Hormuz")>=0})?'<span style="color:#ff0000">Iran/UAE — critical threat, insurance 5x</span><br>':'') +
        (nearChokes.some(function(c){return c.name.indexOf("Taiwan")>=0})?'<span style="color:#ff0000">Taiwan/China — CRITICAL conflict zone</span><br>':'') +
        (nearChokes.some(function(c){return c.name.indexOf("South China")>=0})?'<span style="color:#ff6600">China/ASEAN — territorial disputes active</span><br>':'') +
        (nearChokes.some(function(c){return c.name.indexOf("Bab el-Mandeb")>=0})?'<span style="color:#ff4400">Yemen/Djibouti — Houthi threat, rerouting needed</span><br>':'') +
        '<br><span style="color:#0088ff">Recommended: ' + (overallRisk==="CRITICAL"||overallRisk==="HIGH"?"Reroute via alternative corridor":"Proceed with enhanced insurance") + '</span>' +
      '</div>';
    result.classList.add("active");
    var bounds = L.latLngBounds([fromPt, toPt]);
    map.fitBounds(bounds, { padding: [120, 120], maxZoom: 6 });
  }
  var routeBtn = $("routeCalc");
  if (routeBtn) routeBtn.addEventListener("click", calcRoute);
  var routeFrom = $("routeFrom"), routeTo = $("routeTo");
  if (routeFrom) routeFrom.addEventListener("keydown", function (e) { if (e.key === "Enter") calcRoute(); });
  if (routeTo) routeTo.addEventListener("keydown", function (e) { if (e.key === "Enter") calcRoute(); });

  /* ===== STEP 18: SCENARIO ENGINE ===== */
  var activeScenario = null;
  var scenarioLayer = L.layerGroup();
  function renderScenarioCards() {
    var list = $("scenList");
    if (!list) return;
    var html = "";
    for (var k in SCENARIOS) {
      var s = SCENARIOS[k];
      var pctCls = s.prob >= 50 ? "crit" : s.prob >= 25 ? "high" : s.prob >= 10 ? "mod" : "low";
      var sevCls = s.severity === "CRITICAL" ? "sev-crit" : s.severity === "SEVERE" ? "sev-sev" : s.severity === "HIGH" ? "sev-high" : "sev-mod";
      html += '<div class="scen-card" data-scen="' + k + '">' +
        '<div class="scen-card-row"><span class="scen-emoji">' + s.emoji + '</span><span class="scen-name">' + s.name + '</span><span class="scen-pct ' + pctCls + '">' + s.prob + '% prob</span></div>' +
        '<div class="scen-impact-row"><span class="scen-severity ' + sevCls + '">' + s.severity + '</span> ' + s.econImpact + '</div>' +
        '<div class="scen-impact-row" style="color:#666">⏱ ' + s.timeToImpact + '</div>' +
        '<div class="scen-sectors">Affected: ' + (s.sectors||[]).join(" · ") + ' • Chokepoints: ' + (s.chokes||[]).slice(0,3).join(", ") + '</div>' +
        '</div>';
    }
    list.innerHTML = html;
  }
  function clearScenario() {
    if (scenarioLayer) scenarioLayer.clearLayers();
    activeScenario = null;
    document.querySelectorAll(".scen-card.active").forEach(function (b) { b.classList.remove("active"); });
    if (map) map.setView([20, 0], 2);
  }
  function activateScenario(scenId) {
    var s = SCENARIOS[scenId];
    if (!s) return;
    clearScenario();
    activeScenario = scenId;
    document.querySelectorAll(".scen-card[data-scen]").forEach(function (c) {
      if (c.getAttribute("data-scen") === scenId) c.classList.add("active");
    });
    for (var i = 0; i < s.regions.length; i++) {
      var r = s.regions[i];
      var circle = L.circle([r.lat, r.lng], { radius: r.r * 100000, color: s.color, fillColor: s.color, fillOpacity: 0.15, weight: 1, opacity: 0.6 });
      circle.bindPopup('<div style="color:' + s.color + ';font-weight:700;font-size:13px">' + s.name + '</div><div style="color:#888;margin-top:4px">Impact: ' + s.impact + '</div><div style="color:#ffaa00;margin-top:4px;font-size:10px">Economic: ' + s.econImpact + '</div><div style="color:#ff6600;margin-top:4px;font-size:10px">Chokepoints: ' + (s.chokes||[]).join(", ") + '</div><div style="color:#777;margin-top:2px;font-size:9px">Prob: ' + s.prob + '% • ⏱ ' + s.timeToImpact + '</div>');
      scenarioLayer.addLayer(circle);
    }
    if (map && !map.hasLayer(scenarioLayer)) scenarioLayer.addTo(map);
    if (s.regions.length > 0 && map) map.setView([s.regions[0].lat, s.regions[0].lng], 4, { animate: true });
    var body = $("threatLog");
    if (body) {
      var line = document.createElement("div");
      line.className = "threat-line";
      var now = new Date();
      var ts = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
      line.innerHTML = '<span class="t-time">[' + ts + ']</span> <span class="t-crit">[SCENARIO]</span> <span style="color:#ff6600">' + s.severity + ' — ' + s.name + '</span> <span style="color:#888">' + s.impact + '</span>';
      body.appendChild(line);
      body.scrollTop = body.scrollHeight;
    }
  }
  document.addEventListener("click", function (e) {
    var card = e.target.closest(".scen-card");
    if (!card) return;
    var scenId = card.getAttribute("data-scen");
    if (!scenId) return;
    if (activeScenario === scenId) { clearScenario(); return; }
    activateScenario(scenId);
  });
  var scenClearBtn = $("scenClear");
  if (scenClearBtn) scenClearBtn.addEventListener("click", clearScenario);

  /* ===== STEP 19: FINANCE TABLES ===== */
  var finRendered = false;
  function renderStocksTable() {
    try {
      var el = $("finStocks");
      if (!el) {
        var cryptoParent = $("finCrypto");
        if (!cryptoParent) return;
        var sec = cryptoParent.closest(".fin-section");
        if (!sec || !sec.parentNode) return;
        var div = document.createElement("div");
        div.className = "fin-section";
        div.innerHTML = '<div class="fin-sec-title">STOCK INDICES <span class="fin-live-dot" id="finStockDot" style="display:none">◉</span></div><div class="fin-table" id="finStocks"></div>';
        sec.parentNode.insertBefore(div, sec.nextSibling);
        el = $("finStocks");
      }
      if (!el) return;
      var html = "";
      for (var i = 0; i < FIN_STOCKS.length; i++) {
        var d = FIN_STOCKS[i];
        if (!d || d.price == null) continue;
        var cls = d.chg > 0 ? "up" : (d.chg < 0 ? "down" : "");
        var sign = d.chg > 0 ? "+" : "";
        html += '<div class="fin-row"><span class="fin-name">' + d.name + '</span><span class="fin-val ' + cls + '">' + d.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4}) + ' <span style="font-size:8px">' + sign + d.chg.toFixed(2) + '%</span></span></div>';
      }
      el.innerHTML = html;
      var dot = $("finStockDot");
      if (dot) dot.style.display = "inline-block";
    } catch(e) { console.warn("[Monitor] renderStocksTable:", e); }
  }
  function renderFinanceTables() {
    function renderTable(id, data, isPct) {
      var el = $(id);
      if (!el) return;
      var html = "";
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        var cls = d.chg > 0 ? "up" : (d.chg < 0 ? "down" : "");
        var sign = d.chg > 0 ? "+" : "";
        if (isPct) {
          html += '<div class="fin-row"><span class="fin-name">' + d.name + '</span><span class="fin-val ' + cls + '">' + d.val + ' <span style="font-size:8px">' + (d.chg!==0?(sign+d.chg+"pp"):"") + '</span></span></div>';
        } else {
          html += '<div class="fin-row"><span class="fin-name">' + d.name + '</span><span class="fin-val ' + cls + '">' + d.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4}) + ' <span style="font-size:8px">' + (d.chg>0?("+"+d.chg.toFixed(2)):d.chg.toFixed(2)) + '</span></span></div>';
        }
      }
      el.innerHTML = html;
    }
    function renderCryptoTable() {
      var el = $("finCrypto");
      if (!el) return;
      var html = "";
      for (var i = 0; i < FIN_CRYPTO.length; i++) {
        var d = FIN_CRYPTO[i];
        var cls = d.chg > 0 ? "up" : (d.chg < 0 ? "down" : "");
        var sign = d.chg > 0 ? "+" : "";
        html += '<div class="fin-row"><span class="fin-name"><span class="crypto-icon">' + d.icon + '</span>' + d.name + ' <span class="crypto-dominance">' + d.dom + '</span></span><span class="fin-val ' + cls + '">$' + d.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) + ' <span style="font-size:8px">' + sign + d.chg.toFixed(2) + '%</span></span></div>';
      }
      el.innerHTML = html;
    }
    function renderFearGreed() {
      var el = $("fgGauge");
      if (!el) return;
      var fg = FG_INDEX;
      var pct = fg.val; // 0-100
      var emoji = pct >= 75 ? "😱 EXTREME GREED" : pct >= 55 ? "🤑 GREED" : pct >= 45 ? "😐 NEUTRAL" : pct >= 25 ? "😨 FEAR" : "😰 EXTREME FEAR";
      var color = pct >= 75 ? "#00cc44" : pct >= 55 ? "#88cc00" : pct >= 45 ? "#ffcc00" : pct >= 25 ? "#ff8800" : "#ff2222";
      el.innerHTML = '<div class="fg-wrap">' +
        '<div class="fg-gauge-bar"><div class="fg-marker" style="left:' + pct + '%"></div><span class="fg-extreme left">Fear</span><span class="fg-extreme right">Greed</span></div>' +
        '<div><div class="fg-label" style="color:' + color + '">' + emoji + '</div><div class="fg-val">' + fg.val + ' / 100  |  Prev: ' + fg.prev + '</div></div>' +
        '</div>';
    }
    function renderYieldTable() {
      var el = $("finYield");
      if (!el) return;
      var html = "";
      for (var i = 0; i < FIN_YIELD.length; i++) {
        var d = FIN_YIELD[i];
        var cls = parseFloat(d.val) < 0 ? "down" : "up";
        var sign = d.chg > 0 ? "+" : "";
        html += '<div class="fin-row"><span class="fin-name">' + d.name + '</span><span class="fin-val ' + cls + '">' + d.val + ' <span style="font-size:8px">' + sign + d.chg.toFixed(1) + 'bp</span></span></div>';
      }
      el.innerHTML = html;
    }
    renderCryptoTable();
    renderTable("finCommodities", FIN_COMMODITIES, false);
    renderTable("finCurrencies", FIN_CURRENCIES, false);
    renderTable("finRates", FIN_RATES, true);
    renderFearGreed();
    renderYieldTable();
    renderTable("finPrediction", FIN_PREDICTION, true);
    renderTable("finGDP", FIN_GDP, true);
    renderStocksTable();
  }
  renderFinanceTables();
  finRendered = true;
  document.querySelector('.sb-tab[data-tab="finance"]').addEventListener("click", function () {
    renderFinanceTables();
  });

  /* ===== INFRA TAB RENDERING ===== */
  var infraRendered = false;
  function renderInfraTab() {
    function renderCables() {
      var el = $("infraCables");
      if (!el) return;
      var html = "";
      for (var i = 0; i < INFRA_CABLES.length; i++) {
        var c = INFRA_CABLES[i];
        var cls = c.status === "ok" ? "ok" : c.status === "warn" ? "warn" : "crit";
        html += '<div class="fin-row"><span class="fin-name"><span class="infra-status ' + cls + '"></span>' + c.name + ' <span style="color:#555;font-size:8px">' + c.path + '</span></span><span class="fin-val" style="font-size:8px;color:' + (c.status === "ok" ? "#00ff88" : c.status === "warn" ? "#ffaa00" : "#ff4444") + '">' + (c.status === "ok" ? "OK" : c.status === "warn" ? "WARN" : "CRIT") + '</span></div>';
        if (c.status !== "ok") html += '<div class="fin-row" style="padding-left:12px;font-size:7px;color:#ff8800">↳ ' + c.fault + '</div>';
      }
      el.innerHTML = html;
    }
    function renderPorts() {
      var el = $("infraPorts");
      if (!el) return;
      var html = "";
      for (var i = 0; i < INFRA_PORTS.length; i++) {
        var p = INFRA_PORTS[i];
        var barColor = p.congestion > 75 ? "#ff4444" : p.congestion > 60 ? "#ff6600" : p.congestion > 40 ? "#ffaa00" : "#00ff88";
        var pctCls = p.congestion > 75 ? "down" : p.congestion > 60 ? "down" : p.congestion > 40 ? "up" : "up";
        html += '<div class="fin-row"><span class="fin-name">' + p.name + '</span><span class="port-bar-wrap"><span class="port-bar-fill" style="width:' + p.congestion + '%;background:' + barColor + '"></span></span><span class="port-pct ' + pctCls + '">' + p.congestion + '%</span></div>';
      }
      el.innerHTML = html;
    }
    function renderEnergy() {
      var el = $("infraEnergy");
      if (!el) return;
      var html = "";
      for (var i = 0; i < INFRA_ENERGY.length; i++) {
        var e = INFRA_ENERGY[i];
        var barColor = e.pct > 70 ? "#00ff88" : e.pct > 40 ? "#ffaa00" : "#ff4444";
        var stCls = e.status === "ok" ? "ok" : e.status === "warn" ? "warn" : "crit";
        html += '<div class="fin-row"><span class="fin-name"><span class="infra-status ' + stCls + '"></span>' + e.name + '</span><span class="fin-val" style="font-size:9px">' + e.val.toFixed(1).toLocaleString() + ' ' + e.unit + '</span></div>' +
          '<div class="energy-gauge"><div class="energy-bar"><div class="energy-fill" style="width:' + e.pct + '%;background:' + barColor + '"></div></div><span class="energy-pct">' + e.pct + '%</span></div>';
      }
      el.innerHTML = html;
    }
    function renderPipes() {
      var el = $("infraPipes");
      if (!el) return;
      var html = "";
      for (var i = 0; i < INFRA_PIPES.length; i++) {
        var p = INFRA_PIPES[i];
        var stCls = p.status === "ok" ? "ok" : p.status === "warn" ? "warn" : "crit";
        var statusColor = p.status === "ok" ? "#00ff88" : p.status === "warn" ? "#ffaa00" : "#ff4444";
        html += '<div class="fin-row"><span class="fin-name"><span class="infra-status ' + stCls + '"></span>' + p.name + '</span><span class="fin-val" style="font-size:8px;color:' + statusColor + '">' + p.status.toUpperCase() + '</span></div>' +
          '<div class="fin-row" style="padding-left:12px;font-size:7px;color:#666">↳ ' + p.detail + '</div>';
      }
      el.innerHTML = html;
    }
    renderCables();
    renderPorts();
    renderEnergy();
    renderPipes();
  }
  document.querySelector('.sb-tab[data-tab="infra"]').addEventListener("click", function () {
    if (!infraRendered) { renderInfraTab(); infraRendered = true; }
  });

  var scenRendered = false;
  document.querySelector('.sb-tab[data-tab="scenario"]').addEventListener("click", function () {
    if (!scenRendered) { renderScenarioCards(); scenRendered = true; }
  });

  /* ===== STEP 20: MAP LAYERS ===== */
  var mapEvts = genEvents();
  var layerGroups = {
    quakes: null,
    military: L.layerGroup(),
    naval: L.layerGroup(),
    wildfire: L.layerGroup(),
    cyber: L.layerGroup(),
    disease: L.layerGroup(),
    satellites: L.layerGroup(),
    cables: L.layerGroup(),
    ports: L.layerGroup()
  };
  function populateLayer(type, evts) {
    var lg = layerGroups[type];
    if (!lg) return;
    lg.clearLayers();
    for (var i = 0; i < evts.length; i++) {
      var e = evts[i];
      if (type === "military") {
        var m = L.circleMarker([e.lat, e.lng], { radius: 5, fillColor: "#0088ff", color: "#0055aa", weight: 1, fillOpacity: 0.7 });
        m.bindPopup('<span style="color:#0088ff;font-weight:700">Military Flight</span><br><span style="color:#555">' + rng(20000,50000) + ' ft • ' + rng(400,800) + ' kts</span>');
        lg.addLayer(m);
      } else if (type === "naval") {
        var n = L.circleMarker([e.lat, e.lng], { radius: 6, fillColor: "#00ccaa", color: "#008866", weight: 1, fillOpacity: 0.7 });
        n.bindPopup('<span style="color:#00ccaa;font-weight:700">Naval Vessel</span><br><span style="color:#555">' + ["Destroyer","Frigate","Carrier","Submarine","Patrol"][rng(0,4)] + ' • ' + rng(5,30) + ' kts</span>');
        lg.addLayer(n);
      } else if (type === "wildfire") {
        var w = L.circle([e.lat, e.lng], { radius: rng(20000,80000), fillColor: "#ff4444", color: "#cc0000", weight: 1, fillOpacity: 0.25 });
        w.bindPopup('<span style="color:#ff4444;font-weight:700">Wildfire</span><br><span style="color:#555">' + rng(50,5000) + ' acres • ' + rng(10,95) + '% contained</span>');
        lg.addLayer(w);
      } else if (type === "cyber") {
        var c = L.circleMarker([e.lat, e.lng], { radius: 7, fillColor: "#aa00ff", color: "#6600aa", weight: 1, fillOpacity: 0.6 });
        c.bindPopup('<span style="color:#aa00ff;font-weight:700">Cyber Threat</span><br><span style="color:#555">' + ["DDoS","Ransomware","Data Breach","Phishing","APT"][rng(0,4)] + ' • ' + rng(100,50000) + ' targets</span>');
        lg.addLayer(c);
      } else if (type === "disease") {
        var d = L.circle([e.lat, e.lng], { radius: rng(15000,60000), fillColor: "#ffdd00", color: "#ccaa00", weight: 1, fillOpacity: 0.2 });
        d.bindPopup('<span style="color:#ffdd00;font-weight:700">Disease Outbreak</span><br><span style="color:#555">' + ["H5N1","Dengue","Cholera","Marburg","MERS"][rng(0,4)] + ' • ' + rng(50,5000) + ' cases</span>');
        lg.addLayer(d);
      } else if (type === "satellites") {
        var s = L.circleMarker([e.lat, e.lng], { radius: 3, fillColor: "#888888", color: "#555555", weight: 0.5, fillOpacity: 0.8 });
        s.bindPopup('<span style="color:#888;font-weight:700">Satellite</span><br><span style="color:#555">Orbit: ' + rng(160,36000) + ' km • ' + ["LEO","MEO","GEO","HEO"][rng(0,3)] + '</span>');
        lg.addLayer(s);
      }
    }
  }
  for (var type in mapEvts) {
    if (layerGroups[type]) populateLayer(type, mapEvts[type]);
  }

  // After initial mock, start live data streams
  startAllLiveData();

  // Populate undersea cable layer
  function populateCables() {
    var lg = layerGroups.cables;
    if (!lg) return;
    lg.clearLayers();
    for (var i = 0; i < CABLE_PATHS.length; i++) {
      var path = CABLE_PATHS[i];
      var cable = INFRA_CABLES[i];
      var color = cable && cable.status === "crit" ? "#ff4444" : cable && cable.status === "warn" ? "#ffaa00" : "rgba(255,68,136,0.45)";
      var line = L.polyline(path, { color: color, weight: 1.5, dashArray: cable && cable.status === "ok" ? "" : "4 6", opacity: 0.6 });
      line.bindPopup('<span style="color:#ff4488;font-weight:700">' + (cable ? cable.name : "Cable") + '</span><br><span style="color:#888;font-size:9px">' + (cable ? cable.path : "") + '</span><br><span style="color:' + (cable && cable.status !== "ok" ? "#ffaa00" : "#00ff88") + ';font-size:10px">' + (cable && cable.fault ? cable.fault : "Operational") + '</span>');
      lg.addLayer(line);
    }
  }
  populateCables();

  // Populate port congestion layer
  function populatePorts() {
    var lg = layerGroups.ports;
    if (!lg) return;
    lg.clearLayers();
    for (var i = 0; i < INFRA_PORTS.length; i++) {
      var p = INFRA_PORTS[i];
      var radius = 6 + (p.congestion / 100) * 12;
      var color = p.congestion > 75 ? "#ff4444" : p.congestion > 60 ? "#ff6600" : p.congestion > 40 ? "#ffaa00" : "#44ccff";
      var marker = L.circleMarker([p.lat, p.lng], {
        radius: radius, fillColor: color, color: color,
        weight: 1, fillOpacity: 0.5, opacity: 0.7
      });
      var sevLabel = p.congestion > 75 ? "CRITICAL" : p.congestion > 60 ? "HIGH" : p.congestion > 40 ? "MODERATE" : "LOW";
      marker.bindPopup('<span style="color:#44ccff;font-weight:700">' + p.name + ' Port</span><br><span style="color:' + color + '">Congestion: ' + p.congestion + '% (' + sevLabel + ')</span><br><span style="color:#555;font-size:9px">' + rng(8,45) + ' vessels waiting</span>');
      lg.addLayer(marker);
    }
  }
  populatePorts();
  window._toggleLayer = function (type, visible) {
    var lg = layerGroups[type];
    if (!lg || !map) return;
    if (type === "quakes") {
      if (visible && quakeLayer) quakeLayer.addTo(map);
      else if (quakeLayer) map.removeLayer(quakeLayer);
    } else {
      if (visible) lg.addTo(map); else map.removeLayer(lg);
    }
  };

  /* ===== STEP 21: STATS PANEL ===== */
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
      '<button class="widget-toggle" title="Toggle" data-target="stats">&#x23FB;</button>' +
      '<div class="stat-row"><span class="stat-label">Total (24h)</span><span class="stat-value">' + total + '</span></div>' +
      '<div class="stat-row"><span class="stat-label">Max Magnitude</span><span class="stat-value mag">' + maxMag.toFixed(1) + '</span></div>' +
      '<div class="stat-row"><span class="stat-label">Significant (4.5+)</span><span class="stat-value">' + significant + '</span></div>' +
      '<div class="stat-row"><span class="stat-label">Avg Depth</span><span class="stat-value">' + avgDepth + ' km</span></div>';
    // Toggle re-wired automatically via event delegation on document
  }
  renderStats(MOCK.features);

  /* ===== STEP 22: EARTHQUAKE TICKER ===== */
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

  /* ===== STEP 23: MAP ===== */
  var map = null, quakeLayer = null;
  try {
    if (typeof L !== "undefined" && $("map")) {
      map = L.map("map", { center: [20, 0], zoom: 2, zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OSM &copy; CARTO', subdomains: "abcd", maxZoom: 19
      }).addTo(map);
      quakeLayer = L.layerGroup().addTo(map);
      layerGroups.quakes = quakeLayer;
      scenarioLayer.addTo(map);
      map.on("click", function (e) {
        var closest = null, closestDist = Infinity;
        for (var i = 0; i < COUNTRIES.length; i++) {
          var c = COUNTRIES[i];
          var dist = Math.sqrt(Math.pow(e.latlng.lat - c.lat, 2) + Math.pow(e.latlng.lng - c.lng, 2));
          if (dist < closestDist) { closestDist = dist; closest = c; }
        }
        if (closest && closestDist < 15) window._showRiskDetail(closest.iso);
      });
      console.log("[Monitor] Map initialized");
    } else { console.warn("[Monitor] Leaflet not available"); }
  } catch (e) { console.error("[Monitor] Map init error:", e); }

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

  /* ===== STEP 24: LIVE DATA FETCH ===== */
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
    } catch (e) { console.warn("[Monitor] Live fetch failed:", e); }
    populate(MOCK);
  }

  fetchQuakes();
  setInterval(fetchQuakes, 60000);

  console.log("[Monitor] FULLY INITIALIZED — " + WIDGETS.length + " widgets, toggle system active");
})();

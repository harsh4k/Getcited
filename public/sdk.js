(function () {
  "use strict";

  var script =
    document.currentScript ||
    document.querySelector('script[data-getcited-key], script[data-sdk-key]');
  if (!script) return;

  var SDK_KEY =
    script.getAttribute("data-getcited-key") ||
    script.getAttribute("data-sdk-key") ||
    "";
  if (!SDK_KEY) return;

  var ORIGIN = (function () {
    try {
      return new URL(script.src).origin;
    } catch (e) {
      return window.location.origin;
    }
  })();

  var STORAGE_ANON = "gc_anon_" + SDK_KEY;
  var STORAGE_SESSION = "gc_session_" + SDK_KEY;
  var STORAGE_EXP = "gc_exp_" + SDK_KEY;
  var QUEUE = [];
  var FLUSH_MS = 2000;
  var flushTimer = null;
  var maxScroll = 0;
  var reportedDepths = {};
  var pageStart = Date.now();
  var experiments = [];

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOrCreate(key, hours) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.id && (!parsed.exp || parsed.exp > Date.now())) {
          return parsed.id;
        }
      }
    } catch (e) {}
    var id = uuid();
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          id: id,
          exp: hours ? Date.now() + hours * 3600 * 1000 : null,
        })
      );
    } catch (e) {}
    return id;
  }

  var anonymousId = getOrCreate(STORAGE_ANON, null);
  var sessionId = getOrCreate(STORAGE_SESSION, 0.5);

  function cssPath(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + el.id;
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && parts.length < 5) {
      var name = node.tagName.toLowerCase();
      if (node.className && typeof node.className === "string") {
        var cls = node.className.trim().split(/\s+/).slice(0, 2).join(".");
        if (cls) name += "." + cls;
      }
      parts.unshift(name);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }

  function enqueue(eventType, properties, extra) {
    var payload = {
      sdk_key: SDK_KEY,
      anonymous_id: anonymousId,
      session_id: sessionId,
      event_type: eventType,
      path: window.location.pathname + window.location.search,
      url: window.location.href,
      referrer: document.referrer || "",
      properties: properties || {},
      experiment_id: (extra && extra.experiment_id) || null,
      variant: (extra && extra.variant) || null,
    };
    QUEUE.push(payload);
    scheduleFlush();
  }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, FLUSH_MS);
  }

  function flush() {
    flushTimer = null;
    if (!QUEUE.length) return;
    var batch = QUEUE.splice(0, QUEUE.length);
    var body = JSON.stringify({ events: batch });
    var endpoint = ORIGIN + "/ab/collect";
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(endpoint, blob)) return;
      }
    } catch (e) {}
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
      mode: "cors",
    }).catch(function () {});
  }

  function trackPageview() {
    enqueue("pageview", {
      title: document.title,
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  function trackClick(event) {
    var el = event.target;
    if (!el) return;
    var tag = (el.tagName || "").toLowerCase();
    enqueue("click", {
      tag: tag,
      id: el.id || "",
      text: (el.innerText || el.textContent || "").trim().slice(0, 120),
      href: el.href || (el.closest && el.closest("a") && el.closest("a").href) || "",
      selector: cssPath(el),
      x: event.clientX,
      y: event.clientY,
    });
  }

  function trackScroll() {
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop || 0;
    var height = doc.scrollHeight - window.innerHeight;
    if (height <= 0) return;
    var depth = Math.min(100, Math.round((scrollTop / height) * 100));
    if (depth > maxScroll) maxScroll = depth;
    [25, 50, 75, 100].forEach(function (mark) {
      if (maxScroll >= mark && !reportedDepths[mark]) {
        reportedDepths[mark] = true;
        enqueue("scroll", { depth: mark });
      }
    });
  }

  function trackHeartbeat() {
    enqueue("engagement", {
      seconds: Math.round((Date.now() - pageStart) / 1000),
      max_scroll: maxScroll,
    });
  }

  function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function pickVariant(exp) {
    var variants = exp.variants || [];
    if (!variants.length) return null;
    var bucket = hashString(anonymousId + ":" + exp.id) % 100;
    if (bucket >= (exp.traffic_pct || 100)) return null;
    var total = 0;
    variants.forEach(function (v) {
      total += Number(v.weight || 1);
    });
    var pick = hashString(anonymousId + ":v:" + exp.id) % total;
    var cursor = 0;
    for (var i = 0; i < variants.length; i++) {
      cursor += Number(variants[i].weight || 1);
      if (pick < cursor) return variants[i];
    }
    return variants[0];
  }

  function loadAssignments(cb) {
    var stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_EXP) || "{}") || {};
    } catch (e) {
      stored = {};
    }
    fetch(ORIGIN + "/ab/config/" + encodeURIComponent(SDK_KEY), {
      method: "GET",
      mode: "cors",
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        experiments = (data && data.experiments) || [];
        var assignments = {};
        experiments.forEach(function (exp) {
          var key = String(exp.id);
          if (stored[key] && stored[key].variant) {
            assignments[key] = stored[key];
            return;
          }
          var chosen = pickVariant(exp);
          if (!chosen) return;
          assignments[key] = {
            experiment_id: key,
            variant: chosen.name,
            meta: chosen,
          };
          enqueue(
            "experiment_assigned",
            { experiment_name: exp.name },
            { experiment_id: key, variant: chosen.name }
          );
        });
        try {
          localStorage.setItem(STORAGE_EXP, JSON.stringify(assignments));
        } catch (e) {}
        cb(assignments);
      })
      .catch(function () {
        cb(stored);
      });
  }

  function applyAssignments(assignments) {
    Object.keys(assignments || {}).forEach(function (id) {
      var a = assignments[id];
      if (!a || !a.variant) return;
      document.documentElement.setAttribute("data-gc-exp-" + id, a.variant);
      document.documentElement.classList.add("gc-exp-" + id + "-" + a.variant);
      var meta = a.meta || {};
      if (meta.selector && meta.html != null) {
        try {
          var nodes = document.querySelectorAll(meta.selector);
          nodes.forEach(function (node) {
            node.innerHTML = meta.html;
          });
        } catch (e) {}
      }
      if (meta.selector && meta.text != null) {
        try {
          var textNodes = document.querySelectorAll(meta.selector);
          textNodes.forEach(function (node) {
            node.textContent = meta.text;
          });
        } catch (e) {}
      }
    });
  }

  var api = {
    key: SDK_KEY,
    anonymousId: anonymousId,
    sessionId: sessionId,
    track: function (name, props) {
      enqueue(name || "custom", props || {});
    },
    convert: function (name, props) {
      var p = props || {};
      p.conversion_name = name || "default";
      enqueue("conversion", p);
    },
    getVariant: function (experimentId) {
      try {
        var stored = JSON.parse(localStorage.getItem(STORAGE_EXP) || "{}") || {};
        var a = stored[String(experimentId)];
        return a ? a.variant : null;
      } catch (e) {
        return null;
      }
    },
    flush: flush,
  };

  window.GetCited = api;
  window.getCited = api;

  function boot() {
    trackPageview();
    document.addEventListener("click", trackClick, true);
    window.addEventListener("scroll", trackScroll, { passive: true });
    setInterval(trackHeartbeat, 15000);
    window.addEventListener("beforeunload", function () {
      enqueue("page_leave", {
        seconds: Math.round((Date.now() - pageStart) / 1000),
        max_scroll: maxScroll,
      });
      flush();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flush();
    });
    loadAssignments(applyAssignments);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

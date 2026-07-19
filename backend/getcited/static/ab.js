(function () {
  const sitesEl = document.getElementById("sites");
  const detailEl = document.getElementById("detail");
  const siteStatus = document.getElementById("site-status");
  const expStatus = document.getElementById("exp-status");
  let selectedSite = null;
  const origin = window.location.origin;

  async function api(path, options) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (response.status === 401) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      throw new Error("Authentication required.");
    }
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function snippetFor(key) {
    return (
      '<script src="' +
      origin +
      '/static/sdk.js" data-getcited-key="' +
      key +
      '" async></' +
      "script>"
    );
  }

  async function loadSites() {
    const data = await api("/ab/sites");
    if (!data.sites.length) {
      sitesEl.innerHTML = "<p class='hint'>No sites yet — create one above.</p>";
      return;
    }
    sitesEl.innerHTML = data.sites
      .map(
        (site) => `
            <button type="button" class="site-card" data-id="${site.id}">
              <strong>${escapeHtml(site.name)}</strong>
              <span>${escapeHtml(site.url)}</span>
              <code>${escapeHtml(site.sdk_key)}</code>
            </button>`
      )
      .join("");
    sitesEl.querySelectorAll(".site-card").forEach((btn) => {
      btn.addEventListener("click", () => selectSite(Number(btn.dataset.id)));
    });
  }

  async function selectSite(siteId) {
    const data = await api(`/ab/sites/${siteId}`);
    selectedSite = data.site;
    detailEl.hidden = false;
    document.getElementById("detail-title").textContent = selectedSite.name;
    document.getElementById("detail-meta").textContent =
      `${selectedSite.url} · key ${selectedSite.sdk_key}`;
    document.getElementById("snippet").textContent = snippetFor(selectedSite.sdk_key);

    const experiments = data.experiments || [];
    document.getElementById("experiments").innerHTML = experiments.length
      ? experiments
          .map(
            (exp) => `
              <article class="exp-card">
                <div>
                  <strong>${escapeHtml(exp.name)}</strong>
                  <span class="badge">${escapeHtml(exp.status)}</span>
                </div>
                <p class="meta">
                  Variants: ${escapeHtml(exp.variants.map((v) => v.name).join(", "))}
                  · traffic ${exp.traffic_pct}%
                </p>
                <div class="exp-actions">
                  <button type="button" data-report="${exp.id}">View report</button>
                  ${
                    exp.status === "running"
                      ? `<button type="button" class="secondary" data-pause="${exp.id}">Pause</button>`
                      : `<button type="button" class="secondary" data-run="${exp.id}">Resume</button>`
                  }
                </div>
                <pre class="report" id="report-${exp.id}" hidden></pre>
              </article>`
          )
          .join("")
      : "<p class='hint'>No experiments yet.</p>";

    document.querySelectorAll("[data-report]").forEach((btn) => {
      btn.addEventListener("click", () => showReport(Number(btn.dataset.report)));
    });
    document.querySelectorAll("[data-pause]").forEach((btn) => {
      btn.addEventListener("click", () => setStatus(Number(btn.dataset.pause), "paused"));
    });
    document.querySelectorAll("[data-run]").forEach((btn) => {
      btn.addEventListener("click", () => setStatus(Number(btn.dataset.run), "running"));
    });

    renderOverview(data.overview || {});
  }

  function renderOverview(overview) {
    const totals = overview.totals || {};
    document.getElementById("overview").innerHTML = `
          <div class="stats">
            <div><strong>${totals.events || 0}</strong><span>Events</span></div>
            <div><strong>${totals.users || 0}</strong><span>Users</span></div>
            <div><strong>${totals.sessions || 0}</strong><span>Sessions</span></div>
          </div>
          <div class="split">
            <div>
              <h4>By event type</h4>
              <ul>${
                (overview.by_type || [])
                  .map((row) => `<li>${escapeHtml(row.event_type)} — ${row.count}</li>`)
                  .join("") || "<li>No events yet</li>"
              }</ul>
            </div>
            <div>
              <h4>Top pages</h4>
              <ul>${
                (overview.top_paths || [])
                  .map((row) => `<li>${escapeHtml(row.path)} — ${row.count}</li>`)
                  .join("") || "<li>No pageviews yet</li>"
              }</ul>
            </div>
          </div>
        `;
    document.getElementById("recent").innerHTML =
      (overview.recent || [])
        .map(
          (ev) => `
            <div class="event-row">
              <code>${escapeHtml(ev.event_type)}</code>
              <span>${escapeHtml(ev.path || "")}</span>
              <span class="meta">${escapeHtml(ev.variant || "")} ${escapeHtml(ev.created_at || "")}</span>
            </div>`
        )
        .join("") || "<p class='hint'>Waiting for traffic…</p>";
  }

  async function showReport(experimentId) {
    const data = await api(`/ab/experiments/${experimentId}/report`);
    const el = document.getElementById(`report-${experimentId}`);
    el.hidden = false;
    el.textContent = JSON.stringify(data, null, 2);
  }

  async function setStatus(experimentId, status) {
    await api(`/ab/experiments/${experimentId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    if (selectedSite) selectSite(selectedSite.id);
  }

  document.getElementById("site-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    siteStatus.hidden = false;
    siteStatus.textContent = "Creating site…";
    try {
      const site = await api("/ab/sites", {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("name").value.trim(),
          url: document.getElementById("url").value.trim(),
        }),
      });
      siteStatus.textContent = `Created — SDK key ${site.sdk_key}`;
      event.target.reset();
      await loadSites();
      await selectSite(site.id);
    } catch (err) {
      siteStatus.textContent = err.message;
    }
  });

  document.getElementById("exp-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedSite) return;
    expStatus.hidden = false;
    expStatus.textContent = "Creating experiment…";
    const selector = document.getElementById("selector").value.trim();
    const htmlB = document.getElementById("html-b").value.trim();
    const variantA = { name: document.getElementById("variant-a").value.trim(), weight: 1 };
    const variantB = {
      name: document.getElementById("variant-b").value.trim(),
      weight: 1,
    };
    if (selector) {
      variantA.selector = selector;
      variantB.selector = selector;
      if (htmlB) variantB.text = htmlB;
    }
    try {
      await api(`/ab/sites/${selectedSite.id}/experiments`, {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("exp-name").value.trim(),
          traffic_pct: Number(document.getElementById("exp-traffic").value || 100),
          variants: [variantA, variantB],
        }),
      });
      expStatus.textContent = "Experiment running.";
      event.target.reset();
      document.getElementById("variant-a").value = "control";
      document.getElementById("variant-b").value = "treatment";
      document.getElementById("exp-traffic").value = "100";
      await selectSite(selectedSite.id);
    } catch (err) {
      expStatus.textContent = err.message;
    }
  });

  document.getElementById("copy-snippet").addEventListener("click", async () => {
    const text = document.getElementById("snippet").textContent;
    try {
      await navigator.clipboard.writeText(text);
      document.getElementById("copy-snippet").textContent = "Copied";
      setTimeout(() => {
        document.getElementById("copy-snippet").textContent = "Copy snippet";
      }, 1200);
    } catch (err) {
      alert("Copy failed — select the snippet manually.");
    }
  });

  loadSites().catch((err) => {
    sitesEl.innerHTML = `<p class="status">${escapeHtml(err.message)}</p>`;
  });
})();

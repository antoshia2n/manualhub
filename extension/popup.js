const API = "https://manualhub.vercel.app/api/notion";

// ── Tag colour (same deterministic hash as main app) ──────────
const TAG_COLORS = ["#1d4ed8","#059669","#6d28d9","#c2410c","#0c4a6e","#92400e"];
const TAG_BGS    = ["rgba(29,78,216,0.10)","rgba(5,150,105,0.12)","rgba(109,40,217,0.10)","rgba(194,65,12,0.10)","rgba(12,74,110,0.09)","rgba(146,64,14,0.11)"];

function tagColor(label) {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) & 0xffff;
  const idx = h % TAG_COLORS.length;
  return { color: TAG_COLORS[idx], bg: TAG_BGS[idx] };
}

function tagHtml(label) {
  const { color, bg } = tagColor(label);
  return `<span class="tag" style="color:${color};background:${bg};border-color:${color}55">${label}</span>`;
}

// ── State ─────────────────────────────────────────────────────
let allManuals = [];
let activeTab  = "manuals";
let query      = "";
let openManualId = null;
let openStepIds  = new Set();

// ── Fetch ─────────────────────────────────────────────────────
async function fetchManuals() {
  const content = document.getElementById("content");
  content.innerHTML = `<div class="loading"><span class="spin">⟳</span> 読み込み中…</div>`;
  try {
    const r = await fetch(API);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "取得に失敗しました");
    allManuals = data.manuals || [];
    render();
  } catch (e) {
    content.innerHTML = `<div class="empty">⚠️ ${e.message}<br><small>Notionに接続できませんでした</small></div>`;
  }
}

// ── Search filter ─────────────────────────────────────────────
function filterManuals() {
  if (!query) return allManuals;
  const q = query.toLowerCase();
  return allManuals.filter(m =>
    [m.title, m.description, ...(m.tags || []),
     ...m.steps.flatMap(s => [s.title, s.explanation, s.template, ...(s.links||[]).map(l=>l.label)])
    ].some(f => f?.toLowerCase().includes(q))
  );
}

function filterTemplates() {
  const items = [];
  allManuals.forEach(m => {
    m.steps.forEach(s => {
      if (s.template) items.push({ title: s.title || `手順 ${m.title}`, source: m.title, text: s.template });
    });
  });
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(i => i.title.toLowerCase().includes(q) || i.source.toLowerCase().includes(q) || i.text.toLowerCase().includes(q));
}

// ── Copy helper ───────────────────────────────────────────────
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = "✓ コピー完了";
    btn.classList.add("ok");
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove("ok"); }, 2000);
  });
}

// ── Render ────────────────────────────────────────────────────
function render() {
  const content = document.getElementById("content");
  if (activeTab === "manuals") renderManuals(content);
  else renderTemplates(content);
}

function renderManuals(content) {
  const manuals = filterManuals();
  if (manuals.length === 0) {
    content.innerHTML = `<div class="empty">見つかりません</div>`;
    return;
  }

  content.innerHTML = manuals.map(m => {
    const isOpen = openManualId === m.id;
    const tags = (m.tags || []).map(tagHtml).join("");
    const stepsHtml = isOpen ? m.steps.map((s, i) => {
      const stepOpen = openStepIds.has(s.id);
      const links = (s.links || []).map(l =>
        `<a class="link-btn" href="${l.url}" target="_blank">↗ ${l.label}</a>`
      ).join("");
      const tpl = s.template
        ? `<div class="tpl-block">${escHtml(s.template)}</div>
           <button class="copy-btn" data-copy="${escAttr(s.template)}">📋 テンプレをコピー</button>`
        : "";
      return `
        <div class="step-item" data-step="${s.id}">
          <div class="step-header">
            <span class="step-num">${i + 1}</span>
            <span class="step-title">${escHtml(s.title || `手順 ${i+1}`)}</span>
            <svg class="chevron ${stepOpen ? "open" : ""}" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7a7066" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="step-body ${stepOpen ? "open" : ""}">
            ${s.explanation ? `<p class="step-explain">${escHtml(s.explanation)}</p>` : ""}
            ${links ? `<div class="link-list">${links}</div>` : ""}
            ${tpl}
          </div>
        </div>`;
    }).join("") : "";

    return `
      <div class="manual-card">
        <div class="manual-head" data-manual="${m.id}">
          <div style="flex:1;min-width:0">
            ${tags ? `<div style="margin-bottom:4px">${tags}</div>` : ""}
            <div class="manual-title">${escHtml(m.title || "（無題）")}</div>
          </div>
          <span class="manual-steps-count">${m.steps.length}手順</span>
          <svg class="chevron ${isOpen ? "open" : ""}" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7a7066" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        ${isOpen ? `<div class="steps-list">${stepsHtml}</div>` : ""}
      </div>`;
  }).join("");

  // Events: manual toggle
  content.querySelectorAll(".manual-head").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.manual;
      openManualId = openManualId === id ? null : id;
      render();
    });
  });

  // Events: step toggle
  content.querySelectorAll(".step-item").forEach(el => {
    el.addEventListener("click", e => {
      if (e.target.closest(".copy-btn") || e.target.closest("a")) return;
      const id = el.dataset.step;
      if (openStepIds.has(id)) openStepIds.delete(id);
      else openStepIds.add(id);
      render();
    });
  });

  // Events: copy buttons
  content.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      copyText(btn.dataset.copy, btn);
    });
  });
}

function renderTemplates(content) {
  const items = filterTemplates();
  if (items.length === 0) {
    content.innerHTML = `<div class="empty">テンプレートがありません</div>`;
    return;
  }
  content.innerHTML = items.map((item, i) => `
    <div class="tpl-card">
      <div class="tpl-card-title">${escHtml(item.title)}</div>
      <div class="tpl-card-source">📖 ${escHtml(item.source)}</div>
      <div class="tpl-block">${escHtml(item.text)}</div>
      <button class="copy-btn" data-idx="${i}">📋 コピー</button>
    </div>
  `).join("");

  content.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = items[parseInt(btn.dataset.idx)];
      copyText(item.text, btn);
    });
  });
}

// ── Utils ─────────────────────────────────────────────────────
function escHtml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function escAttr(s) {
  return String(s || "").replace(/"/g, "&quot;").replace(/\n/g, "\\n");
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeTab = tab.dataset.tab;
      render();
    });
  });

  // Search
  document.getElementById("searchInput").addEventListener("input", e => {
    query = e.target.value;
    render();
  });

  // Refresh
  document.getElementById("refreshBtn").addEventListener("click", fetchManuals);

  fetchManuals();
});

const BASE  = "https://api.notion.com/v1";
const DB_ID = process.env.NOTION_DB_ID;
const CHUNK = 1900;

function h() {
  return {
    "Authorization": `Bearer ${process.env.NOTION_SECRET}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  };
}

const rt   = (text) => [{ type: "text", text: { content: String(text).slice(0, 1900) } }];
const rtb  = (text) => [{ type: "text", text: { content: String(text).slice(0, 1900) }, annotations: { bold: true } }];
const hd2  = text  => ({ object: "block", type: "heading_2",  heading_2:  { rich_text: rtb(text) } });
const para = text  => ({ object: "block", type: "paragraph",  paragraph:  { rich_text: rt(text)  } });
const bull = text  => ({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: rt(text) } });
const div  = ()    => ({ object: "block", type: "divider", divider: {} });

function manualToBlocks(manual) {
  const blocks = [];
  if (manual.description) blocks.push(para(manual.description));
  if ((manual.tags || []).length > 0) blocks.push(para("🏷 " + manual.tags.join(" / ")));
  blocks.push(div());

  (manual.steps || []).forEach((step, i) => {
    blocks.push(hd2(`${i + 1}. ${step.title || ""}`));
    if (step.explanation) blocks.push(para(step.explanation));
    (step.tips || []).forEach(t => {
      const e = t.type === "warn" ? "⚠️" : t.type === "note" ? "📝" : "💡";
      blocks.push(bull(`${e} ${t.text}`));
    });
    if ((step.links || []).length > 0)
      step.links.forEach(l => blocks.push(bull(`🔗 ${l.label}  ${l.url}`)));
    if (step.template) {
      blocks.push(para("📋 テンプレート:"));
      const t = step.template;
      for (let j = 0; j < t.length; j += CHUNK)
        blocks.push({ object: "block", type: "code", code: { rich_text: rt(t.slice(j, j + CHUNK)), language: "plain text" } });
    }
    if ((step.checklist || []).length > 0)
      step.checklist.forEach(c => blocks.push(bull(`☐ ${c.text}`)));
    blocks.push(div());
  });

  // Hidden sync JSON in a toggle
  const json = JSON.stringify(manual);
  const jsonBlocks = [];
  for (let i = 0; i < json.length; i += CHUNK)
    jsonBlocks.push({ object: "block", type: "code", code: { rich_text: rt(json.slice(i, i + CHUNK)), language: "json" } });

  blocks.push({
    object: "block", type: "toggle",
    toggle: { rich_text: rt("🔧 Manual Hub 同期データ（編集しないでください）"), children: jsonBlocks },
  });

  return blocks;
}

async function readPageJson(pageId) {
  const r = await fetch(`${BASE}/blocks/${pageId}/children`, { headers: h() });
  const data = await r.json();
  const toggle = (data.results || []).find(b => b.type === "toggle");
  if (!toggle) return null;
  const cr = await fetch(`${BASE}/blocks/${toggle.id}/children`, { headers: h() });
  const cd = await cr.json();
  const text = (cd.results || [])
    .filter(b => b.type === "code")
    .map(b => b.code.rich_text.map(t => t.plain_text).join(""))
    .join("");
  try { return JSON.parse(text); } catch { return null; }
}

async function clearBlocks(pageId) {
  const r = await fetch(`${BASE}/blocks/${pageId}/children`, { headers: h() });
  const data = await r.json();
  await Promise.all((data.results || []).map(b =>
    fetch(`${BASE}/blocks/${b.id}`, { method: "DELETE", headers: h() })
  ));
}

async function findExistingPageId(manual) {
  try {
    const r = await fetch(`${BASE}/databases/${DB_ID}/query`, {
      method: "POST", headers: h(),
      body: JSON.stringify({
        filter: { and: [
          { property: "asset_type", select: { equals: "マニュアル" } },
          { property: "title", rich_text: { equals: (manual.title || "").slice(0, 100) } },
        ]},
      }),
    });
    const data = await r.json();
    for (const page of (data.results || [])) {
      const m = await readPageJson(page.id);
      if (m && m.id === manual.id) return page.id;
    }
  } catch {}
  return null;
}

async function pushBlocks(pageId, blocks) {
  for (let i = 0; i < blocks.length; i += 100) {
    await fetch(`${BASE}/blocks/${pageId}/children`, {
      method: "PATCH", headers: h(),
      body: JSON.stringify({ children: blocks.slice(i, i + 100) }),
    });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!process.env.NOTION_SECRET || !process.env.NOTION_DB_ID)
    return res.status(500).json({ error: "Notion環境変数が設定されていません" });

  if (req.method === "GET") {
    try {
      const r = await fetch(`${BASE}/databases/${DB_ID}/query`, {
        method: "POST", headers: h(),
        body: JSON.stringify({
          filter: { property: "asset_type", select: { equals: "マニュアル" } },
          sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        }),
      });
      const data = await r.json();
      if (data.object === "error") return res.status(400).json({ error: data.message });
      const manuals = (await Promise.all(
        (data.results || []).map(async p => {
          const m = await readPageJson(p.id);
          if (m) m.notionPageId = p.id;
          return m;
        })
      )).filter(Boolean);
      return res.json({ manuals });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === "POST") {
    const { manuals } = req.body;
    if (!Array.isArray(manuals)) return res.status(400).json({ error: "manuals must be an array" });
    try {
      const updated = await Promise.all(manuals.map(async manual => {
        const blocks = manualToBlocks(manual);
        const props  = {
          title:      { title: [{ text: { content: (manual.title || "（無題）").slice(0, 100) } }] },
          asset_type: { select: { name: "マニュアル" } },
        };
        let pageId = manual.notionPageId || await findExistingPageId(manual);

        if (pageId) {
          await fetch(`${BASE}/pages/${pageId}`, { method: "PATCH", headers: h(), body: JSON.stringify({ properties: props }) });
          await clearBlocks(pageId);
          await pushBlocks(pageId, blocks);
        } else {
          const r = await fetch(`${BASE}/pages`, {
            method: "POST", headers: h(),
            body: JSON.stringify({ parent: { database_id: DB_ID }, properties: props, children: blocks.slice(0, 100) }),
          });
          const page = await r.json();
          if (page.object === "error") throw new Error(page.message);
          pageId = page.id;
          if (blocks.length > 100) await pushBlocks(pageId, blocks.slice(100));
        }
        return { ...manual, notionPageId: pageId };
      }));
      return res.json({ manuals: updated });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(405).end();
}

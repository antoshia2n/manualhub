const BASE = "https://api.notion.com/v1";
const DB_ID = process.env.NOTION_DB_ID;
const CHUNK = 1900; // Notion rich_text limit per element

function headers() {
  return {
    "Authorization": `Bearer ${process.env.NOTION_SECRET}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  };
}

// Split large JSON into Notion paragraph blocks
function toBlocks(obj) {
  const s = JSON.stringify(obj);
  const chunks = [];
  for (let i = 0; i < s.length; i += CHUNK) chunks.push(s.slice(i, i + CHUNK));
  return chunks.map(c => ({
    object: "block", type: "paragraph",
    paragraph: { rich_text: [{ type: "text", text: { content: c } }] },
  }));
}

// Read paragraph blocks back into JSON
async function readPageJson(pageId) {
  const r = await fetch(`${BASE}/blocks/${pageId}/children`, { headers: headers() });
  const data = await r.json();
  const text = (data.results || [])
    .filter(b => b.type === "paragraph")
    .map(b => b.paragraph.rich_text.map(t => t.plain_text).join(""))
    .join("");
  try { return JSON.parse(text); } catch { return null; }
}

// Delete all child blocks of a page (needed before rewriting)
async function clearBlocks(pageId) {
  const r = await fetch(`${BASE}/blocks/${pageId}/children`, { headers: headers() });
  const data = await r.json();
  await Promise.all((data.results || []).map(b =>
    fetch(`${BASE}/blocks/${b.id}`, { method: "DELETE", headers: headers() })
  ));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!process.env.NOTION_SECRET || !process.env.NOTION_DB_ID) {
    return res.status(500).json({ error: "Notion環境変数が設定されていません" });
  }

  // ── GET: Pull manuals from Notion ──────────────────────────────
  if (req.method === "GET") {
    try {
      const r = await fetch(`${BASE}/databases/${DB_ID}/query`, {
        method: "POST",
        headers: headers(),
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
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST: Push manuals to Notion ───────────────────────────────
  if (req.method === "POST") {
    const { manuals } = req.body;
    if (!Array.isArray(manuals)) return res.status(400).json({ error: "manuals must be an array" });

    try {
      const updated = await Promise.all(manuals.map(async manual => {
        const blocks = toBlocks(manual);
        const props = {
          title: { title: [{ text: { content: manual.title || "（無題）" } }] },
          asset_type: { select: { name: "マニュアル" } },
        };

        if (manual.notionPageId) {
          // Update existing page
          await fetch(`${BASE}/pages/${manual.notionPageId}`, {
            method: "PATCH", headers: headers(),
            body: JSON.stringify({ properties: props }),
          });
          await clearBlocks(manual.notionPageId);
          await fetch(`${BASE}/blocks/${manual.notionPageId}/children`, {
            method: "PATCH", headers: headers(),
            body: JSON.stringify({ children: blocks }),
          });
          return { ...manual, notionPageId: manual.notionPageId };
        } else {
          // Create new page
          const r = await fetch(`${BASE}/pages`, {
            method: "POST", headers: headers(),
            body: JSON.stringify({
              parent: { database_id: DB_ID },
              properties: props,
              children: blocks,
            }),
          });
          const page = await r.json();
          if (page.object === "error") throw new Error(page.message);
          return { ...manual, notionPageId: page.id };
        }
      }));

      return res.json({ manuals: updated });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}

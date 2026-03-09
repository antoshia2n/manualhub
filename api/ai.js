const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const SYSTEM = `あなたはマニュアル管理ツール「Manual Hub」のコンテンツ作成アシスタントです。
ユーザーの説明をもとに、マニュアルまたはアセットのJSON草案を作成してください。

マニュアルの場合のJSON形式:
{
  "kind": "manual",
  "title": "タイトル",
  "description": "概要説明",
  "tags": ["タグ1", "タグ2"],
  "steps": [
    {
      "title": "手順タイトル",
      "explanation": "説明文",
      "tips": [{"type": "tip", "text": "内容"}],
      "links": [{"label": "ラベル", "url": "https://..."}],
      "template": "テンプレート文章（あれば）",
      "checklist": [{"text": "チェック項目"}]
    }
  ]
}

アセットの場合のJSON形式:
{
  "kind": "asset",
  "type": "prompt|template|link|app|knowhow",
  "title": "タイトル",
  "description": "説明",
  "content": "本文（promptやtemplateの場合）",
  "url": "URL（linkやappの場合）",
  "tags": ["タグ1"]
}

重要: JSONのみを返してください。マークダウンのコードブロック(\`\`\`)や説明文は不要です。純粋なJSONだけ返してください。`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { prompt, apiKey } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  // Use env var if set, otherwise use client-provided key
  const key = process.env.ANTHROPIC_API_KEY || apiKey;
  if (!key) return res.status(400).json({ error: "APIキーが設定されていません" });

  try {
    const r = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || "Anthropic APIエラー");

    const text = data.content?.[0]?.text || "";
    // Strip any accidental markdown fences
    const clean = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let result;
    try { result = JSON.parse(clean); }
    catch { return res.status(500).json({ error: "AIの返答をJSONに変換できませんでした", raw: text }); }

    return res.json({ result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

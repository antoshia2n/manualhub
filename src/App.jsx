import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
const uid       = () => Math.random().toString(36).slice(2, 10);
const now       = () => Date.now();
const fmtDate   = ts => new Date(ts).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
const daysAgo   = ts => Math.floor((now() - ts) / 86400000);
const deepClone = o  => JSON.parse(JSON.stringify(o));

// ─────────────────────────────────────────────
// Custom hooks
// ─────────────────────────────────────────────

// Shared "click outside to close" — one listener per mounted use, not per card
function useClickOutside(ref, onClose) {
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onClose]);
}

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
const PATHS = {
  search:    <><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></>,
  plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x:         <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  chevD:     <polyline points="6 9 12 15 18 9"/>,
  chevR:     <polyline points="9 6 15 12 9 18"/>,
  chevU:     <polyline points="18 15 12 9 6 15"/>,
  back:      <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  check:     <polyline points="20 6 9 17 4 12"/>,
  checkSq:   <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
  sq:        <rect x="3" y="3" width="18" height="18" rx="2"/>,
  edit:      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
  copy:      <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  img:       <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  video:     <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>,
  file:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  book:      <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
  star:      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  archive:   <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>,
  lock:      <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  ext:       <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
  dots:      <><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>,
  tag:       <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  link:      <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  clock:     <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  calendar:  <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  info:      <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  lightbulb: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/></>,
  download:  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  upload:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  printer:   <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
  refresh:   <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
  cloud:     <><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></>,
  cloudUp:   <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  cloudDn:   <><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.83"/></>,
};
const Ic = ({ n, s = 16, c = "currentColor", sw = 2 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {PATHS[n] ?? null}
  </svg>
);

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const C = {
  bg:          "#ede8df",
  paper:       "#f7f2ea",
  card:        "#ffffff",
  header:      "#0f1117",
  border:      "#ddd6ca",
  borderMd:    "#c5bdb0",
  accent:      "#d97706",
  accentBg:    "rgba(217,119,6,0.12)",
  accentBright:"#f59e0b",
  text:        "#18150f",
  textSm:      "#3d3830",
  muted:       "#7a7066",
  green:       "#059669",
  greenBg:     "rgba(5,150,105,0.12)",
  blue:        "#1d4ed8",
  blueBg:      "rgba(29,78,216,0.10)",
  purple:      "#6d28d9",
  purpleBg:    "rgba(109,40,217,0.10)",
  red:         "#b91c1c",
  star:        "#d97706",
  warn:        "#92400e",
  warnBg:      "rgba(146,64,14,0.11)",
  tip:         "#0c4a6e",
  tipBg:       "rgba(12,74,110,0.09)",
  tagColors:   ["#1d4ed8","#059669","#6d28d9","#c2410c","#0c4a6e","#92400e"],
  tagBgs:      ["rgba(29,78,216,0.10)","rgba(5,150,105,0.12)","rgba(109,40,217,0.10)","rgba(194,65,12,0.10)","rgba(12,74,110,0.09)","rgba(146,64,14,0.11)"],
};

// ─────────────────────────────────────────────
// Asset type config
// ─────────────────────────────────────────────
const ASSET_TYPES = {
  prompt:   { label: "プロンプト", icon: "lightbulb", color: "#6d28d9", bg: "rgba(109,40,217,0.10)" },
  template: { label: "テンプレ",   icon: "copy",      color: "#d97706", bg: "rgba(217,119,6,0.10)"  },
  link:     { label: "リンク",     icon: "link",      color: "#1d4ed8", bg: "rgba(29,78,216,0.10)"  },
  app:      { label: "アプリ",     icon: "ext",       color: "#059669", bg: "rgba(5,150,105,0.12)"  },
  knowhow:  { label: "ノウハウ",   icon: "book",      color: "#92400e", bg: "rgba(146,64,14,0.11)"  },
};

// ─────────────────────────────────────────────
// Data model
// ─────────────────────────────────────────────
const mkStep = () => ({
  id: uid(), title: "",
  explanation: "",
  tips:      [],   // { id, type:"tip"|"warn"|"note", text }
  media:     [],   // { id, type:"image"|"video"|"pdf", url, label, caption }
  links:     [],   // { id, label, url }
  template:  "",
  checklist: [],   // { id, text }
  relatedIds:[],
  assetIds:  [],   // references to Asset IDs
});

const mkAsset = () => ({
  id: uid(), title: "", description: "",
  type: "prompt",  // prompt | template | link | app | knowhow
  content: "",     // text body (prompt / template / knowhow)
  url: "",         // for link / app
  tags: [],
  createdAt: now(), updatedAt: now(),
});

const mkManual = () => ({
  id: uid(), title: "", description: "", tags: [],
  steps: [mkStep()],
  relatedIds: [],
  fav: false, archived: false,
  locked: false, pin: "",
  createdAt: now(), updatedAt: now(), reviewAt: null,
  notionPageId: null,
});

// ─────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────
const SAMPLE = [
  {
    id: "m1", title: "月次レポート作成",
    description: "毎月1日に前月データを集計し、経営陣へ報告レポートを提出するフロー。データ取得からメール送付まで完結している。",
    tags: ["定期業務","月次","レポート"], fav: true, archived: false, locked: false, pin: "",
    relatedIds: ["m2"], createdAt: now()-86400000*7, updatedAt: now()-86400000*2, reviewAt: now()+86400000*23,
    steps: [
      { id:"s1", title:"データを取得する",
        explanation:"SalesforceとGoogle Spreadsheetから前月分のデータをエクスポートする。必ずCSV形式で保存し、ファイル名に「YYYYMM_」のプレフィックスをつけること。",
        tips:[{id:"t1",type:"warn",text:"月末締め処理が完了する前に取得すると数値がズレる。必ず翌月1日の10時以降に実施すること。"},{id:"t2",type:"tip",text:"Salesforceのレポートは「売上サマリー_月次」を使うと項目が揃っている。"}],
        media:[{id:"a1",type:"image",url:"https://placehold.co/680x360/e8e2d8/888?text=Salesforce+Export",label:"SalesforceのCSVエクスポート画面",caption:"レポートタブ → 売上サマリー月次 → エクスポートボタン"}],
        links:[{id:"l1",label:"Salesforce 売上サマリー",url:"https://example.com"},{id:"l2",label:"Google Spreadsheet",url:"https://example.com"}],
        template:"以下のCSVデータを分析してください。\n\n要求事項：\n1. 前月比の増減率（%）\n2. 上位3プロダクトのランキング\n3. 異常値・特記事項があれば指摘\n\n出力形式：箇条書き（日本語）\n\n---\n[CSVデータをここに貼り付け]",
        checklist:[{id:"c1",text:"Salesforce CSV を取得した"},{id:"c2",text:"Spreadsheet CSV を取得した"},{id:"c3",text:"ファイル名にYYYYMMプレフィックスをつけた"}],
        relatedIds:[] },
      { id:"s2", title:"集計シートに入力してグラフを確認する",
        explanation:"テンプレートシートを複製し、前月の数値を入力する。グラフは自動更新されるが、前月と比べて明らかにおかしい値があればコメントを入れる。",
        tips:[{id:"t3",type:"note",text:"シートは必ず複製して使うこと。元テンプレートを上書きしないよう注意。"}],
        media:[], links:[{id:"l3",label:"集計テンプレートシート",url:"https://example.com"}], template:"",
        checklist:[{id:"c4",text:"テンプレートシートを複製した"},{id:"c5",text:"数値を入力しグラフを確認した"},{id:"c6",text:"異常値にコメントを入れた（なければスキップ）"}],
        relatedIds:[] },
      { id:"s3", title:"PDFに出力して経営陣へ送付する",
        explanation:"シートをPDF出力し、下記テンプレートを使ってメールを送付する。件名と本文の[]部分を必ず埋めること。",
        tips:[{id:"t4",type:"warn",text:"CCには必ず事業部長全員を含めること。BCC禁止。"}],
        media:[], links:[], relatedIds:[],
        template:"件名：【月次レポート】[YYYY年MM月] 売上実績報告\n\nお疲れ様です。\n[YYYY年MM月]分の月次レポートをお送りします。\n\n【概要】\n・売上合計：[金額]\n・前月比：[+/-XX%]\n・特記事項：[あれば記載 / 特になし]\n\n詳細はPDFをご覧ください。\nご確認のほどよろしくお願いします。",
        checklist:[{id:"c7",text:"PDFを出力した"},{id:"c8",text:"テンプレートの[]を全て埋めた"},{id:"c9",text:"CCに事業部長全員を含めた"},{id:"c10",text:"送付完了"}] },
    ],
  },
  {
    id: "m2", title: "新入社員アカウント発行",
    description: "入社日前日までにGmail・Slack・Notionのアカウントを発行し、本人へ案内メールを送る。所要時間は約15分。",
    tags: ["オンボーディング","情シス","入社対応"], fav: false, archived: false, locked: true, pin: "1234",
    relatedIds: [], createdAt: now()-86400000*30, updatedAt: now()-86400000*5, reviewAt: now()+86400000*60,
    steps: [
      { id:"s4", title:"Google Workspace アカウントを発行する",
        explanation:"Google Admin コンソールからユーザーを新規作成する。姓名・メールアドレス（名字.名前@company.com）・所属部署・権限グループを設定する。",
        tips:[{id:"t5",type:"tip",text:"メールアドレスは姓名をローマ字で。同姓同名の場合は数字サフィックスをつける（例：taro.yamada2）"}],
        media:[{id:"a2",type:"image",url:"https://placehold.co/680x360/e8e2d8/888?text=Google+Admin+Console",label:"Google Admin コンソール",caption:"ユーザー → 新しいユーザーを追加"}],
        links:[{id:"l4",label:"Google Admin コンソール",url:"https://admin.google.com"}],
        template:"", relatedIds:[],
        checklist:[{id:"c11",text:"姓名・メールアドレスを設定した"},{id:"c12",text:"所属部署を設定した"},{id:"c13",text:"権限グループに追加した"}] },
      { id:"s5", title:"Slack と Notion に招待する",
        explanation:"Slack: ワークスペース管理 → 招待リンクを発行。Notion: ワークスペース設定 → メンバーを招待 → 読み取り権限で招待。",
        tips:[{id:"t6",type:"warn",text:"Notion は読み取り権限から始めること。編集権限は上長の承認後に変更する。"}],
        media:[], relatedIds:[],
        links:[{id:"l5",label:"Slack ワークスペース管理",url:"https://slack.com"},{id:"l6",label:"Notion 設定",url:"https://notion.so"}],
        template:"〇〇さん、ご入社おめでとうございます！\n\n以下のアカウント情報をお送りします。\n初回ログイン後、必ずパスワードを変更してください。\n\n■ Gmail\nアドレス：[メールアドレス]\n初期PW：[パスワード]\n\n■ Slack\n招待リンク：[URL]\n\n■ Notion\n招待リンク：[URL]\n\nご不明点はいつでもお気軽にご連絡ください。",
        checklist:[{id:"c14",text:"Slack 招待を送った"},{id:"c15",text:"Notion 招待を送った（読み取り権限）"},{id:"c16",text:"案内メールを送った"}] },
    ],
  },
];

// ─────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────
const STORE_KEY       = "manualhub-v4";
const ASSET_STORE_KEY = "manualhub-assets";

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SAMPLE;
};
const saveData = d => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch {}
};

const loadAssets = () => {
  try {
    const raw = localStorage.getItem(ASSET_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};
const saveAssets = d => {
  try { localStorage.setItem(ASSET_STORE_KEY, JSON.stringify(d)); } catch {}
};

// ─────────────────────────────────────────────
// Full-text search
// ─────────────────────────────────────────────
const searchManual = (m, q) => {
  if (!q) return true;
  const lq = q.toLowerCase();
  return [
    m.title, m.description,
    ...m.tags,
    ...m.steps.flatMap(s => [
      s.title, s.explanation, s.template,
      ...s.tips.map(t => t.text),
      ...s.links.map(l => l.label),
      ...s.checklist.map(c => c.text),
    ]),
  ].some(f => f?.toLowerCase().includes(lq));
};

// ─────────────────────────────────────────────
// Tag colour — deterministic hash, no mutable state
// ─────────────────────────────────────────────
const tagColor = label => {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) & 0xffff;
  const idx = h % C.tagColors.length;
  return { color: C.tagColors[idx], bg: C.tagBgs[idx] };
};

// ─────────────────────────────────────────────
// Callout config
// ─────────────────────────────────────────────
const CALLOUT = {
  tip:  { icon: "lightbulb", bg: C.tipBg,  border: C.tip,  color: C.tip,  label: "ポイント" },
  warn: { icon: "alert",     bg: C.warnBg, border: C.warn, color: C.warn, label: "注意"     },
  note: { icon: "info",      bg: "#f0f4f8", border: "#64748b", color: "#475569", label: "補足" },
};

// ─────────────────────────────────────────────
// Shared UI components
// ─────────────────────────────────────────────

function CopyBtn({ text, label = "コピー" }) {
  const [ok, setOk] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };
  return (
    <button style={{ ...T.copyBtn, ...(ok ? T.copyBtnOk : {}) }} onClick={copy}>
      <Ic n={ok ? "check" : "copy"} s={12} c={ok ? C.green : C.accent} />
      {ok ? "コピー完了！" : label}
    </button>
  );
}

function Tag({ label, onRemove }) {
  const { color, bg } = tagColor(label);
  return (
    <span style={{ ...T.tag, background: bg, borderColor: color + "55", color }}>
      {label}
      {onRemove && (
        <button style={T.tagRm} onClick={onRemove}><Ic n="x" s={9} c={color} /></button>
      )}
    </span>
  );
}

function TagInput({ tags, onChange }) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setVal("");
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {tags.map(t => <Tag key={t} label={t} onRemove={() => onChange(tags.filter(x => x !== t))} />)}
      <div style={T.tagInputWrap}>
        <input style={T.tagInp} value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          placeholder="タグを追加 (Enter)" />
        {val && <button style={T.tagAddBtn} onClick={add}><Ic n="plus" s={12} c={C.accent} /></button>}
      </div>
    </div>
  );
}

function PinModal({ title, sub, onConfirm, onCancel }) {
  const [val, setVal] = useState("");
  return (
    <div style={T.overlay}>
      <div style={T.modal}>
        <div style={T.modalTitle}><Ic n="lock" s={18} c={C.accent} />{title}</div>
        {sub && <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{sub}</p>}
        <input
          style={{ ...T.inp, textAlign: "center", letterSpacing: 10, fontSize: 22, fontWeight: 700 }}
          type="password" maxLength={8} value={val} autoFocus
          placeholder="••••"
          onChange={e => setVal(e.target.value.replace(/\D/g, ""))}
          onKeyDown={e => e.key === "Enter" && val.length >= 4 && onConfirm(val)}
        />
        <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 6 }}>4〜8桁の数字</p>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button style={T.btnBack} onClick={onCancel}>キャンセル</button>
          <button style={{ ...T.btnPrimary, opacity: val.length >= 4 ? 1 : 0.4 }}
            disabled={val.length < 4} onClick={() => onConfirm(val)}>確認</button>
        </div>
      </div>
    </div>
  );
}

function Callout({ type, text }) {
  const cfg = CALLOUT[type] ?? CALLOUT.note;
  return (
    <div style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.border}`, borderRadius: "0 8px 8px 0", padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
      <Ic n={cfg.icon} s={15} c={cfg.color} />
      <div>
        <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color, letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>{cfg.label}</span>
        <span style={{ fontSize: 13, lineHeight: 1.6, color: C.text }}>{text}</span>
      </div>
    </div>
  );
}

function MediaEmbed({ media: { type, url, label, caption } }) {
  const ytId = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];
  return (
    <div style={T.mediaBox}>
      {label && (
        <div style={T.mediaLabel}>
          <Ic n={type === "image" ? "img" : type === "video" ? "video" : "file"} s={13} c={C.muted} />
          {label}
        </div>
      )}
      {type === "image" && <img src={url} alt={label} style={{ maxWidth: "100%", borderRadius: 6, display: "block" }} />}
      {type === "video" && (
        ytId
          ? <iframe src={`https://www.youtube.com/embed/${ytId}`} style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: 6 }} allowFullScreen />
          : <video controls src={url} style={{ width: "100%", borderRadius: 6 }} />
      )}
      {type === "pdf" && <iframe src={url} style={{ width: "100%", height: 420, border: "none", borderRadius: 6 }} />}
      {caption && <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0", fontStyle: "italic" }}>{caption}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// StepSection (detail view)
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// AssetBadge — inline chip shown inside a step
// ─────────────────────────────────────────────
function AssetBadge({ asset }) {
  const cfg = ASSET_TYPES[asset.type] ?? ASSET_TYPES.prompt;
  const [copied, setCopied] = useState(false);
  const canCopy = asset.content && (asset.type === "prompt" || asset.type === "template" || asset.type === "knowhow");
  const isLink  = asset.url && (asset.type === "link" || asset.type === "app");

  const copy = () => {
    navigator.clipboard.writeText(asset.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: asset.content || isLink ? 8 : 0 }}>
        <Ic n={cfg.icon} s={13} c={cfg.color} />
        <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{asset.title}</span>
        {(asset.tags || []).map(t => <Tag key={t} label={t} />)}
      </div>
      {asset.description && (
        <p style={{ fontSize: 12, color: C.textSm, margin: "0 0 8px", lineHeight: 1.5 }}>{asset.description}</p>
      )}
      {asset.content && (
        <pre style={{ ...T.tplPre, margin: "0 0 8px", maxHeight: 140 }}>{asset.content}</pre>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {canCopy && (
          <button style={{ ...T.copyBtn, ...(copied ? T.copyBtnOk : {}) }} onClick={copy}>
            <Ic n={copied ? "check" : "copy"} s={12} c={copied ? C.green : C.accent} />
            {copied ? "コピー完了！" : "コピー"}
          </button>
        )}
        {isLink && (
          <a href={asset.url} target="_blank" rel="noreferrer" style={T.linkBtn}>
            <Ic n="ext" s={12} c={C.blue} />{asset.title}を開く
          </a>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AssetCard — card in the asset list
// ─────────────────────────────────────────────
function AssetCard({ asset, onEdit, onDelete }) {
  const cfg = ASSET_TYPES[asset.type] ?? ASSET_TYPES.prompt;
  const [menu,     setMenu]     = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const menuRef = useRef(null);
  useClickOutside(menuRef, useCallback(() => setMenu(false), []));

  const canCopy = asset.content && ["prompt","template","knowhow"].includes(asset.type);
  const isLink  = asset.url && ["link","app"].includes(asset.type);

  const copy = e => {
    e.stopPropagation();
    navigator.clipboard.writeText(asset.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ ...T.card, borderLeft: `3px solid ${cfg.color}`, cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ background: cfg.bg, borderRadius: 8, padding: 8, flexShrink: 0 }}>
          <Ic n={cfg.icon} s={16} c={cfg.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, background: cfg.bg, borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap" }}>{cfg.label}</span>
            {(asset.tags || []).map(t => <Tag key={t} label={t} />)}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2, lineHeight: 1.4 }}>{asset.title || "（無題）"}</div>
          {asset.description && <p style={{ fontSize: 12, color: C.textSm, margin: 0, lineHeight: 1.5 }}>{asset.description}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <Ic n={expanded ? "chevU" : "chevD"} s={14} c={C.muted} />
          <div style={{ position: "relative" }} ref={menuRef} onClick={e => e.stopPropagation()}>
            <button style={T.iconBtn} onClick={() => setMenu(v => !v)}><Ic n="dots" s={14} c={C.muted} /></button>
            {menu && (
              <div style={T.dropMenu}>
                <button style={T.dropItem} onClick={() => { onEdit(asset); setMenu(false); }}><Ic n="edit" s={13} />編集</button>
                <div style={T.dropDivider} />
                <button style={{ ...T.dropItem, color: C.red }} onClick={() => { onDelete(asset.id); setMenu(false); }}>
                  <Ic n="trash" s={13} c={C.red} />削除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
          {asset.content && (
            <pre style={{ ...T.tplPre, marginBottom: 10, maxHeight: 240, fontSize: 12 }}>{asset.content}</pre>
          )}
          {asset.url && (
            <a href={asset.url} target="_blank" rel="noreferrer"
              style={{ ...T.linkBtn, display: "inline-flex", marginBottom: 10, maxWidth: "100%", overflow: "hidden" }}>
              <Ic n="ext" s={11} c={C.blue} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.url}</span>
            </a>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {canCopy && (
              <button style={{ ...T.copyBtn, ...(copied ? T.copyBtnOk : {}), padding: "7px 16px", fontSize: 13 }} onClick={copy}>
                <Ic n={copied ? "check" : "copy"} s={14} c={copied ? C.green : C.accent} />
                {copied ? "コピー完了！" : "コピー"}
              </button>
            )}
            {isLink && (
              <a href={asset.url} target="_blank" rel="noreferrer" style={{ ...T.linkBtn, padding: "7px 16px", fontSize: 13 }} onClick={e => e.stopPropagation()}>
                <Ic n="ext" s={13} c={C.blue} />開く
              </a>
            )}
          </div>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 8, fontSize: 11, color: C.muted }}>
        {fmtDate(asset.updatedAt)} 更新
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AssetForm — create / edit an asset
// ─────────────────────────────────────────────
function AssetForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial ? deepClone(initial) : mkAsset());
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cfg = ASSET_TYPES[form.type] ?? ASSET_TYPES.prompt;
  const needsContent = ["prompt","template","knowhow"].includes(form.type);
  const needsUrl     = ["link","app"].includes(form.type);

  return (
    <div style={T.formWrap}>
      <div style={T.formBox}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20 }}>
          {initial ? "アセットを編集" : "アセットを作成"}
        </div>

        <div style={T.fields}>
          {/* Type selector */}
          <div>
            <label style={T.fLabel}>種類</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(ASSET_TYPES).map(([key, c]) => (
                <button key={key}
                  style={{ ...T.toggleChip, ...(form.type === key ? { background: c.bg, borderColor: c.color + "55", color: c.color, fontWeight: 800 } : {}) }}
                  onClick={() => sf("type", key)}>
                  <Ic n={c.icon} s={12} c={form.type === key ? c.color : C.muted} />{c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={T.fLabel}>タイトル *</label>
            <input style={T.inp} value={form.title} onChange={e => sf("title", e.target.value)}
              placeholder={`例）${cfg.label}の名前`} autoFocus />
          </div>

          <div>
            <label style={T.fLabel}>説明（任意）</label>
            <input style={T.inp} value={form.description} onChange={e => sf("description", e.target.value)}
              placeholder="どんな用途か、いつ使うかなど…" />
          </div>

          {needsContent && (
            <div>
              <label style={T.fLabel}>{cfg.label}の内容</label>
              <textarea style={{ ...T.inp, minHeight: 140, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
                value={form.content} onChange={e => sf("content", e.target.value)}
                placeholder={form.type === "prompt" ? "AIへの指示文…" : form.type === "template" ? "コピペ用テンプレート…" : "ノウハウ・メモ…"} />
            </div>
          )}

          {needsUrl && (
            <div>
              <label style={T.fLabel}>URL</label>
              <input style={T.inp} value={form.url} onChange={e => sf("url", e.target.value)}
                placeholder="https://…" type="url" />
            </div>
          )}

          <div>
            <label style={T.fLabel}>タグ</label>
            <TagInput tags={form.tags} onChange={v => sf("tags", v)} />
          </div>
        </div>
      </div>

      <div style={T.formNav}>
        <button style={T.btnBack} onClick={onCancel}>キャンセル</button>
        <button
          style={{ ...T.btnSave, opacity: form.title.trim() ? 1 : 0.4 }}
          disabled={!form.title.trim()}
          onClick={() => onSave({ ...form, updatedAt: now() })}>
          <Ic n="check" s={14} c="#fff" />保存する
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AssetList — the asset management page
// ─────────────────────────────────────────────
function AssetList({ assets, onSave, onDelete, onClose }) {
  const [typeFilter, setTypeFilter] = useState(null);
  const [search,     setSearch]     = useState("");
  const [editTarget, setEditTarget] = useState(undefined); // undefined=list, null=new, Asset=edit

  const filtered = useMemo(() => assets
    .filter(a =>
      (!typeFilter || a.type === typeFilter) &&
      (!search || [a.title, a.description, a.content, ...a.tags]
        .some(f => f?.toLowerCase().includes(search.toLowerCase())))
    )
    .sort((a, b) => b.updatedAt - a.updatedAt),
    [assets, typeFilter, search]
  );

  if (editTarget !== undefined) {
    return (
      <AssetForm
        initial={editTarget}
        onSave={a => { onSave(a); setEditTarget(undefined); }}
        onCancel={() => setEditTarget(undefined)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button style={T.backBtn} onClick={onClose}><Ic n="back" s={14} />マニュアル一覧</button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>アセット</h1>
            <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0" }}>プロンプト・テンプレ・リンク・アプリ・ノウハウの共有ライブラリ</p>
          </div>
        </div>
        <button style={T.createBtn} onClick={() => setEditTarget(null)}>
          <Ic n="plus" s={14} c="#1a1a2e" />アセットを追加
        </button>
      </div>

      {/* Search + type filter */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={T.searchBox}>
          <Ic n="search" s={14} c={C.muted} />
          <input style={T.searchInp} value={search} onChange={e => setSearch(e.target.value)} placeholder="アセットを検索…" />
          {search && <button style={T.iconBtn} onClick={() => setSearch("")}><Ic n="x" s={12} c={C.muted} /></button>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          style={{ ...T.tagFilterBtn, ...(typeFilter === null ? T.tagFilterBtnOn : {}) }}
          onClick={() => setTypeFilter(null)}>すべて</button>
        {Object.entries(ASSET_TYPES).map(([key, cfg]) => (
          <button key={key}
            style={{ ...T.tagFilterBtn, ...(typeFilter === key ? { background: cfg.bg, border: `1px solid ${cfg.color}55`, color: cfg.color, fontWeight: 700 } : {}) }}
            onClick={() => setTypeFilter(typeFilter === key ? null : key)}>
            <Ic n={cfg.icon} s={11} c={typeFilter === key ? cfg.color : C.muted} />{cfg.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{filtered.length} 件</div>

      {filtered.length === 0 ? (
        <div style={T.empty}>
          <Ic n="book" s={48} c={C.borderMd} />
          <div style={{ marginTop: 14, fontSize: 15, color: C.muted }}>
            {search ? `「${search}」に一致するアセットが見つかりません` : "アセットがまだありません"}
          </div>
          <button style={{ ...T.createBtn, marginTop: 20 }} onClick={() => setEditTarget(null)}>
            <Ic n="plus" s={14} c="#1a1a2e" />最初のアセットを作成
          </button>
        </div>
      ) : (
        <div style={T.grid}>
          {filtered.map(a => (
            <AssetCard key={a.id} asset={a}
              onEdit={a => setEditTarget(a)}
              onDelete={id => {
                if (confirm("このアセットを削除しますか？")) onDelete(id);
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// AiCreateModal — AI-assisted manual/asset creation
// ─────────────────────────────────────────────
const AI_SYSTEM = `あなたはマニュアル管理ツール「Manual Hub」のコンテンツ作成アシスタントです。
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
      "tips": [{"type": "tip|warn|note", "text": "内容"}],
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

必ずJSONのみを返してください。マークダウンのコードブロックや説明文は不要です。`;

function AiCreateModal({ onSave, onCancel }) {
  const [prompt,   setPrompt]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null); // parsed proposal
  const [error,    setError]    = useState(null);
  const [apiKey,   setApiKey]   = useState(() => localStorage.getItem("mh-apikey") || "");
  const [showKey,  setShowKey]  = useState(!localStorage.getItem("mh-apikey"));

  const generate = async () => {
    if (!prompt.trim() || !apiKey.trim()) return;
    localStorage.setItem("mh-apikey", apiKey.trim());
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), apiKey: apiKey.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "生成に失敗しました");
      setResult(data.result);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const confirm = () => {
    if (!result) return;
    if (result.kind === "manual") {
      const m = {
        ...mkManual(),
        title:       result.title || "",
        description: result.description || "",
        tags:        result.tags || [],
        steps: (result.steps || []).map(s => ({
          ...mkStep(),
          title:       s.title || "",
          explanation: s.explanation || "",
          tips:        (s.tips || []).map(t => ({ id: uid(), type: t.type || "tip", text: t.text || "" })),
          links:       (s.links || []).map(l => ({ id: uid(), label: l.label || "", url: l.url || "" })),
          template:    s.template || "",
          checklist:   (s.checklist || []).map(c => ({ id: uid(), text: c.text || "" })),
        })),
      };
      onSave("manual", m);
    } else {
      const a = {
        ...mkAsset(),
        type:        result.type || "prompt",
        title:       result.title || "",
        description: result.description || "",
        content:     result.content || "",
        url:         result.url || "",
        tags:        result.tags || [],
      };
      onSave("asset", a);
    }
  };

  return (
    <div style={T.overlay}>
      <div style={{ ...T.modal, width: 560, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ background: C.purpleBg, borderRadius: 8, padding: 8 }}><Ic n="lightbulb" s={18} c={C.purple} /></div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>AIで作成</div>
            <div style={{ fontSize: 12, color: C.muted }}>説明を入力するとマニュアルまたはアセットの草案を生成します</div>
          </div>
        </div>

        {showKey && (
          <div style={{ marginBottom: 14 }}>
            <label style={T.fLabel}>Anthropic API Key</label>
            <input style={{ ...T.inp, fontFamily: "monospace", fontSize: 12 }}
              type="password" value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..." />
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>ブラウザのlocalStorageに保存されます。一度入力すれば次回不要。</p>
          </div>
        )}
        {!showKey && (
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: C.green }}>✓ APIキー設定済み</span>
            <button style={{ ...T.iconBtn, fontSize: 11, color: C.muted }} onClick={() => { setShowKey(true); setApiKey(""); localStorage.removeItem("mh-apikey"); }}>変更</button>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={T.fLabel}>何を作りたいか説明してください</label>
          <textarea
            style={{ ...T.inp, minHeight: 100, resize: "vertical" }}
            value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder={"例）新入社員向けのSlack利用マニュアル\n例）ChatGPTで議事録を作成するプロンプト\n例）Googleドライブへのリンク集"}
            autoFocus
          />
        </div>

        {error && (
          <div style={{ background: "rgba(185,28,28,0.1)", border: "1px solid rgba(185,28,28,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, marginBottom: 14 }}>
            ⚠ {error}
          </div>
        )}

        {result && (
          <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, marginBottom: 10, letterSpacing: "0.05em" }}>
              生成結果 — {result.kind === "manual" ? `マニュアル（${(result.steps||[]).length}手順）` : `アセット（${ASSET_TYPES[result.type]?.label || result.type}）`}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{result.title}</div>
            {result.description && <p style={{ fontSize: 12, color: C.textSm, margin: "0 0 8px", lineHeight: 1.5 }}>{result.description}</p>}
            {result.kind === "manual" && (result.steps || []).map((s, i) => (
              <div key={i} style={{ fontSize: 12, padding: "6px 0", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ ...T.stepEdNum, flexShrink: 0 }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.title}</div>
                  {s.explanation && <div style={{ color: C.textSm, marginTop: 2, lineHeight: 1.5 }}>{s.explanation.slice(0, 80)}{s.explanation.length > 80 ? "…" : ""}</div>}
                </div>
              </div>
            ))}
            {result.kind === "asset" && result.content && (
              <pre style={{ ...T.tplPre, fontSize: 12, maxHeight: 120 }}>{result.content}</pre>
            )}
            {(result.tags || []).length > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {result.tags.map(t => <Tag key={t} label={t} />)}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button style={T.btnBack} onClick={onCancel}>キャンセル</button>
          <div style={{ display: "flex", gap: 8 }}>
            {result && (
              <button style={T.btnBack} onClick={() => setResult(null)}>
                <Ic n="refresh" s={13} />再生成
              </button>
            )}
            {!result ? (
              <button
                style={{ ...T.btnPrimary, opacity: (prompt.trim() && apiKey.trim()) ? 1 : 0.4, display: "flex", alignItems: "center", gap: 6 }}
                disabled={!prompt.trim() || !apiKey.trim() || loading}
                onClick={generate}>
                {loading
                  ? <><span style={{ animation: "spin 1s linear infinite", display: "flex" }}><Ic n="refresh" s={14} c="#1a1a2e" /></span>生成中…</>
                  : <><Ic n="lightbulb" s={14} c="#1a1a2e" />生成する</>}
              </button>
            ) : (
              <button style={{ ...T.btnSave, display: "flex", alignItems: "center", gap: 6 }} onClick={confirm}>
                <Ic n="check" s={14} c="#fff" />この内容で保存
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepSection({ step, index, manuals, assets, sessionChecks, onCheck }) {
  const [collapsed, setCollapsed] = useState(true);
  const [showTpl, setShowTpl]     = useState(false);
  const [showChecks, setShowChecks] = useState(true);

  const refs       = step.relatedIds.map(id => manuals.find(m => m.id === id)).filter(Boolean);
  const linkedAssets = (step.assetIds || []).map(id => (assets || []).find(a => a.id === id)).filter(Boolean);
  const myChecks  = sessionChecks[step.id] ?? {};
  const doneCount = step.checklist.filter(c => myChecks[c.id]).length;
  const allDone   = step.checklist.length > 0 && doneCount === step.checklist.length;
  const hasContent = step.explanation || step.tips.length || step.media.length ||
                     step.links.length || step.template || step.checklist.length ||
                     refs.length || linkedAssets.length;

  return (
    <div style={{ ...T.stepSection, ...(allDone ? { opacity: 0.75 } : {}) }} id={`step-${step.id}`}>
      <div
        style={{ ...T.stepHeader, cursor: hasContent ? "pointer" : "default" }}
        onClick={() => hasContent && setCollapsed(v => !v)}
      >
        <div style={{ ...T.stepNum, ...(allDone ? { background: C.greenBg, borderColor: C.green, color: C.green } : {}) }}>
          {allDone ? <Ic n="check" s={14} c={C.green} /> : <span style={{ fontSize: 13, fontWeight: 800 }}>{index + 1}</span>}
        </div>
        <h2 style={{ ...T.stepTitle, flex: 1 }}>{step.title || `手順 ${index + 1}`}</h2>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {collapsed && step.links.length  > 0 && <span style={T.stepDot}><Ic n="link"    s={10} c={C.blue}   /></span>}
          {collapsed && step.media.length  > 0 && <span style={T.stepDot}><Ic n="img"     s={10} c={C.purple} /></span>}
          {collapsed && step.template          && <span style={T.stepDot}><Ic n="copy"    s={10} c={C.accent} /></span>}
          {collapsed && linkedAssets.length > 0 && <span style={T.stepDot}><Ic n="book" s={10} c={C.purple} /></span>}
          {collapsed && step.checklist.length > 0 && (
            <span style={{ ...T.stepDot, background: allDone ? C.greenBg : C.bg }}>
              <Ic n="checkSq" s={10} c={allDone ? C.green : C.muted} />
              <span style={{ fontSize: 10, color: allDone ? C.green : C.muted }}>{doneCount}/{step.checklist.length}</span>
            </span>
          )}
          {hasContent && <Ic n={collapsed ? "chevD" : "chevU"} s={14} c={C.muted} />}
        </div>
      </div>

      {!collapsed && (
        <div style={T.stepBody}>
          {step.explanation && <p style={T.stepExplain}>{step.explanation}</p>}
          {step.tips.map(tip => <Callout key={tip.id} type={tip.type} text={tip.text} />)}

          {step.media.length > 0 && (
            <div style={T.mediaSection}>
              {step.media.map(m => <MediaEmbed key={m.id} media={m} />)}
            </div>
          )}

          <div style={T.actionBar}>
            {step.links.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" style={T.linkBtn}>
                <Ic n="ext" s={12} c={C.blue} />{l.label}
              </a>
            ))}
            {step.template && (
              <button style={T.tplToggleBtn} onClick={() => setShowTpl(v => !v)}>
                <Ic n="copy" s={12} c={C.accent} />テンプレート
                <Ic n={showTpl ? "chevU" : "chevD"} s={11} c={C.accent} />
              </button>
            )}
            {refs.map(r => (
              <span key={r.id} style={T.refBtn}><Ic n="book" s={12} c={C.purple} />{r.title}</span>
            ))}
            {step.checklist.length > 0 && (
              <button
                style={{ ...T.checklistToggle, ...(allDone ? T.checklistToggleDone : {}) }}
                onClick={() => setShowChecks(v => !v)}
              >
                <Ic n={allDone ? "checkSq" : "sq"} s={12} c={allDone ? C.green : C.muted} />
                チェックリスト ({doneCount}/{step.checklist.length})
              </button>
            )}
          </div>

          {showTpl && step.template && (
            <div style={T.tplBox}>
              <div style={T.tplHead}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>テンプレート / プロンプト</span>
                <CopyBtn text={step.template} />
              </div>
              <pre style={T.tplPre}>{step.template}</pre>
            </div>
          )}

          {showChecks && step.checklist.length > 0 && (
            <div style={T.checklistBox}>
              <div style={T.checklistHead}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>チェックリスト（セッション中のみ）</span>
                <button style={T.resetBtn}
                  onClick={() => step.checklist.forEach(c => onCheck(step.id, c.id, false))}>
                  <Ic n="refresh" s={11} c={C.muted} />リセット
                </button>
              </div>
              {step.checklist.map(c => (
                <label key={c.id} style={T.checkItem}
                  onClick={() => onCheck(step.id, c.id, !myChecks[c.id])}>
                  <Ic n={myChecks[c.id] ? "checkSq" : "sq"} s={17} c={myChecks[c.id] ? C.green : C.muted} />
                  <span style={{ textDecoration: myChecks[c.id] ? "line-through" : "none", opacity: myChecks[c.id] ? 0.5 : 1 }}>
                    {c.text}
                  </span>
                </label>
              ))}
            </div>
          )}

          {linkedAssets.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Ic n="book" s={12} c={C.muted} />参照アセット
              </div>
              {linkedAssets.map(a => <AssetBadge key={a.id} asset={a} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ManualDetail
// ─────────────────────────────────────────────
function ManualDetail({ manual, manuals, assets, onBack, onEdit, onToggleFav, onArchive }) {
  const [sessionChecks, setSessionChecks] = useState({});
  const handleCheck = useCallback((stepId, checkId, val) => {
    setSessionChecks(s => ({ ...s, [stepId]: { ...(s[stepId] ?? {}), [checkId]: val } }));
  }, []);

  const backRefs = useMemo(
    () => manuals.filter(m => m.id !== manual.id && m.relatedIds.includes(manual.id)),
    [manuals, manual.id]
  );
  const relRefs = useMemo(
    () => manual.relatedIds.map(id => manuals.find(m => m.id === id)).filter(Boolean),
    [manuals, manual.relatedIds]
  );

  const daysSince = daysAgo(manual.updatedAt);
  const stale     = daysSince > 90;

  return (
    <div style={T.detailWrap}>
      <div style={T.detailTopBar} className="no-print">
        <button style={T.backBtn} onClick={onBack}><Ic n="back" s={14} />一覧に戻る</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={T.toolBtn} onClick={() => onToggleFav(manual.id)} title="お気に入り">
            <Ic n="star" s={15} c={manual.fav ? C.star : C.borderMd} sw={manual.fav ? 0 : 2} />
          </button>
          <button style={T.toolBtn} onClick={() => window.print()} title="印刷 / PDF保存">
            <Ic n="printer" s={15} c={C.muted} />
          </button>
          <button style={T.toolBtn} onClick={() => onArchive(manual.id)} title="アーカイブ">
            <Ic n="archive" s={15} c={C.muted} />
          </button>
          <button style={T.editBtn} onClick={() => onEdit(manual)}><Ic n="edit" s={13} />編集</button>
        </div>
      </div>

      <div style={T.detailHeader}>
        <div style={T.detailMetaRow}>{manual.tags.map(t => <Tag key={t} label={t} />)}</div>
        <h1 style={T.detailTitle}>{manual.title}</h1>
        {manual.description && <p style={T.detailDesc}>{manual.description}</p>}
        <div style={T.detailFooter}>
          <span style={{ fontSize: 12, color: stale ? C.warn : C.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <Ic n="clock" s={12} c={stale ? C.warn : C.muted} />
            最終更新: {fmtDate(manual.updatedAt)}
            {stale && <span style={{ color: C.warn, fontWeight: 700 }}> ⚠ {daysSince}日前 — 要レビュー</span>}
          </span>
          {manual.reviewAt && (
            <span style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
              <Ic n="calendar" s={12} c={C.muted} />次回レビュー: {fmtDate(manual.reviewAt)}
            </span>
          )}
          {manual.locked && (
            <span style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
              <Ic n="lock" s={11} c={C.muted} />編集ロック中
            </span>
          )}
        </div>
      </div>

      {stale && (
        <div style={T.staleWarn}>
          <Ic n="alert" s={15} c={C.warn} />
          <span>このマニュアルは90日以上更新されていません。内容が古くなっている可能性があります。</span>
        </div>
      )}

      {(relRefs.length > 0 || backRefs.length > 0) && (
        <div style={T.refSection} className="no-print">
          {relRefs.length > 0 && (
            <><span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>このマニュアルが参照する：</span>
            {relRefs.map(r => <span key={r.id} style={T.refChip}><Ic n="book" s={11} c={C.purple} />{r.title}</span>)}</>
          )}
          {relRefs.length > 0 && backRefs.length > 0 && <span style={{ color: C.borderMd }}>｜</span>}
          {backRefs.length > 0 && (
            <><span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>このマニュアルを参照している：</span>
            {backRefs.map(r => <span key={r.id} style={{ ...T.refChip, borderColor: C.greenBg, color: C.green }}><Ic n="book" s={11} c={C.green} />{r.title}</span>)}</>
          )}
        </div>
      )}

      {manual.steps.length > 2 && (
        <div style={T.toc} className="no-print">
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>目次</div>
          {manual.steps.map((s, i) => (
            <a key={s.id} style={T.tocItem}
              onClick={e => { e.preventDefault(); document.getElementById(`step-${s.id}`)?.scrollIntoView({ behavior: "smooth" }); }}>
              <span style={T.tocNum}>{i + 1}</span>{s.title || `手順 ${i + 1}`}
            </a>
          ))}
        </div>
      )}

      {manual.steps.map((s, i) => (
        <StepSection key={s.id} step={s} index={i} manuals={manuals} assets={assets}
          sessionChecks={sessionChecks} onCheck={handleCheck} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ManualCard
// ─────────────────────────────────────────────
function ManualCard({ manual, onOpen, onDuplicate, onDelete, onToggleFav, onArchive }) {
  const [folded, setFolded] = useState(true);
  const [menu,   setMenu]   = useState(false);
  const menuRef = useRef(null);
  const closeMenu = useCallback(() => setMenu(false), []);
  useClickOutside(menuRef, closeMenu);

  const stale = daysAgo(manual.updatedAt) > 90;

  return (
    <div style={T.card}>
      <div style={T.cardHead}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={T.cardTags}>
            {manual.tags.slice(0, 3).map(t => <Tag key={t} label={t} />)}
            {manual.tags.length > 3 && <span style={{ fontSize: 11, color: C.muted }}>+{manual.tags.length - 3}</span>}
          </div>
          <div style={T.cardTitle} onClick={() => onOpen(manual.id)}>{manual.title || "（無題）"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <button style={T.iconBtn} onClick={() => onToggleFav(manual.id)}>
            <Ic n="star" s={15} c={manual.fav ? C.star : C.borderMd} sw={manual.fav ? 0 : 2} />
          </button>
          <button style={T.iconBtn} onClick={() => setFolded(v => !v)}>
            <Ic n={folded ? "chevD" : "chevU"} s={14} c={C.muted} />
          </button>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button style={T.iconBtn} onClick={() => setMenu(v => !v)}><Ic n="dots" s={14} c={C.muted} /></button>
            {menu && (
              <div style={T.dropMenu}>
                <button style={T.dropItem} onClick={() => { onOpen(manual.id); setMenu(false); }}><Ic n="ext" s={13} />開く</button>
                <button style={T.dropItem} onClick={() => { onDuplicate(manual.id); setMenu(false); }}><Ic n="copy" s={13} />複製</button>
                <button style={T.dropItem} onClick={() => { onArchive(manual.id); setMenu(false); }}><Ic n="archive" s={13} />アーカイブ</button>
                <div style={T.dropDivider} />
                <button style={{ ...T.dropItem, color: C.red }} onClick={() => { onDelete(manual.id); setMenu(false); }}>
                  <Ic n="trash" s={13} c={C.red} />削除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!folded && (
        <>
          {manual.description && <p style={T.cardDesc}>{manual.description}</p>}
          <div style={T.cardSteps}>
            {manual.steps.map((s, i) => (
              <div key={s.id} style={T.cardStep}>
                <span style={T.cardStepNum}>{i + 1}</span>
                <span style={T.cardStepTitle}>{s.title || "（手順未設定）"}</span>
                <div style={{ display: "flex", gap: 3, marginLeft: "auto", flexShrink: 0 }}>
                  {s.links.length     > 0 && <span style={T.stepDot}><Ic n="link"    s={8} c={C.blue}   /></span>}
                  {s.media.length     > 0 && <span style={T.stepDot}><Ic n="img"     s={8} c={C.purple} /></span>}
                  {s.template             && <span style={T.stepDot}><Ic n="copy"    s={8} c={C.accent} /></span>}
                  {s.checklist.length > 0 && <span style={T.stepDot}><Ic n="checkSq" s={8} c={C.green}  /></span>}
                </div>
              </div>
            ))}
          </div>
          <div style={T.cardFoot}>
            <span style={{ fontSize: 11, color: stale ? C.warn : C.muted, display: "flex", alignItems: "center", gap: 4 }}>
              {stale && <Ic n="alert" s={11} c={C.warn} />}
              {fmtDate(manual.updatedAt)} 更新
            </span>
            {manual.locked && <Ic n="lock" s={11} c={C.muted} />}
            <button style={T.openBtn} onClick={() => onOpen(manual.id)}>開く <Ic n="chevR" s={11} c="#fff" /></button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CollapsibleSection — reusable panel for StepEd
// ─────────────────────────────────────────────
function CollapsibleSection({ icon, iconColor, title, badge, open, onToggle, children }) {
  return (
    <div style={{ ...T.edSection, borderColor: iconColor + "55" }}>
      <div style={{ ...T.edSectionTitle, cursor: "pointer", userSelect: "none" }} onClick={onToggle}>
        <Ic n={icon} s={13} c={iconColor} />
        <span style={{ flex: 1, color: iconColor }}>{title}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {badge > 0 && (
            <span style={{ fontSize: 10, background: iconColor + "18", color: iconColor, borderRadius: 10, padding: "1px 7px", fontWeight: 700 }}>
              {badge}件
            </span>
          )}
          <Ic n={open ? "chevU" : "chevD"} s={13} c={C.muted} />
        </div>
      </div>
      {open && children}
    </div>
  );
}

// ─────────────────────────────────────────────
// StepEd (form step editor)
// ─────────────────────────────────────────────
function StepEd({ step, index, total, manuals, assets, curId, onChange, onRemove, onMove }) {
  const [open, setOpen]       = useState(true);
  const [secOpen, setSecOpen] = useState({ explain: true, media: false, practice: false });
  const [newLink,  setNewLink]  = useState({ label: "", url: "" });
  const [newMedia, setNewMedia] = useState({ type: "image", url: "", label: "", caption: "" });
  const [newTip,   setNewTip]   = useState({ type: "tip", text: "" });
  const [newCheck, setNewCheck] = useState("");

  const up  = (k, v) => onChange({ ...step, [k]: v });
  const toggle = k => setSecOpen(s => ({ ...s, [k]: !s[k] }));

  const addLink  = () => { if (!newLink.url.trim()) return; up("links", [...step.links, { id: uid(), ...newLink }]); setNewLink({ label: "", url: "" }); };
  const addMedia = () => { if (!newMedia.url.trim()) return; up("media", [...step.media, { id: uid(), ...newMedia }]); setNewMedia({ type: "image", url: "", label: "", caption: "" }); };
  const addTip   = () => { if (!newTip.text.trim()) return; up("tips",  [...step.tips,  { id: uid(), ...newTip  }]); setNewTip({ type: "tip", text: "" }); };
  const addCheck = () => { if (!newCheck.trim()) return; up("checklist", [...step.checklist, { id: uid(), text: newCheck.trim() }]); setNewCheck(""); };

  const uploadFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const type = f.type.startsWith("image") ? "image" : f.type === "application/pdf" ? "pdf" : "video";
      up("media", [...step.media, { id: uid(), type, url: ev.target.result, label: f.name, caption: "" }]);
    };
    reader.readAsDataURL(f);
  };

  const others = manuals.filter(m => m.id !== curId);
  const practiceCount = step.links.length + step.checklist.length + (step.template ? 1 : 0) + (step.assetIds || []).length;
  const [assetSearch, setAssetSearch] = useState("");

  return (
    <div style={T.stepEd}>
      <div style={T.stepEdHead} onClick={() => setOpen(v => !v)}>
        <span style={T.stepEdNum}>手順 {index + 1}</span>
        <input style={T.stepEdInline} value={step.title} placeholder="この手順のタイトル…"
          onChange={e => { e.stopPropagation(); up("title", e.target.value); }}
          onClick={e => e.stopPropagation()} />
        <div style={{ display: "flex", gap: 3 }} onClick={e => e.stopPropagation()}>
          {index > 0             && <button style={T.iconBtn} onClick={() => onMove(index, -1)}>↑</button>}
          {index < total - 1     && <button style={T.iconBtn} onClick={() => onMove(index,  1)}>↓</button>}
          <button style={T.iconBtn} onClick={() => onRemove(step.id)}><Ic n="trash" s={12} c={C.red} /></button>
          <Ic n={open ? "chevU" : "chevD"} s={13} c={C.muted} />
        </div>
      </div>

      {open && (
        <div style={T.stepEdBody}>
          {/* 言って聞かせて */}
          <CollapsibleSection icon="book" iconColor={C.tip} title="言って聞かせて — 説明"
            badge={step.tips.length} open={secOpen.explain} onToggle={() => toggle("explain")}>
            <label style={T.fLabel}>説明文</label>
            <textarea style={{ ...T.inp, minHeight: 80, resize: "vertical" }}
              value={step.explanation} onChange={e => up("explanation", e.target.value)}
              placeholder="この手順で何をするかを説明する…" />
            <label style={T.fLabel}>ポイント / 注意 / 補足</label>
            <div style={T.addRow}>
              <select style={{ ...T.inp, width: 90, flex: "none" }} value={newTip.type} onChange={e => setNewTip(t => ({ ...t, type: e.target.value }))}>
                <option value="tip">ポイント</option>
                <option value="warn">注意</option>
                <option value="note">補足</option>
              </select>
              <input style={{ ...T.inp, flex: 1 }} value={newTip.text}
                onChange={e => setNewTip(t => ({ ...t, text: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addTip()} placeholder="内容を入力…" />
              <button style={T.addBtn} onClick={addTip}>追加</button>
            </div>
            {step.tips.map((t, i) => (
              <div key={t.id} style={{ ...T.chip, borderLeftColor: CALLOUT[t.type]?.border }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: CALLOUT[t.type]?.color, minWidth: 40 }}>{CALLOUT[t.type]?.label}</span>
                <span style={T.chipTxt}>{t.text}</span>
                <button style={T.rmBtn} onClick={() => up("tips", step.tips.filter((_, j) => j !== i))}><Ic n="x" s={11} /></button>
              </div>
            ))}
          </CollapsibleSection>

          {/* やってみせ */}
          <CollapsibleSection icon="img" iconColor={C.purple} title="やってみせ — メディア"
            badge={step.media.length} open={secOpen.media} onToggle={() => toggle("media")}>
            <div style={T.addRow}>
              <select style={{ ...T.inp, width: 80, flex: "none" }} value={newMedia.type} onChange={e => setNewMedia(m => ({ ...m, type: e.target.value }))}>
                <option value="image">画像</option>
                <option value="video">動画</option>
                <option value="pdf">PDF</option>
              </select>
              <input style={{ ...T.inp, flex: 2 }} value={newMedia.url}
                onChange={e => setNewMedia(m => ({ ...m, url: e.target.value }))}
                placeholder="URL（YouTube・画像URL など）" />
              <input style={{ ...T.inp, flex: 1 }} value={newMedia.label}
                onChange={e => setNewMedia(m => ({ ...m, label: e.target.value }))} placeholder="表示名" />
              <button style={{ ...T.addBtn, borderColor: C.purple + "55", color: C.purple, background: C.purpleBg }} onClick={addMedia}>追加</button>
            </div>
            <div style={T.addRow}>
              <input style={{ ...T.inp, flex: 1 }} value={newMedia.caption}
                onChange={e => setNewMedia(m => ({ ...m, caption: e.target.value }))} placeholder="キャプション（任意）" />
            </div>
            <label style={{ ...T.addBtn, cursor: "pointer", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, borderColor: C.purple + "55", color: C.purple, background: C.purpleBg }}>
              <Ic n="upload" s={12} />ファイルをアップロード
              <input type="file" accept="image/*,.pdf,video/*" style={{ display: "none" }} onChange={uploadFile} />
            </label>
            {step.media.map((m, i) => (
              <div key={m.id} style={T.chip}>
                <Ic n={m.type === "image" ? "img" : m.type === "video" ? "video" : "file"} s={11} c={C.purple} />
                <span style={T.chipTxt}>{m.label || m.url.slice(0, 50)}</span>
                <button style={T.rmBtn} onClick={() => up("media", step.media.filter((_, j) => j !== i))}><Ic n="x" s={11} /></button>
              </div>
            ))}
          </CollapsibleSection>

          {/* させてみせ */}
          <CollapsibleSection icon="check" iconColor={C.green} title="させてみせ — 実践支援"
            badge={practiceCount} open={secOpen.practice} onToggle={() => toggle("practice")}>
            <label style={T.fLabel}>関連リンク</label>
            <div style={T.addRow}>
              <input style={{ ...T.inp, width: 120, flex: "none" }} value={newLink.label}
                onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} placeholder="ラベル" />
              <input style={{ ...T.inp, flex: 1 }} value={newLink.url}
                onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addLink()} placeholder="URL" />
              <button style={{ ...T.addBtn, borderColor: C.blue + "55", color: C.blue, background: C.blueBg }} onClick={addLink}>追加</button>
            </div>
            {step.links.map((l, i) => (
              <div key={l.id} style={T.chip}>
                <Ic n="link" s={11} c={C.blue} />
                <span style={T.chipTxt}>{l.label || l.url}</span>
                <button style={T.rmBtn} onClick={() => up("links", step.links.filter((_, j) => j !== i))}><Ic n="x" s={11} /></button>
              </div>
            ))}

            <label style={T.fLabel}>テンプレート / プロンプト</label>
            <textarea style={{ ...T.inp, minHeight: 100, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
              value={step.template} onChange={e => up("template", e.target.value)}
              placeholder="コピペで使えるテンプレやAIプロンプトを記入…" />

            <label style={T.fLabel}>チェックリスト</label>
            <div style={T.addRow}>
              <input style={{ ...T.inp, flex: 1 }} value={newCheck}
                onChange={e => setNewCheck(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCheck()} placeholder="チェック項目を入力…" />
              <button style={{ ...T.addBtn, borderColor: C.green + "55", color: C.green, background: C.greenBg }} onClick={addCheck}>追加</button>
            </div>
            {step.checklist.map((c, i) => (
              <div key={c.id} style={T.chip}>
                <Ic n="sq" s={11} c={C.muted} />
                <span style={T.chipTxt}>{c.text}</span>
                <button style={T.rmBtn} onClick={() => up("checklist", step.checklist.filter((_, j) => j !== i))}><Ic n="x" s={11} /></button>
              </div>
            ))}

            {others.length > 0 && (
              <>
                <label style={T.fLabel}>参照マニュアル</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {others.map(m => {
                    const on = step.relatedIds.includes(m.id);
                    return (
                      <button key={m.id}
                        style={{ ...T.toggleChip, ...(on ? T.toggleChipOn : {}) }}
                        onClick={() => up("relatedIds", on
                          ? step.relatedIds.filter(x => x !== m.id)
                          : [...step.relatedIds, m.id])}>
                        {on && <Ic n="check" s={11} c={C.green} />}{m.title || "（無題）"}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {(assets || []).length > 0 && (
              <>
                <label style={T.fLabel}>アセットを紐付け</label>
                <div style={{ ...T.searchBox, marginBottom: 8, maxWidth: "100%" }}>
                  <Ic n="search" s={13} c={C.muted} />
                  <input style={{ ...T.searchInp, fontSize: 12 }} value={assetSearch}
                    onChange={e => setAssetSearch(e.target.value)} placeholder="アセットを検索…" />
                  {assetSearch && <button style={T.iconBtn} onClick={() => setAssetSearch("")}><Ic n="x" s={11} c={C.muted} /></button>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(assets || [])
                    .filter(a => !assetSearch || [a.title, a.description].some(f => f?.toLowerCase().includes(assetSearch.toLowerCase())))
                    .map(a => {
                      const on = (step.assetIds || []).includes(a.id);
                      const cfg = ASSET_TYPES[a.type] ?? ASSET_TYPES.prompt;
                      return (
                        <button key={a.id}
                          style={{ ...T.toggleChip, ...(on ? { background: cfg.bg, borderColor: cfg.color + "55", color: cfg.color, fontWeight: 800 } : {}) }}
                          onClick={() => up("assetIds", on
                            ? (step.assetIds || []).filter(x => x !== a.id)
                            : [...(step.assetIds || []), a.id])}>
                          <Ic n={cfg.icon} s={11} c={on ? cfg.color : C.muted} />
                          {on && <Ic n="check" s={10} c={cfg.color} />}
                          {a.title}
                        </button>
                      );
                    })}
                </div>
                {(step.assetIds || []).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {(step.assetIds || []).map(id => (assets||[]).find(a => a.id === id)).filter(Boolean).map(a => (
                      <div key={a.id} style={T.chip}>
                        <Ic n={ASSET_TYPES[a.type]?.icon || "book"} s={11} c={ASSET_TYPES[a.type]?.color || C.muted} />
                        <span style={T.chipTxt}>{a.title}</span>
                        <button style={T.rmBtn} onClick={() => up("assetIds", (step.assetIds||[]).filter(x => x !== a.id))}><Ic n="x" s={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ManualForm (4-step wizard)
// ─────────────────────────────────────────────
const WIZARD_STEPS = ["基本情報", "手順を作成", "設定", "確認"];

function ManualForm({ initial, manuals, assets, onSave, onCancel }) {
  const [fstep,    setFstep]    = useState(0);
  const [form,     setForm]     = useState(() => initial ? deepClone(initial) : mkManual());
  const [pinSetup, setPinSetup] = useState(false);

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addStep = () => sf("steps", [...form.steps, mkStep()]);
  const updStep = (id, u) => sf("steps", form.steps.map(s => s.id === id ? u : s));
  const rmStep  = id => sf("steps", form.steps.filter(s => s.id !== id));
  const mvStep  = (i, d) => {
    const a = [...form.steps], t = i + d;
    if (t < 0 || t >= a.length) return;
    [a[i], a[t]] = [a[t], a[i]];
    sf("steps", a);
  };

  const canAdvance = fstep === 0 ? form.title.trim().length > 0 : true;
  const others = manuals.filter(m => m.id !== form.id);

  const toggleRelated = id =>
    sf("relatedIds", form.relatedIds.includes(id)
      ? form.relatedIds.filter(x => x !== id)
      : [...form.relatedIds, id]);

  return (
    <div style={T.formWrap}>
      {pinSetup && (
        <PinModal title="編集ロックPINを設定" sub="このPINがないと編集できなくなります。"
          onCancel={() => setPinSetup(false)}
          onConfirm={pin => { sf("pin", pin); sf("locked", true); setPinSetup(false); }} />
      )}

      {/* Wizard progress bar */}
      <div style={T.fsBar}>
        {WIZARD_STEPS.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < WIZARD_STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ ...T.fsDot, ...(i < fstep ? T.fsDotDone : i === fstep ? T.fsDotOn : {}) }}>
                {i < fstep ? <Ic n="check" s={12} c="#fff" /> : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === fstep ? C.text : C.muted, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < fstep ? C.green : C.border, margin: "0 8px", marginBottom: 16 }} />
            )}
          </div>
        ))}
      </div>

      <div style={T.formBox}>
        {/* Step 0 — basics */}
        {fstep === 0 && (
          <div style={T.fields}>
            <div>
              <label style={T.fLabel}>マニュアル名 *</label>
              <input style={T.inp} value={form.title} onChange={e => sf("title", e.target.value)}
                placeholder="例）月次レポート作成" autoFocus />
            </div>
            <div>
              <label style={T.fLabel}>説明 / 概要</label>
              <textarea style={{ ...T.inp, minHeight: 80, resize: "vertical" }}
                value={form.description} onChange={e => sf("description", e.target.value)}
                placeholder="このマニュアルが何のためにあるか、所要時間、対象者など…" />
            </div>
            <div>
              <label style={T.fLabel}>タグ</label>
              <TagInput tags={form.tags} onChange={v => sf("tags", v)} />
            </div>
            <div>
              <label style={T.fLabel}>次回レビュー日</label>
              <input type="date" style={{ ...T.inp, maxWidth: 240 }}
                value={form.reviewAt ? new Date(form.reviewAt).toISOString().slice(0, 10) : ""}
                onChange={e => sf("reviewAt", e.target.value ? new Date(e.target.value).getTime() : null)} />
            </div>
          </div>
        )}

        {/* Step 1 — steps */}
        {fstep === 1 && (
          <div>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
              各手順に「説明・注意点 → メディア（動画・画像）→ リンク・テンプレ・チェックリスト」の順で内容を追加します。
            </p>
            {form.steps.map((s, i) => (
              <StepEd key={s.id} step={s} index={i} total={form.steps.length}
                manuals={manuals} assets={assets} curId={form.id}
                onChange={u => updStep(s.id, u)} onRemove={rmStep} onMove={mvStep} />
            ))}
            <button style={T.addStepBtn} onClick={addStep}><Ic n="plus" s={15} c={C.accent} />手順を追加</button>
          </div>
        )}

        {/* Step 2 — settings */}
        {fstep === 2 && (
          <div style={T.fields}>
            <div>
              <label style={T.fLabel}>このマニュアルが参照するマニュアル</label>
              {others.length === 0
                ? <p style={{ fontSize: 13, color: C.muted }}>他にマニュアルがありません</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {others.map(m => {
                      const on = form.relatedIds.includes(m.id);
                      return (
                        <label key={m.id} style={{ ...T.refRow, ...(on ? T.refRowOn : {}) }}
                          onClick={() => toggleRelated(m.id)}>
                          <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{m.title || "（無題）"}</span>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{m.tags.map(t => <Tag key={t} label={t} />)}</div>
                          {on && <Ic n="check" s={14} c={C.green} />}
                        </label>
                      );
                    })}
                  </div>
              }
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <label style={T.fLabel}>お気に入り</label>
              <button
                style={{ ...T.addBtn, ...(form.fav ? { background: "#fef9c3", borderColor: C.star, color: "#78350f" } : {}) }}
                onClick={() => sf("fav", !form.fav)}>
                <Ic n="star" s={13} c={C.star} sw={form.fav ? 0 : 2} />
                {form.fav ? "お気に入り登録済み" : "お気に入りに追加"}
              </button>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <label style={T.fLabel}>編集ロック（PIN保護）</label>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>設定するとPINなしで編集できなくなります。</p>
              {form.locked
                ? <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: C.green, fontWeight: 700, display: "flex", gap: 5, alignItems: "center" }}>
                      <Ic n="lock" s={14} c={C.green} />ロック設定済み
                    </span>
                    <button style={T.btnBack} onClick={() => { sf("locked", false); sf("pin", ""); }}>解除する</button>
                  </div>
                : <button style={T.addBtn} onClick={() => setPinSetup(true)}><Ic n="lock" s={12} />PINを設定してロック</button>
              }
            </div>
          </div>
        )}

        {/* Step 3 — confirm */}
        {fstep === 3 && (
          <div style={T.fields}>
            <div style={{ background: C.paper, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {form.tags.map(t => <Tag key={t} label={t} />)}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{form.title || "（無題）"}</div>
              {form.description && <p style={{ fontSize: 13, color: C.textSm, lineHeight: 1.6, margin: 0 }}>{form.description}</p>}
              <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                {form.reviewAt && <span style={{ fontSize: 12, color: C.muted }}>レビュー: {fmtDate(form.reviewAt)}</span>}
                {form.fav      && <span style={{ fontSize: 12, color: C.star }}>★ お気に入り</span>}
                {form.locked   && <span style={{ fontSize: 12, color: C.muted }}>🔒 ロック済み</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>手順 ({form.steps.length})</div>
              {form.steps.map((s, i) => (
                <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={T.stepEdNum}>{i + 1}</span>
                  <span style={{ fontSize: 13, flex: 1 }}>{s.title || "（タイトル未設定）"}</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    {s.tips.length      > 0 && <Ic n="info"    s={11} c={C.tip}    />}
                    {s.media.length     > 0 && <Ic n="img"     s={11} c={C.purple} />}
                    {s.links.length     > 0 && <Ic n="link"    s={11} c={C.blue}   />}
                    {s.template             && <Ic n="copy"    s={11} c={C.accent} />}
                    {s.checklist.length > 0 && <Ic n="checkSq" s={11} c={C.green}  />}
                  </div>
                </div>
              ))}
            </div>
            {form.relatedIds.length > 0 && (
              <div style={{ fontSize: 13, color: C.muted }}>参照マニュアル: {form.relatedIds.length}件</div>
            )}
          </div>
        )}
      </div>

      <div style={T.formNav}>
        <button style={T.btnBack} onClick={fstep === 0 ? onCancel : () => setFstep(s => s - 1)}>
          {fstep === 0 ? "キャンセル" : <><Ic n="back" s={13} />戻る</>}
        </button>
        {fstep < 3
          ? <button style={{ ...T.btnPrimary, opacity: canAdvance ? 1 : 0.4 }}
              disabled={!canAdvance} onClick={() => setFstep(s => s + 1)}>次へ →</button>
          : <button style={T.btnSave}
              onClick={() => onSave({ ...form, updatedAt: now() })}>
              <Ic n="check" s={14} c="#fff" />保存する
            </button>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
export default function App() {
  const [manuals,    setManuals]    = useState(() => loadData());
  const [assets,     setAssets]     = useState(() => loadAssets());
  const [ready,      setReady]      = useState(true);
  const [page,       setPage]       = useState("list"); // list | detail | form | assets
  const [tab,        setTab]        = useState("all");  // all | favs | archive
  const [activeId,   setActiveId]   = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [search,     setSearch]     = useState("");
  const [tagFilter,  setTagFilter]  = useState(null);
  const [sortKey,    setSortKey]    = useState("updatedAt");
  const [pinModal,   setPinModal]   = useState(null);
  const [syncMenu,   setSyncMenu]   = useState(false);
  const [syncing,    setSyncing]    = useState(null); // "push" | "pull" | null
  const [syncMsg,    setSyncMsg]    = useState(null); // { ok, text }
  const [showAiModal, setShowAiModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showGlobalResults, setShowGlobalResults] = useState(false);
  const globalSearchRef = useRef(null);
  useClickOutside(globalSearchRef, useCallback(() => setShowGlobalResults(false), []));
  const syncMenuRef = useRef(null);
  useClickOutside(syncMenuRef, useCallback(() => setSyncMenu(false), []));

  // data loaded synchronously from localStorage in useState initializer above

  const persist       = useCallback(next => { setManuals(next); saveData(next); }, []);
  const persistAssets = useCallback(next => { setAssets(next);  saveAssets(next); }, []);

  // Derived counts computed once per render
  const favCount   = useMemo(() => manuals.filter(m =>  m.fav && !m.archived).length, [manuals]);
  const staleCount = useMemo(() => manuals.filter(m => !m.archived && daysAgo(m.updatedAt) > 90).length, [manuals]);
  const allTags    = useMemo(() => [...new Set(manuals.flatMap(m => m.tags))].sort(), [manuals]);

  // BUG FIX: compute baseList inside useMemo so the dependency is stable
  const filtered = useMemo(() => {
    const base = tab === "favs"    ? manuals.filter(m =>  m.fav && !m.archived)
               : tab === "archive" ? manuals.filter(m =>  m.archived)
               :                     manuals.filter(m => !m.archived);
    return base
      .filter(m => searchManual(m, search) && (!tagFilter || m.tags.includes(tagFilter)))
      .sort((a, b) => sortKey === "title" ? a.title.localeCompare(b.title) : b[sortKey] - a[sortKey]);
  }, [manuals, tab, search, tagFilter, sortKey]);

  // Handlers
  const handleSave = useCallback(m => {
    const exists = manuals.some(x => x.id === m.id);
    persist(exists ? manuals.map(x => x.id === m.id ? m : x) : [m, ...manuals]);
    setPage("list");
    setEditTarget(null);
  }, [manuals, persist]);

  const handleDelete = useCallback(id => {
    if (!confirm("このマニュアルを削除しますか？元に戻せません。")) return;
    persist(manuals.filter(m => m.id !== id));
    if (activeId === id) setPage("list");
  }, [manuals, persist, activeId]);

  const handleDuplicate = useCallback(id => {
    const src = manuals.find(m => m.id === id);
    if (!src) return;
    const copy = deepClone(src);
    // Fresh IDs for everything
    copy.id       = uid();
    copy.title    = src.title + " (コピー)";
    copy.createdAt = copy.updatedAt = now();
    copy.locked   = false;
    copy.pin      = "";
    copy.notionPageId = null; // BUG FIX: prevent overwriting original in Notion on next push
    copy.steps    = copy.steps.map(s => ({
      ...s, id: uid(),
      tips:      s.tips.map(t      => ({ ...t,  id: uid() })),
      media:     s.media.map(m     => ({ ...m,  id: uid() })),
      links:     s.links.map(l     => ({ ...l,  id: uid() })),
      checklist: s.checklist.map(c => ({ ...c,  id: uid() })),
    }));
    persist([copy, ...manuals]);
  }, [manuals, persist]);

  const toggleFav = useCallback(id =>
    persist(manuals.map(m => m.id === id ? { ...m, fav: !m.fav } : m)), [manuals, persist]);

  const toggleArchive = useCallback(id => {
    persist(manuals.map(m => m.id === id ? { ...m, archived: !m.archived } : m));
    if (activeId === id && page === "detail") setPage("list");
  }, [manuals, persist, activeId, page]);

  const openEdit = useCallback(m => {
    if (m.locked) {
      setPinModal({ manual: m, onSuccess: () => { setEditTarget(m); setPage("form"); setPinModal(null); } });
    } else {
      setEditTarget(m);
      setPage("form");
    }
  }, []);

  // BUG FIX: revoke object URL to prevent memory leak
  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(manuals, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `manualhub_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [manuals]);

  const handleImport = useCallback(e => {    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error("not an array");
        if (confirm(`${data.length}件のマニュアルをインポートします。既存データとマージしますか？\n（キャンセルで上書き）`)) {
          persist([...data, ...manuals.filter(m => !data.some(d => d.id === m.id))]);
        } else {
          persist(data);
        }
      } catch { alert("JSONの形式が不正です"); }
    };
    reader.readAsText(f);
    e.target.value = "";
  }, [manuals, persist]);

  const showSyncMsg = useCallback((ok, text) => {
    setSyncMsg({ ok, text });
    setTimeout(() => setSyncMsg(null), 4000);
  }, []);

  const handlePush = useCallback(async () => {
    setSyncing("push"); setSyncMenu(false);
    try {
      const r = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuals: manuals.filter(m => !m.archived) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      // Save returned notionPageIds back to localStorage
      const idMap = Object.fromEntries(data.manuals.map(m => [m.id, m.notionPageId]));
      const updated = manuals.map(m => idMap[m.id] ? { ...m, notionPageId: idMap[m.id] } : m);
      persist(updated);
      showSyncMsg(true, `${data.manuals.length}件をNotionに同期しました`);
    } catch (e) {
      showSyncMsg(false, `エラー: ${e.message}`);
    } finally { setSyncing(null); }
  }, [manuals, persist, showSyncMsg]);

  const handlePull = useCallback(async () => {
    setSyncing("pull"); setSyncMenu(false);
    try {
      const r = await fetch("/api/notion");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      // Merge: Notion version wins for existing IDs, new ones are prepended
      const localMap = Object.fromEntries(manuals.map(m => [m.id, m]));
      const merged = [
        ...data.manuals.map(m => ({ ...localMap[m.id], ...m })),
        ...manuals.filter(m => !data.manuals.some(nm => nm.id === m.id)),
      ];
      persist(merged);
      showSyncMsg(true, `${data.manuals.length}件をNotionから読み込みました`);
    } catch (e) {
      showSyncMsg(false, `エラー: ${e.message}`);
    } finally { setSyncing(null); }
  }, [manuals, persist, showSyncMsg]);

  const handleAssetSave = useCallback(a => {    const exists = assets.some(x => x.id === a.id);
    persistAssets(exists ? assets.map(x => x.id === a.id ? a : x) : [a, ...assets]);
  }, [assets, persistAssets]);

  const handleAssetDelete = useCallback(id => {
    persistAssets(assets.filter(a => a.id !== id));
    // BUG FIX: remove orphaned assetId references from all steps in all manuals
    const updated = manuals.map(m => ({
      ...m,
      steps: m.steps.map(s => ({
        ...s,
        assetIds: (s.assetIds || []).filter(aid => aid !== id),
      })),
    }));
    persist(updated);
  }, [assets, persistAssets, manuals, persist]);

  const handleAiSave = useCallback((kind, data) => {
    if (kind === "manual") {
      persist([data, ...manuals]);
      setShowAiModal(false);
      setActiveId(data.id);
      setPage("detail");
    } else {
      persistAssets([data, ...assets]);
      setShowAiModal(false);
      setPage("assets");
    }
  }, [manuals, assets, persist, persistAssets]);

  const globalResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q || q.length < 1) return null;
    const mResults = manuals.filter(m => !m.archived && searchManual(m, q)).slice(0, 5);
    const aResults = assets.filter(a =>
      [a.title, a.description, a.content, ...(a.tags||[])].some(f => f?.toLowerCase().includes(q))
    ).slice(0, 5);
    return { manuals: mResults, assets: aResults };
  }, [globalSearch, manuals, assets]);

  const activeManual = useMemo(() => manuals.find(m => m.id === activeId), [manuals, activeId]);

  const navTo = useCallback((nextTab) => { setTab(nextTab); setPage("list"); }, []);

  if (!ready) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: C.muted }}>
      読み込み中…
    </div>
  );

  return (
    <div style={T.app}>
      {/* Global styles — defined once outside render in real apps; inline here for portability */}
      <style>{`@media print{.no-print{display:none!important}body{background:#fff}#print-root{padding:0}}a{color:inherit}*{box-sizing:border-box}textarea,input,select,button{font-family:inherit}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {pinModal && (
        <PinModal title="編集のためにPINを入力" sub="このマニュアルは編集ロックされています。"
          onCancel={() => setPinModal(null)}
          onConfirm={pin => { if (pin === pinModal.manual.pin) pinModal.onSuccess(); else alert("PINが違います"); }} />
      )}

      {showAiModal && (
        <AiCreateModal
          onSave={handleAiSave}
          onCancel={() => setShowAiModal(false)} />
      )}

      {/* ── Header ── */}
      <div style={T.header} className="no-print">
        <div style={T.headerL}>
          <div style={T.logo} onClick={() => navTo("all")}>
            <Ic n="book" s={17} c={C.accentBright} />Manual Hub
          </div>
          <div style={T.logoDivider} />
          <nav style={T.nav}>
            {[["all","すべて"], ["favs","お気に入り"], ["archive","アーカイブ"]].map(([v, lbl]) => {
              const active = tab === v && page === "list";
              return (
                <button key={v} style={{ ...T.navBtn, ...(active ? T.navBtnOn : {}) }} onClick={() => navTo(v)}>
                  {v === "favs"    && <Ic n="star"    s={13} c={active ? C.star : "rgba(255,255,255,0.45)"} sw={active ? 0 : 2} />}
                  {v === "archive" && <Ic n="archive" s={13} c="rgba(255,255,255,0.45)" />}
                  {lbl}
                  {v === "favs" && favCount > 0 && <span style={T.navBadge}>{favCount}</span>}
                </button>
              );
            })}
            <div style={T.logoDivider} />
            <button
              style={{ ...T.navBtn, ...(page === "assets" ? T.navBtnOn : {}) }}
              onClick={() => setPage("assets")}>
              <Ic n="book" s={13} c={page === "assets" ? C.accentBright : "rgba(255,255,255,0.45)"} />
              アセット
              {assets.length > 0 && <span style={T.navBadge}>{assets.length}</span>}
            </button>
          </nav>
        </div>

        {/* ── Global Search ── */}
        <div style={{ flex: 1, maxWidth: 340, position: "relative" }} ref={globalSearchRef}>
          <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <Ic n="search" s={13} c="rgba(255,255,255,0.4)" />
            <input
              style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, flex: 1, minWidth: 0 }}
              placeholder="横断検索…"
              value={globalSearch}
              onChange={e => { setGlobalSearch(e.target.value); setShowGlobalResults(true); }}
              onFocus={() => setShowGlobalResults(true)}
            />
            {globalSearch && (
              <button style={{ ...T.iconBtn, padding: 0 }} onClick={() => { setGlobalSearch(""); setShowGlobalResults(false); }}>
                <Ic n="x" s={12} c="rgba(255,255,255,0.4)" />
              </button>
            )}
          </div>
          {showGlobalResults && globalResults && (globalResults.manuals.length > 0 || globalResults.assets.length > 0) && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 500, overflow: "hidden" }}>
              {globalResults.manuals.length > 0 && (
                <>
                  <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "0.06em" }}>マニュアル</div>
                  {globalResults.manuals.map(m => (
                    <button key={m.id} style={{ ...T.dropItem, width: "100%" }} onClick={() => { setActiveId(m.id); setPage("detail"); setGlobalSearch(""); setShowGlobalResults(false); }}>
                      <Ic n="book" s={13} c={C.accent} /><span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</span>
                    </button>
                  ))}
                </>
              )}
              {globalResults.assets.length > 0 && (
                <>
                  <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "0.06em", borderTop: globalResults.manuals.length > 0 ? `1px solid ${C.border}` : "none" }}>アセット</div>
                  {globalResults.assets.map(a => {
                    const cfg = ASSET_TYPES[a.type] ?? ASSET_TYPES.prompt;
                    return (
                      <button key={a.id} style={{ ...T.dropItem, width: "100%" }} onClick={() => { setPage("assets"); setGlobalSearch(""); setShowGlobalResults(false); }}>
                        <Ic n={cfg.icon} s={13} c={cfg.color} /><span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
                        <span style={{ fontSize: 10, color: cfg.color, background: cfg.bg, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
          {showGlobalResults && globalSearch && globalResults && globalResults.manuals.length === 0 && globalResults.assets.length === 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 500, padding: "16px", textAlign: "center", fontSize: 13, color: C.muted }}>
              「{globalSearch}」に一致する結果がありません
            </div>
          )}
        </div>

        <div style={T.headerR}>
          {/* Notion sync */}
          <div style={{ position: "relative" }} ref={syncMenuRef}>
            <button style={{ ...T.toolBtnSm, ...(syncMenu ? { background: "rgba(255,255,255,0.08)" } : {}) }}
              onClick={() => setSyncMenu(v => !v)} title="Notion同期">
              {syncing
                ? <span style={{ animation: "spin 1s linear infinite", display: "flex" }}><Ic n="refresh" s={15} c="rgba(255,255,255,0.45)" /></span>
                : <Ic n="cloud" s={15} c="rgba(255,255,255,0.45)" />}
            </button>
            {syncMenu && (
              <div style={{ ...T.dropMenu, right: 0, top: "calc(100% + 8px)", minWidth: 190 }}>
                <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "0.05em" }}>NOTION 同期</div>
                <button style={T.dropItem} onClick={handlePush}>
                  <Ic n="cloudUp" s={14} c={C.blue} />Notionに保存 (Push)
                </button>
                <button style={T.dropItem} onClick={handlePull}>
                  <Ic n="cloudDn" s={14} c={C.green} />Notionから読み込み (Pull)
                </button>
              </div>
            )}
          </div>
          <label style={T.toolBtnSm} title="インポート">
            <Ic n="upload" s={15} c="rgba(255,255,255,0.45)" />
            <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
          </label>
          <button style={T.toolBtnSm} onClick={handleExport} title="エクスポート">
            <Ic n="download" s={15} c="rgba(255,255,255,0.45)" />
          </button>
          {tab !== "archive" && page === "list" && (
            <button style={T.createBtn} onClick={() => { setEditTarget(null); setPage("form"); }}>
              <Ic n="plus" s={14} c="#1a1a2e" />新規作成
            </button>
          )}
          <button style={{ ...T.toolBtnSm, background: "rgba(109,40,217,0.15)", borderRadius: 7 }} onClick={() => setShowAiModal(true)} title="AIで作成">
            <Ic n="lightbulb" s={15} c={C.purple} />
          </button>
        </div>
      </div>

      <div style={T.wrap} id="print-root">
        {syncMsg && (
          <div style={{ ...T.syncToast, background: syncMsg.ok ? C.greenBg : C.warnBg, borderColor: syncMsg.ok ? C.green : C.warn, color: syncMsg.ok ? C.green : C.warn }}>
            <Ic n={syncMsg.ok ? "check" : "alert"} s={14} c={syncMsg.ok ? C.green : C.warn} />
            {syncMsg.text}
          </div>
        )}
        {/* ── List ── */}
        {page === "list" && (
          <>
            {staleCount > 0 && tab === "all" && (
              <div style={T.staleBanner}>
                <Ic n="alert" s={14} c={C.warn} />
                <span style={{ fontSize: 13, color: C.warn }}>
                  <b>{staleCount}件</b>のマニュアルが90日以上更新されていません。レビューを検討してください。
                </span>
              </div>
            )}

            <div style={T.toolbar}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={T.searchBox}>
                  <Ic n="search" s={14} c={C.muted} />
                  <input style={T.searchInp} value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="全文検索（タイトル・説明・手順・テンプレートまで）…" />
                  {search && <button style={T.iconBtn} onClick={() => setSearch("")}><Ic n="x" s={12} c={C.muted} /></button>}
                </div>
                <select style={{ ...T.inp, width: "auto", padding: "8px 12px" }}
                  value={sortKey} onChange={e => setSortKey(e.target.value)}>
                  <option value="updatedAt">更新日順</option>
                  <option value="createdAt">作成日順</option>
                  <option value="title">タイトル順</option>
                </select>
              </div>
              {allTags.length > 0 && (
                <div style={T.tagFilterRow}>
                  <Ic n="tag" s={13} c={C.muted} />
                  <button style={{ ...T.tagFilterBtn, ...(tagFilter === null ? T.tagFilterBtnOn : {}) }}
                    onClick={() => setTagFilter(null)}>すべて</button>
                  {allTags.map(t => (
                    <button key={t}
                      style={{ ...T.tagFilterBtn, ...(tagFilter === t ? T.tagFilterBtnOn : {}) }}
                      onClick={() => setTagFilter(tagFilter === t ? null : t)}>{t}</button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: "0 20px 10px", fontSize: 12, color: C.muted }}>{filtered.length} 件</div>

            {filtered.length === 0 ? (
              <div style={T.empty}>
                <Ic n={tab === "favs" ? "star" : tab === "archive" ? "archive" : "book"} s={48} c={C.borderMd} />
                <div style={{ marginTop: 14, fontSize: 15, color: C.muted }}>
                  {search          ? `「${search}」に一致するマニュアルが見つかりません`
                  : tab === "favs"    ? "お気に入りがありません"
                  : tab === "archive" ? "アーカイブが空です"
                  :                    "マニュアルがまだありません"}
                </div>
                {tab === "all" && !search && (
                  <button style={{ ...T.createBtn, marginTop: 20 }} onClick={() => setPage("form")}>
                    <Ic n="plus" s={14} c="#1a1a2e" />最初のマニュアルを作成
                  </button>
                )}
              </div>
            ) : (
              <div style={T.grid}>
                {filtered.map(m => (
                  <ManualCard key={m.id} manual={m}
                    onOpen={id   => { setActiveId(id); setPage("detail"); }}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onToggleFav={toggleFav}
                    onArchive={toggleArchive}
                  />
                ))}
                {tab === "all" && !search && !tagFilter && (
                  <div style={T.addCard} onClick={() => setPage("form")}>
                    <Ic n="plus" s={32} c={C.borderMd} />
                    <span style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>新規作成</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Detail ── */}
        {page === "detail" && activeManual && (
          <ManualDetail manual={activeManual} manuals={manuals} assets={assets}
            onBack={() => setPage("list")}
            onEdit={openEdit}
            onToggleFav={toggleFav}
            onArchive={toggleArchive} />
        )}

        {/* ── Form ── */}
        {page === "form" && (
          <ManualForm initial={editTarget} manuals={manuals} assets={assets} onSave={handleSave}
            onCancel={() => setPage(activeId && editTarget ? "detail" : "list")} />
        )}

        {/* ── Assets ── */}
        {page === "assets" && (
          <AssetList assets={assets}
            onSave={handleAssetSave}
            onDelete={handleAssetDelete}
            onClose={() => setPage("list")} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const T = {
  app:        { background: C.bg, minHeight: "100vh", fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',sans-serif", color: C.text },  header:      { background: C.header, height: 56, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 0 rgba(255,255,255,0.06),0 4px 16px rgba(0,0,0,0.4)", gap: 16 },
  headerL:     { display: "flex", alignItems: "center", gap: 20, minWidth: 0, overflow: "hidden" },
  logo:        { color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  logoDivider: { width: 1, height: 20, background: "rgba(255,255,255,0.15)", flexShrink: 0 },
  nav:         { display: "flex", gap: 1, alignItems: "center", overflow: "hidden" },
  navBtn:      { background: "none", border: "none", color: "rgba(255,255,255,0.5)", padding: "0 14px", fontSize: 13, cursor: "pointer", borderRadius: 6, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", height: 36 },
  navBtnOn:    { background: "rgba(255,255,255,0.08)", color: "#fff" },
  navBadge:    { background: C.accentBright, color: "#1a1a2e", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800, lineHeight: "1.4" },
  headerR:     { display: "flex", gap: 4, alignItems: "center", flexShrink: 0 },
  createBtn:   { background: C.accentBright, border: "none", color: "#1a1a2e", borderRadius: 7, padding: "7px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  toolBtnSm:   { background: "none", border: "none", cursor: "pointer", width: 34, height: 34, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" },

  wrap:        { padding: "20px 20px 80px", maxWidth: 1300, margin: "0 auto" },
  staleBanner: { background: C.warnBg, border: `1px solid ${C.warn}44`, borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  syncToast:   { border: "1px solid", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13, fontWeight: 600 },
  toolbar:     { display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 },
  searchBox:   { background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 580 },
  searchInp:   { background: "none", border: "none", outline: "none", flex: 1, fontSize: 14, color: C.text },
  tagFilterRow:{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" },
  tagFilterBtn:   { background: C.paper, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 20, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  tagFilterBtnOn: { background: C.accentBg, border: `1px solid ${C.accent}`, color: C.accent, fontWeight: 700 },
  grid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 },
  addCard: { background: "transparent", border: `2px dashed ${C.borderMd}`, borderRadius: 12, minHeight: 170, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  empty:   { textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center" },

  card:         { background: C.card, borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "14px", display: "flex", flexDirection: "column" },
  cardHead:     { display: "flex", gap: 8, alignItems: "flex-start", paddingBottom: 10 },
  cardTags:     { display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 },
  cardTitle:    { fontSize: 15, fontWeight: 800, lineHeight: 1.4, cursor: "pointer", color: C.text },
  cardDesc:     { fontSize: 13, color: C.textSm, lineHeight: 1.6, margin: "0 0 10px" },
  cardSteps:    { borderTop: `1px solid ${C.border}`, paddingTop: 8 },
  cardStep:     { display: "flex", gap: 8, alignItems: "center", padding: "4px 0" },
  cardStepNum:  { fontSize: 10, fontWeight: 800, color: C.accent, background: C.accentBg, padding: "1px 6px", borderRadius: 4, flexShrink: 0 },
  cardStepTitle:{ fontSize: 12, color: C.textSm, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  stepDot:      { background: C.bg, borderRadius: 3, padding: "1px 4px", display: "inline-flex", alignItems: "center", gap: 2 },
  cardFoot:     { display: "flex", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` },
  openBtn:      { background: C.header, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 700, marginLeft: "auto" },
  iconBtn:      { background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, display: "flex", alignItems: "center" },
  dropMenu:     { position: "absolute", right: 0, top: "calc(100% + 4px)", background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, boxShadow: "0 6px 20px rgba(0,0,0,0.12)", minWidth: 155, zIndex: 300, padding: 4 },
  dropItem:     { display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, cursor: "pointer", borderRadius: 5, color: C.text },
  dropDivider:  { height: 1, background: C.border, margin: "4px 0" },

  detailWrap:    { maxWidth: 780, margin: "0 auto" },
  detailTopBar:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  backBtn:       { background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, padding: 0 },
  toolBtn:       { background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" },
  editBtn:       { background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "7px 16px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 },
  detailHeader:  { background: C.card, borderRadius: 12, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 12 },
  detailMetaRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  detailTitle:   { fontSize: 26, fontWeight: 900, margin: "0 0 8px", lineHeight: 1.3, letterSpacing: "-0.01em" },
  detailDesc:    { fontSize: 14, color: C.textSm, lineHeight: 1.7, margin: "0 0 14px" },
  detailFooter:  { display: "flex", gap: 16, flexWrap: "wrap", paddingTop: 12, borderTop: `1px solid ${C.border}` },
  staleWarn:     { background: C.warnBg, border: `1px solid ${C.warn}44`, borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13, color: C.warn },
  refSection:    { background: C.paper, borderRadius: 9, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  refChip:       { background: C.purpleBg, border: `1px solid ${C.purple}33`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: C.purple, display: "inline-flex", alignItems: "center", gap: 5 },
  toc:           { background: C.card, borderRadius: 10, padding: "14px 18px", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  tocItem:       { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 13, color: C.text, textDecoration: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer" },
  tocNum:        { fontSize: 10, fontWeight: 800, color: C.accent, background: C.accentBg, padding: "2px 7px", borderRadius: 4, minWidth: 28, textAlign: "center" },

  stepSection:  { background: C.card, borderRadius: 12, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" },
  stepHeader:   { display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, background: C.paper },
  stepNum:      { width: 36, height: 36, borderRadius: "50%", background: C.accentBg, border: `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.accent },
  stepTitle:    { fontSize: 17, fontWeight: 800, margin: 0, color: C.text },
  stepBody:     { padding: "18px 20px 20px" },
  stepExplain:  { fontSize: 14, lineHeight: 1.8, color: C.text, margin: "0 0 14px", whiteSpace: "pre-wrap" },
  mediaSection: { margin: "14px 0" },
  mediaBox:     { background: C.paper, borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${C.border}` },
  mediaLabel:   { fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 },
  actionBar:    { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
  linkBtn:      { background: C.blueBg, border: `1px solid ${C.blue}33`, color: C.blue, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 },
  tplToggleBtn: { background: C.accentBg, border: `1px solid ${C.accent}44`, color: C.accent, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 },
  refBtn:       { background: C.purpleBg, border: `1px solid ${C.purple}33`, color: C.purple, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 },
  checklistToggle:     { background: C.bg, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 },
  checklistToggleDone: { background: C.greenBg, borderColor: `${C.green}44`, color: C.green },
  tplBox:       { background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginTop: 12 },
  tplHead:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${C.border}` },
  tplPre:       { margin: 0, padding: "14px", fontSize: 13, fontFamily: "'SFMono-Regular',Consolas,monospace", lineHeight: 1.7, color: "#1e3a5f", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f0f5fa", maxHeight: 280, overflowY: "auto" },
  checklistBox: { background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginTop: 12 },
  checklistHead:{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  checkItem:    { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 14, cursor: "pointer", borderBottom: `1px solid ${C.border}`, userSelect: "none" },
  resetBtn:     { background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 5, padding: "3px 9px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },

  copyBtn:    { background: C.accentBg, border: `1px solid ${C.accent}55`, color: C.accent, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 },
  copyBtnOk:  { background: C.greenBg, borderColor: `${C.green}55`, color: C.green },

  tag:         { borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid" },
  tagRm:       { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" },
  tagInputWrap:{ display: "flex", alignItems: "center", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, padding: "2px 10px" },
  tagInp:      { background: "none", border: "none", outline: "none", fontSize: 12, color: C.text, width: 120 },
  tagAddBtn:   { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 },

  formWrap:  { maxWidth: 740, margin: "0 auto" },
  fsBar:     { display: "flex", alignItems: "flex-start", marginBottom: 22 },
  fsDot:     { width: 30, height: 30, borderRadius: "50%", background: C.card, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: C.muted },
  fsDotOn:   { background: C.accentBright, borderColor: C.accentBright, color: "#1a1a2e" },
  fsDotDone: { background: C.green, borderColor: C.green, color: "#fff" },
  formBox:   { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "26px", marginBottom: 18, boxShadow: "0 1px 5px rgba(0,0,0,0.06)" },
  fields:    { display: "flex", flexDirection: "column", gap: 18 },
  fLabel:    { display: "block", fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" },
  inp:       { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13, outline: "none", width: "100%" },
  addRow:    { display: "flex", gap: 8, alignItems: "stretch", flexWrap: "wrap" },
  addBtn:    { background: C.accentBg, border: `1px solid ${C.accent}55`, color: C.accent, borderRadius: 7, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" },
  chip:      { display: "flex", alignItems: "center", gap: 7, background: C.bg, border: `1px solid ${C.border}`, borderLeftWidth: 3, borderRadius: 6, padding: "5px 10px", marginTop: 5 },
  chipTxt:   { fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rmBtn:     { background: "none", border: "none", cursor: "pointer", display: "flex", color: C.muted, padding: 0, flexShrink: 0 },
  toggleChip:   { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 },
  toggleChipOn: { background: C.greenBg, borderColor: `${C.green}55`, color: C.green, fontWeight: 700 },
  refRow:    { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 9, border: `1px solid ${C.border}`, cursor: "pointer", background: C.paper },
  refRowOn:  { border: `1px solid ${C.green}55`, background: C.greenBg },

  stepEd:       { border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 12, overflow: "hidden" },
  stepEdHead:   { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: C.bg, cursor: "pointer", userSelect: "none" },
  stepEdNum:    { fontSize: 10, fontWeight: 800, color: C.accent, background: C.accentBg, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" },
  stepEdInline: { background: "transparent", border: "none", outline: "none", fontSize: 14, fontWeight: 700, color: C.text, flex: 1, minWidth: 0 },
  stepEdBody:   { padding: 16, display: "flex", flexDirection: "column", gap: 16 },
  edSection:    { background: C.paper, borderRadius: 9, padding: "12px 14px", border: `1px solid ${C.border}`, borderLeftWidth: 3, display: "flex", flexDirection: "column", gap: 10 },
  edSectionTitle: { fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 7, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, marginBottom: 2 },
  addStepBtn:   { width: "100%", background: C.paper, border: `2px dashed ${C.border}`, borderRadius: 10, padding: "12px", color: C.muted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },

  formNav:    { display: "flex", justifyContent: "space-between" },
  btnBack:    { background: C.card, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  btnPrimary: { background: C.accentBright, border: "none", color: "#1a1a2e", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 800, cursor: "pointer" },
  btnSave:    { background: C.green, border: "none", color: "#fff", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },

  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(2px)" },
  modal:      { background: C.card, borderRadius: 16, padding: 30, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
  modalTitle: { fontSize: 17, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 10 },
};

# Manual Hub

「やってみせ、言って聞かせて、させてみせ」の思想で設計された業務マニュアル管理ツール。

## ローカルで動かす

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

## Vercel にデプロイする

### 方法 A — Vercel CLI（推奨）

```bash
npm install -g vercel
vercel
```

初回は Vercel アカウントへのログインを求められます。指示に従って進めると URL が発行されます。

### 方法 B — GitHub 経由

1. このフォルダを GitHub にプッシュ
2. https://vercel.com/new でリポジトリを選択
3. Framework Preset が **Vite** になっていることを確認して Deploy

ビルドコマンド・出力ディレクトリはデフォルト（`vite build` / `dist`）のまま変更不要です。

## データの保存先

`localStorage` にブラウザごとに保存されます。
複数人で同じデータを共有するにはバックエンド（Supabase など）との連携が必要です。

右上のエクスポートボタンで JSON ファイルに書き出し、別の端末でインポートすることで手動共有が可能です。

# Current

## Current Phase

Local Dev Hub v1

## Current State

Next.js App Routerで、設定済みローカルアプリの一覧・稼働状態・入口を1画面にまとめるv1を実装済み。

## Working

- `config/apps.json`からのアプリ定義読み込みと起動時検証。
- Node.js側のTCPポート確認によるRunning / Stopped判定。
- 初期状態のServer rendering、15秒間隔の自動更新、手動Refresh。
- アプリ名検索、カテゴリフィルター、Open / GitHub導線。
- Running件数、Stopped件数、使用中ポートのサマリー。
- Windows用`start-local-dev-hub.bat`と固定ポート8790。
- OS設定に追従するライト／ダークUI。

## In Progress

- None.

## Known Issues

- TCPポートがaccept状態ならRunningと判定するため、アプリ固有のHTTP healthまでは検証しない。
- `apps.json`はLocal Dev Hub再起動時に再読込される。

## Immediate Next

- 実際に利用するローカルアプリを`config/apps.json`へ登録する。

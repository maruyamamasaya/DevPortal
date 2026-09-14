# Architecture

## System Overview

ローカルPC上で動作する単一のNext.js application。App DefinitionをJSONから読み込み、Node.js側で各loopback portへのTCP接続可否を確認し、serializableなstatusだけをClient Componentへ渡す。

## Technology Stack

- Next.js 16 / React 19 / TypeScript
- App Router / Server Components / Route Handler
- CSS（追加UI frameworkなし）
- Node.js `net` module
- Vitest / ESLint

## Major Components

- `config/apps.json`: 人が編集するアプリ定義。
- `src/lib/apps/validate.ts`: 設定値の境界検証。
- `src/lib/apps/status-checker.ts`: TCP port status checker。
- `src/app/api/apps/status/route.ts`: UIの定期更新用read-only endpoint。
- `src/components/dev-hub.tsx`: 検索、filter、status更新、カード表示。

## Data Flow

1. Server Componentが`apps.json`を読み込み検証する。
2. status checkerが全アプリのportへ並列接続する。
3. 初期HTMLへアプリ定義とstatusを渡す。
4. Client Componentが15秒ごと、または手動操作時にstatus endpointを呼ぶ。
5. endpointがその時点のstatusを再確認して返す。

## External Services

なし。GitHub URLはブラウザで開くリンクとしてのみ扱い、GitHub APIは呼ばない。

## Deployment

Windows上のNode.js processとして`127.0.0.1:8790`でローカル実行する。

## Key Constraints

- Status check対象はloopback hostだけに限定する。
- v1は閲覧と遷移だけを担い、OS processやGit Repositoryを変更しない。
- DB、認証、Docker、外部APIを使わない。

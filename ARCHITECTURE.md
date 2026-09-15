# Architecture

## System Overview

ローカルPC上で動作する単一のNext.js application。Local/WebのApp DefinitionをJSONから読み込み、LocalのみNode.js側でloopback portへのTCP接続可否を確認する。serializableな定義とstatusをClient Componentへ渡す。

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
- `src/lib/apps/process-manager.ts`: Hub所有プロセスだけを扱う一時的な管理表と起動・停止。
- `src/app/api/apps/process/route.ts`: Originを確認するStart/Stop endpoint。
- `src/components/dev-hub.tsx`: 検索、filter、status更新、カード表示。
- `src/app/api/apps/favicon/[id]/route.ts`: 登録済みWeb Appのファビコン取得と6時間のファイルキャッシュ。
- `src/app/api/apps/preview/[id]/route.ts`: 分離したヘッドレスブラウザでWebと起動中Localを撮影してPNGを返す。停止中Localは保存済み画像を返す。
- `src/lib/apps/media-cache.ts` / `scripts/refresh-media.mjs`: `.cache/media/`への保存と一括更新。
- `scripts/install-media-schedule.ps1`: Windowsの定期タスクを登録し、画面を閉じていても30分ごとにWebの接続確認・撮影と起動中Localの撮影を実行する。
- `src/app/api/apps/web-status/route.ts`: 定期確認の結果をGit管理外のcacheから読み取る。
- `src/components/hub-sidebar.tsx`: 3つの表示を切り替える共通ナビゲーション。
- `src/app/settings/page.tsx` / `src/components/bookmark-settings.tsx`: 設定ページでブックマークと所属フォルダーを管理する。
- `src/components/hub-sidebar.tsx` / `src/lib/bookmarks.ts`: 歯車の設定導線、右側へ展開するフォルダー単位のブックマーク表示・検証。データはブラウザの`localStorage`に保存し、アプリ定義や稼働状態とは分離する。
- `src/lib/layout/grid.ts`: マス目上の配置、重なり判定、保存データ検証。
- `src/app/my-layout/page.tsx` / `src/components/my-layout.tsx`: ユーザー配置の編集・表示。
- `src/app/icons/page.tsx` / `src/components/icon-view.tsx`: アイコンとタイトルの簡易表示。

## Data Flow

マイレイアウトはアプリ定義と初期状態をServerから受け取り、配置座標・サイズのみブラウザの`localStorage`へ保存する。登録アプリの正本は引き続き`apps.json`であり、配置保存にはURLや秘密情報を含めない。将来のウィジェット追加時はブロック対象の種類を明示する拡張を行う。

1. Server Componentが`apps.json`を読み込み検証する。
2. status checkerがLocal Appのportだけへ並列接続する。Web AppのHTTP接続確認はWindows定期タスクが別途実行する。
3. 初期HTMLへアプリ定義とstatusを渡す。
4. Client Componentが15秒ごと、または手動操作時にstatus endpointを呼ぶ。
5. endpointがその時点のstatusを再確認して返す。

## External Services

Web Appのファビコンとプレビュー取得時に限り、登録済み公開URLへServerから接続する。ファビコンのリダイレクトと画像参照は同一originに制限する。プレビューは隔離した未認証Chrome/Edge profileで撮影し、`.cache/media/`に保存する。Web Appの稼働監視は行わない。GitHub URLはブラウザで開くリンクとしてのみ扱う。

## Deployment

Windows上のNode.js processとして`127.0.0.1:8790`でローカル実行する。

## Desktop Migration Considerations

デスクトップアプリ化は[ROADMAP.md](ROADMAP.md)に記載した実施予定であり、方式はまだ決定していない。現在はUIとローカル操作を分離しているが、UIはNext.jsの動的Server renderingと`/api/apps/*`を利用するため、静的なWebViewへ画面だけを移しても現機能は動かない。

- UI: `src/components/dev-hub.tsx`の検索・filter・カード表示は再利用候補。ただし状態更新とStart/Stopは相対URLのAPI呼び出しに依存する。
- ローカル機能: `src/lib/apps/definitions.ts`、`status-checker.ts`、`process-manager.ts`はNode.js server側で動作する。実行場所を変える場合はUIとの呼び出し境界を再設計する。
- プロセス管理: 所有情報はserver processのメモリ上だけにあり、再起動後は失われる。起動にはPowerShell、停止にはWindowsの`taskkill`を使う。アプリ終了時や再起動後の所有・停止ルールが必要。
- 配布: 現状は`config/apps.json`と登録先のローカルパス、Node.js/Next.js実行環境を前提とする。インストール後の設定保存先と実行環境の同梱方法を決める必要がある。

候補は、Node.js/Next.js serverをデスクトップアプリに同梱して既存APIを使う方式と、画面を再利用しローカル機能をデスクトップ側へ移す方式。どちらも未選定であり、選定前に静的書き出しや特定frameworkへの移行を前提としない。

## Key Constraints

- Status check対象はloopback hostだけに限定する。
- 起動設定は`apps.json`の`launch`へ限定し、Hub以外のプロセスを停止しない。
- DB、認証、Docker、外部APIを使わない。

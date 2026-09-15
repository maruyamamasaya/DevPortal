# Current

## Current Phase

Local Dev Hub v1 + 最小v2連携

## Current State

Next.js App Routerで、設定済みローカルアプリの稼働状態と、公開Webアプリを含む一覧・入口を1画面にまとめるv1を実装済み。

## Working

- `config/apps.json`からのアプリ定義読み込みと起動時検証。
- Node.js側のTCPポート確認によるRunning / Stopped判定。
- 公開Webアプリ5件のリンク登録。Webアプリは稼働監視せず、Web Appとして表示する。
- 初期状態のServer rendering、15秒間隔の自動更新、手動Refresh。
- アプリ名検索、カテゴリフィルター、Open / GitHub導線。
- Running件数、Stopped件数、使用中ポートのサマリー。
- Windows用`start-local-dev-hub.bat`と固定ポート8790。
- OS設定に追従するライト／ダークUI。
- 横長カードのページプレビュー枠。Webアプリは未認証ブラウザでトップページを撮影し、Localは`previewUrl`で画像を登録できる。
- Webアプリのサムネイルと公開済みファビコンを`.cache/media/`へ保存し、6時間経過後に再取得を試みる。失敗時は古い画像を表示する。
- 4製品をローカル登録。MySkillは閲覧／編集の2ポートを別カード化。
- 設定済みローカルアプリのStart/Stop。Hubが起動したプロセスだけ停止可能。
- 共通サイドバーからアプリ一覧・マイレイアウト・アイコン表示を切り替えられる。
- マイレイアウトは4×4を初期値とし、幅・高さをマス単位で指定するブロックの配置、移動、サイズ変更、行列の拡張をブラウザに保存する。
- アイコン表示ではアイコンとタイトルだけを並べ、起動中LocalとWebを開ける。

## In Progress

- None.

## Known Issues

- TCPポートがaccept状態ならRunningと判定するため、アプリ固有のHTTP healthまでは検証しない。
- `apps.json`はLocal Dev Hub再起動時に再読込される。
- Hub再起動後はプロセス所有情報が失われ、以前Hubが起動したプロセスもStopできない。
- Command ManagerのTauriデスクトップ画面とMySkill Editorの起動は未検証。Living Aurora UI、MySkill Checker閲覧画面、GitHub MonitorのStart/Stopは実機確認済み。
- `tool`はサイト側にファビコンがなく、頭文字を表示する。ログインが必要なWebアプリのサムネイルは未認証のログイン画面になる。

## Immediate Next

- 登録済みアプリの実機でStart/Stopを確認する。

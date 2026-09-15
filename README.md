# Local Dev Hub

Webアプリのファビコンとトップページのプレビューは自動取得し、Git管理外の`.cache/media/`に保存します。表示時に6時間を過ぎた画像は更新を試み、失敗しても古い画像を残します。初回取得や一括更新は`npm run media:refresh`でも実行できます。ChromeまたはEdgeが必要です。ログインが必要なサイトのプレビューは未認証のログイン画面になります。Localアプリはトップページ画像を`public/previews/<app-id>.png`に置き、`config/apps.json`に`"previewUrl": "/previews/<app-id>.png"`を追加できます。

Windowsでは`npm run media:schedule`でユーザーの定期タスクを登録できます。画面を閉じていても30分ごとにWebサイトの接続確認・撮影と、起動中Localアプリの撮影を行います。停止中Localは最後の画像を表示し、固定画像の`previewUrl`は自動撮影より優先します。ファビコンは6時間を過ぎたときだけ再取得します。画面の「接続中」「接続不可」は最後のHTTP確認結果で、75分以上更新されないと「未確認」になります。定期タスクを止める場合は`Unregister-ScheduledTask -TaskName 'Local Dev Hub - Web media refresh' -Confirm:$false`をPowerShellで実行します。

## Local Dev Hubとは

サイドバーから「マイレイアウト」と「アイコン表示」に切り替えられます。マイレイアウトは4×4の見本から始まり、アプリを空きマスへ追加、ドラッグ移動、サイズ変更できます。配置は利用中のブラウザに自動保存されます。行は12まで、列は6まで拡張できます。

ローカルツールがウィジェット専用のWeb画面を提供したら、`config/widgets.json`へ `{ "id": "tool-summary", "appId": "登録済みローカルアプリID", "name": "概要", "path": "/widgets/summary" }` を追加します。Hubを再起動するとマイレイアウトの「ウィジェットを配置」に表示されます。ツールが起動中のときだけ枠内に画面を表示します。提供元の画面はiframeでの表示を許可し、枠内で読める表示と更新処理を実装してください。`id`は一意のkebab-case、`path`はそのアプリ内の絶対パスです。

複数のローカル開発アプリの状態をまとめて確認し、ローカル／公開WebアプリやGitHub Repositoryへ移動するための、ローカル開発環境の玄関口です。DB・認証・外部APIを使わず、Hub自体はローカルで動作します。

## v1

```text
見る
↓
状態確認
↓
開く
```

- `config/apps.json`からのアプリ一覧読み込み
- Node.jsサーバーから各アプリのTCPポートを確認
- Running / Stoppedを15秒ごとに自動更新
- 手動Refresh、名前検索、カテゴリフィルター
- RunningアプリとGitHub Repositoryを新しいタブで開く
- 公開WebアプリはWeb Appとして表示し、状態を監視せずOpenで開く
- OS設定に合わせたライト／ダーク表示。設定からシステム・ライト・ダークを選択可能

## 起動・停止（v2の最小連携）

登録したローカルアプリのうち`launch`があるカードにはStartが表示されます。ポートが空いている場合だけHubがそのリポジトリで`npm.cmd run`を実行します。アプリの出力はHubを起動したターミナルに流れます。Hubが起動したプロセスにはStopが表示され、Windowsの`taskkill /T /F`でそのプロセスツリーを停止します。Hub以外から起動したアプリはRunningと表示されますが、Stopはできません。Hubを再起動すると起動プロセスの所有情報が失われるため、再起動前にStopしてください。

登録済みポートはLiving Aurora UI `8767`、Command Manager `1420`、MySkill Checker `4321`、MySkill Editor `4174`、GitHub Monitor `3000`です。既定値は各アプリ側で変更していません。MySkill CheckerのAstro 7は`localhost`で待ち受け、AI環境で自動background化するため、Hub起動時だけ`astroForeground`を指定しています。MySkill Editorは先方の環境で`ENOMEM`により起動検証が未完了です。Command Managerはアプリ側の`build.devUrl`とHubの登録ポートがともに`1420`なので、Hubからは`CHEATSHEET_DEV_PORT`だけを渡します。Tauriの起動プロセスとポート1420の待ち受けを確認済みですが、デスクトップ画面表示は未検証です。

起動設定は以下の形式です。`script`は`dev`、`edit`、`tauri`だけに限定し、ポートは`portEnv`または`portArg`から渡します。Tauriでは`tauriDevUrl`、Astro 7では`astroForeground`も指定できます。Start/StopはこのPCのプロセスを操作するため、Hubは必ず`127.0.0.1`にだけ公開してください。

```json
"launch": { "script": "dev", "portEnv": "PORT" }
```

## 必要環境

- Windows
- Node.js 20.9以降
- npm

## セットアップ

```bash
npm install
```

`config/apps.json`を編集してローカルアプリを登録します。

```json
[
  {
    "id": "mymusic-analytics",
    "kind": "local",
    "name": "MyMusic Analytics",
    "description": "MyMusicの再生履歴・音楽特徴分析",
    "category": "Analytics",
    "url": "http://127.0.0.1:8766",
    "port": 8766,
    "localPath": "C:\\Users\\your-name\\Development\\MyMusic-Analytics",
    "repositoryUrl": "https://github.com/your-name/MyMusic-Analytics"
  }
]
```

公開Webアプリは次のように登録します。`port`と`localPath`は不要です。

```json
{
  "id": "study-note",
  "kind": "web",
  "name": "study note",
  "description": "学習ノートアプリ",
  "category": "Main Apps",
  "url": "https://maruyamamasaya.github.io/study/#/",
  "repositoryUrl": null
}
```

`id`は重複しないkebab-case。Localの`url`は`localhost`・`127.0.0.1`・`::1`のいずれかを使い、URL内のポートと`port`を一致させてください。Webの`url`は外部HTTPSにします。`repositoryUrl`がなければ`null`にします。公開WebアプリのRunning / Stoppedや到達性は判定しません。

## 起動

エクスプローラーから[start-local-dev-hub.bat](start-local-dev-hub.bat)をダブルクリックします。初回だけ依存関係を自動でインストールします。

またはターミナルで起動します。

```bash
npm run dev
```

[http://127.0.0.1:8790](http://127.0.0.1:8790)を開きます。ポート確認は接続可否を1.5秒以内で判定し、アプリへHTTPリクエストは送信しません。

本番モードでローカル実行する場合:

```bash
npm start
```

`npm start`は起動前にproduction buildを作り直します。古い`.next`の成果物をそのまま使いません。

## 検証

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Roadmap

```text
v1
見る・開く

v2
起動・停止

v3
ログ

v4
Git Status

v5
Recent Commits
```

ログ収集、Gitコマンド、DB、認証、クラウド同期は実装していません。

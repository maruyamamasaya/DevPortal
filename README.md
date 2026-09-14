# Local Dev Hub

## Local Dev Hubとは

複数のローカル開発アプリをまとめて確認し、起動中のアプリやGitHub Repositoryへ移動するための、ローカル開発環境の玄関口です。DB・認証・外部サービスを使わず、ローカルだけで動作します。

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
- OS設定に合わせたライト／ダーク表示

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

`id`は重複しないkebab-case、`url`は`localhost`・`127.0.0.1`・`::1`のいずれかを使い、URL内のポートと`port`を一致させてください。`repositoryUrl`がなければ`null`にします。

## 起動

エクスプローラーから[start-local-dev-hub.bat](start-local-dev-hub.bat)をダブルクリックします。初回だけ依存関係を自動でインストールします。

またはターミナルで起動します。

```bash
npm run dev
```

[http://127.0.0.1:8790](http://127.0.0.1:8790)を開きます。ポート確認は接続可否を1.5秒以内で判定し、アプリへHTTPリクエストは送信しません。

本番モードでローカル実行する場合:

```bash
npm run build
npm start
```

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

v1ではプロセス操作、ログ収集、Gitコマンド、DB、認証、クラウド同期を実装しません。

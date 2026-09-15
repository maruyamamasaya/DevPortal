# Security

## Authentication / Authorization

loopback interfaceだけで動く個人用local applicationのためv1では設けない。LANやInternetへ公開しない。

## Secrets and Sensitive Data

秘密情報を必要としない。`apps.json`にはtokenやcredentialを記録しない。local pathは個人環境情報を含み得るため、公開Repositoryへpushする前に内容を確認する。

## Input Validation

- `apps.json`は起動時に型、必須値、port範囲、重複id・重複local port、起動設定を検証する。
- status check対象のLocal App URLは`localhost`、`127.0.0.1`、`::1`だけを許可し、外部hostへの任意接続を防ぐ。
- Web Appは外部HTTPS URLのみ許可する。ファビコン取得は登録済みURLと同一origin内だけをたどる。

## External Services

Serverは登録済みWeb Appのファビコンとプレビューの取得時だけ外部アクセスする。プレビュー撮影は一時的な未認証browser profileを使い、画像はGit管理外の`.cache/media/`に保存する。Repository URLはユーザー操作でbrowserへ渡すだけで、Serverからアクセスしない。

## Process Safety

Start/Stop endpointは同一OriginのJSON POSTだけを受け付ける。設定済みの`npm run` scriptと数値portだけを使い、指定directoryで起動する。停止はHubの稼働中セッションが保持するPIDだけをWindowsの`taskkill /T /F`へ渡す。外部から起動済みの同ポートは停止しない。Hub再起動後はPIDを引き継がない。Git操作は行わない。

Webの定期確認・撮影は`apps.json`に登録済みのHTTPS URLだけを対象とする。Windows定期タスクは現在の対話ユーザーで動作し、画面を閉じている間も未認証ブラウザで撮影する。

## Dependencies

依存関係はNext.js、React、TypeScript、ESLint、Vitestに限定し、`npm audit`と定期更新で確認する。

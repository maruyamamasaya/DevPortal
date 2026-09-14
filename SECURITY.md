# Security

## Authentication / Authorization

loopback interfaceだけで動く個人用local applicationのためv1では設けない。LANやInternetへ公開しない。

## Secrets and Sensitive Data

秘密情報を必要としない。`apps.json`にはtokenやcredentialを記録しない。local pathは個人環境情報を含み得るため、公開Repositoryへpushする前に内容を確認する。

## Input Validation

- `apps.json`は起動時に型、必須値、port範囲、重複idを検証する。
- status check対象URLは`localhost`、`127.0.0.1`、`::1`だけを許可し、外部hostへの任意接続を防ぐ。
- URL protocolはHTTP(S)だけを許可する。

## External Services

なし。repository URLはユーザー操作でbrowserへ渡すだけで、Serverからアクセスしない。

## Process Safety

v1はprocess実行、停止、kill、shell command実行、Git操作を行わない。

## Dependencies

依存関係はNext.js、React、TypeScript、ESLint、Vitestに限定し、`npm audit`と定期更新で確認する。

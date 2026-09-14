# Data Model

## Persistence Strategy

Database persistence: Not applicable.

アプリ定義は人が編集する`config/apps.json`を正本とする。Runtime Statusは都度取得する一時データであり保存しない。v1にDB、migration、retention管理は不要。

## App Definition

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | 一意なkebab-case識別子 |
| `name` | string | Yes | 表示名 |
| `description` | string | Yes | 短い説明 |
| `category` | string | Yes | filter分類 |
| `url` | string | Yes | loopback HTTP(S) URL |
| `port` | integer | Yes | 1〜65535 |
| `localPath` | string | Yes | Windows local directory |
| `repositoryUrl` | string / null | No | GitHub等のrepository URL |

## Runtime Status

`id`、`state`、`checkedAt`、`responseTimeMs`をAPI response内だけで扱う。

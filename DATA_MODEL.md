# Data Model

## Persistence Strategy

Database persistence: Not applicable.

マイレイアウトはブラウザの`localStorage`に`columns`、`rows`と、`appId`・`column`・`row`・`width`・`height`を持つブロック配列を保存する。現在の対象は登録アプリだけ。幅・高さはマス単位で指定でき、重なり・範囲外の保存データは読み込み時に除外する。旧`size`プリセットの保存データも読み込める。

アプリ定義は人が編集する`config/apps.json`を正本とする。Runtime Statusは都度取得する一時データであり保存しない。v1にDB、migration、retention管理は不要。

Web AppのファビコンとPNGプレビューはGit管理外の`.cache/media/`へ保存する。ファビコンには画像型・取得元URL・更新時刻のmetadataを付ける。表示時に6時間超なら更新を試み、失敗しても保存済み画像を表示する。

## App Definition

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | 一意なkebab-case識別子 |
| `kind` | `local` / `web` | Yes | アプリ種別 |
| `name` | string | Yes | 表示名 |
| `description` | string | Yes | 短い説明 |
| `category` | string | Yes | filter分類 |
| `url` | string | Yes | Localはloopback HTTP(S)、Webは外部HTTPS URL |
| `port` | integer | Localのみ | 1〜65535 |
| `localPath` | string | Localのみ | Windows local directory |
| `repositoryUrl` | string / null | No | GitHub等のrepository URL |
| `launch` | object | No | Localのみ。`script`、`portEnv`または`portArg`、任意の`tauriDevUrl`・`astroForeground` |

## Runtime Status

Local Appのみ`id`、`state`、`checkedAt`、`responseTimeMs`をAPI response内で扱う。Web Appの稼働状態は取得しない。

Hub所有のprocess handleはメモリだけに保持し、Statusには`managed`を付ける。永続化しない。

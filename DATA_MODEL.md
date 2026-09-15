# Data Model

## Persistence Strategy

Database persistence: Not applicable.

マイレイアウトはブラウザの`localStorage`に`columns`、`rows`と、`itemId`・`column`・`row`・`width`・`height`を持つブロック配列を保存する。対象IDは`app:<appId>`または`widget:<widgetId>`。幅・高さはマス単位で指定でき、登録がなくなった対象、重なり・範囲外の保存データは読み込み時に除外する。旧`appId`と`size`プリセットの保存データも読み込める。

ウィジェット定義は`config/widgets.json`に`id`、登録済みLocalアプリの`appId`、`name`、絶対パス`path`を登録する。URLは登録アプリのoriginとpathから組み立て、配置保存には含めない。

アプリ定義は人が編集する`config/apps.json`を正本とする。Runtime Statusは都度取得する一時データであり保存しない。v1にDB、migration、retention管理は不要。

Web AppのファビコンとPNGプレビューはGit管理外の`.cache/media/`へ保存する。ファビコンには画像型・取得元URL・更新時刻のmetadataを付ける。表示時に6時間超なら更新を試み、失敗しても保存済み画像を表示する。

起動中Local AppのPNGプレビューも同じcacheへ保存する。停止中は撮影せず、最後の画像を残す。`previewUrl`が登録されている場合はその固定画像を優先する。

Web Appの接続確認結果は同じcache内の`web-status.json`に`id`、`reachable`、`checkedAt`を保存する。30分ごとの確認が75分以上途絶えた場合は画面で未確認と表示する。これはHTTP応答の有無を示し、アプリ内部のhealthを保証しない。

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

Local Appは`id`、`state`、`checkedAt`、`responseTimeMs`をAPI response内で扱う。Web Appは別の接続確認結果をcacheから読み取る。

Hub所有のprocess handleはメモリだけに保持し、Statusには`managed`を付ける。永続化しない。

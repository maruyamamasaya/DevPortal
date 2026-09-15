# Domain

## Glossary

- **App Definition**: `apps.json`に登録されたローカル／公開Webアプリの静的情報。
- **Running**: 指定portへのTCP接続が制限時間内に成功した状態。
- **Stopped**: 指定portへのTCP接続が失敗またはtimeoutした状態。
- **Web App**: 外部HTTPS URLを持つ公開アプリ。Running / Stoppedは測定しない。
- **Open**: RunningローカルアプリまたはWebアプリのURLを新しいbrowser tabで開く導線。
- **Hub managed**: 現在のHubプロセスが起動し、所有情報を保持しているローカルアプリ。
- **Bookmark**: ブラウザ内に保存するURLとタイトルの組。アプリ定義や状態確認の対象にはしない。
- **Bookmark Folder**: サイドバーでBookmarkをまとめる1階層のグループ。未分類は常に存在する。

## Entities

- Local App: id、name、description、category、loopback URL、port、local path、任意のrepository URLを持つ。
- Web App: id、name、description、category、外部HTTPS URL、任意のrepository URLを持つ。
- Runtime Status: app id、Running / Stopped、確認時刻、応答時間を持つ一時的な観測値。

## States

- `running`
- `stopped`
- `web`（稼働状態ではなくアプリ種別）

## Business Rules

- statusは15秒ごと、および手動Refreshで更新する。
- Local AppのOpen操作はRunning時だけ有効にする。Web AppのOpenは常に有効。
- 公開Webアプリに対する自動HTTP稼働確認は行わない。
- repository URL未設定時はGitHub操作をdisabledにする。
- Startは起動設定がありポート未使用のときだけ行う。StopはHub managedだけに行う。
- 名前検索は大文字・小文字を区別しない。
- categoryは登録済み値から選択する。
- BookmarkのURLは`http`/`https`のみ許可し、タイトル未入力時はホスト名を使う。設定ページで追加・タイトル変更・所属フォルダー変更・削除し、サイドバーから開く。フォルダー削除時は中のBookmarkを未分類に移す。

## Invariants

- app idは重複しないkebab-case。
- Local AppのURLはloopback hostを指し、URLのportと`port`値は一致する。
- Local Appのportは重複しない。
- Web AppのURLは外部HTTPSを指し、portとlocal pathを持たない。
- status確認自体はprocessを変更しない。Start/Stopは別の明示的な操作である。

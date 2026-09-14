# Domain

## Glossary

- **App Definition**: `apps.json`に登録されたローカル開発アプリの静的情報。
- **Running**: 指定portへのTCP接続が制限時間内に成功した状態。
- **Stopped**: 指定portへのTCP接続が失敗またはtimeoutした状態。
- **Open**: RunningアプリのローカルURLを新しいbrowser tabで開く導線。

## Entities

- Local App: id、name、description、category、URL、port、local path、任意のrepository URLを持つ。
- Runtime Status: app id、Running / Stopped、確認時刻、応答時間を持つ一時的な観測値。

## States

- `running`
- `stopped`

## Business Rules

- statusは15秒ごと、および手動Refreshで更新する。
- Open操作はRunning時だけ有効にする。
- repository URL未設定時はGitHub操作をdisabledにする。
- 名前検索は大文字・小文字を区別しない。
- categoryは登録済み値から選択する。

## Invariants

- app idは重複しないkebab-case。
- app URLはloopback hostを指し、URLのportと`port`値は一致する。
- status確認はアプリのprocessを開始、停止、変更しない。

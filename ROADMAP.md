# Roadmap

## Now — v1

- 登録アプリを見る。
- Running / Stoppedを確認する。
- 起動中アプリとGitHub Repositoryを開く。
- 名前検索とcategory filterを使う。

## Now — v2（最小連携）

- 設定済みローカルアプリのStart / Stopを追加。Restartは未実装。
- Hub再起動をまたぐ所有管理と実機検証は今後の課題。

## Later

- マイレイアウトのブロック対象をウィジェットへ拡張する。ウィジェットの種類・データ取得・更新頻度は機能追加時に設計する。

- v3: 簡易ログ。
- v4: Git Status。
- v5: Recent Commits。

## Planned — デスクトップアプリ化

ブラウザで利用する現在のLocal Dev Hubを、将来デスクトップアプリとして利用できる形にする。実施予定だが、着手時期、採用技術、v3以降の機能との順序は未決定。

- まず登録済みアプリのStart/Stopを実機で検証する。
- Next.jsサーバーをアプリに同梱する方式と、画面を再利用してローカル操作をデスクトップ側へ移す方式を比較し、配布・起動・更新方法を決める。
- TCP状態確認、設定読み込み、Start/Stop、ファビコン取得の実行場所とUIとの通信境界を定める。
- Hub再起動後のプロセス所有情報、アプリ終了時の子プロセス、Windows依存コマンドの扱いを決める。
- ローカルAPIへのアクセス制限、外部URLを開く方法、設定ファイルとローカルパスの配布時の扱いを確認する。
- 選んだ方式で一覧・更新・検索・Open・Start/Stopの一連の操作を実機検証する。

現状の設計上の前提と移行時の注意点は[ARCHITECTURE.md](ARCHITECTURE.md)を参照する。

## Deferred / Won't Do in v1

- log streaming。
- Git status / log / 自動操作。
- DB、認証、ユーザー管理、クラウド同期。
- Docker、Kubernetes、CPU / RAM監視。

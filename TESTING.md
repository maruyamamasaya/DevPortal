# Testing

## Testing Strategy

設定境界をUnit testし、静的検査とproduction buildでServer / Client境界とRoute Handlerを検証する。実際のlocal app状態はbrowserで手動確認する。

## Validation Matrix

| 変更タイプ | 必要な検証 |
| --- | --- |
| app設定・検証 | Unit test、typecheck |
| status checker・API | typecheck、build、manual verification |
| UI・CSS | lint、typecheck、build、browser verification |
| Webメディア取得 | ファビコン・プレビューAPIの画像型、キャッシュ更新、browser verification |
| Web・Local定期取得 | Task Schedulerの30分trigger・実行結果、Web接続状態API、起動中LocalのPNGと停止中の画像維持 |
| 起動script | Windowsでの手動起動 |
| Start/Stop | 同一Origin API、外部起動アプリのStop拒否、Hub所有アプリの起動・停止を実機確認 |

## Fast Validation

```bash
npm run lint
npm run typecheck
npm test
```

## Full Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Manual Verification

- `http://127.0.0.1:8790`が表示される。
- LocalのRunning / Stopped、Web App件数、summary、使用中portが整合する。
- 15秒以内の自動更新と手動Refreshが動く。
- 検索、category filter、Local/Web別のOpen、GitHubのenabled状態を確認する。
- light / dark、desktop / narrow viewportで読みやすい。
- マイレイアウトで追加・移動・幅高さ変更・衝突拒否・行列追加・再読み込み後の保存を確認する。
- アイコン表示と共通サイドバーの切り替えをdesktop / narrow viewportで確認する。
- Web Appのファビコンとプレビューが画像として表示され、サイト側にファビコンがない場合は頭文字へ戻ることを確認する。

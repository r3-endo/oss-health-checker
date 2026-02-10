# Backend Snapshot Factory Review (2026-02-10)

対象: `backend/src/application/services/snapshot-factory.ts` と関連テスト
観点: 純粋関数性、変更耐性（堅牢性/クリーンコード）、セキュリティ

## Findings

### 1. Medium - 月加算ロジックが月末日で意図しない閾値ずれを起こす
- 参照: `backend/src/application/services/snapshot-factory.ts:12`
- `setUTCMonth` は月末日ケースで日付オーバーフローするため、しきい値判定が数日ずれる可能性がある。
- 例: `2025-08-31 + 6 months` は実質 `2026-03-03` 相当となり、想定より stale 判定が遅れる。
- 仕様変更や閾値調整時に予期しない回帰を生みやすい。

### 2. Medium - `Object.freeze` でも `Date` は可変参照のまま返る
- 参照: `backend/src/application/services/snapshot-factory.ts:66`
- `lastCommitAt`, `lastReleaseAt`, `fetchedAt` は `Date` インスタンス参照をそのまま返している。
- 呼び出し元が同一 `Date` オブジェクトを後から変更するとスナップショット値が変化しうる。
- 不変モデルを意図している設計に対して、実質的な純粋性/堅牢性が弱まる。

## Security

- この差分範囲で、直接的なSQLインジェクション/コマンドインジェクション/SSRF経路は見当たらない。
- 外部入力を直接実行系APIへ渡す処理はなく、重大なセキュリティ欠陥は現時点で未検出。

## Quality Assessment

- `evaluateWarningReasons` / `mapStatusFromWarningCount` への分離は責務分離として良い。
- 一方で日時境界と可変参照の2点により「変更に強い」状態としては改善余地がある。

## Verification

- `bun run test`: 成功（`17 passed`）
- `bun run typecheck`: 成功

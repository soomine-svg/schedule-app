# H.P. Canvas 開発セッション要約
# 2026-03-12（前半＋後半）

## プロジェクト基本情報
- アプリ名: H.P. Canvas
- URL: https://soomine-svg.github.io/schedule-app/schedule_app.html
- リポジトリ: https://github.com/soomine-svg/schedule-app
- ファイル: `schedule_app.html`（1ファイル構成）
- ローカル最新: `/home/claude/schedule_app.html`（3674行）
- 前セッション要約: /mnt/transcripts/2026-03-11-19-30-44-hp-canvas-schedule-optimization.txt

## 主要定数（変更なし）
```js
HOME_ADR  = "宮崎県都城市南鷹尾町33-11"
HOME_POS  = {lat:31.7150, lng:131.0800}
DAY_START = 8*60+30      // 08:30
FREE_DAY_END = 20*60+15  // 20:15
GEOCODE_KEY  = "AIzaSyC-bIBrdlwdoPvvNgw0miQvfv_Z17AQunM"
STORAGE_KEY  = 'schedule_v2'
FIXED_SHEET_ID = '1VQH-Yaa4-L9XJUn8hZGlBZl6rHuzFNQI4UCXRPLlcDc'
window._fastMode = false
```

---

## 実装・修正内容（前半：計7件）

### [COMPLETED] 1. 案件追加モーダル：時間指定案件の挿入位置修正
**問題:** 時間指定・ピン案件を追加するとスケジュール最下部に配置されていた。
**修正:** `push`→`splice`で`tm`/`pin`の開始時刻基準に正しい位置へ挿入。

### [COMPLETED] 2. 2-opt改善閾値の修正
閾値 `0.5 → 0.01` に変更。2-opt・or-opt両方に適用。わずかな改善も捕捉できるようになった。

### [COMPLETED] 3. addCaseToDayConfirmのtwoOpt引数修正
`freeDayEnd` 引数に誤って `ds.startMin` が渡されていたのを `20*60+15` に修正。

### [COMPLETED] 4. 繰り越し対策・詰め込み強化（4箇所）
- `remaining` を納期昇順ソート（締め切り近い案件が1〜2日目に優先）
- `todayPool` に今日スケジュール可能な案件を全件投入（枝番ごと1件制限を廃止）
- 当日締切案件（`d2 ≤ 今日`）を枝番制限無視で強制投入
- `fillFree` の残り時間内に収まる最近傍の短い案件を探して配置

### [COMPLETED] 5. timedAvailのソート改善
時刻優先（30分以上の差なら時刻順）→同時刻帯なら納期優先に変更。

### [COMPLETED] 6. Distance Matrix API（道路距離）の確認
前セッションで実装済みであることを確認。キャッシュ・UI・prefetch含む全機能が既存実装済み。

### [COMPLETED] 7. カレンダー翌日またぎ予定のバグ修正
**問題:** 翌日またぎ予定（例: 17:00〜翌7:45）で `endMin` が異常値になりブロックが機能しなかった。
**修正1（`gcalGetBlocks`）:** `endMin < startMin` または `endMin===0` → `24*60` に丸める。
**修正2（`buildAllCore`）:** 15:00以降に始まる翌日またぎブロックは `effectiveDayEnd` を前倒し。

---

## 実装・修正内容（後半：計7件）

### [COMPLETED] 8. GPS現在地バグ修正
**問題:** 「📍 現在地（GPS取得）」を選んでもスケジュールが自宅起点になる。
**原因:** `buildAllCore`内で `day1Adr = HOME_ADR` のまま。`day1Pos` にGPS座標を入れていたが使われていなかった。
**修正:** `day1Adr = "__GPS__"` に変更。`__GPS__` フラグは全距離計算関数で既に対応済み。

### [COMPLETED] 9. 完了→一覧戻し時のvisitLogカウント修正
**問題:** 案件を完了後に一覧に戻すと訪問記録のカウントが減らない。
**修正:** `restoreCase` に `visitLog` の count-- ロジックを追加。count=0になったらエントリ自体を削除。`renderVisitLog()` も呼んで即反映。

### [COMPLETED] 10. スケジュール並べ替えドラッグ＆ドロップ実装
- 各 `tl-row` に `data-dayidx`・`data-itemidx` を追加
- `☰`（ハンバーガーアイコン）のドラッグハンドルを追加
- `touchstart`/`touchmove`/`touchend` イベントをdocumentレベルで捕捉
- ドラッグ中は半透明ゴースト表示＋挿入先に青ライン
- `reorderSchedDirect(dayIdx, fromIdx, toIdx)` 関数を新規追加
- ドロップ後に時刻を先頭から自動再計算

### [COMPLETED] 11. カレンダー翌日またぎ予定の2日目ブロック生成
**問題:** カサノダ（3/13 17:00〜3/14 12:45）が3/14に「長崎滞在中」ブロックとして現れず、13:03に都城案件が配置されていた。
**原因:** `gcalFetchEvents` が開始日にしか予定を登録していなかった。
**修正:** `map` → `reduce` に変更し、翌日またぎ予定の終了日に `0:00〜終了時刻` の継続ブロック（`isCarryOver: true`）を自動生成。Geocoding座標も `isCarryOver` エントリにコピー。

```js
if(endDate !== startDate){
  arr.push({ ..., start: new Date(endDate+'T00:00:00'), end: endDt, dateStr: endDate, isCarryOver: true });
}
```

### [COMPLETED] 12. カレンダー会場への移動時間をDM APIで計算
**問題:** カレンダー会場への移動時間が未考慮で不正な案件配置が発生。
**修正1（effectiveDayEnd）:**
- `location` がある場合: DMキャッシュ優先 → なければ `直線距離×1.5÷80km/h`
- `safeEnd = ブロック開始 - 移動時間 - 余裕30分`
- 実働時間ゼロ（`effectiveDayEnd <= effectiveStartMin + 15`）→ 全件翌日繰越し＋メッセージ表示

**修正2（距離計算式）:** `直線÷60km/h、上限300分` → `直線×1.5÷80km/h、上限なし` に変更。

### [COMPLETED] 13. カレンダー予定の移動時間表示
カレンダー予定欄に `🚗 ○分` を追加表示。出発時刻表示も同じロジックに統一（`🚗 Googleマップ: ○分`）。
DMキャッシュ優先、なければ直線×1.5÷80km/h。

### [COMPLETED] 14. Distance Matrix API を一般道のみに変更
`&mode=driving` → `&mode=driving&avoid=highways`

**注意:** 変更後は「🗑️ 距離キャッシュ」を必ずクリアすること。

---

## 議論・採用しなかった機能

### ルート学習機能（不採用）
例外的な並べ替えの学習・データ不足時の逆効果・古いデータの悪影響などリスクがあるため不採用。まず Distance Matrix API の精度で様子を見ることに。

### 地図ビュー内でのドラッグ並べ替え（不採用）
パフォーマンス影響・座標精度の可視化・スケジュール再描画との競合リスクがある。現在の機能が整ってきているので追加しない方針に。Googleマップへのリンクは引き続き使用可能。

---

## 主要関数マップ（本セッション関連）

| 関数名 | 変更内容 |
|---|---|
| `buildAllCore()` | GPS `day1Adr="__GPS__"` 修正、effectiveDayEnd移動時間考慮、実働ゼロ繰越し、remainingソート、todayPool全件投入 |
| `scheduleDay(...)` | fillFree残り時間活用、timedAvailソート改善 |
| `twoOptImprove(...)` | 閾値0.01に修正 |
| `addCaseToDayConfirm()` | splice挿入、freeDayEnd引数修正 |
| `gcalGetBlocks(dateStr)` | 翌日またぎendMin丸め |
| `gcalFetchEvents()` | isCarryOverエントリ自動生成、座標コピー |
| `restoreCase(i)` | visitLog count-- 追加 |
| `renderDay(...)` | カレンダー予定欄🚗移動時間追加、出発時刻DM対応 |
| `reorderSchedDirect(dayIdx, fromIdx, toIdx)` | 新規追加（ドラッグ用） |
| `fetchDistanceMatrix()` | `avoid=highways` 追加 |
| タッチドラッグ全体（IIFE） | 新規追加 |

---

## 既知の注意点（累積）
- `_dayScheds` は `buildAllCore` 実行時にリセット
- 2-optはタイムド・ピン案件を固定し自由案件のみ入れ替え（閾値0.01）
- フォールバック座標 `31.9115, 131.4237`（橘通）の案件はARルックアップで自動修正
- Distance Matrix APIキャッシュ: `dm_cache_v1`（localStorage）、住所変更・設定変更時はクリア
- `avoid=highways` 変更後は必ず「🗑️ 距離キャッシュ」クリアが必要
- カレンダー会場への移動時間計算はカレンダー予定に「場所」が設定されている場合のみ有効
- `isCarryOver` エントリは `gcalGetBlocks` のdateStrフィルタで正しく拾われる
- ドラッグハンドル（☰）のみドラッグ開始、▲▼ボタンも引き続き使用可能
- GitHubへのpushはブラウザのドラッグ&ドロップで行う（APIネットワーク制限のため）

## PENDING（要GitHub push）
- ローカル `/home/claude/schedule_app.html`（3674行）が最新
- 本セッション全変更（上記1〜14）がGitHubに未反映
- アップロード先: https://github.com/soomine-svg/schedule-app/upload/main
- アップロードするファイル: `schedule_app.html`、`session_summary_2026-03-12_full.md`

# H.P. Canvas 引き継ぎ要約
# 最終更新: 2026-03-17

## 基本情報
- アプリ: H.P. Canvas（訪問スケジュール管理）
- URL: https://soomine-svg.github.io/schedule-app/schedule_app.html
- GitHub: https://github.com/soomine-svg/schedule-app
- 構成: schedule_app.html 1ファイル（3953行）
- データ保存: localStorage(schedule_v2) + Googleスプレッドシート同期

## 主要定数
```js
HOME_ADR = "宮崎県都城市南鷹尾町33-11"
HOME_POS = {lat:31.7150, lng:131.0800}
GEOCODE_KEY = "AIzaSyC-bIBrdlwdoPvvNgw0miQvfv_Z17AQunM"
STORAGE_KEY = 'schedule_v2'
FIXED_SHEET_ID = '1VQH-Yaa4-L9XJUn8hZGlBZl6rHuzFNQI4UCXRPLlcDc'
DAY_START = 8*60+30  // 08:30
FREE_DAY_END = 20*60+15  // 20:15
```

## TM_RANGE（時間指定）
```js
"平日":[510,1215], "平日6-7":[360,420], "平日7-8":[420,480],
"平日6-8":[360,480], "平日8-10":[480,600], "平日12-14":[720,840],
"平日12-17":[720,1020], "平日14-16":[840,960], "平日16-18":[960,1080],
"平日17-20":[1020,1200], "平日18-20":[1080,1200], "平日20-22":[1200,1320],
"休日":[510,1215], "休日6-7":[360,420], "休日8-10":[480,600],
"休日12-17":[720,1020], "休日17-20":[1020,1200]
```
※「平日」「休日」（全日指定）はfreePoolとして扱う（timedAvailに入らない）

## スケジューリング仕様

### 時間指定案件の処理順序
1. ピン案件（最優先・timedAvail先頭）
2. 具体的な時間窓案件（平日6-7〜平日20-22）
3. 全日指定（平日・休日）→ freePoolで処理

### 早朝案件（wEnd<=8:30）
- curから窓内到着可能 → 自然な時刻で配置
- 間に合わない → wStart-trvToTcで逆算（早朝出発）
- earlyDepart<0 または earlyDepart<cur → スキップ（翌日繰越）

### 枝番ルール
- baseId("3319-1") → "3319"
- consumedIds・notDone は完全ID（c.id）で管理
- placed は baseId・完全ID 両方登録
- 1日1baseID原則（todayPool構築時）

### Distance Matrix API
- avoidHighways: true（一般道のみ）
- キャッシュ: localStorage "dm_cache_v1"
- 処理順: カレンダー取得→prefetchCalendarVenues()→全件DM→buildAllCore()
- フォールバック: 直線距離×1.5÷80km/h

### カレンダー連携
- isCarryOver: 翌日またぎ予定の終了日に0:00〜終了時刻のブロック自動生成
- effectiveStartMin: isCarryOverブロック終了＋帰宅移動時間＋15分
- effectiveDayEnd: 夕方ブロック開始−会場移動時間−30分

## 重要な修正履歴（バグ対策）

| 修正内容 | 該当関数 |
|---|---|
| km()にnullチェック追加（座標なしでクラッシュ防止） | km() |
| trv()にtry-catch追加 | trv() in scheduleDay |
| 枝番消滅バグ修正（consumedIdsを完全IDに） | scheduleDay, buildAllCore |
| placed管理を完全IDに変更 | place() in scheduleDay |
| 「平日」全日指定をfreePoolに（ピン案件より先行問題解消） | scheduleDay |
| ピン案件をtimedAvail先頭でソート | timedAvail.sort |
| 早朝案件の不可能配置防止（earlyDepart<cur） | scheduleDay |
| 今からモード選択時にGPS自動取得 | setMode() |
| 自宅着時刻をサマリー・タイムラインに表示 | renderDay() |

## 主要関数一覧
- buildAll(): カレンダー取得→DM取得→buildAllCore()
- buildAllCore(): 3日分スケジュール生成
- scheduleDay(): 1日分スケジュール生成
- prefetchCalendarVenues(): カレンダー会場↔自宅のDM優先取得
- tmColorTheme(tm): 時間帯別カラーテーマ返す
- twoOptImprove(): 自由案件の2-opt最適化
- renderDay(): 1日分HTML生成（帰宅行・自宅着含む）
- setMode(m): モード切替（now時にGPS自動起動）
- gcalFetchEvents(): Googleカレンダー取得・isCarryOver生成

## 注意事項
- GitHubへのpushはブラウザのD&Dで行う（APIネットワーク制限）
- スマホ追加案件はPC側で🔄ボタン押して反映
- DM設定変更後は「🗑️ 距離キャッシュ」クリア必要
- 座標未取得案件は「座標未取得を一括再取得」で取得推奨
- 別チャットへの引き継ぎ: この要約md＋schedule_app.htmlを両方アップ

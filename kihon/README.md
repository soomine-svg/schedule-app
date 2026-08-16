# KIHON — 動ける身体づくり

https://soomine-svg.github.io/schedule-app/kihon/

週2回・25分から始める伴走型トレーニングPWA。単体HTML、外部ライブラリなし・通信なし。
記録は端末の `localStorage['kihon.v1']` にだけ入る。

**これは配信用のコピー。** 開発とドキュメントの本体は `soomine-svg/hpcanvas-os` の `apps/kihon/`
（設計の理由、プログラムの中身、データ契約、テストはそちらの README に書いてある）。
直すときは本体を直して、ここへコピーすること。

## 更新するとき

`sw.js` の `CACHE` の版を必ず上げる（`kihon-v1` → `kihon-v2`）。上げないと古いHTMLが出続ける。
更新してもデータは消えない（localStorage はHTMLの差し替えと無関係）。

## 献立帳（Prep）との関係

同じ `soomine-svg.github.io` オリジンなので、**両アプリは localStorage を共有している**。
パスは無関係で、リポジトリが違っても同じ。よって将来の連携は書き出し／読み込みを経由せず直結できる。

- KIHON のキー … `kihon.v1`
- Prep のキー … `kondate_cho_v1` / `kondate_cho_api_key`

守ること：

1. **`localStorage.clear()` を絶対に使わない**（他のアプリのデータまで消える）。消すときは自分のキーだけ
2. 新しいアプリを足すときも、キーは必ずアプリ名で名前空間を切る
3. **片方だけに独自ドメインを当てない**。オリジンが変わると連携もデータも切れる

データは日付キー（`days["YYYY-MM-DD"]`）で揃えてある。食事側は同じ日付キーの下に `meals` を足せばよい。

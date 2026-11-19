# Live Cam Map（プロトタイプ）

世界中のライブカメラを一枚の地図に表示する、GitHub Pages で公開できる静的サイトです。
[tamatabi.world](https://tamatabi.world/ja/) のような「地図＋ピン＋その場で再生」の体験を、サーバーなしで再現しています。

## 機能

- Leaflet + OpenStreetMap の地図（APIキー不要）
- 地図画像の切り替え（右上のレイヤーコントロール）：標準 / 淡色（CARTO）/ ダーク（CARTO）/ 地形（OpenTopoMap）/ 航空写真（Esri）/ 地理院地図（国土地理院）。ピンはそのままに絵柄だけ変わります。各タイルのクレジット表記は Leaflet が自動で切り替えます
- ピンのクラスタ表示、カテゴリ絞り込み、名前・場所検索
- クリックで YouTube 公式埋め込みプレーヤーを表示
- 「ランダムで旅する」ボタン
- スマホ対応レイアウト

## GitHub Pages で公開する手順

1. GitHub で新しいリポジトリを作る（例：`live-cam-map`）
2. このフォルダの中身をすべてアップロードする（`index.html` がルートに来る形）
3. リポジトリの **Settings → Pages** で、Source を `Deploy from a branch`、Branch を `main` / `(root)` にする
4. 数分待つと `https://<ユーザー名>.github.io/live-cam-map/` で公開されます

ローカル確認は、フォルダで簡易サーバーを立てるのが確実です：

```bash
python3 -m http.server 8000
# http://localhost:8000 を開く
```

## カメラを追加・差し替える

`data/cameras.json` に1件追加するだけです。

```json
{
  "id": "unique-id",
  "name": "表示名",
  "place": "場所",
  "lat": 35.6595,
  "lng": 139.7005,
  "category": "街",
  "description": "ひとこと説明",
  "youtubeVideoId": "動画ID",
  "youtubeChannelId": ""
}
```

- 固定のライブ配信なら `youtubeVideoId`（`watch?v=` の後ろの文字列）
- チャンネルの「現在のライブ」を常に表示したいなら `youtubeChannelId` を入れ、`youtubeVideoId` は空にする
- どちらのIDも未定なら両方空にして `youtubeSearch` に検索ワードを入れると、YouTube検索へのリンクになります（プロトタイプ内の「サンプル」バッジ地点がこの形式です）

## サンプルデータについて

- 渋谷の4地点は、実際に確認できた YouTube 配信ID／チャンネルIDを使用しています
- それ以外は場所と座標のサンプルです。配信は再開・終了でIDが変わることがあるため、公開前に各配信元で最新のIDを確認してください（元サイトの tamatabi.world も毎日チェックして入れ替えているそうです）
- 映像の著作権は各チャンネルに帰属します。公式埋め込みプレーヤーの範囲で利用してください

## 構成

```
index.html          画面
style.css           デザイン
app.js              地図・検索・プレーヤーの処理
data/cameras.json   カメラデータ（ここだけ編集すればOK）
.nojekyll           GitHub Pages 用
```

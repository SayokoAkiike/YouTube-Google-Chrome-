# YouTube Subtitle Layout Helper

YouTube の字幕レイアウトをブラウザ内だけで調整する Chrome 拡張機能です。
ドラッグによる位置移動・フォントサイズ・行間・背景透明度の変更、および二言語字幕表示に対応しています。

## 特徴

- 字幕のフォントサイズ・行間・背景透明度を調整
- 字幕のドラッグ移動（位置はローカルに保存）
- 表示行数の上限を 1〜3 行に制限
- ON/OFF の切り替え
- 設定は Chrome Storage API でローカル保存
- オプション：Google Translate による二言語字幕表示

## 技術的なポイント

- Manifest V3 準拠
- CSS Custom Properties をルート要素に注入することで、JS と CSS の責務を分離
- `MutationObserver` で YouTube の SPA ページ遷移後も字幕コンテナを追跡
- 翻訳リクエストはデバウンス処理（200ms）でレート制限に対応
- `defaultSettings.js` を単一の真実の源として `content.js` と `popup.js` の両方で共有

## ファイル構成

```
.
├── manifest.json          # 拡張機能の定義（Manifest V3）
└── src/
    ├── defaultSettings.js # 設定のデフォルト値（共有モジュール）
    ├── content.js         # YouTube ページへの DOM 操作・CSS 変数注入・ドラッグ処理
    ├── content.css        # 字幕スタイル上書き（CSS Custom Properties 使用）
    ├── popup.html         # 設定用ポップアップ UI
    ├── popup.js           # ポップアップの操作・Chrome Storage 読み書き
    └── popup.css          # ポップアップのスタイル
```

## 権限

`storage` のみ。音声・動画・字幕データの収集・外部サーバーへの送信は行いません。

## インストール方法

1. このリポジトリをクローンまたはダウンロードする
2. Chrome で `chrome://extensions/` を開く
3. 右上の「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、リポジトリのルートフォルダを選択する

ビルド不要です。Node.js・npm は不要です。

## 翻訳機能について

Google Translate の非公式エンドポイントを使用しています。
過剰なリクエストによりレート制限される場合があります。
デフォルトで無効です。ポップアップ設定から有効にできます。

## 注意事項

YouTube のページ構造変更により動作しなくなる可能性があります。
非公式ツールのため自己責任でご使用ください。

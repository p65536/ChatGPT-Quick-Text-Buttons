# ChatGPT Quick Text Buttons

[English README is here.](./README.md)

---

## 概要

ChatGPTのチャット画面に「定型文クイック挿入ボタン」を追加する Tampermonkey 用ユーザースクリプトです。

---

## 特徴

* 定型文（テキストスニペット）をワンクリックで入力欄に挿入
* 用途ごとに複数のボタンセットを切り替え可能
* 追加ライブラリ不要（純粋なJavaScript／jQuery非依存）
* サンプル定型文ファイル付属。カスタマイズも簡単（json形式）

---

## 使い方・操作例

### 1. メインツールバーのボタン

画面右上に「クイックテキスト追加」（✎）と「設定」（⚙️）のアイコンが追加されます。

![メインツールバー（クイックテキスト追加・設定ボタン）](docs/cqtb_001.png)

---

### 2. クイックテキストの挿入

✎アイコンにカーソルを重ねると、登録済みテキストのボタン一覧が表示されます。
挿入したいテキストをクリックすると、チャット入力欄に自動で追加されます。

![クイックテキストの選択と挿入](docs/cqtb_002.png)

---

### 3. 挿入結果の確認

選択したテキストが入力欄の末尾に追加されます。
あとは通常通り送信してください。

![入力欄にテキストが挿入された様子](docs/cqtb_003.png)

---

### 4. 設定画面でカスタマイズ

⚙️アイコンをクリックすると、ボタンに登録するテキストをJSON形式で自由に編集できます。
サンプル定義を参考にして、ご自身の用途に合わせてカスタマイズしてください。

![設定画面：JSON形式で定義を編集](docs/cqtb_004.png)

---

## インストール方法

1. [Tampermonkey 拡張](https://www.tampermonkey.net/) をお使いのブラウザにインストール
2. このリポジトリの最新版スクリプト
   [`ChatGPT Quick Text Buttons.user.js`](./ChatGPT%20Quick%20Text%20Buttons.user.js) をダウンロード
3. Tampermonkey のダッシュボードで「新規スクリプト作成」→ スクリプト内容を貼り付けて保存
   または `.user.js` ファイルを Tampermonkey にドラッグ＆ドロップ
4. 必要に応じてサンプル定型文ファイル（後述）も利用可能

---

## 更新方法

1. Tampermonkey のダッシュボードから本スクリプトを開く
2. 最新版 [`ChatGPT Quick Text Buttons.user.js`](./ChatGPT%20Quick%20Text%20Buttons.user.js) の内容で全文置換
3. スクリプトを保存 (Ctrl+S)

---

## 動作確認環境

* Firefox（最新版）＋Tampermonkeyで動作確認済み
* Chrome, Edge などの主要ブラウザでも同様に動作するはずです（未検証）

---

## サンプル定型文

`samples` フォルダに日本語・英語のサンプル定型文ファイルを用意しています（`sample_texts_ja.json`, `sample_texts_en.json`）。
必要に応じて設定画面で内容をコピペして利用してください。

jsonの基本構造は以下の通りです。
実際に使えるサンプル例は [`samples`](samples) ディレクトリを参照してください。

```json
{
  "Button1": [
    "Sample text 1",
    "Sample text 2"
  ],
  "Button2": [
    "Line 1 of text\nLine 2 of text\nLine 3 of text",
    "Another snippet"
  ],
  "Button3": [
    "If you want to add your own input after a fixed phrase, add a line break at the end.\n\n"
  ]
}
```

---

## 注意事項

* **自動アップデート機能はありません。**
  新バージョンが公開された際は、手動でスクリプトを差し替えてください。

---

## ライセンス

MIT License

---

## 作者

* [p65536](https://github.com/p65536)

---

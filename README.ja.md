# HAR Timing Brief Lite

HARファイルから、リクエスト数・HTTPエラー数・通信時間などのJSON要約を作る無料ツールです。

## 最初の実行

Node.js 20以上を用意し、このフォルダで次を実行します。追加パッケージのインストールは不要です。

```sh
node har-timing-lite.mjs examples/sample.har
```

サンプルは合成データです。自分のHARファイルを使う場合:

```sh
node har-timing-lite.mjs capture.har
```

入力ファイルを上書きしません。ネットワーク送信・テレメトリー・アカウント登録はありません。

## 数値の読み方

- requests: リクエスト数
- httpErrors: HTTPステータス400以上の件数
- medianDurationMs / p95DurationMs: 計測できた通信時間の中央値 / 95パーセンタイル（ミリ秒）
- unknownDurations: 通信時間が不明な件数。不明値は0扱いしません。
- knownResponseBodyBytes: 分かっているレスポンス本文サイズの合計

URL・ヘッダー・Cookie・本文は要約に含めませんが、通信時間・サイズ・件数は残ります。共有前に内容を確認してください。匿名性を保証するものではありません。

HAR 1.2、最大32 MiB・100,000エントリーに対応。ページ全体の読み込み時間やCore Web Vitalsを測るツールではありません。

有料版はHTMLレポート、2キャプチャの比較、最大20ファイルの一括処理を追加します。販売ページ: https://hartimingcodex.gumroad.com/l/har-timing-brief （本体19米ドル、税別）。無料版の利用に購入は不要です。

# 画面録画シナリオ

## シナリオ1: 基本的な使用方法 (ui-demo.gif)

### 準備
- 開発サーバー起動: `npm run dev`
- ブラウザで http://localhost:3000 を開く
- 画面を1200x800程度にリサイズ

### 録画手順 (約20秒)
1. **開始画面** (2秒)
   - アプリのタイトルと入力フォームが見える状態

2. **映画タイトル入力** (3秒)
   - 「となりのトトロ」をゆっくりタイピング

3. **ボタンクリック** (1秒)
   - 「トリビア生成」ボタンクリック

4. **ローディング表示** (3秒)
   - ローディング状態を表示

5. **結果表示** (6秒)
   - トリビアカード表示
   - ホバーエフェクト確認

6. **制作情報展開** (5秒)
   - 「制作情報を見る」ボタンクリック
   - 詳細情報表示

## シナリオ2: 提案機能デモ (suggestion-demo.gif)

### 準備
- 同上

### 録画手順 (約25秒)
1. **開始画面** (2秒)
   - 入力フォームが空の状態

2. **曖昧なタイトル入力** (3秒)
   - 「スターウォーズ」をタイピング

3. **ボタンクリック** (1秒)
   - 「トリビア生成」ボタンクリック

4. **ローディング** (2秒)
   - ローディング状態

5. **提案リスト表示** (5秒)
   - エラーメッセージと提案リスト表示
   - 提案項目をホバー

6. **提案クリック** (2秒)
   - 提案の1つ目をクリック

7. **トリビア生成完了** (10秒)
   - 新しいトリビア表示
   - カードエフェクト確認

## 録画技術的な注意事項

### macOSでの録画
```bash
# 画面録画開始（Shift + Cmd + 5）
# 範囲選択 → オプション → マイクOFF → 録画開始

# 録画停止後、mov形式で保存
# デスクトップに「スクリーンレコーディング [日時].mov」として保存される
```

### GIF変換コマンド
```bash
# 高品質変換（推奨）
ffmpeg -i input.mov -vf "fps=12,scale=800:-1:flags=lanczos,palettegen" palette.png
ffmpeg -i input.mov -i palette.png -filter_complex "fps=12,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse" output.gif

# シンプル変換（品質は劣るが簡単）
ffmpeg -i input.mov -vf "fps=12,scale=800:-1" -y output.gif

# 自動スクリプト使用（推奨）
npm run demo:convert input.mov output-name
```

### 最適化
```bash
# ファイルサイズ圧縮
gifsicle -O3 --lossy=80 input.gif -o output-optimized.gif

# さらなる圧縮（品質とのバランス）
gifsicle -O3 --lossy=60 --resize-fit 800x600 input.gif -o output-compressed.gif
```

## 推奨ツール

1. **録画**: macOS標準、OBS Studio、QuickTime Player
2. **変換**: FFmpeg（最高品質）、Gifski、Online Converter
3. **最適化**: Gifsicle、ImageOptim
4. **プレビュー**: VS Code GIF Preview、ブラウザ

## ファイルサイズ目標

- **ui-demo.gif**: 2-5MB以下
- **suggestion-demo.gif**: 3-6MB以下
- GitHubでの表示を考慮して10MB以下を維持
# GIFファイルプレースホルダー

このディレクトリには以下のGIFファイルが配置される予定です：

## ui-demo.gif
![UI Demo Placeholder](https://via.placeholder.com/800x600/f0f0f0/666666?text=UI+Demo+GIF+%E2%80%A2+Coming+Soon)

**内容**: 基本的な使用方法のデモンストレーション
- 映画タイトル入力（「となりのトトロ」）
- トリビア生成プロセス
- 結果表示とインタラクション

## suggestion-demo.gif
![Suggestion Demo Placeholder](https://via.placeholder.com/800x600/f0f0f0/666666?text=Suggestion+Demo+GIF+%E2%80%A2+Coming+Soon)

**内容**: 提案機能のデモンストレーション
- 曖昧な映画タイトル入力（「スターウォーズ」）
- エラーメッセージと提案リスト表示
- 提案からの映画選択とトリビア生成

---

## 作成手順

1. **サーバー起動**
   ```bash
   npm run dev
   ```

2. **ガイド表示**
   ```bash
   npm run demo
   ```

3. **画面録画実行**
   - macOS: `Shift + Cmd + 5`
   - 詳細なシナリオは `recording-scenarios.md` を参照

4. **GIF変換**
   ```bash
   npm run demo:convert ~/Desktop/recording.mov ui-demo
   ```

5. **README更新**
   - GIFファイル配置後、このファイルを削除
   - READMEの画像リンクが正常に表示されることを確認
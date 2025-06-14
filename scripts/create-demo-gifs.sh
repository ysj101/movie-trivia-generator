#!/bin/bash

# Demo GIF作成スクリプト
# 使用方法: ./scripts/create-demo-gifs.sh

echo "🎬 Movie Trivia Generator - Demo GIF作成スクリプト"
echo ""

# 必要なツールの確認
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 が見つかりません。インストールしてください。"
        return 1
    else
        echo "✅ $1 が利用可能です"
        return 0
    fi
}

echo "📋 必要なツールを確認中..."
check_command "ffmpeg" || exit 1
check_command "npm" || exit 1

# ディレクトリ準備
echo ""
echo "📁 ディレクトリを準備中..."
mkdir -p demo
mkdir -p temp

# 開発サーバー起動確認
echo ""
echo "🚀 開発サーバーの状態確認..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ サーバーが起動しています"
else
    echo "⚠️  サーバーが起動していません。以下のコマンドで起動してください："
    echo "   npm run dev"
    echo ""
    echo "サーバー起動後、再度このスクリプトを実行してください。"
    exit 1
fi

# 録画手順の説明
echo ""
echo "📹 録画手順："
echo ""
echo "1. ブラウザで http://localhost:3000 を開いてください"
echo "2. 画面録画を開始してください（macOS: Shift + Cmd + 5）"
echo "3. 以下のシナリオを実行してください："
echo ""
echo "   🎯 シナリオ1 (ui-demo): 基本的な使用方法"
echo "   - 「となりのトトロ」を入力"
echo "   - トリビア生成ボタンクリック"
echo "   - 結果表示確認"
echo "   - 制作情報展開"
echo ""
echo "   🎯 シナリオ2 (suggestion-demo): 提案機能"
echo "   - 「スターウォーズ」を入力"
echo "   - エラーと提案表示確認"
echo "   - 提案の1つをクリック"
echo "   - トリビア生成確認"
echo ""

# 変換処理
convert_to_gif() {
    local input_file=$1
    local output_name=$2
    local scale=${3:-800}
    
    echo "🔄 $input_file を GIF に変換中..."
    
    if [[ ! -f "$input_file" ]]; then
        echo "❌ ファイルが見つかりません: $input_file"
        return 1
    fi
    
    # パレット生成
    ffmpeg -y -i "$input_file" -vf "fps=12,scale=$scale:-1:flags=lanczos,palettegen" temp/palette.png
    
    # GIF生成（filter_complexを使用）
    ffmpeg -y -i "$input_file" -i temp/palette.png -filter_complex "fps=12,scale=$scale:-1:flags=lanczos[x];[x][1:v]paletteuse" "demo/$output_name.gif"
    
    # 最適化（gifsicleが利用可能な場合）
    if command -v gifsicle &> /dev/null; then
        echo "🗜️  GIFを最適化中..."
        gifsicle -O3 --lossy=70 "demo/$output_name.gif" -o "demo/$output_name-optimized.gif"
        mv "demo/$output_name-optimized.gif" "demo/$output_name.gif"
    fi
    
    echo "✅ $output_name.gif が作成されました"
    
    # ファイルサイズ表示
    size=$(ls -lh "demo/$output_name.gif" | awk '{print $5}')
    echo "   ファイルサイズ: $size"
}

echo "録画が完了したら、以下のコマンドでGIFに変換できます："
echo ""
echo "  # ui-demo.gifの作成"
echo "  ./scripts/create-demo-gifs.sh convert ~/Desktop/ui-recording.mov ui-demo"
echo ""
echo "  # suggestion-demo.gifの作成"
echo "  ./scripts/create-demo-gifs.sh convert ~/Desktop/suggestion-recording.mov suggestion-demo"
echo ""

# 変換モードの処理
if [[ "$1" == "convert" ]]; then
    if [[ -z "$2" || -z "$3" ]]; then
        echo "❌ 使用方法: $0 convert <input_file> <output_name>"
        echo "   例: $0 convert recording.mov ui-demo"
        exit 1
    fi
    
    convert_to_gif "$2" "$3"
    
    echo ""
    echo "🎉 GIF作成完了！"
    echo "📍 ファイル: demo/$3.gif"
    echo ""
    echo "🔍 確認してください："
    echo "   open demo/$3.gif"
fi

# クリーンアップ
if [[ -d "temp" ]]; then
    rm -rf temp
fi

echo ""
echo "📖 詳細なシナリオについては demo/recording-scenarios.md を参照してください"
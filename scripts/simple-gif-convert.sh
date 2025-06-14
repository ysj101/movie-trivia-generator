#!/bin/bash

# シンプルなGIF変換スクリプト
# 使用方法: ./scripts/simple-gif-convert.sh input.mov output-name [scale]

if [[ $# -lt 2 ]]; then
    echo "使用方法: $0 <input_file> <output_name> [scale]"
    echo "例: $0 recording.mov ui-demo 800"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_NAME="$2"
SCALE="${3:-800}"

if [[ ! -f "$INPUT_FILE" ]]; then
    echo "❌ ファイルが見つかりません: $INPUT_FILE"
    exit 1
fi

echo "🎬 GIF変換開始..."
echo "📁 入力: $INPUT_FILE"
echo "📁 出力: demo/$OUTPUT_NAME.gif"
echo "📏 サイズ: ${SCALE}px幅"

# ディレクトリ作成
mkdir -p demo temp

echo ""
echo "🔄 変換中..."

# 高品質変換を試す
if ffmpeg -y -i "$INPUT_FILE" -vf "fps=12,scale=$SCALE:-1:flags=lanczos,palettegen" temp/palette.png 2>/dev/null; then
    echo "✅ パレット生成完了"
    
    if ffmpeg -y -i "$INPUT_FILE" -i temp/palette.png -filter_complex "fps=12,scale=$SCALE:-1:flags=lanczos[x];[x][1:v]paletteuse" "demo/$OUTPUT_NAME.gif" 2>/dev/null; then
        echo "✅ 高品質GIF生成完了"
        METHOD="高品質"
    else
        echo "⚠️  高品質変換失敗、シンプル変換にフォールバック..."
        ffmpeg -y -i "$INPUT_FILE" -vf "fps=12,scale=$SCALE:-1" "demo/$OUTPUT_NAME.gif"
        METHOD="シンプル"
    fi
else
    echo "⚠️  パレット生成失敗、シンプル変換を実行..."
    ffmpeg -y -i "$INPUT_FILE" -vf "fps=12,scale=$SCALE:-1" "demo/$OUTPUT_NAME.gif"
    METHOD="シンプル"
fi

# 最適化
if command -v gifsicle &> /dev/null && [[ -f "demo/$OUTPUT_NAME.gif" ]]; then
    echo "🗜️  最適化中..."
    gifsicle -O3 --lossy=70 "demo/$OUTPUT_NAME.gif" -o "demo/$OUTPUT_NAME-optimized.gif"
    if [[ -f "demo/$OUTPUT_NAME-optimized.gif" ]]; then
        mv "demo/$OUTPUT_NAME-optimized.gif" "demo/$OUTPUT_NAME.gif"
        echo "✅ 最適化完了"
    fi
fi

# 結果表示
if [[ -f "demo/$OUTPUT_NAME.gif" ]]; then
    SIZE=$(ls -lh "demo/$OUTPUT_NAME.gif" | awk '{print $5}')
    echo ""
    echo "🎉 変換完了！"
    echo "📍 ファイル: demo/$OUTPUT_NAME.gif"
    echo "📏 ファイルサイズ: $SIZE"
    echo "🎨 変換方式: $METHOD"
    echo ""
    echo "🔍 確認: open demo/$OUTPUT_NAME.gif"
else
    echo "❌ 変換に失敗しました"
    exit 1
fi

# クリーンアップ
rm -rf temp

echo ""
echo "✨ 完了！"
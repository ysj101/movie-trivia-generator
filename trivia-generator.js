require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

class TriviaGenerator {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateTriviaFromProduction(productionText, movieTitle) {
    const prompt = `
映画「${movieTitle}」の制作情報から、面白い映画トリビアを生成してください。

以下の制作情報を基に：
${productionText}

要求事項：
1. 「●●という裏話があります！」の形式で出力
2. 3-4行程度で、興奮できるような内容
3. 最も興味深く、驚きのある内容を1つだけ厳選
4. 番号なし、リスト形式なしで1つのトリビアのみ
5. 引用符号（[数字]）は除外して読みやすくする
6. 読者が「えー！知らなかった！」と思うような最高の驚きの要素を含める

例：
新海誠監督は当初「夢と知りせば」というタイトルを考えていたが、締切間近になって急遽方針転換！
NHKラジオの名作と同じタイトル「君の名は。」を使うことに決めた、という裏話があります！
実は最初は先行作品とのタイトル被りを嫌がっていたのに、最終的に「誰かにアクセスしやすいタイトル」として採用したなんて驚きです！

このような形式で、制作情報から面白いトリビアを抽出してください。
`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating trivia:', error);
      throw error;
    }
  }
}

async function generateMovieTrivia(movieTitle, apiKey) {
  const { scrapeMovieProduction } = require('./scrape-movie-production');
  
  try {
    console.log(`映画「${movieTitle}」の制作情報を取得中...`);
    
    // 制作情報を取得
    const productionInfo = await scrapeMovieProduction(movieTitle);
    
    if (!productionInfo || productionInfo.includes('制作セクションの内容が見つかりませんでした')) {
      console.log('制作セクションが見つかりませんでした。');
      return null;
    }
    
    console.log('トリビアを生成中...');
    
    // トリビアを生成
    const triviaGenerator = new TriviaGenerator(apiKey);
    const trivia = await triviaGenerator.generateTriviaFromProduction(productionInfo, movieTitle);
    
    return trivia;
  } catch (error) {
    console.error('Error generating movie trivia:', error);
    return null;
  }
}

async function main() {
  const movieTitle = process.argv[2];
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!movieTitle) {
    console.log('使用方法: node trivia-generator.js "映画タイトル"');
    console.log('環境変数 GEMINI_API_KEY を設定してください');
    process.exit(1);
  }
  
  if (!apiKey) {
    console.log('環境変数 GEMINI_API_KEY が設定されていません');
    process.exit(1);
  }
  
  const trivia = await generateMovieTrivia(movieTitle, apiKey);
  
  if (trivia) {
    console.log('\n=== 映画トリビア ===');
    console.log(trivia);
  } else {
    console.log('トリビアの生成に失敗しました。');
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main();
}

module.exports = { TriviaGenerator, generateMovieTrivia };
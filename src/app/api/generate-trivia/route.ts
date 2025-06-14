import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import puppeteer from 'puppeteer';

// Gemini AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// スクレイピング関数
async function scrapeMovieProduction(movieTitle: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const url = `https://ja.wikipedia.org/wiki/${encodeURIComponent(movieTitle)}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const productionSection = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      let productionHeading = null;
      
      for (const heading of headings) {
        const text = heading.textContent?.trim();
        if (text && (text.includes('制作') || text.includes('製作'))) {
          productionHeading = heading;
          break;
        }
      }
      
      if (!productionHeading) {
        return null;
      }
      
      let content = '';
      let currentElement = productionHeading.parentElement?.nextElementSibling;
      
      while (currentElement) {
        // 次のセクションヘッダーに到達したら停止
        if (currentElement.tagName === 'H2' || currentElement.tagName === 'H3') {
          break;
        }
        
        // サブセクションのヘッダー（"作品タイトルについて"など）をチェック
        if (currentElement.tagName === 'DIV' && currentElement.textContent?.includes('[編集]')) {
          const subHeading = currentElement.textContent.replace('[編集]', '').trim();
          // 制作関連のサブセクションのみを含める
          if (subHeading === '作品タイトルについて' || subHeading === '音楽について' || subHeading === 'プロモーションについて') {
            content += `\n${subHeading}\n\n`;
          } else {
            // 制作セクション外のサブセクションに到達したら停止
            break;
          }
        } else if (currentElement.tagName === 'P' || currentElement.tagName === 'UL') {
          const text = currentElement.textContent?.trim();
          if (text && !text.startsWith('[編集]')) {
            content += text + '\n\n';
          }
        }
        
        currentElement = currentElement.nextElementSibling;
      }
      
      return content.trim() || null;
    });
    
    return productionSection;
  } catch (error) {
    console.error('Error scraping movie production:', error);
    return null;
  } finally {
    await browser.close();
  }
}

// トリビア生成関数
async function generateTriviaFromProduction(productionText: string, movieTitle: string) {
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
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating trivia:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { movieTitle } = await request.json();
    
    if (!movieTitle) {
      return NextResponse.json(
        { error: '映画タイトルが指定されていません' },
        { status: 400 }
      );
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key が設定されていません' },
        { status: 500 }
      );
    }
    
    // 制作情報を取得
    const productionInfo = await scrapeMovieProduction(movieTitle);
    
    if (!productionInfo) {
      return NextResponse.json(
        { error: '制作セクションが見つかりませんでした' },
        { status: 404 }
      );
    }
    
    // トリビアを生成
    const trivia = await generateTriviaFromProduction(productionInfo, movieTitle);
    
    return NextResponse.json({
      movieTitle,
      trivia,
      productionInfo
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'トリビアの生成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Movie Trivia Generator API',
    usage: 'POST /api/generate-trivia with { "movieTitle": "映画名" }'
  });
}
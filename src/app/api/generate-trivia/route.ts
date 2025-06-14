import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import puppeteer from 'puppeteer';

// Gemini AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Wikipedia検索関数
async function searchWikipediaMovies(movieTitle: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 適切なUser-Agentを設定
  await page.setUserAgent('Mozilla/5.0 (compatible; MovieTriviaBot/1.0; Educational use)');
  
  try {
    // 複数の検索パターンを試す
    const searchQueries = [
      movieTitle + ' 映画',
      movieTitle + ' (映画)',
      movieTitle,
      movieTitle + ' シリーズ'
    ];
    
    let allSuggestions: Array<{title: string, url: string}> = [];
    
    for (const query of searchQueries) {
      const searchUrl = `https://ja.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}&ns0=1`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      const suggestions = await page.evaluate(() => {
        const results = Array.from(document.querySelectorAll('.mw-search-result-heading a'));
        return results.slice(0, 10).map(link => ({
          title: link.textContent?.trim() || '',
          url: link.getAttribute('href') || ''
        })).filter(item => 
          item.title && 
          (item.title.includes('映画') || 
           item.title.includes('(') || 
           item.title.includes('シリーズ') ||
           item.title.includes('作品') ||
           item.title.includes('エピソード') ||
           // 年代を含む映画タイトル（例：2001年、1990年代など）
           /\d{4}年/.test(item.title) ||
           // 監督や製作会社を含むタイトル
           item.title.includes('監督') ||
           item.title.includes('製作') ||
           // アニメ映画関連
           item.title.includes('劇場版') ||
           item.title.includes('アニメ') ||
           // 邦画・洋画の一般的なパターン
           item.title.includes('の') && (item.title.length <= 50))
        );
      });
      
      allSuggestions = [...allSuggestions, ...suggestions];
      
      if (allSuggestions.length >= 5) break;
    }
    
    // 重複を除去し、映画関連のタイトルを優先
    const uniqueSuggestions = allSuggestions
      .filter((item, index, self) => 
        index === self.findIndex(t => t.title === item.title)
      )
      .sort((a, b) => {
        // 映画関連のキーワードによるスコアリング
        const getScore = (title: string) => {
          let score = 0;
          if (title.includes('映画')) score += 3;
          if (title.includes('(')) score += 2;
          if (title.includes('劇場版')) score += 2;
          if (title.includes('エピソード')) score += 2;
          if (/\d{4}年/.test(title)) score += 1;
          if (title.includes('監督') || title.includes('製作')) score += 1;
          if (title.includes('シリーズ')) score -= 1; // シリーズページは優先度を下げる
          return score;
        };
        
        return getScore(b.title) - getScore(a.title);
      })
      .slice(0, 5);
    
    return uniqueSuggestions;
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    return [];
  } finally {
    await browser.close();
  }
}

// スクレイピング関数
async function scrapeMovieProduction(movieTitle: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 適切なUser-Agentを設定
  await page.setUserAgent('Mozilla/5.0 (compatible; MovieTriviaBot/1.0; Educational use)');
  
  try {
    const url = `https://ja.wikipedia.org/wiki/${encodeURIComponent(movieTitle)}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // ページが存在するかチェック（映画の個別ページかどうかも確認）
    const pageInfo = await page.evaluate(() => {
      const noArticle = document.querySelector('.noarticletext');
      const searchResult = document.querySelector('.mw-search-result');
      const title = document.title;
      const url = window.location.href;
      
      // 映画ページではないページの判定
      const isNotMoviePage = 
        title.includes('シリーズ') || 
        title.includes('曖昧さ回避') || 
        url.includes('シリーズ') ||
        // 概念や一般的な用語のページ
        (!title.includes('映画') && !title.includes('(') && !url.includes('映画') && 
         !title.includes('年') && !title.includes('劇場版'));
      
      return {
        hasNoArticle: !!noArticle,
        hasSearchResult: !!searchResult,
        isNotMoviePage,
        title,
        url
      };
    });
    
    if (pageInfo.hasNoArticle || pageInfo.hasSearchResult || pageInfo.isNotMoviePage) {
      return { error: 'PAGE_NOT_FOUND' };
    }
    
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
    
    if (!productionSection) {
      return { error: 'NO_PRODUCTION_SECTION' };
    }
    
    return { productionSection };
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
    const result = await scrapeMovieProduction(movieTitle);
    
    if (!result) {
      return NextResponse.json(
        { error: 'ページの取得に失敗しました' },
        { status: 500 }
      );
    }
    
    if (result.error === 'PAGE_NOT_FOUND') {
      // 似たようなタイトルを検索
      const suggestions = await searchWikipediaMovies(movieTitle);
      return NextResponse.json(
        { 
          error: '映画が見つかりませんでした',
          suggestions: suggestions.map(s => s.title),
          message: '以下の映画はいかがですか？'
        },
        { status: 404 }
      );
    }
    
    if (result.error === 'NO_PRODUCTION_SECTION') {
      return NextResponse.json(
        { error: 'この映画の制作情報が見つかりませんでした' },
        { status: 404 }
      );
    }
    
    // トリビアを生成
    const trivia = await generateTriviaFromProduction(result.productionSection!, movieTitle);
    
    return NextResponse.json({
      movieTitle,
      trivia,
      productionInfo: result.productionSection!
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
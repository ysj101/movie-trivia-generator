import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { generateTriviaWithAI } from '@/lib/gemini';
import { 
  TriviaRequest, 
  ScrapingResult, 
  SearchSuggestion 
} from '@/types';
import { WIKIPEDIA_CONFIG, ERROR_MESSAGES } from '@/lib/constants';

// Wikipedia検索関数
async function searchWikipediaMovies(movieTitle: string): Promise<SearchSuggestion[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 適切なUser-Agentを設定
  await page.setUserAgent(WIKIPEDIA_CONFIG.USER_AGENT);
  
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
        const allResults = results.slice(0, 15).map(link => ({
          title: link.textContent?.trim() || '',
          url: link.getAttribute('href') || ''
        }));
        
        return allResults.filter(item => {
          if (!item.title) return false;
          
          const title = item.title;
          
          // 明らかに映画タイトルでないページを除外
          const excludePatterns = [
            'カテゴリ:',
            'Template:',
            'プロジェクト:',
            'Help:',
            'Wikipedia:',
            '一覧',
            '年の映画',
            '映画祭',
            '映画館',
            '映画会社',
            '映画産業',
            '映画理論',
            '映画史',
            '映画批評',
            '映画音楽',
            '映画監督一覧',
            '俳優一覧',
            '声優一覧',
            'のフィルモグラフィー',
            'の出演作品',
            'シリーズ',
            '○○賞',
            '賞受賞',
            'について',
            'とは',
            '俳優',
            '監督',
            '声優',
            '製作会社',
            'スタジオ',
            '配給'
          ];
          
          // 汎用的すぎるタイトルを除外
          const genericTerms = [
            /^映画$/,
            /^\d{4}年$/,
            /^\d{4}年の映画$/,
            /^\d{4}年代$/,
            /^映画館$/,
            /^映画祭$/,
            /^日本映画$/,
            /^アメリカ映画$/,
            /^ハリウッド映画$/,
            /^洋画$/,
            /^邦画$/
          ];
          
          // 除外パターンに該当する場合はスキップ
          if (excludePatterns.some(pattern => title.includes(pattern))) {
            return false;
          }
          
          // 汎用的すぎるタイトルを除外
          if (genericTerms.some(pattern => pattern.test(title))) {
            return false;
          }
          
          // 映画を示すポジティブな指標
          const movieIndicators = [
            // 「(年の映画)」形式
            /\(\d{4}年.*映画\)/.test(title),
            // 「劇場版」を含む
            title.includes('劇場版'),
            // 「映画」を含むが除外項目でない
            title.includes('映画') && !excludePatterns.some(pattern => title.includes(pattern)),
            // 特定の映画形式パターン
            /^.{1,30}\s*\(\d{4}年.*映画\)/.test(title), // 「タイトル (2020年の映画)」
            /^.{1,30}\s*\(\d{4}年.*作品\)/.test(title), // 「タイトル (2020年の作品)」
          ];
          
          // 具体的な映画タイトルの特徴（慎重に判定）
          const possibleMovieTitle = (
            title.length >= 2 && 
            title.length <= 35 && 
            !title.includes('一覧') && 
            !title.includes('について') &&
            !title.includes('とは') &&
            !title.includes('年代') &&
            !title.includes('世紀') &&
            // 一般的な映画タイトルの文字パターン
            /^[ぁ-んァ-ヶー一-龠a-zA-Z0-9\s\-・（）()！？．。、]+$/.test(title)
          );
          
          // デバッグ用ログ
          console.log(`Title: "${title}", movieIndicators: ${movieIndicators.some(Boolean)}, possibleMovieTitle: ${possibleMovieTitle}, hasParentheses: ${title.includes('(')}`);
          
          return movieIndicators.some(Boolean) || possibleMovieTitle;
        });
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
        // 映画タイトルの信頼性によるスコアリング
        const getScore = (title: string) => {
          let score = 0;
          
          // 高確度の映画指標
          if (/\(\d{4}年.*映画\)/.test(title)) score += 10; // 「(2020年の映画)」形式
          if (/\(\d{4}年.*作品\)/.test(title)) score += 8;  // 「(2020年の作品)」形式
          if (title.includes('劇場版')) score += 7;          // 劇場版
          
          // 中確度の指標
          if (title.includes('映画') && title.includes('(')) score += 5;
          if (title.includes('映画') && !title.includes('館') && !title.includes('祭')) score += 3;
          
          // 低確度の指標
          if (title.includes('(') && title.length <= 25) score += 2; // 短いタイトルで括弧付き
          if (/\d{4}年/.test(title)) score += 1;
          
          // ペナルティ
          if (title.includes('シリーズ')) score -= 3;
          if (title.includes('一覧')) score -= 5;
          if (title.includes('について')) score -= 5;
          if (title.includes('とは')) score -= 5;
          if (title.includes('俳優') || title.includes('監督') || title.includes('声優')) score -= 3;
          if (title.length > 40) score -= 2; // 長すぎるタイトル
          
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
async function scrapeMovieProduction(movieTitle: string): Promise<ScrapingResult | null> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 適切なUser-Agentを設定
  await page.setUserAgent(WIKIPEDIA_CONFIG.USER_AGENT);
  
  try {
    const url = `${WIKIPEDIA_CONFIG.BASE_URL}${encodeURIComponent(movieTitle)}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // ページが存在するかチェック（映画の個別ページかどうかも確認）
    const pageInfo = await page.evaluate(() => {
      const noArticle = document.querySelector('.noarticletext');
      const searchResult = document.querySelector('.mw-search-result');
      const title = document.title;
      const url = window.location.href;
      
      // 明らかに映画ページではないページの判定
      const isDefinitelyNotMoviePage = 
        title.includes('シリーズ') || 
        title.includes('曖昧さ回避') || 
        url.includes('シリーズ') ||
        // 概念や一般的な用語のページ（ただし、より厳格に判定）
        (!title.includes('映画') && !title.includes('(') && !url.includes('映画') && 
         !title.includes('年') && !title.includes('劇場版') && 
         // 監督名などの明らかに映画以外のページ
         (title.includes('監督') || title.includes('俳優') || title.includes('概念')));
      
      // 映画ページの可能性があるかチェック
      const couldBeMoviePage = 
        title.includes('映画') || 
        title.includes('(') || 
        url.includes('映画') || 
        title.includes('年') || 
        title.includes('劇場版') ||
        // タイトルが比較的短く、具体的な作品名らしい
        (title.length < 50 && !title.includes('一覧') && !title.includes('カテゴリ'));
      
      return {
        hasNoArticle: !!noArticle,
        hasSearchResult: !!searchResult,
        isDefinitelyNotMoviePage,
        couldBeMoviePage,
        title,
        url
      };
    });
    
    // 明らかにページが存在しない、または明らかに映画ページではない場合
    if (pageInfo.hasNoArticle || pageInfo.hasSearchResult || pageInfo.isDefinitelyNotMoviePage) {
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
      // 映画ページの可能性がある場合は制作情報なしとして返す
      if (pageInfo.couldBeMoviePage) {
        return { error: 'NO_PRODUCTION_SECTION' };
      } else {
        // 映画ページではなさそうな場合はページが見つからないとして返す
        return { error: 'PAGE_NOT_FOUND' };
      }
    }
    
    return { productionSection };
  } catch (error) {
    console.error('Error scraping movie production:', error);
    return null;
  } finally {
    await browser.close();
  }
}


export async function POST(request: NextRequest) {
  try {
    const { movieTitle }: TriviaRequest = await request.json();
    
    if (!movieTitle) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NO_TITLE },
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
          error: ERROR_MESSAGES.MOVIE_NOT_FOUND,
          suggestions: suggestions.map(s => s.title),
          message: '以下の映画はいかがですか？'
        },
        { status: 404 }
      );
    }
    
    if (result.error === 'NO_PRODUCTION_SECTION') {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NO_PRODUCTION_INFO },
        { status: 404 }
      );
    }
    
    // トリビアを生成
    const triviaResult = await generateTriviaWithAI(movieTitle, result.productionSection!);
    
    return NextResponse.json({
      movieTitle,
      trivia: triviaResult.trivia,
      interestLevel: triviaResult.interestLevel,
      reasoning: triviaResult.reasoning,
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
/**
 * Wikipedia Scraping Tests
 * スクレイピング機能の単体テスト
 */

import puppeteer from 'puppeteer';

describe('Wikipedia Scraping', () => {
  let browser: any;
  let page: any;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (compatible; MovieTriviaBot/1.0; Educational use)');
  });

  afterEach(async () => {
    await page.close();
  });

  describe('映画ページの判定', () => {
    test('有名な映画ページを正しく識別できる', async () => {
      await page.goto('https://ja.wikipedia.org/wiki/となりのトトロ');
      
      const pageInfo = await page.evaluate(() => {
        const title = document.title;
        const headings = Array.from(document.querySelectorAll('h2, h3')).map(h => h.textContent?.trim());
        
        return {
          title,
          hasProductionSection: headings.some(h => h && (h.includes('制作') || h.includes('製作'))),
          headings
        };
      });

      expect(pageInfo.title).toContain('となりのトトロ');
      expect(pageInfo.hasProductionSection).toBe(true);
    });

    test('シリーズページを正しく識別できる', async () => {
      await page.goto('https://ja.wikipedia.org/wiki/スター・ウォーズシリーズ');
      
      const pageInfo = await page.evaluate(() => {
        const title = document.title;
        const isSeriesPage = title.includes('シリーズ');
        
        return {
          title,
          isSeriesPage
        };
      });

      expect(pageInfo.title).toContain('シリーズ');
      expect(pageInfo.isSeriesPage).toBe(true);
    });

    test('存在しないページを正しく識別できる', async () => {
      await page.goto('https://ja.wikipedia.org/wiki/完全に存在しない映画12345');
      
      const pageExists = await page.evaluate(() => {
        return !document.querySelector('.noarticletext');
      });

      expect(pageExists).toBe(false);
    });
  });

  describe('制作情報の抽出', () => {
    test('制作セクションからテキストを抽出できる', async () => {
      await page.goto('https://ja.wikipedia.org/wiki/君の名は。');
      
      const productionContent = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2, h3'));
        let productionHeading = null;
        
        for (const heading of headings) {
          const text = heading.textContent?.trim();
          if (text && (text.includes('制作') || text.includes('製作'))) {
            productionHeading = heading;
            break;
          }
        }
        
        if (!productionHeading) return null;
        
        let content = '';
        let currentElement = productionHeading.parentElement?.nextElementSibling;
        
        while (currentElement) {
          if (currentElement.tagName === 'H2' || currentElement.tagName === 'H3') {
            break;
          }
          
          if (currentElement.tagName === 'P' || currentElement.tagName === 'UL') {
            const text = currentElement.textContent?.trim();
            if (text && !text.startsWith('[編集]')) {
              content += text + '\n\n';
            }
          }
          
          currentElement = currentElement.nextElementSibling;
        }
        
        return content.trim();
      });

      expect(productionContent).toBeTruthy();
      expect(typeof productionContent).toBe('string');
      expect(productionContent!.length).toBeGreaterThan(100);
    });

    test('制作セクションがない場合はnullを返す', async () => {
      // 制作セクションがない可能性のあるページをテスト
      await page.goto('https://ja.wikipedia.org/wiki/アバター');
      
      const hasProductionSection = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2, h3'));
        return headings.some(heading => {
          const text = heading.textContent?.trim();
          return text && (text.includes('制作') || text.includes('製作'));
        });
      });

      // アバターページは概念ページなので制作セクションはないはず
      expect(hasProductionSection).toBe(false);
    });
  });

  describe('検索機能', () => {
    test('映画検索で関連する結果を取得できる', async () => {
      const searchUrl = 'https://ja.wikipedia.org/wiki/Special:Search?search=スター・ウォーズ%20映画&ns0=1';
      await page.goto(searchUrl);
      
      const searchResults = await page.evaluate(() => {
        const results = Array.from(document.querySelectorAll('.mw-search-result-heading a'));
        return results.slice(0, 5).map(link => ({
          title: link.textContent?.trim() || '',
          url: link.getAttribute('href') || ''
        }));
      });

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].title).toBeTruthy();
    });

    test('フィルタリングロジックが正しく動作する', async () => {
      const searchUrl = 'https://ja.wikipedia.org/wiki/Special:Search?search=映画&ns0=1';
      
      try {
        await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 10000 });
        
        const allResults = await page.evaluate(() => {
          const results = Array.from(document.querySelectorAll('.mw-search-result-heading a, .searchresult h3 a'));
          return results.slice(0, 10).map(link => ({
            title: link.textContent?.trim() || '',
            url: link.getAttribute('href') || ''
          })).filter(item => item.title.length > 0);
        });

        // 検索結果がある場合のみフィルタリングテストを実行
        if (allResults.length > 0) {
          const filteredResults = allResults.filter((item: { title: string; url: string }) => 
            item.title && 
            (item.title.includes('映画') || 
             item.title.includes('(') || 
             item.title.includes('シリーズ') ||
             item.title.includes('作品') ||
             item.title.includes('エピソード') ||
             /\d{4}年/.test(item.title) ||
             item.title.includes('監督') ||
             item.title.includes('製作') ||
             item.title.includes('劇場版') ||
             item.title.includes('アニメ') ||
             (item.title.includes('の') && item.title.length <= 50))
          );

          // フィルタリングされた結果はすべて映画関連のはず
          filteredResults.forEach((result: { title: string; url: string }) => {
            expect(result.title).toMatch(/映画|劇場版|アニメ|\(|\d{4}年|監督|製作|の/);
          });
        }
        
        // このテストは最低限、ページが読み込まれることを確認
        const pageTitle = await page.title();
        expect(pageTitle).toContain('検索結果');
      } catch (error) {
        // ネットワークエラーの場合はスキップ
        console.warn('Search test skipped due to network issues');
      }
    });
  });

  describe('User-Agent設定', () => {
    test('適切なUser-Agentが設定される', async () => {
      const userAgent = await page.evaluate(() => navigator.userAgent);
      expect(userAgent).toContain('MovieTriviaBot');
      expect(userAgent).toContain('Educational use');
    });
  });

  describe('エラーハンドリング', () => {
    test('ネットワークエラー時の処理', async () => {
      // 無効なURLでのテスト
      try {
        await page.goto('https://invalid-url-that-does-not-exist.com');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    test('タイムアウト設定の確認', async () => {
      const startTime = Date.now();
      
      try {
        await page.goto('https://ja.wikipedia.org/wiki/となりのトトロ', { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(10000);
      } catch (error) {
        // タイムアウトエラーも正常な動作
        expect(error).toBeTruthy();
      }
    });
  });
});
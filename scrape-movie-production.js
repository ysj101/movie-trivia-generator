const puppeteer = require('puppeteer');

async function scrapeMovieProduction(movieTitle) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  
  try {
    const url = `https://ja.wikipedia.org/wiki/${encodeURIComponent(movieTitle)}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const productionSection = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      let productionHeading = null;
      
      for (const heading of headings) {
        const text = heading.textContent.trim();
        if (text.includes('制作') || text.includes('製作')) {
          productionHeading = heading;
          break;
        }
      }
      
      if (!productionHeading) {
        return null;
      }
      
      let content = '';
      let currentElement = productionHeading.parentElement.nextElementSibling;
      
      while (currentElement) {
        // 次のセクションヘッダーに到達したら停止
        if (currentElement.tagName === 'H2' || currentElement.tagName === 'H3') {
          break;
        }
        
        // サブセクションのヘッダー（"作品タイトルについて"など）をチェック
        if (currentElement.tagName === 'DIV' && currentElement.textContent.includes('[編集]')) {
          const subHeading = currentElement.textContent.replace('[編集]', '').trim();
          // 制作関連のサブセクションのみを含める
          if (subHeading === '作品タイトルについて' || subHeading === '音楽について' || subHeading === 'プロモーションについて') {
            content += `\n${subHeading}\n\n`;
          } else {
            // 制作セクション外のサブセクションに到達したら停止
            break;
          }
        } else if (currentElement.tagName === 'P' || currentElement.tagName === 'UL') {
          const text = currentElement.textContent.trim();
          if (text && !text.startsWith('[編集]')) {
            content += text + '\n\n';
          }
        }
        
        currentElement = currentElement.nextElementSibling;
      }
      
      return content.trim() || '制作セクションの内容が見つかりませんでした。';
    });
    
    return productionSection;
  } catch (error) {
    console.error('Error scraping movie production:', error);
    return null;
  } finally {
    await browser.close();
  }
}

async function main() {
  const movieTitle = process.argv[2];
  
  if (!movieTitle) {
    console.log('使用方法: node scrape-movie-production.js "映画タイトル"');
    process.exit(1);
  }
  
  console.log(`映画「${movieTitle}」の制作情報を取得中...`);
  
  const productionInfo = await scrapeMovieProduction(movieTitle);
  
  if (productionInfo) {
    console.log('\n=== 制作セクション ===');
    console.log(productionInfo);
  } else {
    console.log('制作セクションが見つかりませんでした。');
  }
}

if (require.main === module) {
  main();
}

module.exports = { scrapeMovieProduction };
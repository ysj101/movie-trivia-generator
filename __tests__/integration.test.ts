/**
 * Integration Tests
 * 実際のシナリオに基づく統合テスト
 * Note: これらのテストはローカルサーバーが起動している場合のみ実行されます
 */

describe.skip('Movie Trivia Generator Integration Tests', () => {
  const API_BASE_URL = 'http://localhost:3000';

  beforeAll(async () => {
    // 統合テスト用の環境変数チェック
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not set - some tests may fail');
    }

    // サーバーが起動しているかチェック
    try {
      await fetch(API_BASE_URL);
    } catch (error) {
      console.warn('Server not running - integration tests will be skipped');
    }
  });

  // サーバーが利用可能かチェックするヘルパー
  const isServerAvailable = async () => {
    try {
      await fetch(API_BASE_URL);
      return true;
    } catch {
      return false;
    }
  };

  describe('実際の使用シナリオ', () => {
    test('ユーザーが「君の名は」と入力した場合のフロー', async () => {
      if (!(await isServerAvailable())) {
        console.log('Server not available, skipping integration test');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle: '君の名は' })
      });

      const data = await response.json();

      if (response.status === 200) {
        // 正確なタイトルでヒットした場合
        expect(data.trivia).toMatch(/という裏話があります！/);
      } else if (response.status === 404) {
        // 曖昧で提案された場合
        expect(data.error).toBe('映画が見つかりませんでした');
        expect(data.suggestions).toContain('君の名は。');
      }
    });

    test('ユーザーが「ジブリ」と入力した場合のフロー', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle: 'ジブリ' })
      });

      const data = await response.json();
      
      // ジブリは概念なので提案が返されるはず
      expect(response.status).toBe(404);
      expect(data.error).toBe('映画が見つかりませんでした');
      expect(Array.isArray(data.suggestions)).toBe(true);
      
      // ジブリ映画の提案が含まれることを期待
      const hasGhibliMovies = data.suggestions.some((suggestion: string) =>
        suggestion.includes('となりのトトロ') || 
        suggestion.includes('千と千尋') ||
        suggestion.includes('魔女の宅急便')
      );
      expect(hasGhibliMovies).toBe(true);
    });

    test('ユーザーが正確な映画名を入力した場合のフロー', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle: 'となりのトトロ' })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.movieTitle).toBe('となりのトトロ');
      expect(data.trivia).toBeTruthy();
      expect(data.productionInfo).toBeTruthy();
      
      // トリビアの品質チェック
      expect(data.trivia).toMatch(/という裏話があります！$/);
      expect(data.trivia.length).toBeGreaterThan(50);
      expect(data.trivia.length).toBeLessThan(1000);
    });
  });

  describe('エッジケースのシナリオ', () => {
    test('非常に長い映画タイトルの処理', async () => {
      const longTitle = 'とても長い映画のタイトルですがこれは実際には存在しない映画でテスト用に作成されたものです'.repeat(2);
      
      const response = await fetch(`${API_BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle: longTitle })
      });

      const data = await response.json();
      
      // エラーが適切に処理されることを確認
      expect(response.status).toBe(404);
      expect(data.error).toBeTruthy();
    });

    test('特殊文字を含む映画タイトルの処理', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle: 'Movie Title with "Quotes" & Symbols!' })
      });

      const data = await response.json();
      
      // エラーハンドリングが適切に動作することを確認
      expect([200, 404, 500]).toContain(response.status);
    });

    test('数字のみの映画タイトルの処理', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle: '2001' })
      });

      const data = await response.json();
      
      if (response.status === 404) {
        expect(data.suggestions).toBeTruthy();
        // 2001年宇宙の旅などが提案される可能性
        const has2001Movie = data.suggestions.some((suggestion: string) =>
          suggestion.includes('2001') && suggestion.includes('宇宙')
        );
        expect(has2001Movie).toBe(true);
      }
    });
  });

  describe('レスポンス時間テスト', () => {
    test('APIレスポンス時間が適切な範囲内', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle: 'となりのトトロ' })
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 30秒以内にレスポンスが返ることを確認
      expect(responseTime).toBeLessThan(30000);
      
      // 最低限の処理時間があることを確認（即座に返るのは怪しい）
      expect(responseTime).toBeGreaterThan(1000);
    });
  });

  describe('並行リクエストテスト', () => {
    test('複数の同時リクエストを処理できる', async () => {
      const movies = ['となりのトトロ', '君の名は。', '天気の子'];
      
      const promises = movies.map(movie =>
        fetch(`${API_BASE_URL}/api/generate-trivia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieTitle: movie })
        })
      );

      const responses = await Promise.all(promises);
      
      // すべてのリクエストが完了することを確認
      expect(responses).toHaveLength(3);
      
      for (const response of responses) {
        expect([200, 404]).toContain(response.status);
      }
    });
  });

  describe('データ品質テスト', () => {
    test('生成されるトリビアの品質', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle: 'となりのトトロ' })
      });

      if (response.status === 200) {
        const data = await response.json();
        
        // トリビアの形式チェック
        expect(data.trivia).toMatch(/という裏話があります！$/);
        
        // 適切な長さチェック
        expect(data.trivia.length).toBeGreaterThan(50);
        expect(data.trivia.length).toBeLessThan(1000);
        
        // 日本語が含まれることをチェック
        expect(data.trivia).toMatch(/[ひらがなカタカナ漢字]/);
        
        // 制作情報の品質チェック
        expect(data.productionInfo.length).toBeGreaterThan(100);
        expect(data.productionInfo).toMatch(/[ひらがなカタカナ漢字]/);
      }
    });

    test('提案の品質', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle: 'スターウォーズ' })
      });

      if (response.status === 404) {
        const data = await response.json();
        
        expect(data.suggestions).toBeTruthy();
        expect(data.suggestions.length).toBeGreaterThan(0);
        expect(data.suggestions.length).toBeLessThanOrEqual(5);
        
        // 提案の関連性チェック
        const hasRelevantSuggestions = data.suggestions.some((suggestion: string) =>
          suggestion.includes('スター・ウォーズ') || suggestion.includes('エピソード')
        );
        expect(hasRelevantSuggestions).toBe(true);
      }
    });
  });
});
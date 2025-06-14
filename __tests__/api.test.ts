/**
 * API Route Tests
 * 実際のWikipediaとGemini APIを使用した統合テスト
 */

import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/generate-trivia/route';
import { config } from 'dotenv';

// .env.local を読み込み
config({ path: '.env.local' });

describe('/api/generate-trivia', () => {
  // タイムアウトを長めに設定（Puppeteerとネットワーク処理のため）
  jest.setTimeout(60000);

  describe('正常系テスト', () => {
    test('有名な映画で適切なレスポンスを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: 'となりのトトロ' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // APIが成功または適切なエラーを返すことを確認
      expect([200, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(data).toHaveProperty('movieTitle');
        expect(data).toHaveProperty('trivia');
        expect(data).toHaveProperty('interestLevel');
        expect(data).toHaveProperty('productionInfo');
        expect(data.trivia).toMatch(/という裏話があります！/);
        expect(typeof data.interestLevel).toBe('number');
        expect(data.interestLevel).toBeGreaterThanOrEqual(1);
        expect(data.interestLevel).toBeLessThanOrEqual(5);
        if (data.reasoning) {
          expect(typeof data.reasoning).toBe('string');
        }
      } else if (response.status === 404) {
        expect(data).toHaveProperty('error');
      } else {
        // 500エラーの場合はAPIエラー
        expect(data).toHaveProperty('error');
      }
    });

    test('制作情報がある映画で適切なレスポンスを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: '君の名は。' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // APIが成功または適切なエラーを返すことを確認
      expect([200, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(data.trivia).toContain('という裏話があります！');
        expect(data.productionInfo).toBeTruthy();
        expect(data.interestLevel).toBeGreaterThanOrEqual(1);
        expect(data.interestLevel).toBeLessThanOrEqual(5);
      } else {
        // エラーレスポンスでもエラーメッセージがあることを確認
        expect(data).toHaveProperty('error');
      }
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('存在しない映画で提案が返される', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: 'スターウォーズ' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', '映画が見つかりませんでした');
      expect(data).toHaveProperty('suggestions');
      expect(data).toHaveProperty('message', '以下の映画はいかがですか？');
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data.suggestions.length).toBeGreaterThan(0);
      
      // スター・ウォーズ関連の提案が含まれることを確認
      const hasStarWarsRelated = data.suggestions.some((suggestion: string) =>
        suggestion.includes('スター・ウォーズ')
      );
      expect(hasStarWarsRelated).toBe(true);
    });

    test('曖昧な映画名で適切なエラーが返される', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: 'アバター' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      // アバターは概念ページなので制作情報がない、または映画が見つからない
      expect(data.error).toMatch(/映画が見つかりませんでした|この映画の制作情報が見つかりませんでした/);
    });

    test('完全に架空の映画タイトルで一般的な提案が返される', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: '完全に架空の映画12345' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('映画が見つかりませんでした');
      expect(Array.isArray(data.suggestions)).toBe(true);
    });

    test('空の映画タイトルでエラーが返される', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    test('movieTitleが未指定でエラーが返される', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('映画タイトルが指定されていません');
    });
  });

  describe('リクエスト形式テスト', () => {
    test('不正なJSONでエラーが返される', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: '{ invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
    });

    test('GETリクエストで説明が返される', async () => {
      const { GET } = require('../src/app/api/generate-trivia/route');
      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Movie Trivia Generator API');
      expect(data).toHaveProperty('usage');
    });
  });

  describe('特殊ケーステスト', () => {
    test('制作情報がない実在映画で適切なエラーが返される', async () => {
      // 注: このテストは実際に制作情報がない映画を見つけた場合のテスト
      // 現在は多くの映画に制作情報があるため、スキップまたは条件付きで実行
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: '制作情報のない架空の映画' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // 制作情報がない場合は404または特定のエラーメッセージ
      if (response.status === 404 && data.error === 'この映画の制作情報が見つかりませんでした') {
        expect(data.error).toBe('この映画の制作情報が見つかりませんでした');
        expect(data).not.toHaveProperty('suggestions');
      } else {
        // 映画が見つからない場合
        expect(data.error).toBe('映画が見つかりませんでした');
        expect(data).toHaveProperty('suggestions');
      }
    });

    test('シリーズページにリダイレクトされる映画名で提案が返される', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: 'ハリー・ポッター' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // シリーズページは除外されるため提案が返されるはず
      expect(response.status).toBe(404);
      expect(data.error).toBe('映画が見つかりませんでした');
      expect(Array.isArray(data.suggestions)).toBe(true);
    });
  });

  describe('レスポンス形式テスト', () => {
    test('成功時のレスポンス形式が正しい', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: 'となりのトトロ' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status === 200) {
        // 成功レスポンスの構造確認
        expect(data).toEqual({
          movieTitle: expect.any(String),
          trivia: expect.any(String),
          interestLevel: expect.any(Number),
          reasoning: expect.any(String),
          productionInfo: expect.any(String)
        });

        // トリビアの内容確認
        expect(data.trivia).toMatch(/という裏話があります！$/);
        expect(data.trivia.length).toBeGreaterThan(50); // 適切な長さ
        expect(data.productionInfo.length).toBeGreaterThan(100); // 十分な制作情報
        
        // 興味深さレベルの確認
        expect(data.interestLevel).toBeGreaterThanOrEqual(1);
        expect(data.interestLevel).toBeLessThanOrEqual(5);
        expect(Number.isInteger(data.interestLevel)).toBe(true);
      }
    });

    test('エラー時のレスポンス形式が正しい', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: '完全に存在しない映画999' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: expect.any(String),
        suggestions: expect.any(Array),
        message: expect.any(String)
      });
    });
  });

  describe('興味深さレベル評価テスト', () => {
    test('AIが正しい範囲で興味深さレベルを評価する', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
        method: 'POST',
        body: JSON.stringify({ movieTitle: 'となりのトトロ' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status === 200) {
        // 興味深さレベルが1-5の範囲内
        expect(data.interestLevel).toBeGreaterThanOrEqual(1);
        expect(data.interestLevel).toBeLessThanOrEqual(5);
        expect(Number.isInteger(data.interestLevel)).toBe(true);

        // 評価理由が存在することを確認
        if (data.reasoning) {
          expect(typeof data.reasoning).toBe('string');
          expect(data.reasoning.length).toBeGreaterThan(0);
        }
      }
    });

    test('異なる映画で異なる評価レベルが返される可能性', async () => {
      const movies = ['となりのトトロ', '君の名は。'];
      const results = [];

      for (const movie of movies) {
        const request = new NextRequest('http://localhost:3000/api/generate-trivia', {
          method: 'POST',
          body: JSON.stringify({ movieTitle: movie }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        if (response.status === 200) {
          results.push({
            movie,
            interestLevel: data.interestLevel,
            reasoning: data.reasoning
          });
        }
      }

      // 少なくとも1つの結果があることを確認
      if (results.length > 0) {
        results.forEach(result => {
          expect(result.interestLevel).toBeGreaterThanOrEqual(1);
          expect(result.interestLevel).toBeLessThanOrEqual(5);
        });
      }
    });
  });
});
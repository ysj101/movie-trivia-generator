'use client';

import { useState } from 'react';

interface TriviaResponse {
  movieTitle: string;
  trivia: string;
  productionInfo: string;
}

interface ErrorResponse {
  error: string;
  suggestions?: string[];
  message?: string;
}

export default function Home() {
  const [movieTitle, setMovieTitle] = useState('');
  const [trivia, setTrivia] = useState<TriviaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateTrivia = async () => {
    if (!movieTitle.trim()) {
      setError('映画タイトルを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    setTrivia(null);
    setSuggestions([]);

    try {
      const response = await fetch('/api/generate-trivia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieTitle: movieTitle.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.suggestions) {
          setError(data.error);
          setSuggestions(data.suggestions);
        } else {
          setError(data.error || 'エラーが発生しました');
        }
        return;
      }

      setTrivia(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎬 映画トリビアジェネレーター
          </h1>
          <p className="text-lg text-gray-600">
            映画タイトルを入力すると、制作秘話から興奮できるトリビアを生成します！
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="movieTitle" className="block text-sm font-medium text-gray-700 mb-2">
              映画タイトル
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                id="movieTitle"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                placeholder="例: 君の名は。"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 font-medium"
                onKeyPress={(e) => e.key === 'Enter' && generateTrivia()}
              />
              <button
                onClick={generateTrivia}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '生成中...' : 'トリビア生成'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 mb-3">{error}</p>
              {suggestions.length > 0 && (
                <div>
                  <p className="text-gray-700 text-sm mb-2">以下の映画はいかがですか？</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setMovieTitle(suggestion);
                          setError('');
                          setSuggestions([]);
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {trivia && (
            <div className="space-y-6">
              {/* メインのトリビアカード */}
              <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* カードヘッダー */}
                <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 text-white">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-2">
                      <div className="bg-white/20 rounded-full p-2 mr-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v7.5M7 4V3a1 1 0 00-1 1v7.5m0 0l-3 3m0 0l3 3m-3-3h18" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium opacity-90">映画トリビア</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">
                      『{trivia.movieTitle}』
                    </h2>
                    <p className="text-white/80 text-sm">驚きの制作秘話</p>
                  </div>
                  
                  {/* 装飾要素 */}
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/5 rounded-full"></div>
                </div>

                {/* カードコンテンツ */}
                <div className="p-6">
                  <div className="relative">
                    {/* 引用符アイコン */}
                    <div className="absolute -top-2 -left-2 text-4xl text-gray-200 font-serif">"</div>
                    
                    <div className="pl-6 pr-4">
                      <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-line font-medium">
                        {trivia.trivia}
                      </div>
                    </div>
                    
                    {/* 右下の引用符 */}
                    <div className="absolute -bottom-4 -right-2 text-4xl text-gray-200 font-serif rotate-180">"</div>
                  </div>
                  
                  {/* カード下部のアクセント */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-500 font-medium">制作秘話</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 制作情報の詳細カード */}
              <details className="group">
                <summary className="cursor-pointer p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-700">制作情報の詳細を表示</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>
                <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-green-100 rounded-full p-2 mr-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">制作背景・詳細情報</h3>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {trivia.productionInfo}
                      </pre>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Wikipediaの制作情報を基に、Gemini AIがトリビアを生成しています</p>
        </div>
      </div>
    </div>
  );
}

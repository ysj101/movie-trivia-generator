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
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  ✨ 『{trivia.movieTitle}』の驚きのトリビア
                </h2>
                <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-line">
                  {trivia.trivia}
                </div>
              </div>

              <details className="group">
                <summary className="cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-700">制作情報の詳細を表示</span>
                  <span className="ml-2 text-gray-500 group-open:rotate-180 transition-transform inline-block">▼</span>
                </summary>
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-x-auto">
                    {trivia.productionInfo}
                  </pre>
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

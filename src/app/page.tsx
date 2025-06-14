'use client';

import { useState } from 'react';
import { TriviaCard } from '@/components';
import { useTrivia } from '@/hooks';

export default function Home() {
  const [movieTitle, setMovieTitle] = useState('');
  const { 
    trivia, 
    loading, 
    error, 
    suggestions, 
    generateTrivia, 
    clearError 
  } = useTrivia();

  const handleGenerateTrivia = async () => {
    await generateTrivia(movieTitle);
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
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateTrivia()}
              />
              <button
                onClick={handleGenerateTrivia}
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
                          clearError();
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
              <TriviaCard trivia={trivia} />

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

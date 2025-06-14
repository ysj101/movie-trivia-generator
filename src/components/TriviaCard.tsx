/**
 * トリビアカードコンポーネント
 */

import { TriviaResponse, InterestLevel } from '@/types';
import { getInterestLevelText } from '@/utils/interest-level';

interface TriviaCardProps {
  trivia: TriviaResponse;
}

export const TriviaCard: React.FC<TriviaCardProps> = ({ trivia }) => {
  return (
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
          <div className="absolute -top-2 -left-2 text-4xl text-gray-200 font-serif">&ldquo;</div>
          
          <div className="pl-6 pr-4">
            <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-line font-medium">
              {trivia.trivia}
            </div>
          </div>
          
          {/* 右下の引用符 */}
          <div className="absolute -bottom-4 -right-2 text-4xl text-gray-200 font-serif rotate-180">&rdquo;</div>
        </div>
        
        {/* カード下部のアクセント */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-500 font-medium">制作秘話</span>
            </div>
            <div className="flex items-center space-x-1" title={`興味深さレベル: ${trivia.interestLevel}/5${trivia.reasoning ? ` (${trivia.reasoning})` : ''}`}>
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i} 
                  className={`w-4 h-4 ${i < trivia.interestLevel ? 'text-yellow-400' : 'text-gray-300'} fill-current transition-colors duration-200`} 
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
              ))}
              <span className="ml-2 text-xs text-gray-400">
                {trivia.interestLevel}/5 {getInterestLevelText(trivia.interestLevel as InterestLevel)}
              </span>
            </div>
          </div>
          {trivia.reasoning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-medium text-amber-800">AI評価理由</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">{trivia.reasoning}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
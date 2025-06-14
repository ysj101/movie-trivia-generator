/**
 * Gemini AI関連の設定とユーティリティ
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { TriviaGenerationResult } from '@/types';
import { normalizeInterestLevel } from '@/utils/interest-level';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const generateTriviaPrompt = (movieTitle: string, productionText: string): string => `
映画「${movieTitle}」の制作情報から、面白い映画トリビアを生成し、その興味深さレベルを評価してください。

以下の制作情報を基に：
${productionText}

要求事項：
1. 「●●という裏話があります！」の形式でトリビアを出力
2. 3-4行程度で、興奮できるような内容
3. 最も興味深く、驚きのある内容を1つだけ厳選
4. 番号なし、リスト形式なしで1つのトリビアのみ
5. 引用符号（[数字]）は除外して読みやすくする
6. 読者が「えー！知らなかった！」と思うような最高の驚きの要素を含める

トリビアの興味深さ評価基準：
★★★★★ (5): 超驚き！誰も知らない秘話、制作現場の奇跡的エピソード
★★★★☆ (4): とても興味深い、制作の重要な裏話や意外な事実
★★★☆☆ (3): 面白い、一般的でない制作背景や工夫
★★☆☆☆ (2): やや興味深い、基本的な制作情報
★☆☆☆☆ (1): 普通、よく知られた一般的な情報

回答は以下のJSON形式で出力してください：
{
  "trivia": "生成されたトリビア文章",
  "interestLevel": 5,
  "reasoning": "評価の理由（簡潔に）"
}
`;

export const parseGeminiResponse = (responseText: string): TriviaGenerationResult => {
  try {
    const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    if (parsed.trivia && typeof parsed.interestLevel === 'number') {
      return {
        trivia: parsed.trivia,
        interestLevel: normalizeInterestLevel(parsed.interestLevel),
        reasoning: parsed.reasoning || ''
      };
    }
  } catch (parseError) {
    console.warn('JSON parsing failed, using fallback:', parseError);
  }
  
  // フォールバック: テキストから抽出
  return {
    trivia: responseText,
    interestLevel: 4, // デフォルト値
    reasoning: 'テキスト形式で生成されたため、デフォルト評価'
  };
};

export const generateTriviaWithAI = async (
  movieTitle: string, 
  productionText: string
): Promise<TriviaGenerationResult> => {
  const prompt = generateTriviaPrompt(movieTitle, productionText);
  
  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return parseGeminiResponse(responseText);
  } catch (error) {
    console.error('Error generating trivia with Gemini:', error);
    throw new Error('AIによるトリビア生成に失敗しました');
  }
};
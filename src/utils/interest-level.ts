/**
 * 興味深さレベル関連のユーティリティ関数
 */

import { InterestLevel } from '@/types';

export const getInterestLevelText = (level: InterestLevel): string => {
  switch (level) {
    case 5: return '超驚き！';
    case 4: return 'とても興味深い';
    case 3: return '面白い';
    case 2: return 'やや興味深い';
    case 1: return '普通';
    default: return '評価中';
  }
};

export const getInterestLevelDescription = (level: InterestLevel): string => {
  switch (level) {
    case 5: return '誰も知らない秘話、制作現場の奇跡的エピソード';
    case 4: return '制作の重要な裏話や意外な事実';
    case 3: return '一般的でない制作背景や工夫';
    case 2: return '基本的な制作情報';
    case 1: return 'よく知られた一般的な情報';
    default: return '評価中...';
  }
};

export const validateInterestLevel = (level: unknown): level is InterestLevel => {
  return typeof level === 'number' && 
         Number.isInteger(level) && 
         level >= 1 && 
         level <= 5;
};

export const normalizeInterestLevel = (level: number): InterestLevel => {
  const normalized = Math.max(1, Math.min(5, Math.round(level)));
  return normalized as InterestLevel;
};
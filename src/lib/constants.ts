/**
 * アプリケーション定数
 */

export const INTEREST_LEVELS = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 4,
} as const;

export const ERROR_MESSAGES = {
  NO_TITLE: '映画タイトルを入力してください',
  MOVIE_NOT_FOUND: '映画が見つかりませんでした',
  NO_PRODUCTION_INFO: 'この映画の制作情報が見つかりませんでした',
  API_ERROR: 'トリビアの生成に失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
} as const;

export const SUCCESS_MESSAGES = {
  TRIVIA_GENERATED: 'トリビアが生成されました',
  SUGGESTIONS_FOUND: '以下の映画はいかがですか？',
} as const;

export const WIKIPEDIA_CONFIG = {
  BASE_URL: 'https://ja.wikipedia.org/wiki/',
  SEARCH_URL: 'https://ja.wikipedia.org/wiki/Special:Search',
  USER_AGENT: 'Mozilla/5.0 (compatible; MovieTriviaBot/1.0; Educational use)',
  TIMEOUT: 30000,
} as const;

export const API_ENDPOINTS = {
  GENERATE_TRIVIA: '/api/generate-trivia',
} as const;

export const UI_CONFIG = {
  MAX_SUGGESTIONS: 5,
  TRIVIA_MIN_LENGTH: 50,
  TRIVIA_MAX_LENGTH: 1000,
  PRODUCTION_INFO_MIN_LENGTH: 100,
} as const;
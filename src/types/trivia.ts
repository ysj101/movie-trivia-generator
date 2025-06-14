/**
 * トリビア関連の型定義
 */

export interface TriviaResponse {
  movieTitle: string;
  trivia: string;
  interestLevel: number;
  reasoning?: string;
  productionInfo: string;
}

export interface ErrorResponse {
  error: string;
  suggestions?: string[];
  message?: string;
}

export interface TriviaRequest {
  movieTitle: string;
}

export interface WikipediaPageInfo {
  hasNoArticle: boolean;
  hasSearchResult: boolean;
  isDefinitelyNotMoviePage: boolean;
  couldBeMoviePage: boolean;
  title: string;
  url: string;
}

export interface ScrapingResult {
  productionSection?: string;
  error?: 'PAGE_NOT_FOUND' | 'NO_PRODUCTION_SECTION';
}

export interface SearchSuggestion {
  title: string;
  url: string;
}

export type InterestLevel = 1 | 2 | 3 | 4 | 5;

export interface TriviaGenerationResult {
  trivia: string;
  interestLevel: InterestLevel;
  reasoning: string;
}
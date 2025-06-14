/**
 * 型定義のエクスポート
 */

export * from './trivia';

// 共通の型定義
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// 環境変数の型定義
export interface EnvironmentVariables {
  GEMINI_API_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// コンポーネントの共通Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
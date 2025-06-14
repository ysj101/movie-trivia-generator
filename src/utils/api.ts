/**
 * API関連のユーティリティ関数
 */

import { TriviaRequest, TriviaResponse, ErrorResponse } from '@/types';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const createTriviaRequest = async (
  movieTitle: string
): Promise<TriviaResponse> => {
  const response = await fetch('/api/generate-trivia', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ movieTitle: movieTitle.trim() } as TriviaRequest),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new APIError(
      data.error || 'リクエストに失敗しました',
      response.status,
      data
    );
  }

  return data as TriviaResponse;
};

export const isErrorResponse = (response: unknown): response is ErrorResponse => {
  return typeof response === 'object' && 
         response !== null && 
         'error' in response && 
         typeof (response as ErrorResponse).error === 'string';
};

export const isTriviaResponse = (response: unknown): response is TriviaResponse => {
  return typeof response === 'object' && 
         response !== null &&
         'movieTitle' in response &&
         'trivia' in response &&
         'interestLevel' in response &&
         'productionInfo' in response &&
         typeof (response as TriviaResponse).movieTitle === 'string' &&
         typeof (response as TriviaResponse).trivia === 'string' &&
         typeof (response as TriviaResponse).interestLevel === 'number' &&
         typeof (response as TriviaResponse).productionInfo === 'string';
};
/**
 * トリビア生成用のカスタムフック
 */

import { useState, useCallback } from 'react';
import { TriviaResponse } from '@/types';
import { createTriviaRequest, APIError, isErrorResponse } from '@/utils/api';
import { ERROR_MESSAGES } from '@/lib/constants';

interface UseTriviaReturn {
  trivia: TriviaResponse | null;
  loading: boolean;
  error: string;
  suggestions: string[];
  generateTrivia: (movieTitle: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useTrivia = (): UseTriviaReturn => {
  const [trivia, setTrivia] = useState<TriviaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const clearError = useCallback(() => {
    setError('');
    setSuggestions([]);
  }, []);

  const reset = useCallback(() => {
    setTrivia(null);
    setError('');
    setSuggestions([]);
    setLoading(false);
  }, []);

  const generateTrivia = useCallback(async (movieTitle: string) => {
    if (!movieTitle.trim()) {
      setError(ERROR_MESSAGES.NO_TITLE);
      return;
    }

    setLoading(true);
    clearError();
    setTrivia(null);

    try {
      const response = await createTriviaRequest(movieTitle);
      setTrivia(response);
    } catch (err) {
      if (err instanceof APIError) {
        if (err.response && isErrorResponse(err.response)) {
          setError(err.response.error);
          if (err.response.suggestions) {
            setSuggestions(err.response.suggestions);
          }
        } else {
          setError(err.message);
        }
      } else {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      }
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  return {
    trivia,
    loading,
    error,
    suggestions,
    generateTrivia,
    clearError,
    reset,
  };
};
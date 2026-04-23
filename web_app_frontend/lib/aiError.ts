import axios from 'axios';

interface ShowToast {
  (opts: { title: string; description: string; variant: 'error' | 'success' | 'info' }): void;
}

/**
 * Handles AI-related errors with friendly messages.
 * Returns true if the error was handled (caller can return early).
 */
export function handleAiError(err: unknown, showToast: ShowToast, context?: string): boolean {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as Record<string, any> | undefined;

    if (status === 429) {
      const retryAfter = data?.retry_after;
      const seconds = typeof retryAfter === 'number' ? Math.ceil(retryAfter) : 60;
      const minutes = seconds >= 60 ? `${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) > 1 ? 's' : ''}` : `${seconds} second${seconds !== 1 ? 's' : ''}`;
      showToast({
        title: '⏳ AI Rate Limit Reached',
        description: `The AI service is temporarily busy. Please wait ${minutes} and try again.`,
        variant: 'error',
      });
      return true;
    }

    if (status === 502 || status === 503) {
      showToast({
        title: '🤖 AI Unavailable',
        description: `The AI service is currently unavailable${context ? ` for ${context}` : ''}. Please try again in a moment.`,
        variant: 'error',
      });
      return true;
    }
  }

  showToast({
    title: '🤖 AI Failed',
    description: `AI ${context ?? 'generation'} could not be completed. You can try again or do it manually.`,
    variant: 'error',
  });
  return true;
}

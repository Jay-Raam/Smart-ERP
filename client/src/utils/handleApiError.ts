// Centralized Error Handling for Smart ERP

export interface ApiErrorEvent {
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
}

// Global Custom Event Dispatcher for Toast Alerts
export function showAppToast(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') {
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: { message, type },
    })
  );
}

export const handleApiError = (
  error: any,
  fallbackMessage = 'Something went wrong. Please try again.'
): string => {
  console.error('[Global Error Handler]:', error);

  let message = fallbackMessage;

  // 1. API error with response
  if (error?.response) {
    const data = error.response.data;
    const status = error.response.status;

    if (status === 401) {
      message = 'Session expired — please log in again.';
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    } else if (status === 403) {
      message = "You don't have permission for this action.";
    } else if (typeof data === 'string' && data.trim() !== '') {
      message = data;
    } else if (data?.message) {
      message = data.message;
    } else if (data?.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      const firstError = data.errors[firstKey]?.[0];
      message = firstError || message;
    } else if (data?.field && data?.message) {
      message = `${data.field.toUpperCase()}: ${data.message}`;
    }
  }
  // 2. Network error (no response)
  else if (error?.request) {
    message = 'No response from server. Please check your network connection.';
  }
  // 3. Client JS error
  else if (error?.message) {
    message = error.message;
  }

  // Never show an empty message
  if (!message || String(message).trim() === '') {
    message = fallbackMessage;
  }

  showAppToast(message, 'error');
  return message;
};

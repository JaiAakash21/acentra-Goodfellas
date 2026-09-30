/**
 * Application environment configuration
 * Connected to FastAPI backend with PostgreSQL engine
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  // Defaults to mock mode for offline demonstration, but seamlessly forwards to FastAPI when toggled or available
  useMockData: import.meta.env.VITE_USE_MOCK !== 'false',
};

/** Backend URL, set via EXPO_PUBLIC_API_URL (see .env.example). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

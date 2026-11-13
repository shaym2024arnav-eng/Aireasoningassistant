// Set VITE_API_URL in frontend/.env (local) or in Vercel project settings,
// e.g. https://your-backend.onrender.com
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

// Dynamic API Base URL detection
// Local: uses the relative /api (handled by Vite proxy)
// Live: points to the main domain's API
export const API_BASE_URL = 'https://myvastutool.com';
export const SOCKET_URL = 'https://my-chat-server-bk1j.onrender.com';

export const UPLOADS_BASE_URL = isLocal 
  ? `http://${hostname}/myvastutool` 
  : 'https://myvastutool.com';

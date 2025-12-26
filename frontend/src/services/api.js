import { API_URL } from '../config/web3';

// ============================================
// SESSION TOKEN STORAGE
// ============================================

const SESSION_KEY = 'commune_session';

export const saveSession = (token) => {
  localStorage.setItem(SESSION_KEY, token);
};

export const getSession = () => {
  return localStorage.getItem(SESSION_KEY);
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

// ============================================
// API HELPERS
// ============================================

const apiRequest = async (endpoint, options = {}) => {
  const session = getSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (session) {
    headers['Authorization'] = `Bearer ${session}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
};

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Check token balance for a wallet (server-side verification)
 */
export const checkBalance = async (wallet) => {
  return apiRequest(`/api/balance?wallet=${wallet}`);
};

/**
 * Verify wallet ownership and get session token
 */
export const verifyWallet = async (wallet, signature, message) => {
  const data = await apiRequest('/api/verify', {
    method: 'POST',
    body: JSON.stringify({ wallet, signature, message }),
  });
  
  if (data.verified && data.token) {
    saveSession(data.token);
  }
  
  return data;
};

/**
 * Validate current session
 */
export const validateSession = async () => {
  const session = getSession();
  if (!session) return { valid: false };
  
  try {
    return await apiRequest('/api/session');
  } catch (error) {
    clearSession();
    return { valid: false };
  }
};

/**
 * Get chat messages
 */
export const getMessages = async () => {
  return apiRequest('/api/messages');
};

/**
 * Send a chat message
 */
export const sendMessage = async (content) => {
  return apiRequest('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
};

/**
 * Logout - clear session
 */
export const logout = () => {
  clearSession();
};

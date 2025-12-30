import { http } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { SiweMessage } from 'siwe';

// ============================================
// API CONFIGURATION
// ============================================

export const API_URL = 'https://commune-api.gregoryesman.workers.dev';

// ============================================
// CONFIGURATION
// ============================================

export const TOKEN_CONFIG = {
  // Guardian Token on BSC
  name: 'Guardian',
  symbol: 'GUARD',
  requiredAmount: 5, // Minimum GUARD tokens needed for access
  decimals: 18,
  
  // Contract address on BSC
  address: '0xF606bd19b1E61574ED625d9ea96C841D4E247A32',
  
  // Chain info
  chainId: 56, // BSC Mainnet
  chainName: 'BNB Smart Chain',
};

// ============================================
// WAGMI CONFIG
// ============================================

export const wagmiConfig = getDefaultConfig({
  appName: 'Commune',
  projectId: '0a4a7b9fe490e41d2ef562bc32e7e9be', // Your WalletConnect Project ID
  chains: [bsc],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org/'),
  },
});

// ============================================
// BEP-20 TOKEN ABI (minimal for balance check)
// ============================================

export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
];

// ============================================
// SIWE (Sign-In with Ethereum) CONFIG - EIP-4361
// Industry standard used by Uniswap, OpenSea, and major dApps
// ============================================

export const SIWE_CONFIG = {
  // Domain that is requesting the signing (must match actual domain)
  domain: typeof window !== 'undefined' ? window.location.host : 'commune-6m2.pages.dev',

  // URI of the current page
  uri: typeof window !== 'undefined' ? window.location.origin : 'https://commune-6m2.pages.dev',

  // Statement shown to user (human-readable)
  statement: 'Sign in to Commune to verify you own this wallet and access the GUARD holder community. This is free and does not trigger any blockchain transaction.',

  // How long the signature is valid (15 minutes)
  expirationMinutes: 15,

  // Create a SIWE message following EIP-4361 standard
  createMessage: (address, nonce, chainId = TOKEN_CONFIG.chainId) => {
    const now = new Date();
    const expirationTime = new Date(now.getTime() + SIWE_CONFIG.expirationMinutes * 60 * 1000);

    const siweMessage = new SiweMessage({
      domain: SIWE_CONFIG.domain,
      address: address,
      statement: SIWE_CONFIG.statement,
      uri: SIWE_CONFIG.uri,
      version: '1',
      chainId: chainId,
      nonce: nonce,
      issuedAt: now.toISOString(),
      expirationTime: expirationTime.toISOString(),
    });

    return siweMessage.prepareMessage();
  },
};

// Legacy config for backwards compatibility
export const SIGN_MESSAGE_CONFIG = {
  // Message template - {nonce} will be replaced with a random value
  getMessage: (nonce) => `Welcome to Commune!

Sign this message to verify you own this wallet and access the community.

This signature is free and does not trigger any blockchain transaction.

Nonce: ${nonce}`,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Truncate an address for display
 */
export const truncateAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Format token balance with decimals
 */
export const formatTokenBalance = (balance, decimals = 18, displayDecimals = 2) => {
  if (!balance) return '0';
  const value = Number(balance) / Math.pow(10, decimals);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
};

/**
 * Check if user has sufficient token balance
 */
export const hasRequiredTokens = (balance, decimals = 18) => {
  if (!balance) return false;
  const tokenBalance = Number(balance) / Math.pow(10, decimals);
  return tokenBalance >= TOKEN_CONFIG.requiredAmount;
};

/**
 * Generate a random nonce for signature verification
 */
export const generateNonce = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import '@rainbow-me/rainbowkit/styles.css';
import {
  RainbowKitProvider,
  ConnectButton,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, useAccount, useSignMessage, useReadContract } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  wagmiConfig,
  TOKEN_CONFIG,
  ERC20_ABI,
  SIWE_CONFIG,
  API_URL,
  truncateAddress,
  formatTokenBalance,
  hasRequiredTokens,
  generateNonce,
} from './config/web3';
import {
  TRANSITIONS,
  SCENE_TIMING,
  TYPOGRAPHY,
  COLORS,
  CARDS,
  LAYOUT,
  getBadgeColors,
  getUsernameColor,
  getTransitionClasses,
} from './presentationConfig';
import { generatePersonalizedQuote } from './contentConfig';
import holderProfiles from '../holder-profiles.json';

// ============================================
// QUERY CLIENT
// ============================================
const queryClient = new QueryClient();

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatTime = (date) => {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date);
};

// ============================================
// ICON COMPONENTS
// ============================================
const Icons = {
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  ),
  Reply: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  ),
  Video: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  ),
  VideoOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" />
      <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
      <path d="m2 2 20 20" />
    </svg>
  ),
  Mic: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  ),
  MicOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  ),
  PhoneOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="22" x2="2" y1="2" y2="22" />
    </svg>
  ),
  Chat: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Disconnect: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Smile: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  Pen: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
};

// ============================================
// UI COMPONENTS
// ============================================
const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a0a0f] hover:from-amber-300 hover:to-orange-400 focus:ring-amber-400 shadow-lg shadow-amber-500/25',
    secondary: 'bg-white/5 text-white/90 hover:bg-white/10 border border-white/10 focus:ring-white/20',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5 focus:ring-white/10',
    danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 focus:ring-red-400',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-3',
  };
  
  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl ${className}`} {...props}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-white/10 text-white/80',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Confirm Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', confirmVariant = 'danger' }) => {
  if (!isOpen) return null;
  
  const confirmStyles = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-black',
    primary: 'bg-amber-400 hover:bg-amber-500 text-black',
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a25] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-white/60 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${confirmStyles[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Link Preview Component - Obsidian Surfing style
const PREVIEW_BLOCKLIST = [
  'google.com', 'google.', // All Google domains
  'youtube.com', 'youtu.be',
  'twitter.com', 'x.com',
  'facebook.com', 'fb.com',
  'instagram.com',
  'linkedin.com',
  'tiktok.com',
  'reddit.com',
  'amazon.com', 'amazon.',
  'netflix.com',
  'spotify.com',
  'discord.com', 'discord.gg',
  'twitch.tv',
  'github.com', // Has its own embed restrictions
  'microsoft.com',
  'apple.com',
  'cloudflare.com',
];

const isBlockedDomain = (url) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return PREVIEW_BLOCKLIST.some(blocked => 
      hostname === blocked || 
      hostname.endsWith('.' + blocked) ||
      hostname.includes(blocked)
    );
  } catch {
    return false;
  }
};

const LinkPreview = ({ url, children }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isHoveringPreview, setIsHoveringPreview] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const linkRef = useRef(null);
  const previewRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  
  // Check if URL is blocked from preview
  const isBlocked = isBlockedDomain(url);
  
  // Calculate initial position for preview
  const calculatePosition = () => {
    if (!linkRef.current) return;
    const rect = linkRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Different sizes for blocked (small tooltip) vs full preview
    const previewWidth = isBlocked ? 280 : 900;
    const previewHeight = isBlocked ? 50 : 600;
    
    let x = rect.left;
    let y = rect.bottom + 8;
    
    // Adjust if would go off right edge
    if (x + previewWidth > viewportWidth - 20) {
      x = viewportWidth - previewWidth - 20;
    }
    
    // Adjust if would go off bottom edge - show above instead
    if (y + previewHeight > viewportHeight - 20) {
      y = rect.top - previewHeight - 8;
    }
    
    // Ensure minimum bounds
    if (x < 20) x = 20;
    if (y < 20) y = 20;
    
    // For blocked sites, keep tooltip close to link
    if (isBlocked) {
      // Prefer showing below the link if there's room
      if (rect.bottom + previewHeight + 20 < viewportHeight) {
        y = rect.bottom + 4;
      } else {
        // Otherwise show above
        y = rect.top - previewHeight - 4;
      }
    }
    
    // For large previews, center if possible
    if (!isBlocked) {
      // Center horizontally if there's room
      const centeredX = (viewportWidth - previewWidth) / 2;
      if (centeredX > 20) {
        x = centeredX;
      }
      // Center vertically if there's room
      const centeredY = (viewportHeight - previewHeight) / 2;
      if (centeredY > 20) {
        y = centeredY;
      }
    }
    
    setPreviewPosition({ x, y });
  };
  
  // Dragging handlers
  const handleDragStart = (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    const rect = previewRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
  };
  
  const handleDrag = (e) => {
    if (!isDragging) return;
    setPreviewPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Add global mouse listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, dragOffset]);
  
  const handleLinkMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsHoveringLink(true);
    hoverTimeoutRef.current = setTimeout(() => {
      calculatePosition();
      setShowPreview(true);
      setIsLoading(true);
      setLoadError(false);
    }, 500); // 500ms delay before showing
  };
  
  const handleLinkMouseLeave = () => {
    setIsHoveringLink(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Small delay before closing to allow mouse to move to preview
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringPreview && !isDragging) {
        setShowPreview(false);
      }
    }, 150);
  };
  
  const handlePreviewMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsHoveringPreview(true);
  };
  
  const handlePreviewMouseLeave = () => {
    if (isDragging) return; // Don't close while dragging
    setIsHoveringPreview(false);
    // Small delay before closing
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringLink && !isDragging) {
        setShowPreview(false);
      }
    }, 150);
  };
  
  // Handle iframe load/error
  const handleIframeLoad = (e) => {
    setIsLoading(false);
    // Check if iframe actually loaded content (some sites block via X-Frame-Options)
    try {
      // This will throw if cross-origin and blocked
      const iframeDoc = e.target.contentDocument || e.target.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body || iframeDoc.body.innerHTML === '') {
        setLoadError(true);
      }
    } catch (err) {
      // Cross-origin - can't check, assume it loaded if no error event
    }
  };
  
  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);
  
  // Extract domain for display
  const getDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };
  
  return (
    <>
      <a
        ref={linkRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 hover:underline break-all inline-flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={handleLinkMouseEnter}
        onMouseLeave={handleLinkMouseLeave}
      >
        {children}
        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
      
      {/* Preview Portal */}
      {showPreview && ReactDOM.createPortal(
        isBlocked ? (
          /* Simple tooltip for blocked sites */
          <div
            ref={previewRef}
            className="fixed z-[200] animate-fade-in"
            style={{ 
              left: previewPosition.x, 
              top: previewPosition.y,
            }}
            onMouseEnter={handlePreviewMouseEnter}
            onMouseLeave={handlePreviewMouseLeave}
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a25] border border-white/20 rounded-xl shadow-xl hover:bg-[#22222f] transition-colors"
            >
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="text-sm text-white/70">Open in new tab</span>
              <span className="text-xs text-white/30">({getDomain(url)})</span>
            </a>
          </div>
        ) : (
          /* Full preview for non-blocked sites */
          <div
            ref={previewRef}
            className="fixed z-[200] animate-fade-in"
            style={{ 
              left: previewPosition.x, 
              top: previewPosition.y,
            }}
            onMouseEnter={handlePreviewMouseEnter}
            onMouseLeave={handlePreviewMouseLeave}
          >
            <div className="w-[900px] h-[600px] bg-[#0a0a0f] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Draggable Header */}
              <div 
                className={`flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleDragStart}
              >
                {/* Drag handle indicator */}
                <div className="flex flex-col gap-0.5 mr-1">
                  <div className="w-4 h-0.5 bg-white/20 rounded-full" />
                  <div className="w-4 h-0.5 bg-white/20 rounded-full" />
                </div>
                
                <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                  <svg className="w-3 h-3 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-xs text-white/50 truncate flex-1">{getDomain(url)}</span>
                  {isLoading && (
                    <div className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
              </div>
              
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Open in new tab"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Close preview"
              >
                <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content Area - iframe preview */}
            <div className="flex-1 relative bg-white overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#12121a] z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white/50 text-sm">Loading preview...</span>
                  </div>
                </div>
              )}
              
              {loadError && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#12121a] z-10">
                  <div className="flex flex-col items-center gap-4 text-center px-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/70 font-medium mb-1">Failed to load</p>
                      <p className="text-white/40 text-sm">This site couldn't be loaded.</p>
                    </div>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-sm font-medium rounded-xl transition-colors"
                    >
                      Open in new tab →
                    </a>
                  </div>
                </div>
              )}
              
              {/* Scaled iframe for desktop view */}
              <iframe
                src={`${API_URL}/api/proxy?url=${encodeURIComponent(url)}`}
                style={{ 
                  width: '1400px', 
                  height: '815px',
                  transform: 'scale(0.643)',
                  transformOrigin: 'top left',
                  border: 'none',
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
                onLoad={handleIframeLoad}
                onError={() => { setIsLoading(false); setLoadError(true); }}
                title={`Preview of ${getDomain(url)}`}
              />
            </div>
            
            {/* Footer hint */}
            <div className="px-3 py-1.5 bg-white/5 border-t border-white/10">
              <p className="text-xs text-white/30 text-center">
                Drag header to move • Move mouse away to close
              </p>
            </div>
          </div>
        </div>
        ),
        document.body
      )}
    </>
  );
};

const Avatar = ({ emoji, size = 'md', status }) => {
  const sizes = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl',
  };
  
  const statusColors = {
    online: 'bg-emerald-400',
    away: 'bg-amber-400',
    offline: 'bg-white/20',
  };
  
  return (
    <div className="relative">
      <div className={`${sizes[size]} bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center border border-white/10`}>
        {emoji}
      </div>
      {status && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${statusColors[status]} rounded-full border-2 border-[#0a0a0f]`} />
      )}
    </div>
  );
};

const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} border-2 border-white/20 border-t-amber-400 rounded-full animate-spin`} />
  );
};

// ============================================
// REPUTATION BADGE COMPONENT
// ============================================
// Shows colored username with glow based on reputation tier
const ReputationBadge = ({ wallet, showTooltip = true, children }) => {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHover, setShowHover] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hiddenBadges, setHiddenBadges] = useState([]);
  const nameRef = useRef(null);
  
  useEffect(() => {
    if (!wallet) return;
    
    const fetchReputation = async () => {
      try {
        // Check localStorage cache first
        const cacheKey = `reputation_${wallet.toLowerCase()}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache for 1 hour client-side
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            setReputation(data);
            setLoading(false);
            // Still fetch hidden badges preference
            fetchHiddenBadges();
            return;
          }
        }
        
        const response = await fetch(`${API_URL}/api/reputation?wallet=${wallet}`);
        if (response.ok) {
          const data = await response.json();
          setReputation(data);
          // Cache it
          localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        }
        
        // Fetch hidden badges preference
        fetchHiddenBadges();
      } catch (error) {
        console.error('Failed to fetch reputation:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchHiddenBadges = async () => {
      try {
        const prefResponse = await fetch(`${API_URL}/api/reputation/modifier?wallet=${wallet}`);
        if (prefResponse.ok) {
          const prefData = await prefResponse.json();
          // modifier now stores hidden badges as "hidden:emoji1,emoji2"
          if (prefData.modifier && prefData.modifier.startsWith('hidden:')) {
            setHiddenBadges(prefData.modifier.replace('hidden:', '').split(',').filter(e => e));
          }
        }
      } catch (error) {
        console.error('Failed to fetch badge preferences:', error);
      }
    };
    
    fetchReputation();
  }, [wallet]);
  
  const handleMouseEnter = (e) => {
    if (!showTooltip || !reputation?.primaryBadge) return;
    const rect = nameRef.current?.getBoundingClientRect();
    if (rect) {
      setHoverPosition({ 
        x: rect.left + rect.width / 2, 
        y: rect.bottom + 8 
      });
    }
    setShowHover(true);
  };
  
  // Build all badges (unfiltered)
  const getAllBadgesRaw = () => {
    if (!reputation?.primaryBadge) return [];
    
    const { primaryBadge, availableModifiers, isEarlyAdopter } = reputation;
    const badges = [];
    
    if (isEarlyAdopter) {
      badges.push({ emoji: '🏆', name: 'Early Adopter', description: 'First 100 GUARD holders' });
    }
    if (primaryBadge) {
      badges.push(primaryBadge);
    }
    if (availableModifiers) {
      availableModifiers.forEach(mod => badges.push(mod));
    }
    
    return badges;
  };
  
  // Get visible badges (filtered by user preference)
  const getVisibleBadges = () => {
    const all = getAllBadgesRaw();
    return all.filter(b => !hiddenBadges.includes(b.emoji));
  };
  
  // Determine the highest visible badge for color/glow
  const getHighestVisibleBadge = () => {
    const visible = getVisibleBadges();
    if (visible.length === 0) return null;
    
    // Priority order: Early Adopter > Founding > Diamond > OG > Veteran > Survivor > Believer > Holder > Modifiers
    const priority = ['🏆', '👑', '💎', '🌳', '🌿', '🌾', '🌱', '🍃', '⭐', '🔄'];
    for (const emoji of priority) {
      const badge = visible.find(b => b.emoji === emoji);
      if (badge) return badge;
    }
    return visible[0];
  };
  
  // Determine color and glow based on highest visible badge
  const getStyleClasses = () => {
    const highestBadge = getHighestVisibleBadge();
    if (!highestBadge) return { color: 'text-white', glow: '' };
    
    const emoji = highestBadge.emoji;
    
    // Early Adopter or Founding Member = Gold with glow
    if (emoji === '🏆' || emoji === '👑') {
      return { 
        color: 'text-amber-400', 
        glow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
      };
    }
    // Diamond Hands = Purple with glow
    if (emoji === '💎') {
      return { 
        color: 'text-purple-400', 
        glow: 'drop-shadow-[0_0_6px_rgba(192,132,252,0.5)]' 
      };
    }
    // OG = Cyan with subtle glow
    if (emoji === '🌳') {
      return { 
        color: 'text-cyan-400', 
        glow: 'drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]' 
      };
    }
    // Veteran = Teal
    if (emoji === '🌿') {
      return { 
        color: 'text-teal-400', 
        glow: 'drop-shadow-[0_0_4px_rgba(45,212,191,0.3)]' 
      };
    }
    // Survivor = Emerald
    if (emoji === '🌾') {
      return { 
        color: 'text-emerald-400', 
        glow: '' 
      };
    }
    // Believer = Green
    if (emoji === '🌱') {
      return { 
        color: 'text-green-400', 
        glow: '' 
      };
    }
    // Holder = Lime
    if (emoji === '🍃') {
      return { 
        color: 'text-lime-400', 
        glow: '' 
      };
    }
    
    return { color: 'text-white', glow: '' };
  };
  
  const { color, glow } = getStyleClasses();
  const visibleBadges = getVisibleBadges();
  
  // If children provided, wrap them with color. Otherwise just return colored span
  if (children) {
    return (
      <>
        <span 
          ref={nameRef}
          className={`${color} ${glow} ${visibleBadges.length > 0 ? 'cursor-help' : ''} transition-all`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowHover(false)}
        >
          {children}
        </span>
        
        {/* Tooltip */}
        {showHover && showTooltip && visibleBadges.length > 0 && ReactDOM.createPortal(
          <div 
            className="fixed z-[300] animate-fade-in pointer-events-none"
            style={{ 
              left: hoverPosition.x, 
              top: hoverPosition.y,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-[#1a1a25] border border-white/20 rounded-xl shadow-xl p-3 max-w-xs">
              <div className="space-y-2">
                {visibleBadges.map((badge, i) => (
                  <div key={badge.emoji} className={`flex items-center gap-2 ${i > 0 ? 'pt-2 border-t border-white/10' : ''}`}>
                    <span className="text-lg">{badge.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{badge.name}</p>
                      <p className="text-xs text-white/50">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }
  
  // Legacy mode - just return nothing (badges removed)
  return null;
};

// ============================================
// LANDING PAGE
// ============================================
const LandingPage = ({ onDevLogin }) => {
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);
  const [devWalletInput, setDevWalletInput] = useState('');
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-600/5 rounded-full blur-[150px]" />
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center font-bold text-[#0a0a0f]">
              C
            </div>
            <span className="text-xl font-semibold tracking-tight">Commune</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLearnMore(true)} className="text-white/60 hover:text-white transition-colors text-sm hidden sm:block">How it works</button>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button variant="secondary" size="sm" onClick={openConnectModal}>
                  <Icons.Wallet />
                  <span className="hidden sm:inline">Connect</span>
                </Button>
              )}
            </ConnectButton.Custom>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 animate-fade-in">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/70">Token-gated community</span>
          </div>
          
          {/* Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Your exclusive
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              GUARD community
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-white/50 max-w-xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Connect, chat, and collaborate with fellow GUARD token holders. 
            Real-time messaging and video calls, all in one beautiful space.
          </p>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button size="lg" onClick={openConnectModal}>
                  <Icons.Wallet />
                  <span>Connect Wallet</span>
                </Button>
              )}
            </ConnectButton.Custom>
            <Button variant="ghost" size="lg" onClick={() => setShowLearnMore(true)}>
              Learn more
            </Button>
          </div>

          {/* Dev Mode Button */}
          {onDevLogin && (
            <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
              {!showDevMode ? (
                <button
                  onClick={() => setShowDevMode(true)}
                  className="text-white/30 hover:text-white/50 text-xs transition-colors"
                >
                  🔧 Dev Mode
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={devWalletInput}
                      onChange={(e) => setDevWalletInput(e.target.value)}
                      placeholder="Enter wallet address (0x...)"
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 w-80"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (devWalletInput.startsWith('0x') && devWalletInput.length === 42) {
                          onDevLogin(devWalletInput);
                        }
                      }}
                      disabled={!devWalletInput.startsWith('0x') || devWalletInput.length !== 42}
                    >
                      Login
                    </Button>
                  </div>
                  <p className="text-white/30 text-xs">Enter any wallet address to test the Wrapped experience</p>
                </div>
              )}
            </div>
          )}

          {/* Token Requirement */}
          <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Card className="inline-flex items-center gap-6 px-8 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-amber-400/20">
                  <span className="text-2xl">🛡️</span>
                </div>
                <div className="text-left">
                  <p className="text-sm text-white/40">Required to access</p>
                  <p className="font-semibold">{TOKEN_CONFIG.requiredAmount} ${TOKEN_CONFIG.symbol}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-left">
                <p className="text-sm text-white/40">Network</p>
                <p className="font-semibold">{TOKEN_CONFIG.chainName}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <section id="how-it-works" className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-white/50">Built for seamless community interaction</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '💬',
                title: 'Real-time Chat',
                description: 'Instant messaging with emojis, reactions, and a clean interface.',
              },
              {
                icon: '📹',
                title: 'Video Calls',
                description: 'High-quality group video with one click. No downloads needed.',
              },
              {
                icon: '🔐',
                title: 'Token-Gated',
                description: 'Exclusive access verified through your wallet. Safe & secure.',
              },
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="p-8 hover:bg-white/[0.05] transition-colors group animate-fade-in-up"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-white/40">
          <p>© 2024 Commune. Powered by GUARD.</p>
          <div className="flex gap-6">
            <a href="https://guardfdn.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Website</a>
            <a href="https://bscscan.com/token/0xF606bd19b1E61574ED625d9ea96C841D4E247A32" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contract</a>
          </div>
        </div>
      </footer>
      
      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          <Card className="max-w-lg w-full p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">How It Works</h2>
              <button 
                onClick={() => setShowLearnMore(false)}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <Icons.X />
              </button>
            </div>
            
            <div className="space-y-6">
              <p className="text-white/70 leading-relaxed">
                This is a <span className="text-amber-400 font-medium">token-gated community</span>. 
                That means you need to hold a certain amount of GUARD tokens in your wallet to access it.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center text-amber-400 font-bold shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold mb-1">Connect Your Wallet</h3>
                    <p className="text-sm text-white/50">Link your MetaMask, Trust Wallet, or any Web3 wallet to the site.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center text-amber-400 font-bold shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold mb-1">Token Balance Check</h3>
                    <p className="text-sm text-white/50">We verify you hold at least {TOKEN_CONFIG.requiredAmount} GUARD tokens on BNB Smart Chain.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center text-amber-400 font-bold shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold mb-1">Sign to Verify Ownership</h3>
                    <p className="text-sm text-white/50">Sign a free message (no transaction, no gas fees) to prove you own the wallet.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-emerald-400/20 rounded-xl flex items-center justify-center text-emerald-400 font-bold shrink-0">✓</div>
                  <div>
                    <h3 className="font-semibold mb-1">Access Granted!</h3>
                    <p className="text-sm text-white/50">You're in! Enjoy chat, video calls, and connect with fellow GUARD holders.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-sm text-white/50">
                  <span className="text-emerald-400 font-medium">🔒 Safe & Secure:</span> We never ask for your private keys or seed phrase. 
                  The signature request is free and doesn't move any funds. All code is open source and available on{' '}
                  <a 
                    href="https://github.com/A0339x/Commune" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
                  >
                    GitHub
                  </a>.
                </p>
              </div>
            </div>
            
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button size="lg" className="w-full mt-6" onClick={() => { setShowLearnMore(false); openConnectModal(); }}>
                  <Icons.Wallet />
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
          </Card>
        </div>
      )}
      
      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes warning-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% { 
            transform: scale(1.01);
            box-shadow: 0 0 20px 5px rgba(239, 68, 68, 0.3);
          }
        }
        @keyframes warp {
          0%, 100% { 
            filter: hue-rotate(0deg) brightness(1);
          }
          25% { 
            filter: hue-rotate(-10deg) brightness(1.1);
          }
          75% { 
            filter: hue-rotate(10deg) brightness(1.1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-gradient-x {
          animation: gradient-x 2s ease infinite;
        }
        .animate-warning-pulse {
          animation: warning-pulse 1s ease-in-out infinite, warp 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// ============================================
// SIGN MESSAGE VERIFICATION PAGE (SIWE - EIP-4361)
// Industry standard used by Uniswap, OpenSea, and major dApps
// ============================================
const SignMessagePage = ({ onSuccess, tokenBalance, walletAddress }) => {
  const [nonce] = useState(generateNonce());
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState(null);

  const { signMessageAsync } = useSignMessage();

  const handleSign = async () => {
    setSigning(true);
    setError(null);

    try {
      // Create SIWE message following EIP-4361 standard
      // This includes domain binding, expiration, chain ID, and nonce
      const message = SIWE_CONFIG.createMessage(walletAddress, nonce);
      const signature = await signMessageAsync({ message });

      // Verify signature with the API using SIWE verification
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          signature,
          message,
          siwe: true, // Flag to use SIWE verification on backend
        }),
      });

      const data = await response.json();

      if (data.verified && data.token) {
        onSuccess(data.token);
      } else {
        setError(data.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Signing error:', err);
      if (err.message?.includes('User rejected')) {
        setError('You rejected the signature request. Please try again.');
      } else {
        setError('Failed to sign message. Please try again.');
      }
    } finally {
      setSigning(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
      </div>
      
      <Card className="relative z-10 max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-400/20">
          <Icons.Pen />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Verify Wallet Ownership</h1>
        <p className="text-white/50 mb-6">
          Sign a message to prove you own this wallet. This is free and doesn't trigger any transaction.
        </p>
        
        <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-white/40 mb-2">Your GUARD Balance</p>
          <p className="text-2xl font-bold text-amber-400">{tokenBalance} GUARD</p>
          <p className="text-xs text-emerald-400 mt-1">✓ Sufficient for access</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <Button size="lg" className="w-full" onClick={handleSign} disabled={signing}>
          {signing ? (
            <>
              <Spinner size="sm" />
              <span>Waiting for signature...</span>
            </>
          ) : (
            <>
              <Icons.Pen />
              <span>Sign Message</span>
            </>
          )}
        </Button>
        
        <p className="text-xs text-white/30 mt-4">
          Your wallet will ask you to sign a message. This proves ownership without any cost.
        </p>
      </Card>
    </div>
  );
};

// ============================================
// INSUFFICIENT TOKENS PAGE
// ============================================
const InsufficientTokensPage = ({ tokenBalance }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[100px]" />
      </div>
      
      <Card className="relative z-10 max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <Icons.Lock />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Insufficient GUARD Tokens</h1>
        <p className="text-white/50 mb-8">
          You need at least {TOKEN_CONFIG.requiredAmount} ${TOKEN_CONFIG.symbol} tokens to access this community.
        </p>
        
        <div className="bg-white/5 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/50">Your balance</span>
            <Badge variant="error">{tokenBalance} ${TOKEN_CONFIG.symbol}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50">Required</span>
            <Badge variant="success">{TOKEN_CONFIG.requiredAmount} ${TOKEN_CONFIG.symbol}</Badge>
          </div>
        </div>
        
        <div className="space-y-3">
          <a 
            href="https://pancakeswap.finance/swap?outputCurrency=0xF606bd19b1E61574ED625d9ea96C841D4E247A32" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="w-full" size="lg">
              Buy ${TOKEN_CONFIG.symbol} on PancakeSwap
            </Button>
          </a>
          <ConnectButton />
        </div>
      </Card>
    </div>
  );
};

// ============================================
// THREAD PREVIEW COMPONENT (Hover Peek)
// ============================================
const ThreadPreview = ({ message, replies, sessionToken, onClose, position, wsRef, walletAddress, rateLimited, rateLimitSeconds }) => {
  const [threadReplies, setThreadReplies] = useState(replies || []);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [exitDirection, setExitDirection] = useState({ x: 0, y: 0 });
  const previewRef = useRef(null);
  const repliesEndRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // Track mouse position while inside
  const handleMouseMove = (e) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  
  // Scroll to bottom when replies load or change
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [threadReplies]);
  
  // Load full thread
  useEffect(() => {
    const loadThread = async () => {
      try {
        const response = await fetch(`${API_URL}/api/thread?messageId=${message.id}`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        const data = await response.json();
        if (data.replies) {
          setThreadReplies(data.replies.map(r => ({
            ...r,
            user: truncateAddress(r.wallet),
            avatar: '🛡️',
            timestamp: new Date(r.timestamp),
          })));
        }
      } catch (error) {
        console.error('Failed to load thread:', error);
      }
    };
    loadThread();
  }, [message.id, sessionToken]);
  
  const handleClose = (e) => {
    // Calculate exit direction based on mouse movement
    const rect = previewRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Normalize direction
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
      
      setExitDirection({
        x: (dx / magnitude) * 30, // 30px movement
        y: (dy / magnitude) * 30,
      });
    }
    
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250); // Match the fade-out duration
  };
  
  const sendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    
    const content = replyText.trim();
    const tempId = `temp-preview-${Date.now()}`;
    
    // Optimistically add reply
    const tempReply = {
      id: tempId,
      wallet: walletAddress,
      content: content,
      user: truncateAddress(walletAddress),
      avatar: '🛡️',
      timestamp: new Date(),
    };
    setThreadReplies(prev => [...prev, tempReply]);
    setReplyText('');
    
    // Send via WebSocket
    if (wsRef?.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'reply',
          content: content,
          replyTo: message.id,
        }));
      } catch (error) {
        console.error('Failed to send reply via WebSocket:', error);
        // Remove temp on failure
        setThreadReplies(prev => prev.filter(r => r.id !== tempId));
      }
    } else {
      // Fallback to HTTP
      try {
        const response = await fetch(`${API_URL}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ content: content, replyTo: message.id }),
        });
        const data = await response.json();
        if (data.success) {
          setThreadReplies(prev => prev.filter(r => r.id !== tempId).concat({
            ...data.message,
            user: truncateAddress(data.message.wallet),
            avatar: '🛡️',
            timestamp: new Date(data.message.timestamp),
          }));
        }
      } catch (error) {
        console.error('Failed to send reply:', error);
        setThreadReplies(prev => prev.filter(r => r.id !== tempId));
      }
    }
    setSending(false);
  };
  
  return (
    <div
      ref={previewRef}
      className="fixed z-50 w-80 max-h-96 bg-[#1a1a25] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      style={{ 
        top: Math.max(80, Math.min(position.top - 50, window.innerHeight - 400)),
        left: Math.min(position.left + 20, window.innerWidth - 340),
        opacity: isClosing ? 0 : 1,
        transform: isClosing 
          ? `translate(${exitDirection.x}px, ${exitDirection.y}px) scale(0.95)` 
          : 'translate(0, 0) scale(1)',
        transition: 'opacity 250ms ease-out, transform 250ms ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleClose}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/5 bg-white/5 overflow-hidden">
        <div className="flex items-center gap-2">
          <Avatar emoji={message.avatar || '🛡️'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              <ReputationBadge wallet={message.wallet} showTooltip={false}>
                {message.displayName || message.user}
              </ReputationBadge>
            </p>
            <p className="text-xs text-white/40 line-clamp-1 break-all">{message.isGif ? '📷 GIF' : message.content}</p>
          </div>
        </div>
      </div>
      
      {/* Replies */}
      <div className="max-h-56 overflow-y-auto overflow-x-hidden p-3 space-y-3">
        {threadReplies.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No replies yet</p>
        ) : (
          threadReplies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <Avatar emoji={reply.avatar || '🛡️'} size="xs" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium truncate">
                    <ReputationBadge wallet={reply.wallet} showTooltip={false}>
                      {reply.displayName || reply.user}
                    </ReputationBadge>
                  </span>
                  <span className="text-xs text-white/20 flex-shrink-0">{formatTime(reply.timestamp)}</span>
                </div>
                {reply.isGif ? (
                  <img src={reply.content} alt="GIF" className="mt-1 max-w-32 rounded-lg" />
                ) : (
                  <p className="text-white/70 text-sm break-words">{reply.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={repliesEndRef} />
      </div>
      
      {/* Reply Input */}
      <div className="p-3 border-t border-white/5">
        {rateLimited ? (
          <div className="flex items-center justify-center py-2 text-amber-400/70 text-xs">
            🕵️ Nice try, but no loopholes here! Wait {rateLimitSeconds}s
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendReply()}
              placeholder="Reply..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400/50"
            />
            <button
              onClick={sendReply}
              disabled={!replyText.trim() || sending}
              className="px-3 py-2 bg-amber-500 rounded-lg text-black text-sm font-medium disabled:opacity-50"
            >
              {sending ? '...' : '↩'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// THREAD MODAL (Full Thread View)
// ============================================
const ThreadModal = ({ message, sessionToken, onClose, wsRef, walletAddress, onRegisterReplyCallback, tenorApiKey, rateLimited, rateLimitSeconds }) => {
  const [threadReplies, setThreadReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { replyId }
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [trendingGifs, setTrendingGifs] = useState([]);
  const repliesEndRef = useRef(null);
  const gifSearchTimeoutRef = useRef(null);
  
  // GIF Functions
  const fetchTrendingGifs = async () => {
    if (!tenorApiKey) return;
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${tenorApiKey}&limit=20&media_filter=gif,tinygif`
      );
      const data = await response.json();
      setTrendingGifs(data.results || []);
    } catch (error) {
      console.error('Failed to fetch trending GIFs:', error);
    }
  };
  
  const searchGifs = async (query) => {
    if (!query.trim() || !tenorApiKey) {
      setGifResults([]);
      return;
    }
    
    setGifLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?key=${tenorApiKey}&q=${encodeURIComponent(query)}&limit=20&media_filter=gif,tinygif`
      );
      const data = await response.json();
      setGifResults(data.results || []);
    } catch (error) {
      console.error('Failed to search GIFs:', error);
    } finally {
      setGifLoading(false);
    }
  };
  
  const handleGifSearchChange = (value) => {
    setGifSearch(value);
    if (gifSearchTimeoutRef.current) {
      clearTimeout(gifSearchTimeoutRef.current);
    }
    gifSearchTimeoutRef.current = setTimeout(() => {
      searchGifs(value);
    }, 300);
  };
  
  const sendGifReply = (gif) => {
    const gifUrl = gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url;
    if (!gifUrl) return;
    
    if (wsRef?.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reply',
        content: gifUrl,
        replyTo: message.id,
        isGif: true,
      }));
    }
    
    setShowGifPicker(false);
    setGifSearch('');
    setGifResults([]);
  };
  
  // Load trending GIFs when picker opens
  useEffect(() => {
    if (showGifPicker && trendingGifs.length === 0) {
      fetchTrendingGifs();
    }
  }, [showGifPicker]);
  
  // Edit a reply
  const saveReplyEdit = (replyId) => {
    if (!editReplyContent.trim()) return;
    
    if (wsRef?.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'edit_reply',
        replyId,
        content: editReplyContent.trim(),
      }));
      // Optimistically update
      setThreadReplies(prev => prev.map(r => 
        r.id === replyId ? { ...r, content: editReplyContent.trim(), editedAt: Date.now() } : r
      ));
    }
    setEditingReplyId(null);
    setEditReplyContent('');
  };
  
  // Delete a reply
  const deleteReply = (replyId) => {
    if (wsRef?.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'delete_reply',
        replyId,
      }));
      // Optimistically update
      setThreadReplies(prev => prev.map(r => 
        r.id === replyId ? { ...r, content: 'Message deleted', deleted: true } : r
      ));
    }
  };
  
  // Register callback for receiving new replies via WebSocket
  useEffect(() => {
    if (onRegisterReplyCallback) {
      onRegisterReplyCallback((parentId, reply) => {
        if (parentId === message.id) {
          setThreadReplies(prev => {
            // Check if this reply already exists (avoid duplicates)
            const exists = prev.some(r => 
              r.id === reply.id || 
              (r.id?.startsWith('temp-') && r.content === reply.content && r.wallet?.toLowerCase() === reply.wallet?.toLowerCase())
            );
            if (exists) {
              // Replace temp with real reply
              return prev.map(r => 
                (r.id?.startsWith('temp-') && r.content === reply.content && r.wallet?.toLowerCase() === reply.wallet?.toLowerCase())
                  ? reply
                  : r
              );
            }
            return [...prev, reply];
          });
        }
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (onRegisterReplyCallback) {
        onRegisterReplyCallback(null);
      }
    };
  }, [message.id, onRegisterReplyCallback]);
  
  // Load full thread
  useEffect(() => {
    const loadThread = async () => {
      try {
        const response = await fetch(`${API_URL}/api/thread?messageId=${message.id}`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        const data = await response.json();
        if (data.replies) {
          setThreadReplies(data.replies.map(r => ({
            ...r,
            user: truncateAddress(r.wallet),
            avatar: '🛡️',
            timestamp: new Date(r.timestamp),
          })));
        }
      } catch (error) {
        console.error('Failed to load thread:', error);
      } finally {
        setLoading(false);
      }
    };
    loadThread();
    
    // Poll for new replies less frequently since we have WebSocket
    const interval = setInterval(loadThread, 30000);
    return () => clearInterval(interval);
  }, [message.id, sessionToken]);
  
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadReplies]);
  
  const sendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    
    const content = replyText.trim();
    const tempId = `temp-reply-${Date.now()}`;
    
    // Optimistically add reply
    const tempReply = {
      id: tempId,
      wallet: walletAddress,
      content: content,
      user: truncateAddress(walletAddress),
      avatar: '🛡️',
      timestamp: new Date(),
      sendStatus: 'sending',
    };
    setThreadReplies(prev => [...prev, tempReply]);
    setReplyText('');
    
    // Send via WebSocket
    if (wsRef?.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'reply',
          content: content,
          replyTo: message.id,
        }));
        // The WebSocket handler will confirm and update via callback
      } catch (error) {
        console.error('Failed to send reply via WebSocket:', error);
        // Mark as failed
        setThreadReplies(prev => prev.map(r => 
          r.id === tempId ? { ...r, sendStatus: 'failed' } : r
        ));
      }
    } else {
      // Fallback to HTTP if WebSocket unavailable
      try {
        const response = await fetch(`${API_URL}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ content: content, replyTo: message.id }),
        });
        const data = await response.json();
        if (data.success) {
          // Replace temp with real reply
          setThreadReplies(prev => prev.filter(r => r.id !== tempId).concat({
            ...data.message,
            user: truncateAddress(data.message.wallet),
            avatar: '🛡️',
            timestamp: new Date(data.message.timestamp),
          }));
        }
      } catch (error) {
        console.error('Failed to send reply:', error);
        setThreadReplies(prev => prev.map(r => 
          r.id === tempId ? { ...r, sendStatus: 'failed' } : r
        ));
      }
    }
    setSending(false);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - blurred chat visible behind */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Thread Panel */}
      <div className="relative z-10 w-full max-w-lg bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold">{showGifPicker ? 'Select GIF' : 'Thread'}</h3>
          <button
            onClick={() => showGifPicker ? setShowGifPicker(false) : onClose()}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <Icons.X />
          </button>
        </div>
        
        {/* GIF Picker - replaces content when open */}
        {showGifPicker ? (
          <>
            {/* Backdrop to close on click outside */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowGifPicker(false)}
            />
            <div className="flex-1 flex flex-col p-4 z-20 min-h-[400px]">
              <input
                type="text"
                value={gifSearch}
                onChange={(e) => handleGifSearchChange(e.target.value)}
                placeholder="Search GIFs..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-amber-400/50 flex-shrink-0"
                autoFocus
              />
              <div className="flex-1 overflow-y-auto">
                {gifLoading ? (
                  <div className="flex justify-center py-8"><Spinner size="sm" /></div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(gifSearch ? gifResults : trendingGifs).map((gif) => (
                      <img
                        key={gif.id}
                        src={gif.media_formats?.tinygif?.url}
                        alt="GIF"
                        onClick={() => sendGifReply(gif)}
                        className="w-full h-28 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </div>
                )}
                {!gifLoading && gifSearch && gifResults.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-4">No GIFs found</p>
                )}
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-end flex-shrink-0">
                <span className="text-xs text-white/30">Powered by Tenor</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Original Message */}
            <div className="p-4 bg-white/5 border-b border-white/5 flex-shrink-0">
              <div className="flex gap-3">
                <Avatar emoji={message.avatar || '🛡️'} size="md" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <ReputationBadge wallet={message.wallet}>
                      <span className="font-medium">{message.displayName || message.user}</span>
                    </ReputationBadge>
                    {message.displayName && (
                      <span className="text-xs text-white/20 font-mono">{message.user}</span>
                    )}
                    <span className="text-xs text-white/30">{formatTime(message.timestamp)}</span>
                  </div>
                  <p className="text-white/80 mt-1">{message.content}</p>
                </div>
              </div>
            </div>
            
            {/* Replies Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : threadReplies.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No replies yet. Be the first!</p>
          ) : (
            threadReplies.map((reply) => {
              const canModifyReply = !reply.deleted && 
                reply.wallet?.toLowerCase() === walletAddress?.toLowerCase() &&
                Date.now() - (typeof reply.timestamp === 'number' ? reply.timestamp : new Date(reply.timestamp).getTime()) < 15 * 60 * 1000;
              
              return (
                <div key={reply.id} className="flex gap-3 group">
                  <Avatar emoji={reply.avatar || '🛡️'} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <ReputationBadge wallet={reply.wallet}>
                        <span className="text-sm font-medium">{reply.displayName || reply.user}</span>
                      </ReputationBadge>
                      {reply.displayName && (
                        <span className="text-xs text-white/20 font-mono">{reply.user}</span>
                      )}
                      <span className="text-xs text-white/30">{formatTime(reply.timestamp)}</span>
                      {reply.editedAt && !reply.deleted && (
                        <span className="text-xs text-white/20">(edited)</span>
                      )}
                    </div>
                    {editingReplyId === reply.id ? (
                      <div className="mt-1">
                        <input
                          type="text"
                          value={editReplyContent}
                          onChange={(e) => setEditReplyContent(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveReplyEdit(reply.id)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400/50"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => saveReplyEdit(reply.id)} className="text-xs px-3 py-1 bg-amber-500 text-black rounded-lg font-medium">Save</button>
                          <button onClick={() => { setEditingReplyId(null); setEditReplyContent(''); }} className="text-xs px-3 py-1 bg-white/10 text-white/70 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : reply.deleted ? (
                      <p className="text-sm mt-1 text-white/40 italic">Message deleted</p>
                    ) : reply.isGif ? (
                      <img src={reply.content} alt="GIF" className="mt-1 max-w-48 rounded-lg" />
                    ) : (
                      <p className="text-sm mt-1 text-white/70">{reply.content}</p>
                    )}
                    {canModifyReply && editingReplyId !== reply.id && !reply.isGif && (
                      <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingReplyId(reply.id); setEditReplyContent(reply.content); }}
                          className="text-xs text-white/30 hover:text-amber-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ replyId: reply.id })}
                          className="text-xs text-white/30 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {/* Delete only for GIF replies */}
                    {canModifyReply && reply.isGif && (
                      <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDeleteConfirm({ replyId: reply.id })}
                          className="text-xs text-white/30 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={repliesEndRef} />
        </div>
        
        {/* Reply Input */}
        <div className="p-4 border-t border-white/5 flex-shrink-0">
          {rateLimited ? (
            <div className="flex items-center justify-center py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <span className="text-amber-400/80 text-sm">🕵️ Sneaky! But threads count too. Wait {rateLimitSeconds}s</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={`px-3 py-3 rounded-xl transition-colors ${showGifPicker ? 'bg-amber-400/20 text-amber-400' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                title="Send GIF"
              >
                GIF
              </button>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                placeholder="Reply to thread..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400/50"
              />
              <Button onClick={sendReply} disabled={!replyText.trim() || sending}>
                {sending ? <Spinner size="sm" /> : <Icons.Send />}
              </Button>
            </div>
          )}
        </div>
          </>
        )}
      </div>
      
      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteReply(deleteConfirm?.replyId)}
        title="Delete Reply"
        message="Are you sure you want to delete this reply? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

// ============================================
// CHAT COMPONENT
// ============================================
const ChatRoom = ({ walletAddress, sessionToken }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [openThread, setOpenThread] = useState(null);
  const [hoverThread, setHoverThread] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 100 });
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [trendingGifs, setTrendingGifs] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeWarning, setActiveWarning] = useState(null);
  const [warningPulse, setWarningPulse] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [announcementVisible, setAnnouncementVisible] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]); // Messages waiting for server confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { messageId } for delete confirmation
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  
  // Onboarding state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  
  // Rate limit state
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const rateLimitIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const gifSearchTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const mentionSoundRef = useRef(null);
  const lastMessageTimestampRef = useRef(0); // Track last received message timestamp
  const retryQueueRef = useRef([]); // Queue for failed messages to retry
  const retryTimeoutRef = useRef(null);
  const threadReplyCallbackRef = useRef(null); // Callback for ThreadModal to receive new replies
  
  const emojis = ['👍', '❤️', '😂', '🔥', '🚀', '💎', '🛡️', '👏'];
  
  // Tenor API Key - fetched from server
  const [tenorApiKey, setTenorApiKey] = useState('');
  
  // Listen for chat menu events
  useEffect(() => {
    const handleSearch = (e) => {
      const query = e.detail.query.toLowerCase();
      setSearchQuery(query);
      
      // Find matching messages
      const results = messages.filter(msg => 
        msg.content?.toLowerCase().includes(query) ||
        msg.displayName?.toLowerCase().includes(query) ||
        msg.user?.toLowerCase().includes(query)
      );
      setSearchResults(results);
      
      // Scroll to first result if found
      if (results.length > 0) {
        const firstResult = results[0];
        setHighlightedMessageId(firstResult.id);
        const element = document.getElementById(`msg-${firstResult.id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedMessageId(null), 3000);
      }
    };
    
    const handleScrollTop = () => {
      messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleScrollBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    window.addEventListener('chat-search', handleSearch);
    window.addEventListener('chat-scroll-top', handleScrollTop);
    window.addEventListener('chat-scroll-bottom', handleScrollBottom);
    
    return () => {
      window.removeEventListener('chat-search', handleSearch);
      window.removeEventListener('chat-scroll-top', handleScrollTop);
      window.removeEventListener('chat-scroll-bottom', handleScrollBottom);
    };
  }, [messages]);
  
  // Check if first visit and show onboarding
  useEffect(() => {
    const hasVisited = localStorage.getItem('commune_visited');
    
    if (!hasVisited) {
      setIsFirstVisit(true);
      setShowWelcomeModal(true);
      localStorage.setItem('commune_visited', 'true');
    }
  }, []);
  
  // Fetch warnings on mount
  useEffect(() => {
    const fetchWarnings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/warnings`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        const data = await response.json();
        if (data.warnings && data.warnings.length > 0) {
          // Show the most recent unacknowledged warning
          setActiveWarning(data.warnings[0]);
          triggerWarningPulse();
        }
      } catch (error) {
        console.error('Failed to fetch warnings:', error);
      }
    };
    fetchWarnings();
  }, [sessionToken]);
  
  // Trigger warning pulse animation
  const triggerWarningPulse = () => {
    setWarningPulse(true);
    // Pulse 5 times
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
      pulseCount++;
      if (pulseCount >= 10) {
        clearInterval(pulseInterval);
      }
    }, 500);
  };
  
  // Acknowledge warning
  const acknowledgeWarning = async () => {
    if (!activeWarning) return;
    try {
      await fetch(`${API_URL}/api/warnings/ack`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ warningId: activeWarning.id }),
      });
      setActiveWarning(null);
      setWarningPulse(false);
    } catch (error) {
      console.error('Failed to acknowledge warning:', error);
    }
  };
  
  // Fetch Tenor API key on mount
  useEffect(() => {
    const fetchTenorKey = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tenor-key`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        const data = await response.json();
        if (data.key) {
          setTenorApiKey(data.key);
        }
      } catch (error) {
        console.error('Failed to fetch Tenor API key:', error);
      }
    };
    fetchTenorKey();
  }, [sessionToken]);
  
  // Initialize notification sounds
  useEffect(() => {
    // Create audio elements for notifications
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19teleEAGZtdCAQAAAAAQABAEARAABAAQACABAAZGF0YU' + 'A'.repeat(100));
    notificationSoundRef.current.volume = 0.3;
    mentionSoundRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19teleEAGZtdCAQAAAAAQABAEARAABAAQACABAAZGF0YU' + 'A'.repeat(100));
    mentionSoundRef.current.volume = 0.5;
  }, []);
  
  // Play notification sound
  const playNotificationSound = (isMention = false) => {
    if (!soundEnabled) return;
    try {
      // Use Web Audio API for a simple beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = isMention ? 880 : 660; // Higher pitch for mentions
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Audio not supported
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // WebSocket URL
  const WS_URL = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  
  // Track last pong received
  const lastPongRef = useRef(Date.now());
  const connectionCheckRef = useRef(null);
  
  // Connect to WebSocket
  const connectWebSocket = () => {
    // Clean up existing connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    
    console.log('Connecting to WebSocket...');
    // Pass token via subprotocol header instead of URL query string for security
    // Remove '=' padding as it's invalid in WebSocket subprotocol names (RFC 6455)
    const safeToken = sessionToken.replace(/=/g, '');
    const ws = new WebSocket(`${WS_URL}/api/ws`, [`auth-${safeToken}`]);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      lastPongRef.current = Date.now();
      
      // If we have previous messages, do incremental fetch; otherwise full load
      const isReconnect = lastMessageTimestampRef.current > 0;
      loadMessageHistory(isReconnect);
      
      // Process retry queue
      if (retryQueueRef.current.length > 0) {
        console.log(`Processing ${retryQueueRef.current.length} queued messages`);
        const queue = [...retryQueueRef.current];
        retryQueueRef.current = [];
        queue.forEach(msg => {
          try {
            ws.send(JSON.stringify(msg));
          } catch (e) {
            console.error('Failed to send queued message:', e);
            retryQueueRef.current.push(msg);
          }
        });
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
      setConnected(false);
      wsRef.current = null;
      // Reconnect after 2 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 2000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Force close to trigger reconnect
      try {
        ws.close();
      } catch (e) {}
    };
  };
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'new_message':
        // Update last message timestamp
        if (data.message.timestamp > lastMessageTimestampRef.current) {
          lastMessageTimestampRef.current = data.message.timestamp;
        }
        
        // Check if this message mentions us
        const isMentioned = data.message.mentions?.some(
          m => m.toLowerCase() === walletAddress?.toLowerCase()
        );
        const isOwnMessage = data.message.wallet?.toLowerCase() === walletAddress?.toLowerCase();
        
        // Play sound for new messages (not our own)
        if (!isOwnMessage) {
          playNotificationSound(isMentioned);
        }
        
        // Clear typing indicator for this user
        setTypingUsers(prev => prev.filter(u => u.wallet.toLowerCase() !== data.message.wallet.toLowerCase()));
        
        // If this is our own message, remove from pending and update temp message
        if (isOwnMessage) {
          setPendingMessages(prev => prev.filter(p => 
            !(p.content === data.message.content && p.status === 'sending')
          ));
        }
        
        setMessages(prev => {
          // Remove any temp message with same content from same wallet
          const filtered = prev.filter(m => 
            !(m.id?.startsWith('temp-') && 
              m.content === data.message.content && 
              m.wallet.toLowerCase() === data.message.wallet.toLowerCase())
          );
          return [...filtered, {
            ...data.message,
            user: truncateAddress(data.message.wallet),
            avatar: '🛡️',
            timestamp: new Date(data.message.timestamp),
            recentReplies: [],
          }].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        break;
        
      case 'new_reply':
        // Update main message's recent replies preview
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.parentId) {
            const newReplies = [...(msg.recentReplies || []), {
              ...data.reply,
              displayName: data.reply.displayName,
              user: truncateAddress(data.reply.wallet),
              avatar: '🛡️',
              timestamp: new Date(data.reply.timestamp),
            }].slice(-3);
            return {
              ...msg,
              replyCount: (msg.replyCount || 0) + 1,
              recentReplies: newReplies,
            };
          }
          return msg;
        }));
        
        // Notify ThreadModal if it's open for this thread
        if (threadReplyCallbackRef.current) {
          threadReplyCallbackRef.current(data.parentId, {
            ...data.reply,
            displayName: data.reply.displayName,
            user: truncateAddress(data.reply.wallet),
            avatar: '🛡️',
            timestamp: new Date(data.reply.timestamp),
          });
        }
        
        // Play sound for replies (not our own)
        if (data.reply.wallet?.toLowerCase() !== walletAddress?.toLowerCase()) {
          playNotificationSound(false);
        }
        break;
        
      case 'message_edited':
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              content: data.content,
              editedAt: data.editedAt,
            };
          }
          return msg;
        }));
        break;
        
      case 'message_deleted':
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              content: 'Message deleted',
              deleted: true,
            };
          }
          return msg;
        }));
        break;
        
      case 'reply_edited':
        // Update reply in the parent message's recentReplies
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.parentId) {
            return {
              ...msg,
              recentReplies: (msg.recentReplies || []).map(r => 
                r.id === data.replyId 
                  ? { ...r, content: data.content, editedAt: data.editedAt }
                  : r
              ),
            };
          }
          return msg;
        }));
        break;
        
      case 'reply_deleted':
        // Update reply in the parent message's recentReplies
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.parentId) {
            return {
              ...msg,
              recentReplies: (msg.recentReplies || []).map(r => 
                r.id === data.replyId 
                  ? { ...r, content: 'Message deleted', deleted: true }
                  : r
              ),
            };
          }
          return msg;
        }));
        break;
        
      case 'reaction_updated':
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              reactions: data.reactions,
            };
          }
          return msg;
        }));
        break;
        
      case 'user_typing':
        setTypingUsers(prev => {
          // Add user if not already in list
          if (!prev.some(u => u.wallet.toLowerCase() === data.wallet.toLowerCase())) {
            return [...prev, { wallet: data.wallet, displayName: data.displayName }];
          }
          return prev;
        });
        // Auto-remove after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.wallet.toLowerCase() !== data.wallet.toLowerCase()));
        }, 3000);
        break;
        
      case 'user_stop_typing':
        setTypingUsers(prev => prev.filter(u => u.wallet.toLowerCase() !== data.wallet.toLowerCase()));
        break;
        
      case 'displayname_changed':
        // Update display name in all messages from this user
        setMessages(prev => prev.map(msg => {
          if (msg.wallet?.toLowerCase() === data.wallet?.toLowerCase()) {
            return {
              ...msg,
              displayName: data.displayName,
              recentReplies: (msg.recentReplies || []).map(r => 
                r.wallet?.toLowerCase() === data.wallet?.toLowerCase()
                  ? { ...r, displayName: data.displayName }
                  : r
              ),
            };
          }
          // Also update replies in other messages
          return {
            ...msg,
            recentReplies: (msg.recentReplies || []).map(r => 
              r.wallet?.toLowerCase() === data.wallet?.toLowerCase()
                ? { ...r, displayName: data.displayName }
                : r
            ),
          };
        }));
        // Update online users list
        setOnlineUsers(prev => prev.map(u => 
          u.wallet?.toLowerCase() === data.wallet?.toLowerCase()
            ? { ...u, displayName: data.displayName }
            : u
        ));
        break;
        
      case 'online_users':
        setOnlineUsers(data.users || []);
        setOnlineCount(data.count || 0);
        break;
        
      case 'user_joined':
        setOnlineCount(data.onlineCount || 0);
        break;
        
      case 'user_left':
        setOnlineCount(data.onlineCount || 0);
        setTypingUsers(prev => prev.filter(u => u.wallet.toLowerCase() !== data.wallet?.toLowerCase()));
        break;
        
      case 'pong':
        // Keep-alive response - update last pong time
        lastPongRef.current = Date.now();
        break;
        
      case 'error':
        console.error('WebSocket error:', data.message);
        // Check for rate limit error
        if (data.message && data.message.includes('Slow down')) {
          // Extract seconds from message like "Slow down! Try again in 5 seconds."
          const match = data.message.match(/(\d+)\s*seconds?/);
          const seconds = match ? parseInt(match[1]) : 10;
          startRateLimitCountdown(seconds);
        }
        break;
        
      case 'warning':
        // Received a warning from admin
        setActiveWarning(data.warning);
        triggerWarningPulse();
        // Play alert sound
        if (soundEnabled) {
          playNotificationSound(true);
        }
        break;
        
      case 'announcement':
        // Received an announcement
        setAnnouncement(data.announcement);
        setAnnouncementVisible(true);
        // Auto-hide after 30 seconds for non-urgent
        if (data.announcement.type !== 'urgent') {
          setTimeout(() => setAnnouncementVisible(false), 30000);
        }
        break;
    }
  };
  
  // Load message history via HTTP
  // If incremental=true, only fetch messages after lastMessageTimestampRef
  const loadMessageHistory = async (incremental = false) => {
    try {
      const afterParam = incremental && lastMessageTimestampRef.current > 0 
        ? `?after=${lastMessageTimestampRef.current}` 
        : '';
      
      const response = await fetch(`${API_URL}/api/messages${afterParam}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        const newMessages = data.messages.map(msg => ({
          ...msg,
          user: truncateAddress(msg.wallet),
          avatar: '🛡️',
          timestamp: new Date(msg.timestamp),
          recentReplies: (msg.recentReplies || []).map(r => ({
            ...r,
            user: truncateAddress(r.wallet),
            avatar: '🛡️',
            timestamp: new Date(r.timestamp),
          })),
        }));
        
        // Update lastMessageTimestamp
        const maxTimestamp = Math.max(...data.messages.map(m => m.timestamp));
        if (maxTimestamp > lastMessageTimestampRef.current) {
          lastMessageTimestampRef.current = maxTimestamp;
        }
        
        if (incremental) {
          // Merge new messages, avoiding duplicates
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
            if (uniqueNew.length === 0) return prev;
            return [...prev, ...uniqueNew].sort((a, b) => 
              new Date(a.timestamp) - new Date(b.timestamp)
            );
          });
          console.log(`Fetched ${newMessages.length} missed messages`);
        } else {
          // Full load - replace all
          setMessages(newMessages);
          // Scroll to bottom after messages load
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Failed to load message history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connectWebSocket();
    
    // Keep-alive ping every 10 seconds (more aggressive)
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 10000);
    
    // Check connection health every 10 seconds
    // If no pong received in 25 seconds, force reconnect
    connectionCheckRef.current = setInterval(() => {
      const timeSinceLastPong = Date.now() - lastPongRef.current;
      
      if (timeSinceLastPong > 25000) {
        console.log('Connection stale (no pong in 25s), forcing reconnect...');
        setConnected(false);
        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch (e) {}
          wsRef.current = null;
        }
        connectWebSocket();
      } else if (wsRef.current?.readyState !== WebSocket.OPEN && connected) {
        // State mismatch - we think we're connected but we're not
        console.log('Connection state mismatch, forcing reconnect...');
        setConnected(false);
        connectWebSocket();
      }
    }, 10000);
    
    // Also check on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, checking connection...');
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          console.log('Connection lost while tab was hidden, reconnecting...');
          setConnected(false);
          connectWebSocket();
        } else {
          // Send a ping to verify connection is actually alive
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
          // Also fetch any missed messages
          loadMessageHistory(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check on online/offline events
    const handleOnline = () => {
      console.log('Browser came online, checking connection...');
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }
    };
    window.addEventListener('online', handleOnline);
    
    return () => {
      clearInterval(pingInterval);
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionToken]);
  
  // Rate limit countdown
  const startRateLimitCountdown = (seconds) => {
    setRateLimited(true);
    setRateLimitSeconds(seconds);
    
    // Clear any existing interval
    if (rateLimitIntervalRef.current) {
      clearInterval(rateLimitIntervalRef.current);
    }
    
    rateLimitIntervalRef.current = setInterval(() => {
      setRateLimitSeconds(prev => {
        if (prev <= 1) {
          clearInterval(rateLimitIntervalRef.current);
          setRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Cleanup rate limit interval on unmount
  useEffect(() => {
    return () => {
      if (rateLimitIntervalRef.current) {
        clearInterval(rateLimitIntervalRef.current);
      }
    };
  }, []);
  
  const sendMessage = async (replyTo = null) => {
    if (!newMessage.trim() || sending || rateLimited) return;
    
    const messageContent = newMessage;
    const tempId = `temp-${Date.now()}`;
    const sendTime = Date.now();
    
    const messagePayload = {
      type: replyTo ? 'reply' : 'message',
      content: messageContent,
      replyTo,
      mentions: selectedMentions.map(m => m.wallet),
      tempId, // Include for tracking
    };
    
    const tempMessage = {
      id: tempId,
      content: messageContent,
      wallet: walletAddress,
      user: truncateAddress(walletAddress),
      avatar: '🛡️',
      timestamp: new Date(),
      replyCount: 0,
      recentReplies: [],
      sendStatus: 'sending', // 'sending' | 'sent' | 'failed'
    };
    
    // Optimistically add message immediately
    if (!replyTo) {
      setMessages(prev => [...prev, tempMessage]);
      setTimeout(() => scrollToBottom(), 100);
    }
    setNewMessage('');
    
    // Add to pending
    setPendingMessages(prev => [...prev, { content: messageContent, status: 'sending', tempId, sendTime }]);
    
    // Stop typing indicator
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_typing' }));
    }
    isTypingRef.current = false;
    
    // Try to send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(messagePayload));
      } catch (error) {
        console.error('Failed to send message via WebSocket:', error);
        // Add to retry queue
        retryQueueRef.current.push(messagePayload);
        // Update message status to failed
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, sendStatus: 'failed' } : m
        ));
        setPendingMessages(prev => prev.map(p => 
          p.tempId === tempId ? { ...p, status: 'failed' } : p
        ));
        // Try to reconnect
        setConnected(false);
        connectWebSocket();
      }
    } else {
      // Not connected - queue for retry
      console.log('WebSocket not connected, queuing message for retry');
      retryQueueRef.current.push(messagePayload);
      // Update message status
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, sendStatus: 'queued' } : m
      ));
      setPendingMessages(prev => prev.map(p => 
        p.tempId === tempId ? { ...p, status: 'queued' } : p
      ));
      // Try to reconnect
      setConnected(false);
      connectWebSocket();
    }
    
    // Set a timeout to mark as failed if no confirmation
    setTimeout(() => {
      setPendingMessages(prev => {
        const pending = prev.find(p => p.tempId === tempId && p.status === 'sending');
        if (pending) {
          // Still pending after 10 seconds - mark as potentially failed
          setMessages(msgs => msgs.map(m => 
            m.id === tempId && m.sendStatus === 'sending' 
              ? { ...m, sendStatus: 'slow' } 
              : m
          ));
        }
        return prev;
      });
    }, 10000);
    
    // Clear selected mentions
    setSelectedMentions([]);
  };
  
  // Retry a failed message
  const retryMessage = (tempId) => {
    setMessages(prev => {
      const msg = prev.find(m => m.id === tempId);
      if (msg && (msg.sendStatus === 'failed' || msg.sendStatus === 'queued')) {
        const messagePayload = {
          type: 'message',
          content: msg.content,
          mentions: msg.mentions || [],
          tempId,
        };
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify(messagePayload));
            return prev.map(m => m.id === tempId ? { ...m, sendStatus: 'sending' } : m);
          } catch (e) {
            retryQueueRef.current.push(messagePayload);
          }
        } else {
          retryQueueRef.current.push(messagePayload);
          connectWebSocket();
        }
      }
      return prev;
    });
  };
  
  // Handle typing indicator
  const handleTyping = () => {
    if (!isTypingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }));
      isTypingRef.current = true;
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop_typing' }));
      }
      isTypingRef.current = false;
    }, 2000);
  };
  
  // Handle input change with mention detection
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    handleTyping();
    
    // Check for @ mention trigger
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      // Show mentions if @ is at end or followed by text without space
      if (!textAfterAt.includes(' ')) {
        setShowMentions(true);
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };
  
  // Filter online users for mention dropdown
  const filteredMentionUsers = onlineUsers.filter(user => {
    const name = (user.displayName || truncateAddress(user.wallet)).toLowerCase();
    return name.includes(mentionSearch);
  });
  
  // Select a mention
  const selectMention = (user) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    const beforeAt = newMessage.slice(0, lastAtIndex);
    const mentionText = user.displayName || truncateAddress(user.wallet);
    
    setNewMessage(beforeAt + '@' + mentionText + ' ');
    setSelectedMentions(prev => [...prev, user]);
    setShowMentions(false);
    inputRef.current?.focus();
  };
  
  // Handle mention keyboard navigation
  const handleMentionKeyDown = (e) => {
    if (!showMentions || filteredMentionUsers.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex(prev => (prev + 1) % filteredMentionUsers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(prev => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
    } else if (e.key === 'Enter' && showMentions) {
      e.preventDefault();
      selectMention(filteredMentionUsers[mentionIndex]);
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };
  
  // Start editing a message
  const startEditing = (msg) => {
    setEditingMessage(msg.id);
    setEditContent(msg.content);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingMessage(null);
    setEditContent('');
  };
  
  // Save edited message
  const saveEdit = () => {
    if (!editContent.trim() || !editingMessage) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'edit',
        messageId: editingMessage,
        content: editContent.trim(),
      }));
      // Optimistically update
      setMessages(prev => prev.map(m => 
        m.id === editingMessage 
          ? { ...m, content: editContent.trim(), editedAt: Date.now() }
          : m
      ));
    } else {
      // Show error toast or reconnect
      console.error('Cannot edit - connection lost');
      setConnected(false);
      connectWebSocket();
    }
    
    cancelEditing();
  };
  
  // Delete a message (called after confirmation)
  const deleteMessage = (messageId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'delete',
        messageId,
      }));
      // Optimistically update
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, content: 'Message deleted', deleted: true }
          : m
      ));
    } else {
      // Show error and reconnect
      console.error('Cannot delete - connection lost');
      setConnected(false);
      connectWebSocket();
    }
  };
  
  // Check if user can edit/delete (own message, within 15 min)
  const canModify = (msg) => {
    if (msg.deleted) return false;
    if (msg.wallet?.toLowerCase() !== walletAddress?.toLowerCase()) return false;
    const fifteenMinutes = 15 * 60 * 1000;
    const msgTime = typeof msg.timestamp === 'number' ? msg.timestamp : new Date(msg.timestamp).getTime();
    return Date.now() - msgTime < fifteenMinutes;
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Handle hover for thread preview
  const handleMouseEnter = (msg, event) => {
    if (msg.replyCount > 0) {
      // Use mouse position directly
      setHoverPosition({ 
        top: event.clientY,
        left: event.clientX,
      });
      
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverThread(msg);
      }, 500); // 500ms delay before showing preview
    }
  };
  
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };
  
  // Render message content with highlighted mentions and clickable links
  const renderMessageContent = (content, mentions = []) => {
    if (!content) return null;
    
    // Check if current user is mentioned
    const isMentioned = mentions?.some(m => m.toLowerCase() === walletAddress?.toLowerCase());
    
    // Combined regex for URLs and @mentions
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mentionRegex = /@(\S+)/g;
    
    // First, split by URLs
    const urlParts = content.split(urlRegex);
    const urls = content.match(urlRegex) || [];
    
    const processedParts = [];
    let urlIndex = 0;
    
    urlParts.forEach((part, i) => {
      if (urls.includes(part)) {
        // This is a URL - wrap in LinkPreview
        const displayUrl = part.length > 50 ? part.slice(0, 47) + '...' : part;
        processedParts.push(
          <LinkPreview key={`url-${i}`} url={part}>
            {displayUrl}
          </LinkPreview>
        );
        urlIndex++;
      } else {
        // Process mentions within this part
        const mentionParts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = mentionRegex.exec(part)) !== null) {
          // Add text before mention
          if (match.index > lastIndex) {
            mentionParts.push(part.slice(lastIndex, match.index));
          }
          // Add highlighted mention
          mentionParts.push(
            <span key={`mention-${i}-${match.index}`} className="text-amber-400 font-medium">
              {match[0]}
            </span>
          );
          lastIndex = match.index + match[0].length;
        }
        // Add remaining text
        if (lastIndex < part.length) {
          mentionParts.push(part.slice(lastIndex));
        }
        
        // Reset regex
        mentionRegex.lastIndex = 0;
        
        if (mentionParts.length > 0) {
          processedParts.push(...mentionParts);
        } else if (part) {
          processedParts.push(part);
        }
      }
    });
    
    return processedParts.length > 0 ? processedParts : content;
  };
  
  // Reaction picker state
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const reactionEmojis = ['👍', '❤️', '😂', '🔥', '🚀', '💎', '🛡️', '👏'];
  
  // Toggle reaction on a message
  const toggleReaction = (messageId, emoji) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reaction',
        messageId,
        emoji,
      }));
    }
    setShowReactionPicker(null);
    setHoveredEmoji(null);
  };
  
  // Handle mouse leave from reaction picker - select the last hovered emoji
  const handleReactionPickerLeave = (messageId) => {
    if (hoveredEmoji) {
      toggleReaction(messageId, hoveredEmoji);
    } else {
      setShowReactionPicker(null);
    }
  };
  
  // Check if current user has reacted with specific emoji
  const hasReacted = (reactions, emoji) => {
    if (!reactions || !reactions[emoji]) return false;
    return reactions[emoji].some(w => w.toLowerCase() === walletAddress?.toLowerCase());
  };
  
  // GIF Functions
  const fetchTrendingGifs = async () => {
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${tenorApiKey}&limit=20&media_filter=gif,tinygif`
      );
      const data = await response.json();
      setTrendingGifs(data.results || []);
    } catch (error) {
      console.error('Failed to fetch trending GIFs:', error);
    }
  };
  
  const searchGifs = async (query) => {
    if (!query.trim()) {
      setGifResults([]);
      return;
    }
    
    setGifLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?key=${tenorApiKey}&q=${encodeURIComponent(query)}&limit=20&media_filter=gif,tinygif`
      );
      const data = await response.json();
      setGifResults(data.results || []);
    } catch (error) {
      console.error('Failed to search GIFs:', error);
    } finally {
      setGifLoading(false);
    }
  };
  
  // Debounced GIF search
  const handleGifSearchChange = (value) => {
    setGifSearch(value);
    
    if (gifSearchTimeoutRef.current) {
      clearTimeout(gifSearchTimeoutRef.current);
    }
    
    gifSearchTimeoutRef.current = setTimeout(() => {
      searchGifs(value);
    }, 300);
  };
  
  // Send GIF message
  const sendGif = (gif) => {
    const gifUrl = gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url;
    if (!gifUrl) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: gifUrl,
        isGif: true,
      }));
    }
    
    setShowGifPicker(false);
    setGifSearch('');
    setGifResults([]);
  };
  
  // Load trending GIFs when picker opens
  useEffect(() => {
    if (showGifPicker && trendingGifs.length === 0) {
      fetchTrendingGifs();
    }
  }, [showGifPicker]);
  
  // Online count is now received via WebSocket
  const [onlineCount, setOnlineCount] = useState(0);
  
  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Thread Modal */}
      {openThread && (
        <ThreadModal
          message={openThread}
          sessionToken={sessionToken}
          onClose={() => setOpenThread(null)}
          wsRef={wsRef}
          walletAddress={walletAddress}
          onRegisterReplyCallback={(callback) => { threadReplyCallbackRef.current = callback; }}
          tenorApiKey={tenorApiKey}
          rateLimited={rateLimited}
          rateLimitSeconds={rateLimitSeconds}
        />
      )}
      
      {/* Welcome Modal for First-Time Users */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#12121a] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {onboardingStep === 0 && (
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
                  🛡️
                </div>
                <h2 className="text-2xl font-bold mb-3">Welcome to Commune!</h2>
                <p className="text-white/60 mb-8">
                  You've joined an exclusive community of GUARD token holders. Let's get you set up.
                </p>
                <Button onClick={() => setOnboardingStep(1)} className="w-full">
                  Get Started →
                </Button>
              </div>
            )}
            
            {onboardingStep === 1 && (
              <div className="text-center">
                <div className="text-5xl mb-6">🧵</div>
                <h2 className="text-xl font-bold mb-3">Threaded Conversations</h2>
                <p className="text-white/60 mb-8">
                  Hover over any message and click <span className="text-amber-400">Reply</span> to start a thread. Hover over "View replies" for a quick preview — click to dive in.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setOnboardingStep(0)} className="flex-1">
                    ← Back
                  </Button>
                  <Button onClick={() => setOnboardingStep(2)} className="flex-1">
                    Next →
                  </Button>
                </div>
              </div>
            )}
            
            {onboardingStep === 2 && (
              <div className="text-center">
                <div className="text-5xl mb-6">🎉</div>
                <h2 className="text-xl font-bold mb-3">Express Yourself</h2>
                <p className="text-white/60 mb-8">
                  React with emojis, send GIFs, and @mention other members to get their attention.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setOnboardingStep(1)} className="flex-1">
                    ← Back
                  </Button>
                  <Button onClick={() => setOnboardingStep(3)} className="flex-1">
                    Next →
                  </Button>
                </div>
              </div>
            )}
            
            {onboardingStep === 3 && (
              <div className="text-center">
                <div className="text-5xl mb-6">🔗</div>
                <h2 className="text-xl font-bold mb-3">Live Link Previews</h2>
                <p className="text-white/60 mb-8">
                  Hover over links to preview many websites <span className="text-amber-400">right inside the chat</span>. Browse and click through pages without leaving the conversation. Some sites (like Google, YouTube) will open in a new tab instead.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setOnboardingStep(2)} className="flex-1">
                    ← Back
                  </Button>
                  <Button onClick={() => setOnboardingStep(4)} className="flex-1">
                    Next →
                  </Button>
                </div>
              </div>
            )}
            
            {onboardingStep === 4 && (
              <div className="text-center">
                <div className="text-5xl mb-6">⚙️</div>
                <h2 className="text-xl font-bold mb-3">Make It Yours</h2>
                <p className="text-white/60 mb-8">
                  Set your display name in Settings (top right) so others know who you are!
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setOnboardingStep(3)} className="flex-1">
                    ← Back
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowWelcomeModal(false);
                      localStorage.setItem('commune_onboarded', 'true');
                    }} 
                    className="flex-1"
                  >
                    Enter Chat 🚀
                  </Button>
                </div>
              </div>
            )}
            
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2, 3, 4].map(step => (
                <div 
                  key={step}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step === onboardingStep ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            
            {/* Skip button */}
            {onboardingStep < 4 && (
              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                  localStorage.setItem('commune_onboarded', 'true');
                }}
                className="absolute top-4 right-4 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Thread Preview on Hover */}
      {hoverThread && !openThread && (
        <ThreadPreview
          message={hoverThread}
          replies={hoverThread.recentReplies}
          sessionToken={sessionToken}
          onClose={() => setHoverThread(null)}
          position={hoverPosition}
          wsRef={wsRef}
          walletAddress={walletAddress}
          rateLimited={rateLimited}
          rateLimitSeconds={rateLimitSeconds}
        />
      )}
      
      {/* Chat Header */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-medium text-white/80">GUARD Chat</h2>
        <Badge variant={connected ? 'success' : 'warning'}>
          {connected ? `${onlineCount} online` : 'Connecting...'}
        </Badge>
      </div>
      
      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto p-6 space-y-4 transition-all duration-300 ${openThread ? 'blur-sm opacity-50' : ''} relative`}
      >
        {/* Rate Limit Overlay */}
        {rateLimited && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-amber-400 mb-4">{rateLimitSeconds}</div>
            <div className="text-white/60 text-center px-4">
              <p className="text-lg font-medium mb-1">Slow down!</p>
              <p className="text-sm">You're sending messages too fast. Please wait.</p>
            </div>
          </div>
        )}
        
        {/* Search Results Banner */}
        {searchQuery && (
          <div className="sticky top-0 z-10 bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-2 flex items-center justify-between backdrop-blur-sm">
            <span className="text-amber-400 text-sm">
              🔍 Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </span>
            <button 
              onClick={() => { setSearchQuery(''); setSearchResults([]); setHighlightedMessageId(null); }}
              className="text-white/50 hover:text-white text-sm"
            >
              Clear
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
            <span className="ml-2 text-white/50">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40">
            <Icons.Chat />
            <p className="mt-2">No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`group transition-all duration-500 ${
                msg.sendStatus === 'failed' || msg.sendStatus === 'queued' ? 'opacity-60' : ''
              } ${
                highlightedMessageId === msg.id 
                  ? 'bg-amber-400/20 -mx-4 px-4 py-2 rounded-xl ring-2 ring-amber-400/50' 
                  : ''
              }`}
            >
              {/* Main Message */}
              <div className="flex gap-3">
                <Avatar emoji={msg.avatar} size="sm" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <ReputationBadge wallet={msg.wallet}>
                      <span className="font-medium text-sm">
                        {msg.displayName || msg.user}
                      </span>
                    </ReputationBadge>
                    {msg.displayName && (
                      <span className="text-xs text-white/20 font-mono">{msg.user}</span>
                    )}
                    <span className="text-xs text-white/30">{formatTime(msg.timestamp)}</span>
                    {msg.editedAt && !msg.deleted && (
                      <span className="text-xs text-white/20">(edited)</span>
                    )}
                    {/* Send Status */}
                    {msg.sendStatus === 'sending' && (
                      <span className="text-xs text-white/40">sending...</span>
                    )}
                    {msg.sendStatus === 'slow' && (
                      <span className="text-xs text-yellow-400/70">slow connection...</span>
                    )}
                    {msg.sendStatus === 'queued' && (
                      <button 
                        onClick={() => retryMessage(msg.id)}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        queued - tap to retry
                      </button>
                    )}
                    {msg.sendStatus === 'failed' && (
                      <button 
                        onClick={() => retryMessage(msg.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        failed - tap to retry
                      </button>
                    )}
                  </div>
                  
                  {/* Message Content - Edit Mode or Display */}
                  {editingMessage === msg.id ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400/50"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={saveEdit}
                          className="text-xs px-3 py-1 bg-amber-500 text-black rounded-lg font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-xs px-3 py-1 bg-white/10 text-white/70 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : msg.isGif ? (
                    <img 
                      src={msg.content} 
                      alt="GIF" 
                      className="mt-1 max-w-xs rounded-lg"
                      loading="lazy"
                    />
                  ) : (
                    <p className={`text-sm mt-1 leading-relaxed ${msg.deleted ? 'text-white/40 italic' : 'text-white/80'} ${msg.mentions?.some(m => m.toLowerCase() === walletAddress?.toLowerCase()) ? 'bg-amber-400/10 -mx-2 px-2 py-1 rounded-lg border-l-2 border-amber-400' : ''}`}>
                      {renderMessageContent(msg.content || msg.message, msg.mentions)}
                    </p>
                  )}
                  
                  {/* Reply Button & Edit/Delete */}
                  <div className="flex items-center gap-3 mt-2 h-5">
                    {/* Reply button - only shows on hover when no replies */}
                    {msg.replyCount === 0 && !msg.deleted && (
                      <button
                        onClick={() => setOpenThread(msg)}
                        className="text-xs text-white/30 hover:text-amber-400 transition-all duration-200 flex items-center gap-1 opacity-0 group-hover:opacity-100"
                      >
                        <Icons.Reply />
                        Reply
                      </button>
                    )}
                    
                    {/* Edit/Delete buttons - only for own messages within 15 min */}
                    {canModify(msg) && editingMessage !== msg.id && !msg.isGif && (
                      <>
                        <button
                          onClick={() => startEditing(msg)}
                          className="text-xs text-white/30 hover:text-amber-400 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ messageId: msg.id })}
                          className="text-xs text-white/30 hover:text-red-400 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    
                    {/* Reaction picker button */}
                    {!msg.deleted && (
                      <div className="relative">
                        <button
                          onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                          className="text-xs text-white/30 hover:text-amber-400 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          +😀
                        </button>
                        
                        {/* Emoji picker dropdown */}
                        {showReactionPicker === msg.id && (
                          <>
                            {/* Invisible backdrop to catch outside clicks */}
                            <div 
                              className="fixed inset-0 z-[5]" 
                              onClick={() => setShowReactionPicker(null)}
                            />
                            <div className="absolute bottom-full left-0 mb-2 bg-[#1a1a24] border border-white/10 rounded-xl p-2 flex gap-1 shadow-lg z-10">
                              {reactionEmojis.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg.id, emoji)}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors ${hasReacted(msg.reactions, emoji) ? 'bg-amber-400/20' : ''}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Reactions display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(msg.reactions).map(([emoji, wallets]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                            hasReacted(msg.reactions, emoji)
                              ? 'bg-amber-400/20 border border-amber-400/30 text-amber-400'
                              : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                          }`}
                          title={wallets.map(w => truncateAddress(w)).join(', ')}
                        >
                          <span>{emoji}</span>
                          <span>{wallets.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recent Replies Preview (max 3) */}
              {msg.recentReplies && msg.recentReplies.length > 0 && (
                <div className="ml-10 mt-2 pl-4 border-l-2 border-white/10 space-y-2">
                  {msg.recentReplies.slice(-3).map((reply) => (
                    <div key={reply.id} className="flex gap-2 items-start">
                      <Avatar emoji={reply.avatar || '🛡️'} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <ReputationBadge wallet={reply.wallet} showTooltip={false}>
                            <span className="text-xs font-medium">{reply.displayName || reply.user}</span>
                          </ReputationBadge>
                          <span className="text-xs text-white/20">{formatTime(reply.timestamp)}</span>
                        </div>
                        {reply.isGif ? (
                          <span className="text-white/60 text-xs italic">📷 GIF</span>
                        ) : (
                          <p className="text-white/60 text-xs line-clamp-2">{reply.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => setOpenThread(msg)}
                    onMouseEnter={(e) => handleMouseEnter(msg, e)}
                    onMouseLeave={handleMouseLeave}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors ml-8"
                  >
                    View all {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'} →
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className={`p-4 border-t border-white/5 transition-all duration-300 ${openThread ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-white/40">
              {typingUsers.length === 1 
                ? `${typingUsers[0].displayName || truncateAddress(typingUsers[0].wallet)} is typing...`
                : typingUsers.length === 2
                  ? `${typingUsers[0].displayName || truncateAddress(typingUsers[0].wallet)} and ${typingUsers[1].displayName || truncateAddress(typingUsers[1].wallet)} are typing...`
                  : `${typingUsers.length} people are typing...`
              }
            </p>
          </div>
        )}
        
        {/* Connection Status / Warning / Announcement / Sound Toggle */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Warning inline */}
            {activeWarning ? (
              <div className="flex items-center gap-2 flex-1 min-w-0 text-red-400">
                <span className={`text-sm flex-shrink-0 ${warningPulse ? 'animate-bounce' : ''}`}>⚠️</span>
                <p className="text-xs font-medium truncate flex-1">{activeWarning.message}</p>
                <button 
                  onClick={acknowledgeWarning}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all flex-shrink-0 ${
                    warningPulse 
                      ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                      : 'bg-red-500/50 text-white/70 hover:bg-red-500'
                  }`}
                >
                  ✓ OK
                </button>
              </div>
            ) : announcementVisible && announcement ? (
              <div className={`flex items-center gap-2 flex-1 min-w-0 ${
                announcement.type === 'urgent' 
                  ? 'text-red-400' 
                  : announcement.type === 'warning'
                    ? 'text-yellow-400'
                    : announcement.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-blue-400'
              }`}>
                <span className="text-sm flex-shrink-0">
                  {announcement.type === 'urgent' ? '🚨' : 
                   announcement.type === 'warning' ? '⚠️' : 
                   announcement.type === 'success' ? '✅' : '📢'}
                </span>
                <p className="text-xs font-medium truncate">{announcement.message}</p>
                <button 
                  onClick={() => setAnnouncementVisible(false)}
                  className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 ml-1"
                >
                  ✕
                </button>
              </div>
            ) : rateLimited ? (
              <p className="text-xs text-amber-400/70">
                ⏳ Rate limited - wait {rateLimitSeconds}s
              </p>
            ) : (
              <p className={`text-xs ${
                connected 
                  ? 'text-emerald-400/70' 
                  : 'text-amber-400/70'
              }`}>
                {connected 
                  ? '● Connected' 
                  : 'Connecting...'}
              </p>
            )}
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors flex-shrink-0 ${soundEnabled ? 'text-white/50 hover:text-white/70' : 'text-white/30'}`}
            title={soundEnabled ? 'Sound on' : 'Sound off'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>
        </div>
        
        <div className="relative">
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 transition-all ${
            rateLimited
              ? 'bg-amber-500/5 border-amber-500/30'
              : activeWarning 
                ? 'bg-red-500/5 border-red-500/30 focus-within:border-red-400/50' 
                : 'bg-white/5 border-white/10 focus-within:border-amber-400/50'
          }`}>
            {rateLimited ? (
              /* Centered countdown when rate limited */
              <div className="flex-1 flex items-center justify-center py-0.5">
                <span className="text-white/40 text-sm">⏳ Wait {rateLimitSeconds}s to send messages</span>
              </div>
            ) : (
              <>
                <button 
                  className="text-white/40 hover:text-white/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  disabled={!!activeWarning}
                >
                  <span className="text-xs font-bold">GIF</span>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  disabled={!!activeWarning}
                  onKeyDown={(e) => {
                    handleMentionKeyDown(e);
                    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    activeWarning 
                      ? "Acknowledge warning to continue..." 
                      : "Type a message... (use @ to mention)"
                  }
                  className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none text-sm disabled:cursor-not-allowed"
                />
                <button 
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim() || !!activeWarning}
                  className="text-amber-400 hover:text-amber-300 transition-colors disabled:text-white/20 disabled:cursor-not-allowed"
                >
                  <Icons.Send />
                </button>
              </>
            )}
          </div>
          
          {/* Mentions Dropdown */}
          {showMentions && filteredMentionUsers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#151520] border border-white/10 rounded-xl p-2 max-h-48 overflow-y-auto">
              {filteredMentionUsers.map((user, index) => (
                <button
                  key={user.wallet}
                  onClick={() => selectMention(user)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    index === mentionIndex ? 'bg-amber-400/20' : 'hover:bg-white/5'
                  }`}
                >
                  <Avatar emoji="🛡️" size="xs" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{user.displayName || truncateAddress(user.wallet)}</p>
                    {user.displayName && (
                      <p className="text-xs text-white/30 font-mono">{truncateAddress(user.wallet)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* GIF Picker */}
          {showGifPicker && (
            <>
              {/* Backdrop to close on click outside */}
              <div 
                className="fixed inset-0 z-[5]" 
                onClick={() => setShowGifPicker(false)}
              />
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#151520] border border-white/10 rounded-xl p-3 max-h-80 overflow-hidden flex flex-col z-10">
                {/* Search */}
                <input
                  type="text"
                  value={gifSearch}
                  onChange={(e) => handleGifSearchChange(e.target.value)}
                  placeholder="Search GIFs..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 mb-3"
                  autoFocus
                />
                
                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                  {gifLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="sm" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {(gifSearch ? gifResults : trendingGifs).map((gif) => (
                        <button
                          key={gif.id}
                          onClick={() => sendGif(gif)}
                          className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-amber-400 transition-all"
                        >
                          <img
                            src={gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url}
                            alt={gif.content_description || 'GIF'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {!gifLoading && gifSearch && gifResults.length === 0 && (
                    <p className="text-white/40 text-center py-4 text-sm">No GIFs found</p>
                  )}
                </div>
                
                {/* Tenor attribution */}
                <div className="mt-2 pt-2 border-t border-white/10 flex justify-end">
                  <span className="text-xs text-white/30">Powered by Tenor</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Delete Message Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteMessage(deleteConfirm?.messageId)}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

// ============================================
// VIDEO CALL COMPONENT
// ============================================
const VideoCall = ({ walletAddress }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  const joinCall = () => {
    setIsInCall(true);
    setParticipants([
      { id: 1, name: truncateAddress(walletAddress), avatar: '🛡️', isYou: true },
      { id: 2, name: 'alice.eth', avatar: '🌸', isYou: false },
      { id: 3, name: 'cryptoking.eth', avatar: '👑', isYou: false },
    ]);
  };
  
  const leaveCall = () => {
    setIsInCall(false);
    setParticipants([]);
    setIsMuted(false);
    setIsVideoOff(false);
  };
  
  if (!isInCall) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-400/20">
            <Icons.Video />
          </div>
          <h2 className="text-2xl font-bold mb-2">Join Video Call</h2>
          <p className="text-white/50 mb-8">
            Connect face-to-face with other GUARD holders in real-time.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8 text-white/50">
            <div className="flex -space-x-2">
              {['🌸', '👑', '🔧'].map((emoji, i) => (
                <div key={i} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border-2 border-[#0a0a0f]">
                  {emoji}
                </div>
              ))}
            </div>
            <span className="text-sm">3 members in call</span>
          </div>
          <Button size="lg" className="w-full" onClick={joinCall}>
            <Icons.Video />
            Join Call
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {participants.map((participant) => (
          <div 
            key={participant.id}
            className="relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden group"
          >
            {/* Video placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
            
            {/* Avatar when video is off */}
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-3 border border-white/10">
                {participant.avatar}
              </div>
              <p className="text-sm font-medium">{participant.name}</p>
              {participant.isYou && <Badge variant="success" className="mt-2">You</Badge>}
            </div>
            
            {/* Name overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-sm font-medium bg-black/50 backdrop-blur px-3 py-1 rounded-lg">
                {participant.name} {participant.isYou && '(You)'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-6 border-t border-white/5">
        <Button 
          variant={isMuted ? 'danger' : 'secondary'}
          onClick={() => setIsMuted(!isMuted)}
          className="w-14 h-14 rounded-full p-0"
        >
          {isMuted ? <Icons.MicOff /> : <Icons.Mic />}
        </Button>
        
        <Button 
          variant={isVideoOff ? 'danger' : 'secondary'}
          onClick={() => setIsVideoOff(!isVideoOff)}
          className="w-14 h-14 rounded-full p-0"
        >
          {isVideoOff ? <Icons.VideoOff /> : <Icons.Video />}
        </Button>
        
        <Button 
          variant="danger"
          onClick={leaveCall}
          className="w-14 h-14 rounded-full p-0 bg-red-500 hover:bg-red-400 border-none"
        >
          <Icons.PhoneOff />
        </Button>
      </div>
    </div>
  );
};

// ============================================
// USER LIST SIDEBAR
// ============================================
const UserList = ({ sessionToken }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch online users
  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json();
      if (data.users) {
        setOnlineUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch online users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Update presence (tell server we're online)
  const updatePresence = async () => {
    try {
      await fetch(`${API_URL}/api/presence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  };
  
  useEffect(() => {
    // Initial fetch
    fetchOnlineUsers();
    updatePresence();
    
    // Refresh online users every 10 seconds
    const usersInterval = setInterval(fetchOnlineUsers, 10000);
    
    // Update our presence every 30 seconds
    const presenceInterval = setInterval(updatePresence, 30000);
    
    return () => {
      clearInterval(usersInterval);
      clearInterval(presenceInterval);
    };
  }, [sessionToken]);
  
  // Generate avatar emoji based on wallet address
  const getAvatarEmoji = (wallet) => {
    const emojis = ['🛡️', '⚔️', '🏰', '👑', '💎', '🔥', '⭐', '🌟', '🎯', '🚀'];
    const index = parseInt(wallet.slice(-2), 16) % emojis.length;
    return emojis[index];
  };
  
  return (
    <div className="w-64 border-l border-white/5 p-4 hidden lg:block flex-shrink-0 overflow-y-auto">
      <h3 className="text-sm font-semibold text-white/50 mb-4 flex items-center gap-2">
        <Icons.Users />
        GUARD Holders Online
        <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
          {onlineUsers.length}
        </span>
      </h3>
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : onlineUsers.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No users online</p>
        ) : (
          onlineUsers.map((user) => (
            <div key={user.wallet} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <Avatar emoji={getAvatarEmoji(user.wallet)} size="sm" status="online" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  <ReputationBadge wallet={user.wallet}>
                    {user.displayName || truncateAddress(user.wallet)}
                  </ReputationBadge>
                </p>
                {user.displayName && (
                  <p className="text-xs text-white/30 font-mono truncate">{truncateAddress(user.wallet)}</p>
                )}
                {!user.displayName && (
                  <p className="text-xs text-emerald-400">online</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================
// ADMIN PANEL
// ============================================
const AdminPanel = ({ sessionToken }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('users');
  const [muteModal, setMuteModal] = useState(null);
  const [banModal, setBanModal] = useState(null);
  const [muteDuration, setMuteDuration] = useState(30);
  const [muteReason, setMuteReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [nukeModal, setNukeModal] = useState(null);
  const [bulkBanModal, setBulkBanModal] = useState(false);
  const [bulkBanReason, setBulkBanReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [warningTarget, setWarningTarget] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
  const [sendingWarning, setSendingWarning] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [warningSent, setWarningSent] = useState(false);
  const [announcementSent, setAnnouncementSent] = useState(false);
  const [deleteMessageConfirm, setDeleteMessageConfirm] = useState(null); // { messageId }
  const [deleteReplyConfirm, setDeleteReplyConfirm] = useState(null); // { replyId }
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  
  // Admin onboarding
  const [showAdminWelcome, setShowAdminWelcome] = useState(false);
  const [adminOnboardingStep, setAdminOnboardingStep] = useState(0);
  
  // Check if first time admin
  useEffect(() => {
    const hasSeenAdminWelcome = localStorage.getItem('commune_admin_welcomed');
    if (!hasSeenAdminWelcome) {
      setShowAdminWelcome(true);
      localStorage.setItem('commune_admin_welcomed', 'true');
    }
  }, []);
  
  // Send warning to user
  const handleSendWarning = async () => {
    if (!warningTarget || !warningMessage) return;
    
    setSendingWarning(true);
    setWarningSent(false);
    try {
      const response = await fetch(`${API_URL}/api/admin/warn`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ 
          wallet: warningTarget, 
          message: warningMessage,
        }),
      });
      
      if (response.ok) {
        setWarningTarget('');
        setWarningMessage('');
        setWarningSent(true);
        // Reset after 2 seconds
        setTimeout(() => setWarningSent(false), 2000);
      }
    } catch (error) {
      console.error('Failed to send warning:', error);
    } finally {
      setSendingWarning(false);
    }
  };
  
  // Send announcement to all users
  const handleSendAnnouncement = async () => {
    if (!announcementMessage) return;
    
    setSendingAnnouncement(true);
    setAnnouncementSent(false);
    try {
      const response = await fetch(`${API_URL}/api/admin/announce`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ 
          message: announcementMessage, 
          type: announcementType,
        }),
      });
      
      if (response.ok) {
        setAnnouncementMessage('');
        setAnnouncementSent(true);
        // Reset after 2 seconds
        setTimeout(() => setAnnouncementSent(false), 2000);
      }
    } catch (error) {
      console.error('Failed to send announcement:', error);
    } finally {
      setSendingAnnouncement(false);
    }
  };
  
  // Load users
  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };
  
  // Load messages with original content
  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/messages`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };
  
  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/audit`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadUsers(), loadMessages(), loadAuditLogs()]);
      setLoading(false);
    };
    load();
  }, [sessionToken]);
  
  // Filter messages by user and search query
  const filteredMessages = messages.filter(msg => {
    const matchesUser = !filterUser || msg.wallet?.toLowerCase() === filterUser.toLowerCase();
    const matchesSearch = !searchQuery || 
      (msg.content?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (msg.originalContent?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (msg.displayName?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesUser && matchesSearch;
  });
  
  // Get unique users from messages for filter dropdown
  const messageUsers = [...new Map(messages.map(m => [m.wallet?.toLowerCase(), {
    wallet: m.wallet,
    displayName: m.displayName,
  }])).values()];
  
  // Get message count per user
  const userMessageCounts = messages.reduce((acc, msg) => {
    const wallet = msg.wallet?.toLowerCase();
    acc[wallet] = (acc[wallet] || 0) + 1;
    return acc;
  }, {});
  
  // Toggle user selection
  const toggleUserSelection = (wallet) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(wallet)) {
        next.delete(wallet);
      } else {
        next.add(wallet);
      }
      return next;
    });
  };
  
  // Toggle message selection
  const toggleMessageSelection = (id) => {
    setSelectedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  // Select all visible messages
  const selectAllMessages = () => {
    const visibleIds = filteredMessages.filter(m => !m.deleted).map(m => m.id);
    setSelectedMessages(new Set(visibleIds));
  };
  
  // Select all users
  const selectAllUsers = () => {
    const allWallets = users.filter(u => !u.isBanned).map(u => u.wallet);
    setSelectedUsers(new Set(allWallets));
  };
  
  // Clear selections
  const clearSelections = () => {
    setSelectedUsers(new Set());
    setSelectedMessages(new Set());
  };
  
  // Bulk delete messages (called after confirmation)
  const handleBulkDelete = async () => {
    if (selectedMessages.size === 0) return;
    
    setProcessing(true);
    try {
      for (const messageId of selectedMessages) {
        await fetch(`${API_URL}/api/admin/delete-message`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}` 
          },
          body: JSON.stringify({ messageId }),
        });
      }
      setSelectedMessages(new Set());
      loadMessages();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Bulk ban users
  const handleBulkBan = async () => {
    if (selectedUsers.size === 0) return;
    
    setProcessing(true);
    try {
      for (const wallet of selectedUsers) {
        await fetch(`${API_URL}/api/admin/ban`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}` 
          },
          body: JSON.stringify({ wallet, reason: bulkBanReason || 'Bulk ban' }),
        });
      }
      setSelectedUsers(new Set());
      setBulkBanModal(false);
      setBulkBanReason('');
      loadUsers();
    } catch (error) {
      console.error('Bulk ban failed:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Nuke user (delete all their messages)
  const handleNuke = async () => {
    if (!nukeModal) return;
    
    setProcessing(true);
    try {
      const userMessages = messages.filter(m => 
        m.wallet?.toLowerCase() === nukeModal.wallet?.toLowerCase() && !m.deleted
      );
      
      for (const msg of userMessages) {
        await fetch(`${API_URL}/api/admin/delete-message`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}` 
          },
          body: JSON.stringify({ messageId: msg.id }),
        });
      }
      
      setNukeModal(null);
      loadMessages();
    } catch (error) {
      console.error('Nuke failed:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Mute user
  const handleMute = async () => {
    if (!muteModal) return;
    try {
      await fetch(`${API_URL}/api/admin/mute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ 
          wallet: muteModal.wallet, 
          duration: muteDuration,
          reason: muteReason || 'No reason provided',
        }),
      });
      setMuteModal(null);
      setMuteReason('');
      loadUsers();
    } catch (error) {
      console.error('Failed to mute user:', error);
    }
  };
  
  // Ban user
  const handleBan = async () => {
    if (!banModal) return;
    try {
      await fetch(`${API_URL}/api/admin/ban`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ 
          wallet: banModal.wallet, 
          reason: banReason || 'No reason provided',
        }),
      });
      setBanModal(null);
      setBanReason('');
      loadUsers();
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };
  
  // Unban user
  const handleUnban = async (wallet) => {
    try {
      await fetch(`${API_URL}/api/admin/unban`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ wallet }),
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
  };
  
  // Delete message (called after confirmation)
  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/delete-message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ messageId }),
      });
      if (response.ok) {
        // Update local state instead of full reload
        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, deleted: true, content: 'Message deleted', adminDeleted: true }
            : m
        ));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };
  
  // Delete reply (admin, called after confirmation)
  const handleDeleteReply = async (replyId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/delete-reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ replyId }),
      });
      if (response.ok) {
        // Update local state - find the reply in allReplies and mark as deleted
        setMessages(prev => prev.map(m => ({
          ...m,
          allReplies: (m.allReplies || []).map(r => 
            r.id === replyId 
              ? { ...r, deleted: true, originalContent: r.content, content: 'Message deleted' }
              : r
          ),
        })));
      }
    } catch (error) {
      console.error('Failed to delete reply:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      {/* Admin Welcome Modal */}
      {showAdminWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#12121a] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {adminOnboardingStep === 0 && (
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
                  🛡️
                </div>
                <h2 className="text-2xl font-bold mb-3">Welcome, Admin!</h2>
                <p className="text-white/60 mb-8">
                  You have elevated privileges to moderate the Commune. With great power comes great responsibility.
                </p>
                <Button onClick={() => setAdminOnboardingStep(1)} className="w-full">
                  Show Me Around →
                </Button>
              </div>
            )}
            
            {adminOnboardingStep === 1 && (
              <div className="text-center">
                <div className="text-5xl mb-6">👥</div>
                <h2 className="text-xl font-bold mb-3">User Management</h2>
                <p className="text-white/60 mb-8">
                  View all connected users, mute troublemakers temporarily, or ban repeat offenders. Select multiple users for bulk actions.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setAdminOnboardingStep(0)} className="flex-1">
                    ← Back
                  </Button>
                  <Button onClick={() => setAdminOnboardingStep(2)} className="flex-1">
                    Next →
                  </Button>
                </div>
              </div>
            )}
            
            {adminOnboardingStep === 2 && (
              <div className="text-center">
                <div className="text-5xl mb-6">💬</div>
                <h2 className="text-xl font-bold mb-3">Message Moderation</h2>
                <p className="text-white/60 mb-8">
                  Delete inappropriate messages, view thread replies, or use <span className="text-red-400 font-semibold">Nuke Mode</span> to wipe all messages from a user at once.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setAdminOnboardingStep(1)} className="flex-1">
                    ← Back
                  </Button>
                  <Button onClick={() => setAdminOnboardingStep(3)} className="flex-1">
                    Next →
                  </Button>
                </div>
              </div>
            )}
            
            {adminOnboardingStep === 3 && (
              <div className="text-center">
                <div className="text-5xl mb-6">📢</div>
                <h2 className="text-xl font-bold mb-3">Communicate</h2>
                <p className="text-white/60 mb-8">
                  Send <span className="text-yellow-400">warnings</span> to specific users that they must acknowledge, or broadcast <span className="text-blue-400">announcements</span> to the entire community.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setAdminOnboardingStep(2)} className="flex-1">
                    ← Back
                  </Button>
                  <Button onClick={() => setAdminOnboardingStep(4)} className="flex-1">
                    Next →
                  </Button>
                </div>
              </div>
            )}
            
            {adminOnboardingStep === 4 && (
              <div className="text-center">
                <div className="text-5xl mb-6">📋</div>
                <h2 className="text-xl font-bold mb-3">Audit Log</h2>
                <p className="text-white/60 mb-8">
                  Every admin action is logged. Review the history of bans, mutes, deletions, and warnings for accountability and transparency.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setAdminOnboardingStep(3)} className="flex-1">
                    ← Back
                  </Button>
                  <Button 
                    onClick={() => setShowAdminWelcome(false)} 
                    className="flex-1"
                  >
                    Let's Go! 🚀
                  </Button>
                </div>
              </div>
            )}
            
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2, 3, 4].map(step => (
                <div 
                  key={step}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step === adminOnboardingStep ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            
            {/* Skip button */}
            {adminOnboardingStep < 4 && (
              <button
                onClick={() => setShowAdminWelcome(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}
      
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        🛡️ Admin Panel
      </h1>
      
      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveSection('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'users' 
              ? 'bg-amber-400 text-black' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveSection('messages')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'messages' 
              ? 'bg-amber-400 text-black' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Messages ({messages.length})
        </button>
        <button
          onClick={() => setActiveSection('communicate')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'communicate' 
              ? 'bg-amber-400 text-black' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          📢 Communicate
        </button>
        <button
          onClick={() => { setActiveSection('audit'); loadAuditLogs(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'audit' 
              ? 'bg-amber-400 text-black' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          📋 Audit Log
        </button>
      </div>
      
      {/* Users Section */}
      {activeSection === 'users' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Bulk Actions Bar */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-xl">
            <button
              onClick={selectAllUsers}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearSelections}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Clear
            </button>
            <div className="flex-1" />
            {selectedUsers.size > 0 && (
              <>
                <span className="text-xs text-amber-400">{selectedUsers.size} selected</span>
                <button
                  onClick={() => setBulkBanModal(true)}
                  disabled={processing}
                  className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : `Ban Selected (${selectedUsers.size})`}
                </button>
              </>
            )}
          </div>
          
          {/* Users List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {users.map(user => (
              <div 
                key={user.wallet}
                className={`p-4 rounded-xl border ${
                  selectedUsers.has(user.wallet) 
                    ? 'bg-amber-400/10 border-amber-400/30'
                    : user.isBanned 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : user.isMuted 
                        ? 'bg-yellow-500/10 border-yellow-500/30' 
                        : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  {!user.isBanned && (
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.wallet)}
                      onChange={() => toggleUserSelection(user.wallet)}
                      className="w-4 h-4 rounded bg-white/10 border-white/20 text-amber-400 focus:ring-amber-400/50"
                    />
                  )}
                  
                  <div className="flex-1">
                    <p className="font-medium">{user.displayName || truncateAddress(user.wallet)}</p>
                    <p className="text-xs text-white/40 font-mono">{user.wallet}</p>
                    <p className="text-xs text-white/30 mt-1">
                      {userMessageCounts[user.wallet?.toLowerCase()] || 0} messages
                      {userMessageCounts[user.wallet?.toLowerCase()] > 0 && (
                        <>
                          <button
                            onClick={() => { setFilterUser(user.wallet); setActiveSection('messages'); }}
                            className="ml-2 text-amber-400 hover:underline"
                          >
                            View →
                          </button>
                          <button
                            onClick={() => setNukeModal(user)}
                            className="ml-2 text-red-400 hover:underline"
                          >
                            Nuke 💣
                          </button>
                        </>
                      )}
                    </p>
                    {user.isBanned && (
                      <p className="text-xs text-red-400 mt-1">🚫 Banned: {user.banReason}</p>
                    )}
                    {user.isMuted && !user.isBanned && (
                      <p className="text-xs text-yellow-400 mt-1">🔇 Muted: {user.muteReason}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!user.isBanned && (
                      <>
                        <button
                          onClick={() => setMuteModal(user)}
                          className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                        >
                          Mute
                        </button>
                        <button
                          onClick={() => setBanModal(user)}
                          className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Ban
                        </button>
                      </>
                    )}
                  {user.isBanned && (
                    <button
                      onClick={() => handleUnban(user.wallet)}
                      className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      Unban
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-white/40 text-center py-8">No users found</p>
          )}
        </div>
        </div>
      )}
      
      {/* Messages Section */}
      {activeSection === 'messages' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Bulk Actions Bar */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-xl">
            <button
              onClick={selectAllMessages}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Select All Visible
            </button>
            <button
              onClick={() => setSelectedMessages(new Set())}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Clear
            </button>
            <div className="flex-1" />
            {selectedMessages.size > 0 && (
              <>
                <span className="text-xs text-amber-400">{selectedMessages.size} selected</span>
                <button
                  onClick={() => setBulkDeleteConfirm(true)}
                  disabled={processing}
                  className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Deleting...' : `Delete Selected (${selectedMessages.size})`}
                </button>
              </>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* User Filter Dropdown */}
            <div className="flex-1 min-w-48">
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="bg-[#1a1a24] text-white">All Users</option>
                {messageUsers.map(user => (
                  <option key={user.wallet} value={user.wallet} className="bg-[#1a1a24] text-white">
                    {user.displayName || truncateAddress(user.wallet)} ({userMessageCounts[user.wallet?.toLowerCase()] || 0} msgs)
                  </option>
                ))}
              </select>
            </div>
            
            {/* Search */}
            <div className="flex-1 min-w-48">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400/50"
              />
            </div>
            
            {/* Clear Filters */}
            {(filterUser || searchQuery) && (
              <button
                onClick={() => { setFilterUser(''); setSearchQuery(''); }}
                className="px-3 py-2 bg-white/10 rounded-lg text-sm text-white/60 hover:bg-white/20 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Results Count */}
          <div className="text-xs text-white/40 mb-2">
            Showing {filteredMessages.length} of {messages.length} messages
            {filterUser && (
              <span className="ml-2 text-amber-400">
                • Filtered by: {messageUsers.find(u => u.wallet?.toLowerCase() === filterUser.toLowerCase())?.displayName || truncateAddress(filterUser)}
              </span>
            )}
          </div>
          
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredMessages.slice().reverse().map(msg => (
              <div 
                key={msg.id}
                className={`p-4 rounded-xl border ${
                  selectedMessages.has(msg.id)
                    ? 'bg-amber-400/10 border-amber-400/30'
                    : msg.deleted 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  {!msg.deleted && (
                    <input
                      type="checkbox"
                      checked={selectedMessages.has(msg.id)}
                      onChange={() => toggleMessageSelection(msg.id)}
                      className="w-4 h-4 mt-1 rounded bg-white/10 border-white/20 text-amber-400 focus:ring-amber-400/50"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <button 
                        onClick={() => setFilterUser(msg.wallet)}
                        className="font-medium text-sm hover:text-amber-400 transition-colors"
                        title="Filter by this user"
                      >
                        {msg.displayName || truncateAddress(msg.wallet)}
                      </button>
                      <span className="text-xs text-white/30">{new Date(msg.timestamp).toLocaleString()}</span>
                      {msg.deleted && <span className="text-xs text-red-400">DELETED</span>}
                      {msg.adminDeleted && <span className="text-xs text-red-400">(by admin)</span>}
                      {msg.replyCount > 0 && (
                        <span className="text-xs text-amber-400">{msg.replyCount} replies</span>
                      )}
                    </div>
                    {msg.isGif ? (
                      <img src={msg.deleted ? '' : msg.content} alt="GIF" className="max-w-xs rounded-lg" />
                    ) : (
                      <p className="text-sm text-white/70">
                        {msg.deleted ? (
                          <>
                            <span className="line-through text-red-400/50">{msg.originalContent}</span>
                          </>
                        ) : msg.content}
                      </p>
                    )}
                    
                    {/* Thread Replies */}
                    {msg.allReplies && msg.allReplies.length > 0 && (
                      <div className="mt-3 ml-4 border-l-2 border-white/10 pl-4 space-y-2">
                        <div className="text-xs text-white/40 mb-2">Thread replies:</div>
                        {msg.allReplies.map(reply => (
                          <div 
                            key={reply.id} 
                            className={`p-2 rounded-lg ${reply.deleted ? 'bg-red-500/10' : 'bg-white/5'}`}
                          >
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-xs font-medium">{reply.displayName || truncateAddress(reply.wallet)}</span>
                              <span className="text-xs text-white/30">{new Date(reply.timestamp).toLocaleString()}</span>
                              {reply.deleted && <span className="text-xs text-red-400">DELETED</span>}
                            </div>
                            <p className="text-xs text-white/60">
                              {reply.deleted ? (
                                <span className="line-through text-red-400/50">{reply.originalContent}</span>
                              ) : reply.content}
                            </p>
                            {!reply.deleted && (
                              <button
                                onClick={() => setDeleteReplyConfirm({ replyId: reply.id })}
                                className="mt-1 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                              >
                                Delete Reply
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!msg.deleted && (
                      <button
                        onClick={() => setDeleteMessageConfirm({ messageId: msg.id })}
                        className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => { setMuteModal({ wallet: msg.wallet, displayName: msg.displayName }); }}
                      className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                      title="Mute this user"
                    >
                      Mute
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredMessages.length === 0 && (
              <p className="text-white/40 text-center py-8">No messages found</p>
            )}
          </div>
        </div>
      )}
      
      {/* Communicate Section */}
      {activeSection === 'communicate' && (
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Send Warning to User */}
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              ⚠️ Send Warning to User
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Warnings appear as attention-grabbing banners that block the user from chatting until acknowledged.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-1">Select User</label>
                <select
                  value={warningTarget}
                  onChange={(e) => setWarningTarget(e.target.value)}
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-400/50"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-[#1a1a24] text-white">Choose a user...</option>
                  {messageUsers.map(user => (
                    <option key={user.wallet} value={user.wallet} className="bg-[#1a1a24] text-white">
                      {user.displayName || truncateAddress(user.wallet)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-white/60 block mb-1">Warning Message</label>
                <textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  placeholder="Enter your warning message..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400/50 resize-none"
                />
              </div>
              
              <button
                onClick={handleSendWarning}
                disabled={!warningTarget || !warningMessage || sendingWarning || warningSent}
                className={`w-full px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  warningSent 
                    ? 'bg-emerald-500 text-white animate-pulse' 
                    : 'bg-red-500 text-white disabled:opacity-50 hover:bg-red-600'
                }`}
              >
                {warningSent ? '✓ Warning Sent!' : sendingWarning ? 'Sending...' : '⚠️ Send Warning'}
              </button>
            </div>
          </div>
          
          {/* Send Announcement */}
          <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
              📢 Send Announcement
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Announcements appear as banners to all users currently in the chat.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-1">Announcement Type</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'info', label: '📢 Info', color: 'blue' },
                    { value: 'success', label: '✅ Success', color: 'emerald' },
                    { value: 'warning', label: '⚠️ Warning', color: 'yellow' },
                    { value: 'urgent', label: '🚨 Urgent', color: 'red' },
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setAnnouncementType(type.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        announcementType === type.value 
                          ? `bg-${type.color}-500/30 border border-${type.color}-500/50 text-${type.color}-300`
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-white/60 block mb-1">Message</label>
                <textarea
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Enter your announcement..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400/50 resize-none"
                />
              </div>
              
              <button
                onClick={handleSendAnnouncement}
                disabled={!announcementMessage || sendingAnnouncement || announcementSent}
                className={`w-full px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  announcementSent 
                    ? 'bg-emerald-500 text-white animate-pulse' 
                    : 'bg-blue-500 text-white disabled:opacity-50 hover:bg-blue-600'
                }`}
              >
                {announcementSent ? '✓ Announcement Sent!' : sendingAnnouncement ? 'Sending...' : '📢 Send to All Users'}
              </button>
            </div>
          </div>
          
          {/* Admin Notes */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-lg font-bold text-white/80 mb-4 flex items-center gap-2">
              📝 Communication Tips
            </h3>
            <ul className="text-sm text-white/60 space-y-2">
              <li>• <strong>Warnings</strong> block users from chatting until they acknowledge</li>
              <li>• <strong>Info announcements</strong> auto-dismiss after 30 seconds</li>
              <li>• <strong>Urgent announcements</strong> stay until manually dismissed</li>
              <li>• Users receive both visual and audio notifications</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Audit Log Section */}
      {activeSection === 'audit' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/60">
              Showing last {auditLogs.length} admin actions
            </p>
            <button
              onClick={loadAuditLogs}
              className="px-3 py-1.5 text-xs bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {auditLogs.map(log => (
              <div 
                key={log.id}
                className={`p-4 rounded-xl border ${
                  log.action === 'ban' ? 'bg-red-500/10 border-red-500/30' :
                  log.action === 'unban' ? 'bg-green-500/10 border-green-500/30' :
                  log.action === 'mute' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  log.action === 'warn' ? 'bg-orange-500/10 border-orange-500/30' :
                  log.action === 'announce' ? 'bg-blue-500/10 border-blue-500/30' :
                  log.action === 'delete_message' ? 'bg-purple-500/10 border-purple-500/30' :
                  'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {log.action === 'ban' ? '🚫' :
                         log.action === 'unban' ? '✅' :
                         log.action === 'mute' ? '🔇' :
                         log.action === 'warn' ? '⚠️' :
                         log.action === 'announce' ? '📢' :
                         log.action === 'delete_message' ? '🗑️' : '📋'}
                      </span>
                      <span className="font-medium text-sm capitalize">{log.action.replace('_', ' ')}</span>
                      <span className="text-xs text-white/30">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 space-y-1">
                      <p>By: <span className="font-mono text-white/40">{truncateAddress(log.adminWallet)}</span></p>
                      {log.details.targetWallet && (
                        <p>Target: <span className="font-mono text-white/40">{truncateAddress(log.details.targetWallet)}</span></p>
                      )}
                      {log.details.reason && (
                        <p>Reason: <span className="text-white/50">{log.details.reason}</span></p>
                      )}
                      {log.details.message && (
                        <p>Message: <span className="text-white/50">{log.details.message.substring(0, 100)}{log.details.message.length > 100 ? '...' : ''}</span></p>
                      )}
                      {log.details.duration && (
                        <p>Duration: <span className="text-white/50">{log.details.duration} minutes</span></p>
                      )}
                      {log.details.type && (
                        <p>Type: <span className="text-white/50 capitalize">{log.details.type}</span></p>
                      )}
                      {log.details.messageContent && (
                        <p>Content: <span className="text-white/50">{log.details.messageContent}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-white/40 text-center py-8">No audit logs yet</p>
            )}
          </div>
        </div>
      )}
      
      {/* Mute Modal */}
      {muteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#151520] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Mute User</h3>
            <p className="text-sm text-white/60 mb-4">
              Muting: {muteModal.displayName || truncateAddress(muteModal.wallet)}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(parseInt(e.target.value) || 30)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 block mb-1">Reason</label>
                <input
                  type="text"
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMuteModal(null)}
                  className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMute}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-medium"
                >
                  Mute User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#151520] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-red-400">Ban User</h3>
            <p className="text-sm text-white/60 mb-4">
              Banning: {banModal.displayName || truncateAddress(banModal.wallet)}
            </p>
            <p className="text-xs text-red-400/70 mb-4">
              This will permanently remove the user until unbanned.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-1">Reason</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBanModal(null)}
                  className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBan}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Nuke Modal */}
      {nukeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#151520] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-red-400">💣 Nuke User</h3>
            <p className="text-sm text-white/60 mb-2">
              User: {nukeModal.displayName || truncateAddress(nukeModal.wallet)}
            </p>
            <p className="text-sm text-red-400/70 mb-4">
              This will delete ALL {userMessageCounts[nukeModal.wallet?.toLowerCase()] || 0} messages from this user. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setNukeModal(null)}
                className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleNuke}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {processing ? 'Nuking...' : '💣 Nuke All Messages'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Ban Modal */}
      {bulkBanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#151520] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-red-400">Bulk Ban Users</h3>
            <p className="text-sm text-white/60 mb-4">
              Banning {selectedUsers.size} users. This will remove them from the community.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-1">Reason (applies to all)</label>
                <input
                  type="text"
                  value={bulkBanReason}
                  onChange={(e) => setBulkBanReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setBulkBanModal(false); setBulkBanReason(''); }}
                  className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkBan}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {processing ? 'Banning...' : `Ban ${selectedUsers.size} Users`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Message Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteMessageConfirm}
        onClose={() => setDeleteMessageConfirm(null)}
        onConfirm={() => handleDeleteMessage(deleteMessageConfirm?.messageId)}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
      
      {/* Delete Reply Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteReplyConfirm}
        onClose={() => setDeleteReplyConfirm(null)}
        onConfirm={() => handleDeleteReply(deleteReplyConfirm?.replyId)}
        title="Delete Reply"
        message="Are you sure you want to delete this reply? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
      
      {/* Bulk Delete Confirm Modal */}
      <ConfirmModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Messages"
        message={`Are you sure you want to delete ${selectedMessages.size} messages? This action cannot be undone.`}
        confirmText="Delete All"
        confirmVariant="danger"
      />
    </div>
  );
};

// ============================================
// COMMUNITY DASHBOARD
// ============================================
const CommunityDashboard = ({ address, tokenBalance, sessionToken }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [displayName, setDisplayName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userReputation, setUserReputation] = useState(null);
  const [selectedModifier, setSelectedModifier] = useState(null);
  const [savingBadge, setSavingBadge] = useState(false);
  const [mlmWarning, setMlmWarning] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/check`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });

        const data = await response.json();
        setIsAdmin(data.isAdmin || false);
      } catch (error) {
        console.error('Failed to check admin status:', error);
      }
    };
    checkAdmin();
  }, [sessionToken]);
  
  // Fetch display name on mount
  useEffect(() => {
    const fetchDisplayName = async () => {
      try {
        const response = await fetch(`${API_URL}/api/displayname?wallet=${address}`);
        const data = await response.json();
        if (data.displayName) {
          setDisplayName(data.displayName);
          setNewDisplayName(data.displayName);
        }
      } catch (error) {
        console.error('Failed to fetch display name:', error);
      }
    };
    fetchDisplayName();
  }, [address]);
  
  // Fetch user's reputation for badge selector
  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reputation?wallet=${address}`);
        const data = await response.json();
        setUserReputation(data);
        
        // Also fetch their modifier preference
        const prefResponse = await fetch(`${API_URL}/api/reputation/modifier?wallet=${address}`);
        const prefData = await prefResponse.json();
        setSelectedModifier(prefData.modifier);
      } catch (error) {
        console.error('Failed to fetch reputation:', error);
      }
    };
    if (address) {
      fetchReputation();
    }
  }, [address]);
  
  // Track the original modifier to detect changes
  const [originalModifier, setOriginalModifier] = useState(null);
  
  useEffect(() => {
    if (selectedModifier && originalModifier === null) {
      setOriginalModifier(selectedModifier);
    }
  }, [selectedModifier, originalModifier]);
  
  // Update selected badges locally (no server call yet)
  const updateSelectedBadges = (newSelection) => {
    setSelectedModifier(newSelection);
  };
  
  // Save and close settings
  const closeSettings = async () => {
    // Check if badges changed
    if (selectedModifier !== originalModifier && selectedModifier) {
      setSavingBadge(true);
      try {
        const response = await fetch(`${API_URL}/api/reputation/modifier`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ modifier: selectedModifier }),
        });
        
        await response.json();
        
        // Clear ALL reputation caches
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('reputation_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Reload to show new badges
        window.location.reload();
      } catch (error) {
        console.error('Failed to save badge preference:', error);
        setSavingBadge(false);
      }
    } else {
      setShowSettings(false);
    }
  };
  
  // Save display name
  const saveDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setNameError('Display name cannot be empty');
      return;
    }
    
    setSavingName(true);
    setNameError('');
    setNameSuccess(false);
    
    try {
      const response = await fetch(`${API_URL}/api/displayname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ displayName: newDisplayName.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDisplayName(data.displayName);
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 3000);
      } else {
        setNameError(data.error || 'Failed to save display name');
      }
    } catch (error) {
      setNameError('Failed to save display name');
    } finally {
      setSavingName(false);
    }
  };
  
  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center font-bold text-[#0a0a0f]">
              C
            </div>
            <span className="text-xl font-semibold tracking-tight">Commune</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Token Balance */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-amber-400">🛡️</span>
              <span className="font-medium">{tokenBalance}</span>
              <span className="text-white/50">${TOKEN_CONFIG.symbol}</span>
            </div>
            
            {/* Wallet Address */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="font-mono text-sm">{truncateAddress(address)}</span>
            </div>
            
            {/* Settings */}
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icons.Settings />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar Navigation */}
        <nav className="w-16 sm:w-20 border-r border-white/5 p-3 flex flex-col items-center gap-2 flex-shrink-0 relative">
          {/* Chat Tab with Expandable Menu */}
          <div className="relative">
            <button
              onClick={() => {
                if (activeTab === 'chat') {
                  setShowChatMenu(!showChatMenu);
                } else {
                  setActiveTab('chat');
                  setShowChatMenu(false);
                }
              }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'chat' 
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icons.Chat />
            </button>
            
            {/* Expandable Chat Menu */}
            {showChatMenu && activeTab === 'chat' && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowChatMenu(false)}
                />
                
                {/* Menu Panel */}
                <div className="absolute left-full top-0 ml-2 z-50 w-64 bg-[#12121a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-left-2 duration-200">
                  {/* Header */}
                  <div className="p-4 border-b border-white/5">
                    <h3 className="font-semibold text-sm text-white/80">Chat Options</h3>
                  </div>
                  
                  {/* Search */}
                  <div className="p-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-amber-400/50 placeholder-white/30"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            // Dispatch search event to ChatRoom
                            window.dispatchEvent(new CustomEvent('chat-search', { 
                              detail: { query: e.target.value.trim() } 
                            }));
                            setShowChatMenu(false);
                          }
                        }}
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-xs text-white/30 mt-2 px-1">Press Enter to search</p>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="px-3 pb-3 space-y-1">
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('chat-scroll-top'));
                        setShowChatMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-base">⬆️</span>
                      <span>Jump to top</span>
                    </button>
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('chat-scroll-bottom'));
                        setShowChatMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-base">⬇️</span>
                      <span>Jump to bottom</span>
                    </button>
                  </div>
                  
                  {/* Footer */}
                  <div className="px-4 py-3 bg-white/5 border-t border-white/5">
                    <p className="text-xs text-white/30 text-center">Click chat icon again to close</p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={() => { setActiveTab('video'); setShowChatMenu(false); }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'video' 
                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icons.Video />
          </button>
          
          {/* Admin Tab - Only show for admins */}
          {isAdmin && (
            <button
              onClick={() => { setActiveTab('admin'); setShowChatMenu(false); }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'admin' 
                  ? 'bg-red-400/20 text-red-400 border border-red-400/30' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title="Admin Panel"
            >
              🛡️
            </button>
          )}
          
          <div className="flex-1" />
          
          <ConnectButton.Custom>
            {({ openAccountModal }) => (
              <button
                onClick={openAccountModal}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Icons.Disconnect />
              </button>
            )}
          </ConnectButton.Custom>
        </nav>
        
        {/* Content Area */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {activeTab === 'chat' && <ChatRoom walletAddress={address} sessionToken={sessionToken} />}
          {activeTab === 'video' && <VideoCall walletAddress={address} />}
          {activeTab === 'admin' && isAdmin && <AdminPanel sessionToken={sessionToken} />}
        </div>
        
        {/* User List */}
        {activeTab === 'chat' && <UserList sessionToken={sessionToken} />}
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={closeSettings}
        >
          <Card className="max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button 
                onClick={closeSettings}
                disabled={savingBadge}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors disabled:opacity-50"
              >
                {savingBadge ? <Spinner size="sm" /> : <Icons.X />}
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSettingsTab('profile')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  settingsTab === 'profile'
                    ? 'bg-amber-400/20 text-amber-400 border border-amber-400/50'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Icons.User />
                Profile
              </button>
              <button
                onClick={() => setSettingsTab('badges')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  settingsTab === 'badges'
                    ? 'bg-amber-400/20 text-amber-400 border border-amber-400/50'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <span>🏅</span>
                Badges
              </button>
            </div>
            
            {/* Profile Tab */}
            {settingsTab === 'profile' && (
              <div className="space-y-4">
                {/* Display Name */}
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Icons.User />
                    <span className="font-medium">Display Name</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newDisplayName !== displayName) {
                          saveDisplayName();
                        }
                      }}
                      placeholder="Enter display name..."
                      maxLength={20}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400/50"
                    />
                    <Button 
                      size="sm" 
                      onClick={saveDisplayName}
                      disabled={savingName || newDisplayName === displayName}
                    >
                      {savingName ? <Spinner size="sm" /> : 'Save'}
                    </Button>
                  </div>
                  {nameError && (
                    <p className="text-red-400 text-xs mt-2">{nameError}</p>
                  )}
                  {nameSuccess && (
                    <p className="text-emerald-400 text-xs mt-2">Display name saved!</p>
                  )}
                  <p className="text-white/30 text-xs mt-2">Max 20 characters. Letters, numbers, spaces, underscores, dashes only.</p>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Icons.Wallet />
                    <span>Wallet</span>
                  </div>
                  <span className="font-mono text-sm text-white/50">{truncateAddress(address)}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span>🛡️</span>
                    <span>GUARD Balance</span>
                  </div>
                  <span className="font-medium text-amber-400">{tokenBalance}</span>
                </div>
                
                <ConnectButton.Custom>
                  {({ openAccountModal }) => (
                    <Button variant="danger" className="w-full" onClick={openAccountModal}>
                      <Icons.Disconnect />
                      Disconnect Wallet
                    </Button>
                  )}
                </ConnectButton.Custom>
              </div>
            )}
            
            {/* Badges Tab */}
            {settingsTab === 'badges' && (
              <div className="space-y-4">
                {/* Badge Display */}
                {userReputation?.primaryBadge ? (
                  <>
                    {/* Build list of all available badges */}
                    {(() => {
                      const allBadges = [];
                      if (userReputation.isEarlyAdopter) {
                        allBadges.push({ emoji: '🏆', name: 'Early Adopter', description: 'First 100 GUARD holders ever' });
                      }
                      if (userReputation.primaryBadge) {
                        allBadges.push(userReputation.primaryBadge);
                      }
                      if (userReputation.availableModifiers) {
                        userReputation.availableModifiers.forEach(mod => {
                          allBadges.push(mod);
                        });
                      }
                      
                      // Parse hidden badges from selectedModifier (stored as "hidden:emoji1,emoji2")
                      const getHiddenBadges = () => {
                        if (selectedModifier && selectedModifier.startsWith('hidden:')) {
                          return selectedModifier.replace('hidden:', '').split(',').filter(e => e);
                        }
                        return [];
                      };
                      
                      const hiddenBadges = getHiddenBadges();
                      const visibleBadges = allBadges.filter(b => !hiddenBadges.includes(b.emoji));
                      
                      // Get highest visible badge for color preview
                      const priority = ['🏆', '👑', '💎', '🌳', '🌿', '🌾', '🌱', '🍃', '⭐', '🔄'];
                      let highestBadge = null;
                      for (const emoji of priority) {
                        const badge = visibleBadges.find(b => b.emoji === emoji);
                        if (badge) {
                          highestBadge = badge;
                          break;
                        }
                      }
                      
                      const getColorAndGlow = () => {
                        if (!highestBadge) return { color: 'text-white', glow: '' };
                        const emoji = highestBadge.emoji;
                        if (emoji === '🏆' || emoji === '👑') return { color: 'text-amber-400', glow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' };
                        if (emoji === '💎') return { color: 'text-purple-400', glow: 'drop-shadow-[0_0_6px_rgba(192,132,252,0.5)]' };
                        if (emoji === '🌳') return { color: 'text-cyan-400', glow: 'drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]' };
                        if (emoji === '🌿') return { color: 'text-teal-400', glow: 'drop-shadow-[0_0_4px_rgba(45,212,191,0.3)]' };
                        if (emoji === '🌾') return { color: 'text-emerald-400', glow: '' };
                        if (emoji === '🌱') return { color: 'text-green-400', glow: '' };
                        if (emoji === '🍃') return { color: 'text-lime-400', glow: '' };
                        return { color: 'text-white', glow: '' };
                      };
                      
                      const { color, glow } = getColorAndGlow();
                      
                      const toggleBadgeVisibility = (emoji) => {
                        let newHidden = [...hiddenBadges];
                        if (newHidden.includes(emoji)) {
                          // Show badge
                          newHidden = newHidden.filter(e => e !== emoji);
                        } else {
                          // Hide badge
                          newHidden.push(emoji);
                        }
                        updateSelectedBadges(newHidden.length > 0 ? `hidden:${newHidden.join(',')}` : '');
                      };
                      
                      return (
                        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                          {/* Username color preview */}
                          <div className="p-4 bg-white/5 rounded-xl">
                            <p className="text-xs text-white/50 mb-3">Your username appearance:</p>
                            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                              <span className={`text-lg font-medium ${color} ${glow} transition-all`}>
                                {displayName || truncateAddress(address)}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 mt-2">Hover over usernames in chat to see recognition details</p>
                          </div>
                          
                          {/* Badge visibility toggles */}
                          <div className="p-4 bg-white/5 rounded-xl">
                            <p className="text-sm font-medium mb-2">Your recognition:</p>
                            <p className="text-xs text-white/50 mb-3">Toggle which badges others can see when they hover your name</p>
                            <div className="space-y-2">
                              {allBadges.map(badge => {
                                const isHidden = hiddenBadges.includes(badge.emoji);
                                return (
                                  <button
                                    key={badge.emoji}
                                    onClick={() => toggleBadgeVisibility(badge.emoji)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                                      isHidden
                                        ? 'bg-white/5 border border-white/10 opacity-50'
                                        : 'bg-white/10 border border-white/20'
                                    }`}
                                  >
                                    <span className={`text-2xl ${isHidden ? 'grayscale' : ''}`}>{badge.emoji}</span>
                                    <div className="flex-1 text-left">
                                      <p className={`text-sm font-medium ${isHidden ? 'text-white/50' : ''}`}>{badge.name}</p>
                                      <p className="text-xs text-white/40">{badge.description}</p>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full transition-colors ${isHidden ? 'bg-white/10' : 'bg-amber-500'}`}>
                                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${isHidden ? 'ml-0.5' : 'ml-4'}`} />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {hiddenBadges.length > 0 && (
                              <p className="text-xs text-white/30 mt-3 text-center">
                                {hiddenBadges.length} badge{hiddenBadges.length > 1 ? 's' : ''} hidden from your profile
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="p-6 bg-white/5 rounded-xl text-center">
                    <span className="text-4xl mb-4 block">🏅</span>
                    <p className="text-sm text-white/70 mb-2">No badges yet</p>
                    <p className="text-xs text-white/50">
                      Hold GUARD tokens to earn reputation badges! Badges are based on how long you've been a holder.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================
// AUTH FLOW WRAPPER
// ============================================
const AuthenticatedApp = () => {
  const { address: connectedAddress, isConnected: walletConnected } = useAccount();
  const [isVerified, setIsVerified] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [lastCheckedAddress, setLastCheckedAddress] = useState(null);

  // Dev mode - allows testing with any wallet address
  const [devWallet, setDevWallet] = useState(null);
  const isDevMode = !!devWallet;
  const address = devWallet || connectedAddress;
  const isConnected = isDevMode || walletConnected;
  
  // Read GUARD token balance (skip in dev mode)
  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: TOKEN_CONFIG.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !isDevMode && isConnected && !!address,
  });

  const formattedBalance = isDevMode ? '∞ (Dev Mode)' : formatTokenBalance(balance, TOKEN_CONFIG.decimals);
  const hasEnoughTokens = isDevMode || hasRequiredTokens(balance, TOKEN_CONFIG.decimals);
  
  // Check for existing session or handle wallet change (skip in dev mode)
  useEffect(() => {
    // Skip session check in dev mode - already verified
    if (isDevMode) {
      setCheckingSession(false);
      return;
    }

    const handleSession = async () => {
      // If no address, reset everything
      if (!address) {
        setCheckingSession(false);
        return;
      }

      // If wallet changed, clear old session
      if (lastCheckedAddress && lastCheckedAddress !== address) {
        setIsVerified(false);
        setSessionToken(null);
        sessionStorage.removeItem('commune_session');
      }

      setLastCheckedAddress(address);

      // Check for existing valid session
      const storedToken = sessionStorage.getItem('commune_session');
      if (storedToken) {
        try {
          const response = await fetch(`${API_URL}/api/session`, {
            headers: { 'Authorization': `Bearer ${storedToken}` },
          });
          const data = await response.json();

          if (data.valid && data.wallet?.toLowerCase() === address.toLowerCase()) {
            setSessionToken(storedToken);
            setIsVerified(true);
            setCheckingSession(false);
            return;
          }
        } catch (error) {
          console.error('Session check failed:', error);
        }
        // Invalid session - remove it
        sessionStorage.removeItem('commune_session');
      }

      setCheckingSession(false);
    };

    handleSession();
  }, [address, isDevMode]);
  
  // Periodic balance recheck to kick users who sold tokens
  useEffect(() => {
    if (!sessionToken || !isVerified) return;
    
    const revalidateBalance = async () => {
      try {
        const response = await fetch(`${API_URL}/api/revalidate`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        const data = await response.json();
        
        if (!data.valid) {
          // User no longer has enough tokens - kick them out
          console.log('Session invalidated:', data.reason);
          setSessionToken(null);
          setIsVerified(false);
          sessionStorage.removeItem('commune_session');
        }
      } catch (error) {
        console.error('Balance revalidation failed:', error);
      }
    };
    
    // Check every 5 minutes
    const interval = setInterval(revalidateBalance, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [sessionToken, isVerified]);
  
  // Not connected - show landing page
  if (!isConnected) {
    return <LandingPage onDevLogin={(wallet) => {
      setDevWallet(wallet);
      setIsVerified(true); // Skip signature in dev mode
      setSessionToken('dev-mode-token');
      setCheckingSession(false);
    }} />;
  }
  
  // Checking for existing session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-white/50 mt-4">Checking session...</p>
        </div>
      </div>
    );
  }
  
  // Loading balance (skip in dev mode)
  if (!isDevMode && balanceLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-white/50 mt-4">Checking GUARD balance...</p>
        </div>
      </div>
    );
  }
  
  // Insufficient tokens
  if (!hasEnoughTokens) {
    return <InsufficientTokensPage tokenBalance={formattedBalance} />;
  }
  
  // Has tokens but not verified - show sign message
  if (!isVerified) {
    return (
      <SignMessagePage 
        tokenBalance={formattedBalance}
        walletAddress={address}
        onSuccess={(token) => {
          setSessionToken(token);
          sessionStorage.setItem('commune_session', token);
          setIsVerified(true);
        }}
      />
    );
  }
  
  // Fully authenticated - show recognition loading then dashboard
  return (
    <RecognitionLoader 
      address={address} 
      tokenBalance={formattedBalance} 
      sessionToken={sessionToken} 
    />
  );
};

// ============================================
// BADGE WITH TOOLTIP - For wrapped screen
// ============================================
const BadgeWithTooltip = ({ emoji, name, description }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const badgeRef = useRef(null);
  
  // Get badge-specific colors
  const getBadgeColors = () => {
    switch (emoji) {
      case '🏆': return { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/40', glow: 'shadow-amber-500/30', text: 'text-amber-400' };
      case '👑': return { bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/40', glow: 'shadow-amber-500/30', text: 'text-amber-400' };
      case '💎': return { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/40', glow: 'shadow-purple-500/30', text: 'text-purple-400' };
      case '🌳': return { bg: 'from-cyan-500/20 to-teal-500/20', border: 'border-cyan-500/40', glow: 'shadow-cyan-500/30', text: 'text-cyan-400' };
      case '🌿': return { bg: 'from-teal-500/20 to-green-500/20', border: 'border-teal-500/40', glow: 'shadow-teal-500/30', text: 'text-teal-400' };
      case '🔒': return { bg: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/40', glow: 'shadow-blue-500/30', text: 'text-blue-400' };
      case '⚡': return { bg: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/30', text: 'text-yellow-400' };
      case '🗳️': return { bg: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/40', glow: 'shadow-indigo-500/30', text: 'text-indigo-400' };
      default: return { bg: 'from-white/10 to-white/5', border: 'border-white/20', glow: 'shadow-white/10', text: 'text-white/80' };
    }
  };
  
  const colors = getBadgeColors();
  
  const handleMouseEnter = () => {
    const rect = badgeRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
    setShowTooltip(true);
  };
  
  return (
    <>
      <div 
        ref={badgeRef}
        className={`group flex flex-col items-center cursor-pointer p-3 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} transition-all duration-300 hover:-translate-y-2 hover:shadow-lg ${colors.glow} hover:scale-105`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-4xl mb-2 transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-lg">{emoji}</span>
        <span className={`text-xs font-medium ${colors.text} text-center leading-tight`}>{name}</span>
      </div>
      
      {showTooltip && ReactDOM.createPortal(
        <div 
          className="fixed z-[400] animate-fade-in pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className={`bg-gradient-to-br from-[#1a1a25] to-[#0f0f18] border ${colors.border} rounded-xl shadow-2xl ${colors.glow} p-4 max-w-xs mb-2 backdrop-blur-sm`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl drop-shadow-lg">{emoji}</span>
              <div>
                <p className={`text-sm font-bold ${colors.text} mb-1`}>{name}</p>
                <p className="text-xs text-white/60 leading-relaxed">{description}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// ============================================
// RECOGNITION LOADER - "GUARD WRAPPED" EXPERIENCE
// ============================================
// Demo wallets that skip the Wrapped presentation (go straight to chat)
const DEMO_SKIP_WRAPPED = [
  '0x81763A34dB26e383C1144BE34C3FB7C56F48BFF3'.toLowerCase(),
];

const RecognitionLoader = ({ address, tokenBalance, sessionToken }) => {
  const [stage, setStage] = useState('loading'); // 'loading', 'transitioning', 'wrapped', 'ready'
  const [terminalLines, setTerminalLines] = useState([]);
  const [guardData, setGuardData] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Check if user has already seen the wrapped experience this session
  // OR if this is a demo wallet that should skip wrapped
  useEffect(() => {
    const seenKey = `guard_wrapped_seen_${address.toLowerCase()}`;
    const shouldSkip = sessionStorage.getItem(seenKey) || DEMO_SKIP_WRAPPED.includes(address.toLowerCase());
    if (shouldSkip) {
      setShowDashboard(true);
    }
  }, [address]);
  
  // Terminal typing effect
  const addTerminalLine = (text, delay = 0) => {
    return new Promise(resolve => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, { text, timestamp: Date.now() }]);
        resolve();
      }, delay);
    });
  };
  
  // Fetch reputation data with terminal updates
  useEffect(() => {
    if (showDashboard) return;
    
    const fetchReputationWithProgress = async () => {
      try {
        await addTerminalLine(`> Initializing connection...`, 1500);
        await addTerminalLine(`> Wallet identified: ${address.slice(0, 6)}...${address.slice(-4)}`, 2500);
        await addTerminalLine(`> Scanning blockchain for GUARD activity...`, 3000);
        
        // Actually fetch the reputation data
        const response = await fetch(`${API_URL}/api/reputation?wallet=${address}&detailed=true`);
        
        await addTerminalLine(`> Retrieving your community achievements...`, 3000);
        
        if (response.ok) {
          const data = await response.json();
          setGuardData(data);
          
          // Cache it
          const cacheKey = `reputation_${address.toLowerCase()}`;
          localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
          
          await addTerminalLine(`> ✓ Data retrieved successfully!`, 2500);
          await addTerminalLine(`> Preparing your GUARD journey recap...`, 2000);
          
          // Start fade out transition
          setStage('transitioning');
          // After fade out completes, show wrapped
          setTimeout(() => setStage('wrapped'), 1000);
        } else {
          await addTerminalLine(`> ⚠ Could not retrieve history`, 2000);
          await addTerminalLine(`> Proceeding to community...`, 2000);
          setTimeout(() => handleEnterCommunity(), 1500);
        }
      } catch (error) {
        console.error('Failed to fetch reputation:', error);
        await addTerminalLine(`> Connection issue, skipping recap...`, 2000);
        setTimeout(() => handleEnterCommunity(), 1500);
      }
    };
    
    fetchReputationWithProgress();
  }, [address, showDashboard]);
  
  const handleEnterCommunity = () => {
    const seenKey = `guard_wrapped_seen_${address.toLowerCase()}`;
    sessionStorage.setItem(seenKey, 'true');
    setShowDashboard(true);
  };
  
  // If already seen or ready to show dashboard
  if (showDashboard) {
    return <CommunityDashboard address={address} tokenBalance={tokenBalance} sessionToken={sessionToken} />;
  }
  
  // Format date nicely
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  // Calculate holding duration
  const getHoldingDuration = () => {
    // Use walletProfile.firstBuyDate as fallback if guardData.firstBuy is missing
    const firstBuyTimestamp = guardData?.firstBuy || (walletProfile?.firstBuyDate ? new Date(walletProfile.firstBuyDate).getTime() : null);
    if (!firstBuyTimestamp) return null;
    const days = Math.floor((Date.now() - firstBuyTimestamp) / (1000 * 60 * 60 * 24));
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
    }
    return `${days} day${days !== 1 ? 's' : ''}`;
  };
  
  // Get fun description based on badges
  const getHolderPersonality = () => {
    if (!guardData) return null;
    
    const { primaryBadge, availableModifiers, isEarlyAdopter } = guardData;
    
    if (isEarlyAdopter) {
      return "You were there from the beginning. A true pioneer who believed before anyone else. 🏆";
    }
    if (primaryBadge?.emoji === '👑') {
      return "A founding member of the GUARD family. Your conviction helped build this community. 👑";
    }
    if (primaryBadge?.emoji === '💎') {
      return "Diamond hands don't shake. You've weathered every storm with unwavering belief. 💎";
    }
    if (primaryBadge?.emoji === '🌳') {
      return "Deep roots grow strong trees. You're an OG who's seen it all. 🌳";
    }
    if (primaryBadge?.emoji === '🌿') {
      return "A veteran holder with stories to tell. Your journey continues. 🌿";
    }
    if (availableModifiers?.find(m => m.emoji === '⭐')) {
      return "A true believer who went all-in early. That's conviction. ⭐";
    }
    if (availableModifiers?.find(m => m.emoji === '🔄')) {
      return "Steady and consistent. You've been stacking GUARD like clockwork. 🔄";
    }
    
    return "Welcome to the GUARD community. Your journey is just beginning! 🛡️";
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        
        {/* Loading Stage - Terminal */}
        {(stage === 'loading' || stage === 'transitioning') && (
          <div 
            className="animate-fade-in-slow"
            style={{ 
              opacity: stage === 'transitioning' ? 0 : undefined,
              transition: stage === 'transitioning' ? 'opacity 1s ease-out' : undefined
            }}
          >
            <h2 className="text-xl font-bold text-center mb-6 text-amber-400">
              🛡️ Scanning Your GUARD Journey
            </h2>
            
            {/* Terminal Window */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden shadow-2xl">
              {/* Terminal Header */}
              <div className="bg-[#161b22] px-4 py-2 flex items-center gap-2 border-b border-[#30363d]">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
                <span className="ml-3 text-xs text-white/40 font-mono">guard-scanner v1.0</span>
              </div>
              
              {/* Terminal Body */}
              <div className="p-4 font-mono text-sm h-64 overflow-y-auto">
                {terminalLines.map((line, i) => (
                  <div 
                    key={i} 
                    className={`${line.text.includes('✓') ? 'text-green-400' : line.text.includes('⚠') ? 'text-yellow-400' : 'text-green-400/80'} animate-fade-in`}
                  >
                    {line.text}
                  </div>
                ))}
                {stage === 'loading' && <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1" />}
              </div>
            </div>
            
            <p className="text-center text-white/30 text-sm mt-4">
              Fetching your blockchain history...
            </p>
          </div>
        )}
        
        {/* Wrapped Stage - GUARD Wrapped */}
        {stage === 'wrapped' && guardData && (
          <WrappedPresentation 
            guardData={guardData} 
            address={address}
            formatDate={formatDate}
            getHoldingDuration={getHoldingDuration}
            getHolderPersonality={getHolderPersonality}
            onEnterCommunity={handleEnterCommunity}
          />
        )}
        
      </div>
    </div>
  );
};

// ============================================
// WRAPPED PRESENTATION - Cinematic reveal with Price Stats
// ============================================
const WrappedPresentation = ({ guardData, address, formatDate, getHoldingDuration, getHolderPersonality, onEnterCommunity }) => {
  const [scene, setScene] = useState(0);
  const [subStage, setSubStage] = useState(0);
  const [flipDate, setFlipDate] = useState(null);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [priceStats, setPriceStats] = useState(null);
  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);
  const [quoteReady, setQuoteReady] = useState(false); // User clicked Next on quote
  const [personalizedQuote, setPersonalizedQuote] = useState(null); // The generated quote
  
  // Load profile from holder-profiles.json for accurate badge and quote data
  const walletProfile = holderProfiles.profiles.find(
    p => p.address.toLowerCase() === address.toLowerCase()
  );

  // Fetch price stats on mount, with fallback to holder-profiles.json
  useEffect(() => {
    const fetchPriceStats = async () => {
      try {
        const walletToFetch = address;

        // First, call reputation endpoint to ensure transfers are cached
        // This is needed because user-price-stats depends on cached transfer data
        await fetch(`${API_URL}/api/reputation?wallet=${walletToFetch}`);

        // Now fetch price stats (transfers should be cached)
        const response = await fetch(`${API_URL}/api/user-price-stats?wallet=${walletToFetch}`);
        if (response.ok) {
          const data = await response.json();
          // If API returned valid data, use it
          if (data && data.totalBuys) {
            setPriceStats(data);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch price stats:', error);
      }

      // Fallback: build priceStats from holder-profiles.json
      if (walletProfile) {
        const fallbackStats = {
          totalBuys: walletProfile.totalBuys,
          totalSells: walletProfile.totalSells,
          currentBalance: walletProfile.balance,
          biggestBuy: walletProfile.biggestBuy,
          biggestSell: walletProfile.biggestSell,
          firstBuyDate: walletProfile.firstBuyDate,
          lastBuyDate: walletProfile.lastBuyDate,
          // These require price data which we don't have in holder-profiles.json
          // They'll show as unavailable, which is fine
          bestBuy: null,
          worstBuy: null,
          dcaScore: null,
          paperHandsMoments: walletProfile.totalSells > 0 ? [{ exists: true }] : [],
          monthlyStreak: null,
          buyingStyle: walletProfile.totalBuys >= 10 ? 'Accumulator' : 'Holder',
        };
        setPriceStats(fallbackStats);
      }
    };
    fetchPriceStats();
  }, [address, walletProfile]);

  // Load personalized quote from holder profiles
  useEffect(() => {
    if (walletProfile) {
      const quote = generatePersonalizedQuote(walletProfile);
      setPersonalizedQuote(quote);
    }
  }, [address, walletProfile]);

  // Build badges array from holder-profiles.json (more accurate than API)
  const allBadges = [];
  if (walletProfile) {
    // Use profile data from holder-profiles.json
    if (walletProfile.isEarlyAdopter) {
      allBadges.push({
        emoji: '🏆',
        name: 'Early Adopter',
        reason: 'For being one of the first 100 GUARD holders ever'
      });
    }
    if (walletProfile.primaryBadge) {
      allBadges.push({
        emoji: walletProfile.primaryBadge.emoji,
        name: walletProfile.primaryBadge.name,
        reason: walletProfile.primaryBadge.permanent ? 'A permanent mark of your early commitment' : 'Based on when you first joined'
      });
    }
    if (walletProfile.modifiers) {
      walletProfile.modifiers.forEach(mod => {
        // Skip opt-in badges like Paper Hands unless explicitly shown
        if (!mod.optIn) {
          allBadges.push({
            emoji: mod.emoji,
            name: mod.name,
            reason: mod.reason
          });
        }
      });
    }
  } else {
    // Fallback to guardData from API if not in holder-profiles.json
    if (guardData.isEarlyAdopter) {
      allBadges.push({
        emoji: '🏆',
        name: 'Early Adopter',
        reason: 'For being one of the first 100 GUARD holders ever'
      });
    }
    if (guardData.primaryBadge) {
      allBadges.push({
        emoji: guardData.primaryBadge.emoji,
        name: guardData.primaryBadge.name,
        reason: guardData.primaryBadge.description
      });
    }
    if (guardData.availableModifiers) {
      guardData.availableModifiers.forEach(mod => {
        allBadges.push({
          emoji: mod.emoji,
          name: mod.name,
          reason: mod.description
        });
      });
    }
  }
  
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Helper to format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num?.toLocaleString() || '0';
  };
  
  // Helper to format price
  const formatPrice = (price) => {
    const p = parseFloat(price);
    if (p < 0.01) return '$' + p.toFixed(4);
    if (p < 1) return '$' + p.toFixed(3);
    return '$' + p.toFixed(2);
  };
  
  // Helper to format date nicely
  const formatNiceDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Scene 0: Title sequence
  useEffect(() => {
    if (scene !== 0) return;
    const t = SCENE_TIMING.scene0_title;
    
    const titleSequence = async () => {
      await delay(t.initialDelay);
      setSubStage(1); // Show title
      await delay(t.titleDisplay);
      setSubStage(2); // Show subtitle
      await delay(t.subtitleDisplay);
      setSubStage(3); // Fade out
      await delay(t.fadeOut);
      setScene(1);
      setSubStage(0);
    };
    
    titleSequence();
  }, [scene]);
  
  // Scene 1: Date flip sequence
  useEffect(() => {
    if (scene !== 1) return;
    const t = SCENE_TIMING.scene1_date;
    
    const dateSequence = async () => {
      await delay(t.initialDelay);
      setSubStage(1); // "Your journey began..."
      await delay(t.titleDisplay);
      setSubStage(2); // Start date flip
      startDateFlip();
      await delay(t.dateFlipDuration);
      setSubStage(3); // Show duration
      await delay(t.durationDisplay);
      setSubStage(4); // Fade out
      await delay(t.fadeOut);
      setScene(2);
      setSubStage(0);
    };
    
    dateSequence();
  }, [scene]);
  
  // Scene 2: The Accumulator - total buys, biggest buy
  useEffect(() => {
    if (scene !== 2) return;
    const t = SCENE_TIMING.scene2_accumulator;
    
    const accumulatorSequence = async () => {
      await delay(t.initialDelay);
      setSubStage(1); // "You kept coming back"
      await delay(t.titleDisplay);
      setSubStage(2); // Show total buys counter
      await delay(t.countDisplay);
      setSubStage(3); // Show biggest buy
      await delay(t.biggestBuyDisplay);
      setSubStage(4); // Fade out
      await delay(t.fadeOut);
      setScene(3);
      setSubStage(0);
    };
    
    accumulatorSequence();
  }, [scene]);
  
  // Scene 3: Timing Game - best vs worst buy
  useEffect(() => {
    if (scene !== 3) return;
    const t = SCENE_TIMING.scene3_timing;
    
    const timingSequence = async () => {
      await delay(t.initialDelay);
      setSubStage(1); // "Let's talk timing..."
      await delay(t.titleDisplay);
      setSubStage(2); // Show best buy
      await delay(t.bestBuyDisplay);
      setSubStage(3); // Show worst buy
      await delay(t.worstBuyDisplay);
      setSubStage(4); // Show multiplier difference
      await delay(t.multiplierDisplay);
      setSubStage(5); // Fade out
      await delay(t.fadeOut);
      // Go to Paper Hands scene if they have moments, otherwise skip to Style
      if (priceStats?.paperHandsMoments?.length > 0) {
        setScene(4); // Paper Hands
      } else {
        setScene(5); // Skip to Style
      }
      setSubStage(0);
    };
    
    timingSequence();
  }, [scene, priceStats]);
  
  // Scene 4: Paper Hands Moments 😅
  useEffect(() => {
    if (scene !== 4) return;
    const t = SCENE_TIMING.scene4_paperHands;
    
    const paperHandsSequence = async () => {
      await delay(t.initialDelay);
      setSubStage(1); // "About those sells..."
      await delay(t.titleDisplay);
      setSubStage(2); // Show first paper hands moment
      await delay(t.cardDisplay);
      setSubStage(3); // Show "but you came back" message
      await delay(t.redemptionDisplay);
      setSubStage(4); // Fade out
      await delay(t.fadeOut);
      setScene(5); // Go to Style
      setSubStage(0);
    };
    
    paperHandsSequence();
  }, [scene]);
  
  // Scene 5: Your Style - DCA score, streak, favorite day
  useEffect(() => {
    if (scene !== 5) return;
    const t = SCENE_TIMING.scene5_style;
    
    const styleSequence = async () => {
      await delay(t.initialDelay);
      setSubStage(1); // "Your buying style"
      await delay(t.titleDisplay);
      setSubStage(2); // Show style badge
      await delay(t.badgeDisplay);
      setSubStage(3); // Show streak
      await delay(t.streakDisplay);
      setSubStage(4); // Show day/time preference
      await delay(t.preferenceDisplay);
      setSubStage(5); // Fade out
      await delay(t.fadeOut);
      setScene(6); // Badges
      setSubStage(0);
      setCurrentBadgeIndex(0);
    };
    
    styleSequence();
  }, [scene]);
  
  // Scene 6: Badges sequence
  useEffect(() => {
    if (scene !== 6) return;
    const t = SCENE_TIMING.scene6_badges;
    
    const badgeSequence = async () => {
      await delay(t.initialDelay);
      setSubStage(1); // Show "You've earned your place" title
      await delay(t.titleDisplay);
      
      // Loop through each badge
      for (let i = 0; i < allBadges.length; i++) {
        // Change badge index while at subStage 4 or 1 (badge content hidden)
        setCurrentBadgeIndex(i);
        await delay(TRANSITIONS.elementDelay.short);
        setSubStage(2); // Fade in reason
        await delay(t.reasonDisplay);
        setSubStage(3); // Fade in badge
        await delay(t.badgeReveal);
        // Only fade out badge content if there are more badges or personality quote
        if (i < allBadges.length - 1) {
          setSubStage(1); // Keep title, hide badge content
          await delay(t.badgeTransition);
        }
      }
      
      // Fade out last badge AND title together
      setSubStage(4); // This will hide both title and badge
      await delay(t.titleFadeOut);
      
      // Show personality quote (everything else is now hidden)
      setSubStage(6);
      // Wait for user to click Next button (quoteReady state)
      // This is handled by the quoteReady useEffect below
    };

    badgeSequence();
  }, [scene, allBadges.length]);

  // Handle quote Next button click - advance to next scene
  useEffect(() => {
    if (!quoteReady || scene !== 6 || subStage !== 6) return;

    const advanceScene = async () => {
      const t = SCENE_TIMING.scene6_badges;
      // Fade out entire scene
      setSubStage(5);
      await delay(t.fadeOut);

      // Move to username color scene
      setScene(7);
      setSubStage(0);
      setQuoteReady(false); // Reset for next time
    };

    advanceScene();
  }, [quoteReady, scene, subStage]);

  // Scene 7: Username color reveal
  useEffect(() => {
    if (scene !== 7) return;
    const t = SCENE_TIMING.scene7_username;
    
    const usernameSequence = async () => {
      await delay(t.initialDelay);
      setSubStage(1); // Show message about color
      await delay(t.messageDisplay);
      setSubStage(2); // Show username in white
      await delay(t.usernameReveal);
      setSubStage(3); // Transition to colored/glowing
      await delay(t.colorTransition);
      setSubStage(4); // Fade out
      await delay(t.fadeOut);
      
      // Move to final summary
      setScene(8); // Final
      setSubStage(0);
    };
    
    usernameSequence();
  }, [scene]);
  
  // Scene 8: Final summary
  useEffect(() => {
    if (scene !== 8) return;
    const t = SCENE_TIMING.scene8_summary;
    
    const finalSequence = async () => {
      await delay(t.initialDelay);
      setSubStage(1); // Fade in complete wrapped
    };
    
    finalSequence();
  }, [scene]);
  
  // Date flip animation
  const startDateFlip = () => {
    const today = new Date();
    // Use walletProfile.firstBuyDate as fallback if guardData.firstBuy is missing
    const firstBuySource = guardData.firstBuy || (walletProfile?.firstBuyDate ? new Date(walletProfile.firstBuyDate).getTime() : null);
    if (!firstBuySource) return; // Can't animate without a date
    const targetDate = new Date(firstBuySource);

    setFlipDate(today);
    
    const totalDuration = 2500;
    const steps = 20;
    const stepDuration = totalDuration / steps;
    const dayDiff = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
    const daysPerStep = dayDiff / steps;
    
    let step = 0;
    const flipInterval = setInterval(() => {
      step++;
      const daysBack = Math.floor(daysPerStep * step);
      const newDate = new Date(today);
      newDate.setDate(today.getDate() - daysBack);
      setFlipDate(newDate);
      
      if (step >= steps) {
        clearInterval(flipInterval);
        setFlipDate(targetDate);
      }
    }, stepDuration);
  };
  
  const formatFlipDate = (date) => {
    if (!date) return { day: '--', month: '---', year: '----' };
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      year: date.getFullYear()
    };
  };
  
  const flipDateParts = formatFlipDate(flipDate);
  
  // Calculate timing multiplier
  const getTimingMultiplier = () => {
    if (!priceStats?.bestBuy?.price || !priceStats?.worstBuy?.price) return null;
    const best = parseFloat(priceStats.bestBuy.price);
    const worst = parseFloat(priceStats.worstBuy.price);
    return Math.round(worst / best);
  };
  
  // Get buying style emoji and description
  const getBuyingStyleInfo = () => {
    const style = priceStats?.buyingStyle;
    switch (style) {
      case 'consistent_dca': return { emoji: '📊', label: 'Consistent DCA', desc: 'You bought like clockwork' };
      case 'moderate_dca': return { emoji: '📈', label: 'Moderate DCA', desc: 'Steady accumulation' };
      case 'accumulator': return { emoji: '🎯', label: 'Accumulator', desc: 'Strategic buying when it felt right' };
      case 'one_time': return { emoji: '💫', label: 'One-Timer', desc: 'You saw it and went all in' };
      case 'occasional': return { emoji: '🌙', label: 'Occasional Buyer', desc: 'Quality over quantity' };
      default: return { emoji: '💎', label: 'GUARD Holder', desc: 'Part of the community' };
    }
  };
  
  const buyingStyleInfo = getBuyingStyleInfo();
  const timingMultiplier = getTimingMultiplier();
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      
      {/* Scene 0: Title Sequence */}
      {scene === 0 && (
        <div className={`text-center transition-opacity ${TRANSITIONS.fadeDefault} ${subStage === 3 ? 'opacity-0' : 'opacity-100'}`}>
          <h1 className={`${TYPOGRAPHY.heroTitle} mb-4 transition-opacity ${TRANSITIONS.fadeVerySlow} ${TRANSITIONS.easing} ${
            subStage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}>
            <span className={`${TYPOGRAPHY.heroTitleAccent}`}>Your GUARD</span> Journey
          </h1>
          <p className={`${TYPOGRAPHY.heroSubtitle} transition-opacity ${TRANSITIONS.fadeSlow} ${TRANSITIONS.easing} delay-500 ${
            subStage >= 2 ? 'opacity-100' : 'opacity-0'
          }`}>
            Here's your story in the community
          </p>
        </div>
      )}
      
      {/* Scene 1: Date Flip Sequence */}
      {scene === 1 && (
        <div className={`text-center transition-opacity ${TRANSITIONS.fadeDefault} ${subStage === 4 ? 'opacity-0' : 'opacity-100'}`}>
          <p className={`${TYPOGRAPHY.sceneTitle} mb-8 transition-opacity ${TRANSITIONS.fadeDefault} ${
            subStage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}>
            Your journey began...
          </p>
          
          {/* Flip Clock Style Date */}
          <div className={`flex justify-center gap-3 mb-8 transition-opacity ${TRANSITIONS.fadeFast} ${
            subStage >= 2 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className={`group ${CARDS.dateCard} min-w-[80px] transition-all duration-300 ${CARDS.dateCardHover}`}>
              <span className="text-4xl font-bold text-white font-mono group-hover:text-amber-400 transition-colors">{flipDateParts.day}</span>
            </div>
            <div className={`group ${CARDS.dateCard} min-w-[100px] transition-all duration-300 ${CARDS.dateCardHover}`}>
              <span className="text-4xl font-bold text-white font-mono group-hover:text-amber-400 transition-colors">{flipDateParts.month}</span>
            </div>
            <div className={`group ${CARDS.dateCard} transition-all duration-300 ${CARDS.dateCardHover}`}>
              <span className={`text-4xl font-bold ${COLORS.primary} font-mono group-hover:${COLORS.primaryGlow} transition-all`}>{flipDateParts.year}</span>
            </div>
          </div>
          
          <p className={`text-lg text-white/50 transition-opacity ${TRANSITIONS.fadeDefault} ${
            subStage >= 3 ? 'opacity-100' : 'opacity-0'
          }`}>
            That's <span className={`${COLORS.primary} font-bold ${COLORS.primaryGlow}`}>{getHoldingDuration()}</span> of holding strong
          </p>
        </div>
      )}
      
      {/* Scene 2: The Accumulator - total buys, biggest buy */}
      {scene === 2 && (
        <div className={`text-center transition-opacity ${TRANSITIONS.fadeDefault} ${subStage === 4 ? 'opacity-0' : 'opacity-100'}`}>
          <p className={`${TYPOGRAPHY.sceneTitle} mb-8 transition-opacity ${TRANSITIONS.fadeDefault} ${
            subStage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}>
            You kept coming back...
          </p>
          
          {/* Total buys counter */}
          <div className={`mb-8 transition-opacity ${TRANSITIONS.fadeFast} ${
            subStage >= 2 ? 'opacity-100' : 'opacity-0'
          }`}>
            <span className={`${TYPOGRAPHY.statNumber} ${COLORS.primaryGlowStrong} hover:${COLORS.primaryGlowHover} transition-all duration-300 cursor-default`}>
              {priceStats?.totalBuys || guardData.transactionCount || '?'}
            </span>
            <p className={TYPOGRAPHY.statLabel}>separate purchases</p>
          </div>
          
          {/* Biggest buy */}
          {priceStats?.biggestBuy && (
            <div className={`transition-opacity ${TRANSITIONS.fadeFast} ${
              subStage >= 3 ? 'opacity-100' : 'opacity-0'
            }`}>
              <p className="text-white/50 mb-2">Your biggest single buy</p>
              <div className={`group ${CARDS.statCard} inline-block transition-all duration-300 ${CARDS.statCardHover} cursor-default`}>
                <span className={`${TYPOGRAPHY.cardTitle} group-hover:text-amber-100 transition-colors`}>{formatNumber(priceStats.biggestBuy.amount)}</span>
                <span className={`text-xl ${COLORS.primary} ml-2 group-hover:${COLORS.primaryGlow} transition-all`}>GUARD</span>
                <p className={`${TYPOGRAPHY.cardDetail} mt-1 group-hover:text-white/60 transition-colors`}>{formatNiceDate(priceStats.biggestBuy.date)}</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Scene 3: Timing Game - best vs worst buy */}
      {scene === 3 && (
        <div className={`text-center transition-opacity ${TRANSITIONS.fadeDefault} ${subStage === 5 ? 'opacity-0' : 'opacity-100'}`}>
          <p className={`${TYPOGRAPHY.sceneTitle} mb-10 transition-opacity ${TRANSITIONS.fadeDefault} ${
            subStage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}>
            Let's talk timing...
          </p>
          
          <div className="flex justify-center gap-8 flex-wrap">
            {/* Best buy */}
            {priceStats?.bestBuy && (
              <div className={`transition-opacity ${TRANSITIONS.fadeFast} ${
                subStage >= 2 ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className={`group ${COLORS.bestTiming.bg} border ${COLORS.bestTiming.border} ${CARDS.timingCard} cursor-default transition-all duration-300 ${CARDS.timingCardHover} ${COLORS.bestTiming.shadow} ${COLORS.bestTiming.hoverBorder} ${COLORS.bestTiming.hoverBg}`}>
                  <p className={`${COLORS.bestTiming.text} ${TYPOGRAPHY.timingLabel} mb-2`}>
                    <span className="inline-block group-hover:animate-bounce">🎯</span> Best Timing
                  </p>
                  <span className={`${TYPOGRAPHY.timingPrice} ${COLORS.bestTiming.text} group-hover:text-green-300 group-hover:${COLORS.bestTiming.glow} transition-all`}>{formatPrice(priceStats.bestBuy.price)}</span>
                  <p className={`${TYPOGRAPHY.cardSubtitle} mt-2 group-hover:text-white/70 transition-colors`}>{formatNiceDate(priceStats.bestBuy.date)}</p>
                  <p className={TYPOGRAPHY.cardSmallDetail}>{formatNumber(priceStats.bestBuy.amount)} GUARD</p>
                </div>
              </div>
            )}
            
            {/* Worst buy */}
            {priceStats?.worstBuy && (
              <div className={`transition-opacity ${TRANSITIONS.fadeFast} ${
                subStage >= 3 ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className={`group ${COLORS.worstTiming.bg} border ${COLORS.worstTiming.border} ${CARDS.timingCard} cursor-default transition-all duration-300 ${CARDS.timingCardHover} ${COLORS.worstTiming.shadow} ${COLORS.worstTiming.hoverBorder} ${COLORS.worstTiming.hoverBg}`}>
                  <p className={`${COLORS.worstTiming.text} ${TYPOGRAPHY.timingLabel} mb-2`}>
                    <span className="inline-block group-hover:animate-pulse">😅</span> Worst Timing
                  </p>
                  <span className={`${TYPOGRAPHY.timingPrice} ${COLORS.worstTiming.text} group-hover:text-red-300 group-hover:${COLORS.worstTiming.glow} transition-all`}>{formatPrice(priceStats.worstBuy.price)}</span>
                  <p className={`${TYPOGRAPHY.cardSubtitle} mt-2 group-hover:text-white/70 transition-colors`}>{formatNiceDate(priceStats.worstBuy.date)}</p>
                  <p className={TYPOGRAPHY.cardSmallDetail}>{formatNumber(priceStats.worstBuy.amount)} GUARD</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Multiplier difference */}
          {timingMultiplier && timingMultiplier > 1 && (
            <p className={`${TYPOGRAPHY.multiplierText} mt-8 transition-opacity ${TRANSITIONS.fadeFast} ${
              subStage >= 4 ? 'opacity-100' : 'opacity-0'
            }`}>
              That's a <span className={`${TYPOGRAPHY.multiplierAccent} ${COLORS.primaryGlow}`}>{timingMultiplier}x</span> difference! 
              <span className="text-white/40 ml-2">Hey, we've all been there 😅</span>
            </p>
          )}
        </div>
      )}
      
      {/* Scene 4: Paper Hands Moments 😅 */}
      {scene === 4 && priceStats?.paperHandsMoments?.length > 0 && (
        <div className={`text-center transition-opacity ${TRANSITIONS.fadeDefault} ${subStage === 4 ? 'opacity-0' : 'opacity-100'}`}>
          <p className={`${TYPOGRAPHY.sceneTitle} mb-8 transition-opacity ${TRANSITIONS.fadeDefault} ${
            subStage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}>
            About those sells... <span className="inline-block animate-pulse">😬</span>
          </p>
          
          {/* Paper hands moment card */}
          <div className={`transition-opacity ${TRANSITIONS.fadeFast} ${
            subStage >= 2 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className={`group ${COLORS.paperHands.bgGradient} border ${COLORS.paperHands.border} ${CARDS.paperHandsCard} cursor-default transition-all duration-300 ${CARDS.paperHandsCardHover}`}>
              <span className="text-5xl block mb-4 group-hover:animate-bounce">🧻</span>
              <p className={`${TYPOGRAPHY.cardSubtitle} mb-2`}>You sold on {formatNiceDate(priceStats.paperHandsMoments[0].sellDate)}</p>
              <p className="text-2xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors">
                {formatNumber(Math.round(priceStats.paperHandsMoments[0].sellAmount))} GUARD
              </p>
              <p className={`${TYPOGRAPHY.cardDetail} mb-4`}>
                at {formatPrice(priceStats.paperHandsMoments[0].sellPrice)}
              </p>
              
              <div className="border-t border-white/10 pt-4">
                <p className={TYPOGRAPHY.cardSubtitle}>Then it pumped to</p>
                <p className={`${TYPOGRAPHY.timingPrice} ${COLORS.paperHands.text} group-hover:text-red-300 group-hover:${COLORS.paperHands.glow} transition-all`}>
                  +{priceStats.paperHandsMoments[0].missedGainPercent}%
                </p>
                <p className={`${TYPOGRAPHY.cardSmallDetail} mt-1`}>
                  peaked {formatPrice(priceStats.paperHandsMoments[0].recoveryPrice)}
                </p>
              </div>
            </div>
            
            {priceStats.paperHandsMoments.length > 1 && (
              <p className={`${TYPOGRAPHY.cardSmallDetail} mt-4 hover:text-white/50 transition-colors cursor-default`}>
                ...and {priceStats.paperHandsMoments.length - 1} more time{priceStats.paperHandsMoments.length > 2 ? 's' : ''} 😅
              </p>
            )}
          </div>
          
          {/* Redemption message */}
          <p className={`text-lg text-white/60 mt-8 transition-opacity ${TRANSITIONS.fadeFast} ${
            subStage >= 3 ? 'opacity-100' : 'opacity-0'
          }`}>
            But hey, <span className={`${COLORS.primary} font-medium ${COLORS.primaryGlow}`}>you came back stronger</span> <span className="inline-block hover:scale-125 transition-transform cursor-default">💪</span>
          </p>
        </div>
      )}
      
      {/* Scene 5: Your Style - DCA score, streak, favorite day */}
      {scene === 5 && (
        <div className={`text-center transition-opacity ${TRANSITIONS.fadeDefault} ${subStage === 5 ? 'opacity-0' : 'opacity-100'}`}>
          <p className={`${TYPOGRAPHY.sceneTitle} mb-8 transition-opacity ${TRANSITIONS.fadeDefault} ${
            subStage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}>
            Your buying style
          </p>
          
          {/* Style badge */}
          <div className={`mb-8 transition-opacity ${TRANSITIONS.fadeFast} ${
            subStage >= 2 ? 'opacity-100' : 'opacity-0'
          }`}>
            <span className="text-6xl block mb-3 hover:scale-125 hover:rotate-12 transition-transform duration-300 cursor-default">{buyingStyleInfo.emoji}</span>
            <p className={`text-2xl font-bold ${COLORS.primary} ${COLORS.primaryGlow}`}>{buyingStyleInfo.label}</p>
            <p className="text-white/50 mt-1">{buyingStyleInfo.desc}</p>
            {priceStats?.dcaScore > 0 && (
              <p className={TYPOGRAPHY.cardSmallDetail}>{priceStats.dcaScore}% consistency score</p>
            )}
          </div>
          
          {/* Streak */}
          {priceStats?.monthlyStreak?.longest > 1 && (
            <div className={`mb-6 transition-opacity ${TRANSITIONS.fadeFast} ${
              subStage >= 3 ? 'opacity-100' : 'opacity-0'
            }`}>
              <p className="text-white/50 mb-2">Longest buying streak</p>
              <div className={`group ${CARDS.stylePill} cursor-default transition-all duration-300 ${CARDS.stylePillHover}`}>
                <span className="text-2xl group-hover:animate-pulse">🔥</span>
                <span className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">{priceStats.monthlyStreak.longest} months</span>
                <span className="text-white/40 text-sm">in a row</span>
              </div>
              <p className={`${TYPOGRAPHY.cardSmallDetail} mt-2`}>
                {priceStats.monthlyStreak.start} → {priceStats.monthlyStreak.end}
              </p>
            </div>
          )}
          
          {/* Day/time preference */}
          <div className={`transition-opacity ${TRANSITIONS.fadeFast} ${
            subStage >= 4 ? 'opacity-100' : 'opacity-0'
          }`}>
            <p className="text-white/40">
              You're a <span className="text-white font-medium hover:text-amber-400 transition-colors cursor-default">{priceStats?.favoriteDayOfWeek || 'weekday'}</span>
              {' '}
              <span className={`${COLORS.primary} hover:${COLORS.primaryGlow} transition-all cursor-default`}>{priceStats?.buyTimePreference?.replace('_', ' ') || 'buyer'}</span>
            </p>
          </div>
        </div>
      )}
      
      {/* Scene 6: Badges Sequence */}
      {scene === 6 && (
        <div className={`text-center transition-opacity ${TRANSITIONS.fadeDefault} ${LAYOUT.badgeSceneMinHeight} flex flex-col items-center justify-center ${subStage === 5 ? 'opacity-0' : 'opacity-100'}`}>
          
          {/* Badge sequence content - shown during stages 1-3, fades at 4 */}
          <div className={`flex flex-col items-center justify-center transition-opacity ${TRANSITIONS.fadeDefault} ${
            subStage >= 1 && subStage <= 3 ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
          }`}>
            {/* Title */}
            <p className={`${TYPOGRAPHY.sceneTitle} mb-8 transition-opacity ${TRANSITIONS.fadeDefault} ${
              subStage >= 1 && subStage <= 3 ? 'opacity-100' : 'opacity-0'
            }`}>
              You've earned your place
            </p>
            
            {/* Badge content */}
            {allBadges[currentBadgeIndex] && (
              <div className={`flex flex-col items-center justify-center transition-opacity ${TRANSITIONS.fadeFast} ${
                subStage === 2 || subStage === 3 ? 'opacity-100' : 'opacity-0'
              }`}>
                {/* Reason text - single line */}
                <p className={`${TYPOGRAPHY.badgeReason} transition-opacity ${TRANSITIONS.fadeFast} mb-6 ${
                  subStage >= 2 && subStage <= 3 ? 'opacity-100' : 'opacity-0'
                }`}>
                  {(() => {
                    const name = allBadges[currentBadgeIndex].name;
                    const reason = allBadges[currentBadgeIndex].reason;
                    if (name === 'Early Adopter') return 'One of the first 100 to believe';
                    if (name === 'Founding Member') return 'Here from the very beginning';
                    if (name === 'True Believer') return 'Over half your stack within 45 days of your first buy';
                    if (name === 'Steady Stacker') return 'Consistently building your position';
                    if (name === 'Diamond Hands') return 'Held through everything';
                    if (name === 'Whale') return 'A major force in the community';
                    return reason.replace(/^For /i, '').replace(/\.$/, '');
                  })()}
                </p>
                
                {/* Badge reveal */}
                <div className={`flex flex-col items-center justify-center transition-opacity ${TRANSITIONS.fadeFast} ${
                  subStage === 3 ? 'opacity-100' : 'opacity-0'
                }`}>
                  <span className={`${TYPOGRAPHY.badgeEmoji} block mb-4 hover:scale-110 transition-transform duration-300 cursor-default ${
                    getBadgeColors(allBadges[currentBadgeIndex].emoji).glow
                  }`}>
                    {allBadges[currentBadgeIndex].emoji}
                  </span>
                  <p className={`${TYPOGRAPHY.badgeName} ${
                    getBadgeColors(allBadges[currentBadgeIndex].emoji).text
                  }`}>
                    {allBadges[currentBadgeIndex].name}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Personalized story quote - card style with Next button */}
          <div className={`flex flex-col items-center justify-center w-full transition-opacity ${TRANSITIONS.fadeVerySlow} ${TRANSITIONS.easing} ${
            subStage === 6 ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
          }`}>
            <div className={`${CARDS.quoteCard} ${CARDS.quoteCardGlow}`}>
              <div className={TYPOGRAPHY.storyQuoteContainer}>
                <p className={TYPOGRAPHY.storyQuote}>
                  {personalizedQuote || getHolderPersonality()}
                </p>
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setQuoteReady(true)}
                  className="px-8 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 hover:border-amber-500/60 rounded-lg text-amber-400 font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Scene 7: Username Color Reveal */}
      {scene === 7 && (
        <div className={`text-center transition-opacity ${TRANSITIONS.fadeDefault} ${subStage === 4 ? 'opacity-0' : 'opacity-100'}`}>
          {/* Message about color */}
          <p className={`${TYPOGRAPHY.sceneTitle} mb-12 max-w-md mx-auto transition-opacity ${TRANSITIONS.fadeDefault} ${
            subStage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}>
            Your recognition gives you a special presence in chat
          </p>
          
          {/* Username reveal */}
          <div className={`transition-opacity ${TRANSITIONS.fadeDefault} ${
            subStage >= 2 ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Username with color overlay for smooth transition */}
            <div className="relative inline-block">
              {/* Base white text */}
              <p className={`${TYPOGRAPHY.username} cursor-default hover:scale-110 transition-all duration-500 ${
                subStage >= 3 ? 'text-white/0' : 'text-white'
              }`}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              {/* Colored text overlay */}
              <p className={`${TYPOGRAPHY.username} cursor-default absolute inset-0 transition-all ${TRANSITIONS.fadeDefault} hover:scale-110 ${
                subStage >= 3 ? 'opacity-100' : 'opacity-0'
              } ${getUsernameColor(guardData)}`}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
            
            {/* Hint text */}
            <p className={`${TYPOGRAPHY.usernameHint} mt-6 transition-opacity ${TRANSITIONS.fadeDefault} ${
              subStage >= 3 ? 'opacity-100' : 'opacity-0'
            }`}>
              Hover over your name to reveal your achievements
            </p>
          </div>
        </div>
      )}
      
      {/* Scene 8: Final Summary */}
      {scene === 8 && (
        <div className={`space-y-6 w-full transition-all ${TRANSITIONS.fadeSlow} ${
          subStage >= 1 ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              <span className={COLORS.primary}>Your GUARD</span> Journey
            </h1>
            <p className="text-white/50">Here's your story in the community</p>
          </div>
          
          {/* Main Stats Card */}
          <div className={`${CARDS.statCard} rounded-2xl p-6 space-y-5 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10`}>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="group cursor-default p-2 rounded-lg hover:bg-white/5 transition-all duration-200 hover:-translate-y-1">
                <p className={`text-2xl font-bold ${COLORS.primary} group-hover:scale-110 transition-transform duration-200`}>{priceStats?.totalBuys || '?'}</p>
                <p className="text-white/40 text-xs">Purchases</p>
              </div>
              <div className="group cursor-default p-2 rounded-lg hover:bg-white/5 transition-all duration-200 hover:-translate-y-1">
                <p className="text-2xl font-bold text-white group-hover:scale-110 transition-transform duration-200">{formatNumber(priceStats?.currentBalance || 0)}</p>
                <p className="text-white/40 text-xs">GUARD Now</p>
              </div>
              <div className="group cursor-default p-2 rounded-lg hover:bg-white/5 transition-all duration-200 hover:-translate-y-1">
                <p className={`text-2xl font-bold ${COLORS.bestTiming.text} group-hover:scale-110 transition-transform duration-200`}>{priceStats?.dcaScore || 0}%</p>
                <p className="text-white/40 text-xs">DCA Score</p>
              </div>
            </div>
            
            <div className="border-t border-white/10" />
            
            {/* Journey Timeline */}
            <div className="text-center group cursor-default">
              <p className="text-white/50 text-sm mb-1">Journey started</p>
              <p className="text-lg font-bold text-amber-400 group-hover:text-amber-300 transition-colors duration-200">{formatDate(guardData?.firstBuy || (walletProfile?.firstBuyDate ? new Date(walletProfile.firstBuyDate).getTime() : null))}</p>
              <p className="text-white/40 text-sm mt-1">
                <span className="text-white font-medium">{getHoldingDuration()}</span> of holding strong
              </p>
            </div>
            
            <div className="border-t border-white/10" />
            
            {/* Timing Stats */}
            {(priceStats?.bestBuy || priceStats?.worstBuy) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {priceStats?.bestBuy && (
                    <div className="group bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20 hover:border-green-500/40 hover:bg-green-500/15">
                      <p className="text-green-400 text-xs mb-1">
                        <span className="inline-block group-hover:animate-bounce">🎯</span> Best Buy
                      </p>
                      <p className="text-lg font-bold text-green-400 group-hover:text-green-300 transition-colors">{formatPrice(priceStats.bestBuy.price)}</p>
                      <p className="text-white/30 text-xs">{formatNiceDate(priceStats.bestBuy.date)}</p>
                    </div>
                  )}
                  {priceStats?.worstBuy && (
                    <div className="group bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/20 hover:border-red-500/40 hover:bg-red-500/15">
                      <p className="text-red-400 text-xs mb-1">
                        <span className="inline-block group-hover:animate-pulse">😅</span> Worst Buy
                      </p>
                      <p className="text-lg font-bold text-red-400 group-hover:text-red-300 transition-colors">{formatPrice(priceStats.worstBuy.price)}</p>
                      <p className="text-white/30 text-xs">{formatNiceDate(priceStats.worstBuy.date)}</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-white/10" />
              </>
            )}
            
            {/* Buying Style & Streak */}
            <div className="flex justify-center gap-4 flex-wrap text-center">
              <div className="group bg-white/5 rounded-lg px-4 py-2 cursor-default transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-md">
                <span className="text-2xl inline-block group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">{buyingStyleInfo.emoji}</span>
                <p className="text-sm font-medium text-amber-400 group-hover:text-amber-300 transition-colors">{buyingStyleInfo.label}</p>
              </div>
              {priceStats?.monthlyStreak?.longest > 1 && (
                <div className="group bg-white/5 rounded-lg px-4 py-2 cursor-default transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-md">
                  <span className="text-2xl inline-block group-hover:scale-125 group-hover:animate-pulse transition-transform duration-300">🔥</span>
                  <p className="text-sm font-medium text-white group-hover:text-orange-300 transition-colors">{priceStats.monthlyStreak.longest} mo streak</p>
                </div>
              )}
              {priceStats?.favoriteDayOfWeek && (
                <div className="group bg-white/5 rounded-lg px-4 py-2 cursor-default transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-md">
                  <span className="text-2xl inline-block group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-300">📅</span>
                  <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{priceStats.favoriteDayOfWeek}s</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-white/10" />
            
            {/* Milestones */}
            {priceStats?.milestonesHit?.length > 0 && (
              <>
                <div className="text-center">
                  <p className="text-white/50 text-sm mb-3">Milestones crossed</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {priceStats.milestonesHit.map((m, i) => (
                      <span 
                        key={i} 
                        className="bg-white/10 rounded-full px-3 py-1 text-sm cursor-default transition-all duration-300 hover:bg-amber-500/20 hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-500/20"
                        style={{ transitionDelay: `${i * 50}ms` }}
                      >
                        <span className="text-amber-400">{formatNumber(m.milestone)}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/10" />
              </>
            )}
            
            {/* Paper Hands Moments */}
            {priceStats?.paperHandsMoments?.length > 0 && (
              <>
                <div className="text-center">
                  <p className="text-white/50 text-sm mb-3">
                    <span className="inline-block hover:animate-spin transition-transform cursor-default">🧻</span> Paper Hands Moments
                  </p>
                  <div className="space-y-2">
                    {priceStats.paperHandsMoments.map((moment, i) => (
                      <div 
                        key={i} 
                        className="group bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex justify-between items-center cursor-default transition-all duration-300 hover:-translate-y-1 hover:bg-red-500/15 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10"
                      >
                        <div className="text-left">
                          <p className="text-white/70 text-sm group-hover:text-white/90 transition-colors">{formatNiceDate(moment.sellDate)}</p>
                          <p className="text-white/40 text-xs">{formatNumber(Math.round(moment.sellAmount))} GUARD @ {formatPrice(moment.sellPrice)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-400 font-bold group-hover:text-red-300 group-hover:scale-110 transition-all duration-200 inline-block">+{moment.missedGainPercent}%</p>
                          <p className="text-white/30 text-xs">missed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/30 text-xs mt-2 italic">But you came back stronger <span className="inline-block hover:scale-150 transition-transform cursor-default">💪</span></p>
                </div>
                <div className="border-t border-white/10" />
              </>
            )}
            
            {/* Badges Earned */}
            <div className="text-center">
              <p className="text-amber-400/80 text-sm font-medium mb-4 tracking-wide uppercase">✨ Recognition Earned</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {allBadges.map((badge, i) => (
                  <BadgeWithTooltip 
                    key={i}
                    emoji={badge.emoji} 
                    name={badge.name} 
                    description={badge.reason}
                  />
                ))}
              </div>
            </div>
            
            <div className="border-t border-white/10" />
            
            {/* Personality */}
            <div className="text-center group cursor-default">
              <p className="text-lg text-white/90 italic group-hover:text-white transition-colors duration-300">
                "{getHolderPersonality()}"
              </p>
            </div>
          </div>
          
          {/* Username Preview */}
          <div className="group bg-white/5 border border-white/10 rounded-xl p-4 text-center transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1 hover:shadow-lg cursor-default">
            <p className="text-white/50 text-sm mb-2 group-hover:text-white/70 transition-colors">In chat, your name will glow:</p>
            <p className={`text-xl font-bold transition-all duration-500 group-hover:scale-110 ${
              guardData.isEarlyAdopter || guardData.primaryBadge?.emoji === '👑' 
                ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] group-hover:drop-shadow-[0_0_16px_rgba(251,191,36,0.8)]' 
                : guardData.primaryBadge?.emoji === '💎' 
                  ? 'text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.5)] group-hover:drop-shadow-[0_0_14px_rgba(192,132,252,0.7)]'
                  : guardData.primaryBadge?.emoji === '🌳'
                    ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]'
                    : 'text-white group-hover:text-white/90'
            }`}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
            <p className="text-white/30 text-xs mt-2 group-hover:text-white/50 transition-colors">
              Hover over your name to see your achievements
            </p>
          </div>
          
          {/* Enter Button - with glow effect */}
          <button
            onClick={onEnterCommunity}
            className="group relative w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/40 overflow-hidden"
          >
            {/* Animated border beam effect */}
            <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="absolute inset-[-2px] rounded-xl bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 animate-pulse" style={{ filter: 'blur(4px)' }}></span>
            </span>
            <span className="relative flex items-center justify-center gap-2">
              <span className="group-hover:animate-bounce">🎉</span> 
              Let's Go! Enter the Community
            </span>
          </button>
          
          <p className="text-center text-white/30 text-sm hover:text-white/50 transition-colors cursor-default">
            Your friends are waiting
          </p>
        </div>
      )}
      
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================
export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#f59e0b',
            accentColorForeground: '#0a0a0f',
            borderRadius: 'large',
            fontStack: 'system',
          })}
        >
          <AuthenticatedApp />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

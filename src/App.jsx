import React, { useState, useEffect, useRef } from 'react';
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
  SIGN_MESSAGE_CONFIG,
  API_URL,
  truncateAddress,
  formatTokenBalance,
  hasRequiredTokens,
  generateNonce,
} from './config/web3';

// ============================================
// QUERY CLIENT
// ============================================
const queryClient = new QueryClient();

// ============================================
// MOCK DATA
// ============================================
const MOCK_MESSAGES = [
  { id: 1, user: 'alice.eth', avatar: '🌸', message: 'Hey everyone! Excited to be here.', timestamp: new Date(Date.now() - 3600000) },
  { id: 2, user: 'cryptoking.eth', avatar: '👑', message: 'Welcome! Great to have you.', timestamp: new Date(Date.now() - 3500000) },
  { id: 3, user: 'defi_dev.eth', avatar: '🔧', message: 'Anyone working on anything cool?', timestamp: new Date(Date.now() - 3400000) },
];

const MOCK_USERS = [
  { address: '0x1234...5678', name: 'alice.eth', avatar: '🌸', status: 'online' },
  { address: '0x2345...6789', name: 'cryptoking.eth', avatar: '👑', status: 'online' },
  { address: '0x3456...7890', name: 'defi_dev.eth', avatar: '🔧', status: 'away' },
  { address: '0x4567...8901', name: 'nft_collector.eth', avatar: '🎨', status: 'online' },
];

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
// LANDING PAGE
// ============================================
const LandingPage = () => {
  const [showLearnMore, setShowLearnMore] = useState(false);
  
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
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

// ============================================
// SIGN MESSAGE VERIFICATION PAGE
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
      const message = SIGN_MESSAGE_CONFIG.getMessage(nonce);
      const signature = await signMessageAsync({ message });
      
      // Verify signature with the API and get session token
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          signature,
          message,
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
const ThreadPreview = ({ message, replies, sessionToken, onClose, position }) => {
  const [threadReplies, setThreadReplies] = useState(replies || []);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const previewRef = useRef(null);
  
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
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match the fade-out duration
  };
  
  const sendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ content: replyText, replyTo: message.id }),
      });
      const data = await response.json();
      if (data.success) {
        setThreadReplies(prev => [...prev, {
          ...data.message,
          user: truncateAddress(data.message.wallet),
          avatar: '🛡️',
          timestamp: new Date(data.message.timestamp),
        }]);
        setReplyText('');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div
      ref={previewRef}
      className={`fixed z-50 w-80 max-h-96 bg-[#1a1a25] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
        isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{ 
        top: Math.max(80, Math.min(position.top - 50, window.innerHeight - 400)),
        left: Math.min(position.left + 20, window.innerWidth - 340),
      }}
      onMouseLeave={handleClose}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <Avatar emoji={message.avatar || '🛡️'} size="sm" />
          <div>
            <p className="text-sm font-medium">{message.displayName || message.user}</p>
            <p className="text-xs text-white/40 line-clamp-1">{message.content}</p>
          </div>
        </div>
      </div>
      
      {/* Replies */}
      <div className="max-h-56 overflow-y-auto p-3 space-y-3">
        {threadReplies.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No replies yet</p>
        ) : (
          threadReplies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <Avatar emoji={reply.avatar || '🛡️'} size="xs" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium">{reply.displayName || reply.user}</span>
                  <span className="text-xs text-white/20">{formatTime(reply.timestamp)}</span>
                </div>
                <p className="text-white/70 text-sm">{reply.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Reply Input */}
      <div className="p-3 border-t border-white/5">
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
      </div>
    </div>
  );
};

// ============================================
// THREAD MODAL (Full Thread View)
// ============================================
const ThreadModal = ({ message, sessionToken, onClose }) => {
  const [threadReplies, setThreadReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const repliesEndRef = useRef(null);
  
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
    
    // Poll for new replies
    const interval = setInterval(loadThread, 5000);
    return () => clearInterval(interval);
  }, [message.id, sessionToken]);
  
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadReplies]);
  
  const sendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ content: replyText, replyTo: message.id }),
      });
      const data = await response.json();
      if (data.success) {
        setThreadReplies(prev => [...prev, {
          ...data.message,
          user: truncateAddress(data.message.wallet),
          avatar: '🛡️',
          timestamp: new Date(data.message.timestamp),
        }]);
        setReplyText('');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
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
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold">Thread</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <Icons.X />
          </button>
        </div>
        
        {/* Original Message */}
        <div className="p-4 bg-white/5 border-b border-white/5">
          <div className="flex gap-3">
            <Avatar emoji={message.avatar || '🛡️'} size="md" />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{message.displayName || message.user}</span>
                {message.displayName && (
                  <span className="text-xs text-white/20 font-mono">{message.user}</span>
                )}
                <span className="text-xs text-white/30">{formatTime(message.timestamp)}</span>
              </div>
              <p className="text-white/80 mt-1">{message.content}</p>
            </div>
          </div>
        </div>
        
        {/* Replies */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : threadReplies.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No replies yet. Be the first!</p>
          ) : (
            threadReplies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <Avatar emoji={reply.avatar || '🛡️'} size="sm" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{reply.displayName || reply.user}</span>
                    {reply.displayName && (
                      <span className="text-xs text-white/20 font-mono">{reply.user}</span>
                    )}
                    <span className="text-xs text-white/30">{formatTime(reply.timestamp)}</span>
                  </div>
                  <p className="text-white/70 text-sm mt-1">{reply.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={repliesEndRef} />
        </div>
        
        {/* Reply Input */}
        <div className="p-4 border-t border-white/5">
          <div className="flex gap-2">
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
        </div>
      </div>
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
  const messagesEndRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  
  const emojis = ['👍', '❤️', '😂', '🔥', '🚀', '💎', '🛡️', '👏'];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Load messages from API
  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages.map(msg => ({
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
        })));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [sessionToken]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const sendMessage = async (replyTo = null) => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ content: newMessage, replyTo }),
      });
      
      const data = await response.json();
      
      if (data.success && data.message) {
        if (!replyTo) {
          setMessages(prev => [...prev, {
            ...data.message,
            user: truncateAddress(data.message.wallet),
            avatar: '🛡️',
            timestamp: new Date(data.message.timestamp),
            replyCount: 0,
            recentReplies: [],
          }]);
        }
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
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
  
  // Fetch online user count
  const [onlineCount, setOnlineCount] = useState(0);
  
  const fetchOnlineCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      const data = await response.json();
      if (data.count !== undefined) {
        setOnlineCount(data.count);
      }
    } catch (error) {
      // Silently fail
    }
  };
  
  useEffect(() => {
    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 10000);
    return () => clearInterval(interval);
  }, [sessionToken]);
  
  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Thread Modal */}
      {openThread && (
        <ThreadModal
          message={openThread}
          sessionToken={sessionToken}
          onClose={() => setOpenThread(null)}
        />
      )}
      
      {/* Thread Preview on Hover */}
      {hoverThread && !openThread && (
        <ThreadPreview
          message={hoverThread}
          replies={hoverThread.recentReplies}
          sessionToken={sessionToken}
          onClose={() => setHoverThread(null)}
          position={hoverPosition}
        />
      )}
      
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          <h2 className="font-semibold">GUARD Chat</h2>
          <Badge>{onlineCount} online</Badge>
        </div>
      </div>
      
      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-4 transition-all duration-300 ${openThread ? 'blur-sm opacity-50' : ''}`}>
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
              className="group"
              onMouseEnter={(e) => handleMouseEnter(msg, e)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Main Message */}
              <div className="flex gap-3">
                <Avatar emoji={msg.avatar} size="sm" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm">
                      {msg.displayName || msg.user}
                    </span>
                    {msg.displayName && (
                      <span className="text-xs text-white/20 font-mono">{msg.user}</span>
                    )}
                    <span className="text-xs text-white/30">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="text-white/80 text-sm mt-1 leading-relaxed">{msg.content || msg.message}</p>
                  
                  {/* Reply Button & Thread Info */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setOpenThread(msg)}
                      className="text-xs text-white/30 hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                      <Icons.Reply />
                      Reply
                    </button>
                    
                    {msg.replyCount > 0 && (
                      <button
                        onClick={() => setOpenThread(msg)}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                      >
                        💬 {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
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
                          <span className="text-xs font-medium">{reply.displayName || reply.user}</span>
                          <span className="text-xs text-white/20">{formatTime(reply.timestamp)}</span>
                        </div>
                        <p className="text-white/60 text-xs line-clamp-2">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {msg.replyCount > 3 && (
                    <button
                      onClick={() => setOpenThread(msg)}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors ml-8"
                    >
                      View all {msg.replyCount} replies →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className={`p-4 border-t border-white/5 transition-all duration-300 ${openThread ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
        {/* Slow Mode Notice */}
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          <p className="text-red-400 text-xs">
            Slow mode enabled — new messages appear every 5 seconds
          </p>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/5 rounded-2xl border border-white/10 px-4 py-3 focus-within:border-amber-400/50 transition-colors">
            <button 
              className="text-white/40 hover:text-white/70 transition-colors relative"
              onClick={() => setShowEmojis(!showEmojis)}
            >
              <Icons.Smile />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none text-sm"
            />
            <button 
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="text-amber-400 hover:text-amber-300 transition-colors disabled:text-white/20 disabled:cursor-not-allowed"
            >
              <Icons.Send />
            </button>
          </div>
          
          {/* Emoji Picker */}
          {showEmojis && (
            <div className="absolute bottom-full left-0 mb-2 bg-[#151520] border border-white/10 rounded-xl p-3 flex gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  className="w-8 h-8 hover:bg-white/10 rounded-lg transition-colors text-lg"
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojis(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
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
    <div className="w-64 border-l border-white/5 p-4 hidden lg:block">
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
                  {user.displayName || truncateAddress(user.wallet)}
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
// COMMUNITY DASHBOARD
// ============================================
const CommunityDashboard = ({ address, tokenBalance, sessionToken }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState(false);
  
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
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
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
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-16 sm:w-20 border-r border-white/5 p-3 flex flex-col items-center gap-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'chat' 
                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icons.Chat />
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'video' 
                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icons.Video />
          </button>
          
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
        <div className="flex-1 flex">
          {activeTab === 'chat' && <ChatRoom walletAddress={address} sessionToken={sessionToken} />}
          {activeTab === 'video' && <VideoCall walletAddress={address} />}
        </div>
        
        {/* User List */}
        {activeTab === 'chat' && <UserList sessionToken={sessionToken} />}
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <Icons.X />
              </button>
            </div>
            
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
                  <Icons.Mic />
                  <span>Microphone</span>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Icons.Video />
                  <span>Camera</span>
                </div>
                <Badge variant="success">Enabled</Badge>
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
            </div>
            
            <ConnectButton.Custom>
              {({ openAccountModal }) => (
                <Button variant="danger" className="w-full mt-6" onClick={openAccountModal}>
                  <Icons.Disconnect />
                  Disconnect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
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
  const { address, isConnected } = useAccount();
  const [isVerified, setIsVerified] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [lastCheckedAddress, setLastCheckedAddress] = useState(null);
  
  // Read GUARD token balance
  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: TOKEN_CONFIG.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && !!address,
  });
  
  const formattedBalance = formatTokenBalance(balance, TOKEN_CONFIG.decimals);
  const hasEnoughTokens = hasRequiredTokens(balance, TOKEN_CONFIG.decimals);
  
  // Check for existing session or handle wallet change
  useEffect(() => {
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
        localStorage.removeItem('commune_session');
      }
      
      setLastCheckedAddress(address);
      
      // Check for existing valid session
      const storedToken = localStorage.getItem('commune_session');
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
        localStorage.removeItem('commune_session');
      }
      
      setCheckingSession(false);
    };
    
    handleSession();
  }, [address]);
  
  // Not connected - show landing page
  if (!isConnected) {
    return <LandingPage />;
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
  
  // Loading balance
  if (balanceLoading) {
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
          localStorage.setItem('commune_session', token);
          setIsVerified(true);
        }}
      />
    );
  }
  
  // Fully authenticated - show dashboard
  return <CommunityDashboard address={address} tokenBalance={formattedBalance} sessionToken={sessionToken} />;
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

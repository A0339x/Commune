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
  const [exitDirection, setExitDirection] = useState({ x: 0, y: 0 });
  const previewRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // Track mouse position while inside
  const handleMouseMove = (e) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  
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
  const messagesEndRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const gifSearchTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const mentionSoundRef = useRef(null);
  
  const emojis = ['👍', '❤️', '😂', '🔥', '🚀', '💎', '🛡️', '👏'];
  
  // Tenor API Key - fetched from server
  const [tenorApiKey, setTenorApiKey] = useState('');
  
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
  
  // Connect to WebSocket
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const ws = new WebSocket(`${WS_URL}/api/ws?token=${sessionToken}`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      // Load initial message history
      loadMessageHistory();
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'new_message':
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
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.parentId) {
            const newReplies = [...(msg.recentReplies || []), {
              ...data.reply,
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
        // Keep-alive response
        break;
        
      case 'error':
        console.error('WebSocket error:', data.message);
        break;
    }
  };
  
  // Load message history via HTTP (one-time on connect)
  const loadMessageHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
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
        // Scroll to bottom after messages load
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 100);
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
    
    // Keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionToken]);
  
  const sendMessage = async (replyTo = null) => {
    if (!newMessage.trim() || sending) return;
    
    const messageContent = newMessage;
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content: messageContent,
      wallet: walletAddress,
      user: truncateAddress(walletAddress),
      avatar: '🛡️',
      timestamp: new Date(),
      replyCount: 0,
      recentReplies: [],
    };
    
    // Optimistically add message immediately
    if (!replyTo) {
      setMessages(prev => [...prev, tempMessage]);
      setTimeout(() => scrollToBottom(), 100);
    }
    setNewMessage('');
    
    // Stop typing indicator
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_typing' }));
    }
    isTypingRef.current = false;
    
    // Extract mentioned wallets from selectedMentions
    const mentions = selectedMentions.map(m => m.wallet);
    
    // Send via WebSocket if connected, otherwise fallback to HTTP
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: replyTo ? 'reply' : 'message',
        content: messageContent,
        replyTo,
        mentions,
      }));
    } else {
      // Fallback to HTTP
      setSending(true);
      try {
        await fetch(`${API_URL}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ content: messageContent, replyTo, mentions }),
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } finally {
        setSending(false);
      }
    }
    
    // Clear mentions
    setSelectedMentions([]);
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
    }
    
    cancelEditing();
  };
  
  // Delete a message
  const deleteMessage = (messageId) => {
    if (!confirm('Delete this message?')) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'delete',
        messageId,
      }));
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
  
  // Render message content with highlighted mentions
  const renderMessageContent = (content, mentions = []) => {
    if (!content) return null;
    
    // Check if current user is mentioned
    const isMentioned = mentions?.some(m => m.toLowerCase() === walletAddress?.toLowerCase());
    
    // Simple regex to find @mentions
    const mentionRegex = /@(\S+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      // Add highlighted mention
      parts.push(
        <span key={match.index} className="text-amber-400 font-medium">
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
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
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
          <h2 className="font-semibold">GUARD Chat</h2>
          <Badge>{connected ? `${onlineCount} online` : 'Connecting...'}</Badge>
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
                    {msg.editedAt && !msg.deleted && (
                      <span className="text-xs text-white/20">(edited)</span>
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
                          onClick={() => deleteMessage(msg.id)}
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
                          <span className="text-xs font-medium">{reply.displayName || reply.user}</span>
                          <span className="text-xs text-white/20">{formatTime(reply.timestamp)}</span>
                        </div>
                        <p className="text-white/60 text-xs line-clamp-2">{reply.content}</p>
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
        
        {/* Connection Status & Sound Toggle */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <p className={`text-xs ${connected ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>
              {connected ? 'Real-time connection active' : 'Connecting...'}
            </p>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${soundEnabled ? 'text-white/50 hover:text-white/70' : 'text-white/30'}`}
            title={soundEnabled ? 'Sound on' : 'Sound off'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/5 rounded-2xl border border-white/10 px-4 py-3 focus-within:border-amber-400/50 transition-colors">
            <button 
              className="text-white/40 hover:text-white/70 transition-colors"
              onClick={() => setShowGifPicker(!showGifPicker)}
            >
              <span className="text-xs font-bold">GIF</span>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                handleMentionKeyDown(e);
                if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message... (use @ to mention)"
              className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none text-sm"
            />
            <button 
              onClick={() => sendMessage()}
              disabled={!newMessage.trim()}
              className="text-amber-400 hover:text-amber-300 transition-colors disabled:text-white/20 disabled:cursor-not-allowed"
            >
              <Icons.Send />
            </button>
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
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#151520] border border-white/10 rounded-xl p-3 max-h-80 overflow-hidden flex flex-col">
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
// ADMIN PANEL
// ============================================
const AdminPanel = ({ sessionToken }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
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
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadUsers(), loadMessages()]);
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
  
  // Bulk delete messages
  const handleBulkDelete = async () => {
    if (selectedMessages.size === 0) return;
    if (!confirm(`Delete ${selectedMessages.size} messages?`)) return;
    
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
  
  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    try {
      await fetch(`${API_URL}/api/admin/delete-message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ messageId }),
      });
      loadMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
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
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        🛡️ Admin Panel
      </h1>
      
      {/* Section Tabs */}
      <div className="flex gap-2 mb-6">
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
                  onClick={handleBulkDelete}
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400/50"
              >
                <option value="">All Users</option>
                {messageUsers.map(user => (
                  <option key={user.wallet} value={user.wallet}>
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
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!msg.deleted && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
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
  const [isAdmin, setIsAdmin] = useState(false);
  
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
        <nav className="w-16 sm:w-20 border-r border-white/5 p-3 flex flex-col items-center gap-2 flex-shrink-0">
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
          
          {/* Admin Tab - Only show for admins */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
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
          localStorage.removeItem('commune_session');
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

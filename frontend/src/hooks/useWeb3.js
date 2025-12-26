import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { ERC20_ABI, TOKEN_CONFIG, getTokenAddress, hasRequiredTokens, formatTokenBalance } from '../config/web3';

// ============================================
// useTokenGate Hook
// ============================================

/**
 * Hook to check if the connected wallet has the required token balance
 * Returns access status and token balance information
 */
export function useTokenGate() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Get the token contract address for the current chain
  const tokenAddress = getTokenAddress(chainId);
  
  // Read the token balance
  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: isConnected && !!address && !!tokenAddress,
    },
  });
  
  // Calculate access status
  const formattedBalance = balance ? formatTokenBalance(balance, TOKEN_CONFIG.decimals) : '0';
  const hasAccess = balance ? hasRequiredTokens(balance, TOKEN_CONFIG.decimals) : false;
  
  return {
    isConnected,
    isLoading,
    error,
    address,
    balance: formattedBalance,
    rawBalance: balance,
    hasAccess,
    requiredAmount: TOKEN_CONFIG.requiredAmount,
    tokenSymbol: TOKEN_CONFIG.symbol,
    refetchBalance: refetch,
  };
}

// ============================================
// useChat Hook
// ============================================

/**
 * Hook for managing real-time chat functionality
 * In production, this would connect to a WebSocket server
 */
export function useChat(roomId = 'general') {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const { address } = useAccount();
  
  // Simulate connection
  useEffect(() => {
    // In production, connect to Socket.IO or WebSocket server
    // const socket = io('wss://your-server.com');
    
    setIsConnected(true);
    
    // Load initial mock messages
    setMessages([
      {
        id: 1,
        user: 'alice.eth',
        avatar: '🌸',
        message: 'Hey everyone! Excited to be here.',
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: 2,
        user: 'cryptoking.eth',
        avatar: '👑',
        message: 'Welcome! Great to have you.',
        timestamp: new Date(Date.now() - 3500000),
      },
    ]);
    
    setUsers([
      { address: '0x1234...5678', name: 'alice.eth', avatar: '🌸', status: 'online' },
      { address: '0x2345...6789', name: 'cryptoking.eth', avatar: '👑', status: 'online' },
      { address: '0x3456...7890', name: 'defi_dev.eth', avatar: '🔧', status: 'away' },
    ]);
    
    return () => {
      // Cleanup: disconnect socket
      setIsConnected(false);
    };
  }, [roomId]);
  
  const sendMessage = useCallback((content) => {
    if (!content.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      user: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anonymous',
      avatar: '🌟',
      message: content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, newMessage]);
    
    // In production, emit to socket
    // socket.emit('message', newMessage);
  }, [address]);
  
  return {
    messages,
    users,
    isConnected,
    sendMessage,
  };
}

// ============================================
// useVideoCall Hook
// ============================================

/**
 * Hook for managing video call functionality
 * In production, this would integrate with Daily.co, Twilio, or Jitsi
 */
export function useVideoCall(roomId = 'main') {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const { address } = useAccount();
  
  const joinCall = useCallback(async () => {
    try {
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setLocalStream(stream);
      setIsInCall(true);
      
      // Add self to participants
      setParticipants([
        {
          id: 'local',
          name: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'You',
          avatar: '🌟',
          isLocal: true,
          stream,
        },
      ]);
      
      // In production, connect to video service
      // const call = await daily.join({ url: `https://your-domain.daily.co/${roomId}` });
      
    } catch (error) {
      console.error('Failed to join call:', error);
    }
  }, [address, roomId]);
  
  const leaveCall = useCallback(() => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    
    setLocalStream(null);
    setIsInCall(false);
    setParticipants([]);
    setIsMuted(false);
    setIsVideoOff(false);
    
    // In production, disconnect from video service
    // daily.leave();
  }, [localStream]);
  
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);
  
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream]);
  
  return {
    isInCall,
    isMuted,
    isVideoOff,
    participants,
    localStream,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
  };
}

// ============================================
// useOnlineStatus Hook
// ============================================

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}

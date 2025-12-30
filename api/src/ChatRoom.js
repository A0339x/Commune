/**
 * ChatRoom Durable Object
 * Manages WebSocket connections for real-time chat
 */

// Sanitize content - strip HTML tags and dangerous patterns
function sanitizeContent(content) {
  if (!content) return '';
  
  return content
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs (can be used for XSS)
    .replace(/data:/gi, 'data-blocked:')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Trim whitespace
    .trim();
}

// Rate limit configuration
const RATE_LIMIT = {
  messages: 10,      // Max messages
  window: 10000,     // Per 10 seconds
  cooldown: 30000,   // 30 second cooldown if exceeded
};

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // WebSocket -> { wallet, displayName, lastMessages: [], rateLimited: false }
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }
    
    // Handle HTTP requests (for getting message history)
    if (url.pathname === '/history') {
      return this.getHistory(request);
    }
    
    // Handle thread replies request
    if (url.pathname === '/thread') {
      return this.getThreadReplies(request);
    }
    
    // Handle internal broadcast requests
    if (url.pathname === '/broadcast-warning') {
      return this.handleBroadcastWarning(request);
    }
    
    if (url.pathname === '/broadcast-announcement') {
      return this.handleBroadcastAnnouncement(request);
    }
    
    if (url.pathname === '/broadcast-displayname') {
      return this.handleBroadcastDisplayName(request);
    }
    
    if (url.pathname === '/broadcast-delete') {
      return this.handleBroadcastDelete(request);
    }
    
    // Admin endpoints - these are ONLY called internally from the main worker
    // which verifies admin auth before calling. Durable Objects are not
    // publicly accessible, they can only be reached via stub.fetch() from
    // within the Worker code. The "http://internal/" URL prefix confirms this.
    if (url.pathname === '/admin-delete') {
      // Verify internal origin
      if (!request.url.startsWith('http://internal/')) {
        return new Response('Forbidden', { status: 403 });
      }
      return this.handleAdminDelete(request);
    }

    if (url.pathname === '/admin-messages') {
      if (!request.url.startsWith('http://internal/')) {
        return new Response('Forbidden', { status: 403 });
      }
      return this.handleAdminMessages(request);
    }

    if (url.pathname === '/admin-delete-reply') {
      if (!request.url.startsWith('http://internal/')) {
        return new Response('Forbidden', { status: 403 });
      }
      return this.handleAdminDeleteReply(request);
    }
    
    return new Response('Expected WebSocket', { status: 400 });
  }
  
  async handleAdminDeleteReply(request) {
    try {
      const { replyId, adminWallet } = await request.json();
      
      // Find the reply - check DO first, then KV
      const doKeys = await this.state.storage.list({ prefix: 'msg:' });
      let reply = null;
      let replyKey = null;
      
      for (const [key, value] of doKeys) {
        if (key.includes(replyId)) {
          reply = value;
          replyKey = key;
          break;
        }
      }
      
      if (!reply) {
        // Try KV
        const kvList = await this.env.MESSAGES.list({ prefix: 'msg:' });
        for (const key of kvList.keys) {
          if (key.name.includes(replyId)) {
            reply = await this.env.MESSAGES.get(key.name, 'json');
            replyKey = key.name;
            break;
          }
        }
      }
      
      if (!reply) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Soft delete
      const deletedReply = {
        ...reply,
        deleted: true,
        deletedAt: Date.now(),
        deletedBy: adminWallet,
        adminDeleted: true,
        originalContent: reply.content,
      };
      
      // Store in both DO and KV
      await this.state.storage.put(replyKey, deletedReply);
      await this.env.MESSAGES.put(replyKey, JSON.stringify(deletedReply), {
        expirationTtl: 365 * 24 * 60 * 60,
      });
      
      // Broadcast deletion
      if (reply.replyTo) {
        this.broadcast({
          type: 'reply_deleted',
          replyId,
          parentId: reply.replyTo,
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  async handleAdminMessages(request) {
    try {
      const messages = [];
      
      // Merge message indexes from DO and KV
      const doIndex = await this.state.storage.get('message_index') || [];
      const kvIndex = await this.env.MESSAGES.get('message_index', 'json') || [];
      
      // Merge indexes, removing duplicates by key
      const seenKeys = new Set();
      const index = [];
      for (const item of [...kvIndex, ...doIndex]) {
        if (!seenKeys.has(item.key)) {
          seenKeys.add(item.key);
          index.push(item);
        }
      }
      index.sort((a, b) => a.timestamp - b.timestamp);
      
      for (const item of index) {
        // Try DO storage first, fall back to KV
        let msg = await this.state.storage.get(item.key);
        if (!msg) {
          msg = await this.env.MESSAGES.get(item.key, 'json');
        }
        if (msg && !msg.replyTo) {
          // Get all thread replies for this message
          const threadKey = `thread:${msg.id}`;
          const doThreadIndex = await this.state.storage.get(threadKey) || [];
          const kvThreadIndex = await this.env.MESSAGES.get(threadKey, 'json') || [];
          
          // Merge thread indexes
          const seenReplyIds = new Set();
          const threadIndex = [];
          for (const ti of [...kvThreadIndex, ...doThreadIndex]) {
            if (!seenReplyIds.has(ti.id)) {
              seenReplyIds.add(ti.id);
              threadIndex.push(ti);
            }
          }
          threadIndex.sort((a, b) => a.timestamp - b.timestamp);
          
          // Get all replies (not just last 3)
          const allReplies = [];
          for (const replyItem of threadIndex) {
            const replyKey = `msg:${replyItem.timestamp}:${replyItem.id}`;
            let reply = await this.state.storage.get(replyKey);
            if (!reply) {
              reply = await this.env.MESSAGES.get(replyKey, 'json');
            }
            if (reply) {
              allReplies.push(reply);
            }
          }
          
          // Include originalContent for admins and all replies
          messages.push({
            ...msg,
            replyCount: threadIndex.length,
            allReplies, // Full thread for admin viewing
          });
        }
      }
      
      return new Response(JSON.stringify({ messages }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  async handleAdminDelete(request) {
    try {
      const { messageId, adminWallet } = await request.json();
      
      // Find the message in index - check DO first, then KV
      const doIndex = await this.state.storage.get('message_index') || [];
      const kvIndex = await this.env.MESSAGES.get('message_index', 'json') || [];
      const index = [...doIndex, ...kvIndex];
      const msgIndex = index.find(item => item.key.includes(messageId));
      
      if (!msgIndex) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Get the message - DO first, then KV
      let msg = await this.state.storage.get(msgIndex.key);
      if (!msg) {
        msg = await this.env.MESSAGES.get(msgIndex.key, 'json');
      }
      if (!msg) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Soft delete
      const deletedMsg = {
        ...msg,
        deleted: true,
        deletedAt: Date.now(),
        deletedBy: adminWallet,
        adminDeleted: true,
        originalContent: msg.content,
      };
      
      // Store in both DO and KV
      await this.state.storage.put(msgIndex.key, deletedMsg);
      await this.env.MESSAGES.put(msgIndex.key, JSON.stringify(deletedMsg), {
        expirationTtl: 365 * 24 * 60 * 60,
      });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  async handleBroadcastDelete(request) {
    try {
      const data = await request.json();
      const { messageId } = data;
      
      // Broadcast to all clients
      this.broadcast({
        type: 'message_deleted',
        messageId,
      });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  async handleBroadcastDisplayName(request) {
    try {
      const data = await request.json();
      const { wallet, displayName } = data;
      
      // Update session display name for this user
      for (const [ws, session] of this.sessions) {
        if (session.wallet?.toLowerCase() === wallet?.toLowerCase()) {
          session.displayName = displayName;
          this.sessions.set(ws, session);
        }
      }
      
      // Broadcast to all clients
      this.broadcast({
        type: 'displayname_changed',
        wallet,
        displayName,
      });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  async getThreadReplies(request) {
    try {
      const url = new URL(request.url);
      const messageId = url.searchParams.get('messageId');
      
      if (!messageId) {
        return new Response(JSON.stringify({ error: 'Missing messageId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const threadKey = `thread:${messageId}`;
      
      // Get from both sources and merge
      const doThreadIndex = await this.state.storage.get(threadKey) || [];
      const kvThreadIndex = await this.env.MESSAGES.get(threadKey, 'json') || [];
      
      // Merge indexes, removing duplicates by id
      const seenIds = new Set();
      const threadIndex = [];
      for (const item of [...kvThreadIndex, ...doThreadIndex]) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          threadIndex.push(item);
        }
      }
      
      const replies = [];
      for (const item of threadIndex) {
        const replyKey = `msg:${item.timestamp}:${item.id}`;
        // Try DO storage first, fall back to KV
        let reply = await this.state.storage.get(replyKey);
        if (!reply) {
          reply = await this.env.MESSAGES.get(replyKey, 'json');
        }
        if (reply) {
          replies.push(reply);
        }
      }
      
      // Sort by timestamp
      replies.sort((a, b) => a.timestamp - b.timestamp);
      
      return new Response(JSON.stringify({ replies }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('getThreadReplies error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  async handleBroadcastWarning(request) {
    try {
      const data = await request.json();
      const { targetWallet, warning } = data;
      
      // Send warning only to the target user
      for (const [ws, session] of this.sessions) {
        if (session.wallet?.toLowerCase() === targetWallet?.toLowerCase()) {
          try {
            ws.send(JSON.stringify({
              type: 'warning',
              warning,
            }));
          } catch (e) {
            // WebSocket may be closed
          }
        }
      }
      
      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Broadcast warning error:', error);
      return new Response('Error', { status: 500 });
    }
  }
  
  async handleBroadcastAnnouncement(request) {
    try {
      const data = await request.json();
      const { announcement } = data;
      
      // Send announcement to all users
      this.broadcast({
        type: 'announcement',
        announcement,
      });
      
      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Broadcast announcement error:', error);
      return new Response('Error', { status: 500 });
    }
  }

  async handleWebSocket(request) {
    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Get wallet from query params (passed from main worker after auth)
    const url = new URL(request.url);
    const wallet = url.searchParams.get('wallet');
    const displayName = url.searchParams.get('displayName') || null;
    const protocol = url.searchParams.get('protocol'); // Auth protocol to echo back

    if (!wallet) {
      return new Response('Missing wallet', { status: 400 });
    }

    // Accept the WebSocket
    this.state.acceptWebSocket(server);

    // Store session info with rate limiting data
    this.sessions.set(server, {
      wallet,
      displayName,
      lastMessages: [],  // Timestamps of recent messages
      rateLimitedUntil: 0,  // Timestamp when rate limit expires
    });

    // Broadcast user joined
    this.broadcast({
      type: 'user_joined',
      wallet,
      displayName,
      onlineCount: this.sessions.size,
    }, server);

    // Send current online users to the new connection
    server.send(JSON.stringify({
      type: 'online_users',
      users: this.getOnlineUsers(),
      count: this.sessions.size,
    }));

    // Return WebSocket response with protocol header (required for subprotocol handshake)
    const headers = {};
    if (protocol) {
      headers['Sec-WebSocket-Protocol'] = protocol;
    }
    return new Response(null, { status: 101, webSocket: client, headers });
  }

  // Check if user is rate limited
  checkRateLimit(session) {
    const now = Date.now();
    
    // Initialize if missing (for existing connections)
    if (!session.lastMessages) {
      session.lastMessages = [];
    }
    if (!session.rateLimitedUntil) {
      session.rateLimitedUntil = 0;
    }
    
    // Check if in cooldown
    if (session.rateLimitedUntil > now) {
      return { 
        limited: true, 
        remaining: Math.ceil((session.rateLimitedUntil - now) / 1000) 
      };
    }
    
    // Clean old messages outside window
    session.lastMessages = session.lastMessages.filter(
      ts => now - ts < RATE_LIMIT.window
    );
    
    // Check if over limit
    if (session.lastMessages.length >= RATE_LIMIT.messages) {
      session.rateLimitedUntil = now + RATE_LIMIT.cooldown;
      return { 
        limited: true, 
        remaining: Math.ceil(RATE_LIMIT.cooldown / 1000) 
      };
    }
    
    // Record this message
    session.lastMessages.push(now);
    return { limited: false };
  }

  async webSocketMessage(ws, message) {
    const session = this.sessions.get(ws);
    if (!session) return;

    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'message':
          await this.handleChatMessage(ws, session, data);
          break;
        case 'reply':
          await this.handleReply(ws, session, data);
          break;
        case 'edit':
          await this.handleEditMessage(ws, session, data);
          break;
        case 'delete':
          await this.handleDeleteMessage(ws, session, data);
          break;
        case 'edit_reply':
          await this.handleEditReply(ws, session, data);
          break;
        case 'delete_reply':
          await this.handleDeleteReply(ws, session, data);
          break;
        case 'reaction':
          await this.handleReaction(ws, session, data);
          break;
        case 'typing':
          // Broadcast typing indicator to others
          this.broadcast({
            type: 'user_typing',
            wallet: session.wallet,
            displayName: session.displayName,
          }, ws); // Exclude sender
          break;
        case 'stop_typing':
          this.broadcast({
            type: 'user_stop_typing',
            wallet: session.wallet,
          }, ws);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        case 'update_display_name':
          session.displayName = data.displayName;
          this.sessions.set(ws, session);
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }

  async webSocketClose(ws) {
    const session = this.sessions.get(ws);
    this.sessions.delete(ws);

    if (session) {
      // Broadcast user left
      this.broadcast({
        type: 'user_left',
        wallet: session.wallet,
        onlineCount: this.sessions.size,
      });
    }
  }

  async webSocketError(ws, error) {
    console.error('WebSocket error:', error);
    this.sessions.delete(ws);
  }

  async handleChatMessage(ws, session, data) {
    if (!data.content || data.content.trim().length === 0) return;
    
    // Check rate limit
    const rateCheck = this.checkRateLimit(session);
    if (rateCheck.limited) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `Slow down! Try again in ${rateCheck.remaining} seconds.` 
      }));
      return;
    }
    
    // Check if user is muted
    const muteData = await this.env.SESSIONS.get(`mute:${session.wallet.toLowerCase()}`, 'json');
    if (muteData && muteData.until > Date.now()) {
      const remaining = Math.ceil((muteData.until - Date.now()) / 60000);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `You are muted for ${remaining} more minute(s). Reason: ${muteData.reason}` 
      }));
      return;
    }
    
    // Allow longer content for GIF URLs
    const maxLength = data.isGif ? 500 : 1000;
    if (data.content.length > maxLength) return;

    // Sanitize content (skip for GIFs which are just URLs)
    const sanitizedContent = data.isGif ? data.content.trim() : sanitizeContent(data.content);
    if (!sanitizedContent) return;

    // Extract mentions from content (format: @wallet or @displayName)
    const mentions = data.mentions || [];

    const message = {
      id: crypto.randomUUID(),
      wallet: session.wallet,
      displayName: session.displayName,
      content: sanitizedContent,
      timestamp: Date.now(),
      replyTo: null,
      replyCount: 0,
      isGif: data.isGif || false,
      mentions: mentions,
    };

    // Store message in KV
    await this.storeMessage(message);

    // Broadcast to all connected clients
    this.broadcast({
      type: 'new_message',
      message,
    });
  }

  async handleReply(ws, session, data) {
    if (!data.content || data.content.trim().length === 0) return;
    if (!data.replyTo) return;

    // Check rate limit
    const rateCheck = this.checkRateLimit(session);
    if (rateCheck.limited) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `Slow down! Try again in ${rateCheck.remaining} seconds.` 
      }));
      return;
    }

    // Sanitize content (skip for GIFs as they're URLs)
    const sanitizedContent = data.isGif ? data.content : sanitizeContent(data.content);
    if (!sanitizedContent) return;

    const reply = {
      id: crypto.randomUUID(),
      wallet: session.wallet,
      displayName: session.displayName,
      content: sanitizedContent,
      timestamp: Date.now(),
      replyTo: data.replyTo,
      isGif: data.isGif || false,
    };

    try {
      // Store reply in KV FIRST, before broadcasting
      await this.storeReply(reply);

      // Broadcast to all connected clients only after successful storage
      this.broadcast({
        type: 'new_reply',
        reply,
        parentId: data.replyTo,
      });
    } catch (error) {
      console.error('Failed to handle reply:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to save reply. Please try again.' 
      }));
    }
  }

  async handleEditMessage(ws, session, data) {
    if (!data.messageId || !data.content || data.content.trim().length === 0) return;
    if (data.content.length > 1000) return;

    // Find the message in index - check DO first, then KV
    const doIndex = await this.state.storage.get('message_index') || [];
    const kvIndex = await this.env.MESSAGES.get('message_index', 'json') || [];
    const index = [...doIndex, ...kvIndex];
    const msgIndex = index.find(item => item.key.includes(data.messageId));
    
    if (!msgIndex) return;

    // Get the message - DO first, then KV
    let msg = await this.state.storage.get(msgIndex.key);
    if (!msg) {
      msg = await this.env.MESSAGES.get(msgIndex.key, 'json');
    }
    if (!msg) return;

    // Only allow editing own messages
    if (msg.wallet.toLowerCase() !== session.wallet.toLowerCase()) {
      ws.send(JSON.stringify({ type: 'error', message: 'Cannot edit others messages' }));
      return;
    }

    // Optional: 15 minute edit window
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - msg.timestamp > fifteenMinutes) {
      ws.send(JSON.stringify({ type: 'error', message: 'Edit window expired (15 minutes)' }));
      return;
    }

    // Update message
    const updatedMsg = {
      ...msg,
      content: data.content.trim(),
      editedAt: Date.now(),
      editHistory: [...(msg.editHistory || []), {
        content: msg.content,
        editedAt: Date.now(),
      }],
    };

    // Store updated message in both DO and KV
    await this.state.storage.put(msgIndex.key, updatedMsg);
    await this.env.MESSAGES.put(msgIndex.key, JSON.stringify(updatedMsg), {
      expirationTtl: 365 * 24 * 60 * 60,
    });

    // Broadcast to all clients
    this.broadcast({
      type: 'message_edited',
      messageId: data.messageId,
      content: updatedMsg.content,
      editedAt: updatedMsg.editedAt,
    });
  }

  async handleDeleteMessage(ws, session, data) {
    if (!data.messageId) return;

    // Find the message in index - check DO first, then KV
    const doIndex = await this.state.storage.get('message_index') || [];
    const kvIndex = await this.env.MESSAGES.get('message_index', 'json') || [];
    const index = [...doIndex, ...kvIndex];
    const msgIndex = index.find(item => item.key.includes(data.messageId));
    
    if (!msgIndex) return;

    // Get the message - DO first, then KV
    let msg = await this.state.storage.get(msgIndex.key);
    if (!msg) {
      msg = await this.env.MESSAGES.get(msgIndex.key, 'json');
    }
    if (!msg) return;

    // Only allow deleting own messages (admins can be added later)
    if (msg.wallet.toLowerCase() !== session.wallet.toLowerCase()) {
      ws.send(JSON.stringify({ type: 'error', message: 'Cannot delete others messages' }));
      return;
    }

    // Soft delete - preserve original for admin logs
    const deletedMsg = {
      ...msg,
      deleted: true,
      deletedAt: Date.now(),
      deletedBy: session.wallet,
      originalContent: msg.content, // Preserved for admin viewing
    };

    // Store soft-deleted message in both DO and KV
    await this.state.storage.put(msgIndex.key, deletedMsg);
    await this.env.MESSAGES.put(msgIndex.key, JSON.stringify(deletedMsg), {
      expirationTtl: 365 * 24 * 60 * 60,
    });

    // Broadcast to all clients
    this.broadcast({
      type: 'message_deleted',
      messageId: data.messageId,
    });
  }

  async handleEditReply(ws, session, data) {
    if (!data.replyId || !data.content || data.content.trim().length === 0) return;
    if (data.content.length > 1000) return;

    // Find the reply - check DO first, then KV
    // We need to search through thread indexes to find which thread contains this reply
    const doKeys = await this.state.storage.list({ prefix: 'msg:' });
    let reply = null;
    let replyKey = null;
    
    for (const [key, value] of doKeys) {
      if (key.includes(data.replyId)) {
        reply = value;
        replyKey = key;
        break;
      }
    }
    
    if (!reply) {
      // Try KV
      const kvList = await this.env.MESSAGES.list({ prefix: 'msg:' });
      for (const key of kvList.keys) {
        if (key.name.includes(data.replyId)) {
          reply = await this.env.MESSAGES.get(key.name, 'json');
          replyKey = key.name;
          break;
        }
      }
    }
    
    if (!reply || !reply.replyTo) return;

    // Only allow editing own replies
    if (reply.wallet.toLowerCase() !== session.wallet.toLowerCase()) {
      ws.send(JSON.stringify({ type: 'error', message: 'Cannot edit others replies' }));
      return;
    }

    // 15 minute edit window
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - reply.timestamp > fifteenMinutes) {
      ws.send(JSON.stringify({ type: 'error', message: 'Edit window expired (15 minutes)' }));
      return;
    }

    // Update reply
    const updatedReply = {
      ...reply,
      content: data.content.trim(),
      editedAt: Date.now(),
    };

    // Store in both DO and KV
    await this.state.storage.put(replyKey, updatedReply);
    await this.env.MESSAGES.put(replyKey, JSON.stringify(updatedReply), {
      expirationTtl: 365 * 24 * 60 * 60,
    });

    // Broadcast to all clients
    this.broadcast({
      type: 'reply_edited',
      replyId: data.replyId,
      parentId: reply.replyTo,
      content: data.content.trim(),
      editedAt: updatedReply.editedAt,
    });
  }

  async handleDeleteReply(ws, session, data) {
    if (!data.replyId) return;

    // Find the reply - check DO first, then KV
    const doKeys = await this.state.storage.list({ prefix: 'msg:' });
    let reply = null;
    let replyKey = null;
    
    for (const [key, value] of doKeys) {
      if (key.includes(data.replyId)) {
        reply = value;
        replyKey = key;
        break;
      }
    }
    
    if (!reply) {
      // Try KV
      const kvList = await this.env.MESSAGES.list({ prefix: 'msg:' });
      for (const key of kvList.keys) {
        if (key.name.includes(data.replyId)) {
          reply = await this.env.MESSAGES.get(key.name, 'json');
          replyKey = key.name;
          break;
        }
      }
    }
    
    if (!reply || !reply.replyTo) return;

    // Only allow deleting own replies
    if (reply.wallet.toLowerCase() !== session.wallet.toLowerCase()) {
      ws.send(JSON.stringify({ type: 'error', message: 'Cannot delete others replies' }));
      return;
    }

    // Soft delete
    const deletedReply = {
      ...reply,
      deleted: true,
      deletedAt: Date.now(),
      deletedBy: session.wallet,
      originalContent: reply.content,
    };

    // Store in both DO and KV
    await this.state.storage.put(replyKey, deletedReply);
    await this.env.MESSAGES.put(replyKey, JSON.stringify(deletedReply), {
      expirationTtl: 365 * 24 * 60 * 60,
    });

    // Broadcast to all clients
    this.broadcast({
      type: 'reply_deleted',
      replyId: data.replyId,
      parentId: reply.replyTo,
    });
  }

  async handleReaction(ws, session, data) {
    if (!data.messageId || !data.emoji) return;
    
    // Validate emoji is in allowed list
    const allowedEmojis = ['👍', '❤️', '😂', '🔥', '🚀', '💎', '🛡️', '👏'];
    if (!allowedEmojis.includes(data.emoji)) return;

    try {
      // Find the message in index - check DO first, then KV
      const doIndex = await this.state.storage.get('message_index') || [];
      const kvIndex = await this.env.MESSAGES.get('message_index', 'json') || [];
      const index = [...doIndex, ...kvIndex];
      const msgIndex = index.find(item => item.key.includes(data.messageId));
      
      if (!msgIndex) {
        console.log('Message not found in index:', data.messageId);
        return;
      }

      // Get the message - DO first, then KV
      let msg = await this.state.storage.get(msgIndex.key);
      if (!msg) {
        msg = await this.env.MESSAGES.get(msgIndex.key, 'json');
      }
      if (!msg) {
        console.log('Message not found:', msgIndex.key);
        return;
      }

      // Initialize reactions if not present
      const reactions = msg.reactions || {};
      const emojiReactions = reactions[data.emoji] || [];
      const walletLower = session.wallet.toLowerCase();
      
      // Toggle reaction (add if not present, remove if present)
      const existingIndex = emojiReactions.findIndex(w => w.toLowerCase() === walletLower);
      let action;
      
      if (existingIndex >= 0) {
        // Remove reaction
        emojiReactions.splice(existingIndex, 1);
        action = 'removed';
      } else {
        // Add reaction
        emojiReactions.push(session.wallet);
        action = 'added';
      }
      
      // Update reactions object
      if (emojiReactions.length === 0) {
        delete reactions[data.emoji];
      } else {
        reactions[data.emoji] = emojiReactions;
      }
      
      // Store updated message in both DO and KV
      const updatedMsg = { ...msg, reactions };
      await this.state.storage.put(msgIndex.key, updatedMsg);
      await this.env.MESSAGES.put(msgIndex.key, JSON.stringify(updatedMsg), {
        expirationTtl: 365 * 24 * 60 * 60,
      });

      // Broadcast to all clients
      this.broadcast({
        type: 'reaction_updated',
        messageId: data.messageId,
        emoji: data.emoji,
        reactions: reactions,
        action,
        wallet: session.wallet,
      });
    } catch (error) {
      console.error('Reaction error:', error);
    }
  }

  async storeMessage(message) {
    const key = `msg:${message.timestamp}:${message.id}`;
    const indexKey = 'message_index';
    
    try {
      // 1. Store in Durable Object storage (instant consistency)
      await this.state.storage.put(key, message);
      
      // Update message index in DO
      let index = await this.state.storage.get(indexKey) || [];
      index.push({
        key,
        timestamp: message.timestamp,
      });
      // Keep only last 100 messages in index
      const trimmedIndex = index.slice(-100);
      await this.state.storage.put(indexKey, trimmedIndex);
      
      // 2. Also write to KV as backup (eventually consistent, but persistent)
      // Don't await - let it happen in background
      this.env.MESSAGES.put(key, JSON.stringify(message), {
        expirationTtl: 365 * 24 * 60 * 60,
      }).catch(err => console.error('KV backup write failed:', err));
      
      this.env.MESSAGES.put(indexKey, JSON.stringify(trimmedIndex), {
        expirationTtl: 365 * 24 * 60 * 60,
      }).catch(err => console.error('KV index backup failed:', err));
      
    } catch (error) {
      console.error('Error storing message:', error);
    }
  }

  async storeReply(reply) {
    const key = `msg:${reply.timestamp}:${reply.id}`;
    const threadKey = `thread:${reply.replyTo}`;
    
    try {
      // 1. Store in Durable Object storage (instant consistency)
      await this.state.storage.put(key, reply);
      
      // Get thread index from DO storage first, fall back to KV
      let threadIndex = await this.state.storage.get(threadKey) || [];
      threadIndex.push({
        id: reply.id,
        timestamp: reply.timestamp,
      });
      await this.state.storage.put(threadKey, threadIndex);
      
      console.log('Reply stored in DO storage, thread has', threadIndex.length, 'replies');
      
      // 2. Also write to KV as backup (eventually consistent, but persistent)
      // Don't await - let it happen in background
      this.env.MESSAGES.put(key, JSON.stringify(reply), {
        expirationTtl: 365 * 24 * 60 * 60,
      }).catch(err => console.error('KV backup write failed:', err));
      
      this.env.MESSAGES.put(threadKey, JSON.stringify(threadIndex), {
        expirationTtl: 365 * 24 * 60 * 60,
      }).catch(err => console.error('KV thread index backup failed:', err));
      
    } catch (error) {
      console.error('storeReply error:', error.message);
      throw error;
    }
  }

  async getHistory(request) {
    try {
      const url = new URL(request.url);
      const afterTimestamp = parseInt(url.searchParams.get('after')) || 0;
      
      const messages = [];
      
      // Merge message indexes from DO and KV
      const doIndex = await this.state.storage.get('message_index') || [];
      const kvIndex = await this.env.MESSAGES.get('message_index', 'json') || [];
      
      // Merge indexes, removing duplicates by key
      const seenKeys = new Set();
      let index = [];
      for (const item of [...kvIndex, ...doIndex]) {
        if (!seenKeys.has(item.key)) {
          seenKeys.add(item.key);
          index.push(item);
        }
      }
      index.sort((a, b) => a.timestamp - b.timestamp);
      
      // Filter by afterTimestamp if provided
      if (afterTimestamp > 0) {
        index = index.filter(item => item.timestamp > afterTimestamp);
        if (index.length === 0) {
          return new Response(JSON.stringify({ messages: [] }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      for (const item of index) {
        // Try DO storage first, fall back to KV
        let msg = await this.state.storage.get(item.key);
        if (!msg) {
          msg = await this.env.MESSAGES.get(item.key, 'json');
        }
        if (msg && !msg.replyTo) {
          // Get thread replies - merge from both DO and KV
          const threadKey = `thread:${msg.id}`;
          const doThreadIndex = await this.state.storage.get(threadKey) || [];
          const kvThreadIndex = await this.env.MESSAGES.get(threadKey, 'json') || [];
          
          // Merge indexes, removing duplicates by id
          const seenIds = new Set();
          const threadIndex = [];
          for (const ti of [...kvThreadIndex, ...doThreadIndex]) {
            if (!seenIds.has(ti.id)) {
              seenIds.add(ti.id);
              threadIndex.push(ti);
            }
          }
          // Sort by timestamp before slicing
          threadIndex.sort((a, b) => a.timestamp - b.timestamp);
          
          // Get last 3 replies - try DO storage first, fall back to KV
          const recentReplies = [];
          const lastThree = threadIndex.slice(-3);
          for (const replyItem of lastThree) {
            const replyKey = `msg:${replyItem.timestamp}:${replyItem.id}`;
            let reply = await this.state.storage.get(replyKey);
            if (!reply) {
              reply = await this.env.MESSAGES.get(replyKey, 'json');
            }
            if (reply) {
              recentReplies.push(reply);
            }
          }

          // Handle deleted messages - hide original content for non-admins
          const messageForClient = {
            ...msg,
            replyCount: threadIndex.length,
            recentReplies: recentReplies.map(r => ({
              ...r,
              content: r.deleted ? 'Message deleted' : r.content,
              originalContent: undefined, // Never send to regular users
              editHistory: undefined,
            })),
          };
          
          // If message is deleted, hide original content
          if (msg.deleted) {
            messageForClient.content = 'Message deleted';
            messageForClient.originalContent = undefined;
            messageForClient.editHistory = undefined;
          }

          messages.push(messageForClient);
        }
      }

      messages.sort((a, b) => a.timestamp - b.timestamp);

      return new Response(JSON.stringify({ messages }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  getOnlineUsers() {
    const users = [];
    for (const [ws, session] of this.sessions) {
      users.push({
        wallet: session.wallet,
        displayName: session.displayName,
      });
    }
    return users;
  }

  broadcast(message, exclude = null) {
    const json = JSON.stringify(message);
    for (const [ws, session] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          ws.send(json);
        } catch (error) {
          // Connection might be closing
        }
      }
    }
  }
}

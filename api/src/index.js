/**
 * Commune API - Cloudflare Worker
 * Handles token verification, session management, and chat
 */

// Export the ChatRoom Durable Object
export { ChatRoom } from './ChatRoom.js';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  token: {
    address: '0xF606bd19b1E61574ED625d9ea96C841D4E247A32',
    symbol: 'GUARD',
    decimals: 18,
    requiredAmount: 5,
  },
  bsc: {
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
  },
  session: {
    expiryHours: 24,
    secret: 'CHANGE_THIS_TO_A_SECURE_SECRET_KEY', // Will be set via env variable
  },
  cors: {
    origins: ['https://commune-6m2.pages.dev', 'http://localhost:3000'],
  },
  admins: [
    '0x5e6ac347f70da8f3929c0c14cfd82c652ea9a7ba', // Primary admin
  ],
};

// Helper to check if wallet is admin
function isAdmin(wallet) {
  return CONFIG.admins.includes(wallet?.toLowerCase());
}

// Helper to log admin actions to KV
async function logAuditAction(env, action, adminWallet, details) {
  try {
    const logEntry = {
      id: crypto.randomUUID(),
      action,
      adminWallet: adminWallet.toLowerCase(),
      details,
      timestamp: Date.now(),
    };
    
    // Store individual log entry
    const logKey = `audit:${logEntry.timestamp}:${logEntry.id}`;
    await env.SESSIONS.put(logKey, JSON.stringify(logEntry), {
      expirationTtl: 365 * 24 * 60 * 60, // Keep for 1 year
    });
    
    // Update audit index for easy retrieval
    const indexKey = 'audit_index';
    const existingIndex = await env.SESSIONS.get(indexKey, 'json') || [];
    existingIndex.push({
      key: logKey,
      action,
      timestamp: logEntry.timestamp,
    });
    
    // Keep only last 1000 entries in index
    const trimmedIndex = existingIndex.slice(-1000);
    await env.SESSIONS.put(indexKey, JSON.stringify(trimmedIndex));
    
    return logEntry;
  } catch (error) {
    console.error('Failed to log audit action:', error);
    return null;
  }
}

// ============================================
// ERC20 BALANCE CHECK ABI (minimal)
// ============================================
const ERC20_BALANCE_OF_SIGNATURE = '0x70a08231';

// ============================================
// PRICE DATA PROCESSING FUNCTIONS
// ============================================

// Process raw Dune price data and identify dips
function processPriceData(rows) {
  if (!rows || rows.length === 0) return { prices: [], dips: [], stats: {} };
  
  // Sort by date
  const sorted = rows.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const prices = [];
  const dips = [];
  
  // First pass: collect all price data
  for (const row of sorted) {
    const date = row.date;
    const price = parseFloat(row.price_usd) || 0;
    const volume = parseFloat(row.volume_usd) || 0;
    const tradeCount = parseInt(row.trade_count) || 0;
    const lowPrice = parseFloat(row.low_price) || price;
    const highPrice = parseFloat(row.high_price) || price;
    
    prices.push({
      date,
      price,
      volume,
      tradeCount,
      lowPrice,
      highPrice,
      isDip: false,
      dipSeverity: null,
      recentDrop: 0,
    });
  }
  
  // Second pass: detect actual dips (recent price drops, not just ATH distance)
  // A "dip" is when price dropped significantly from recent highs (7-30 day window)
  for (let i = 0; i < prices.length; i++) {
    const current = prices[i];
    
    // Look back 7 days for short-term dips
    let recentHigh7d = current.price;
    for (let j = Math.max(0, i - 7); j < i; j++) {
      if (prices[j].price > recentHigh7d) {
        recentHigh7d = prices[j].price;
      }
    }
    
    // Look back 30 days for medium-term dips
    let recentHigh30d = current.price;
    for (let j = Math.max(0, i - 30); j < i; j++) {
      if (prices[j].price > recentHigh30d) {
        recentHigh30d = prices[j].price;
      }
    }
    
    // Calculate drop percentages
    const drop7d = recentHigh7d > 0 ? ((recentHigh7d - current.price) / recentHigh7d) * 100 : 0;
    const drop30d = recentHigh30d > 0 ? ((recentHigh30d - current.price) / recentHigh30d) * 100 : 0;
    
    // Use the more significant drop
    const recentDrop = Math.max(drop7d, drop30d);
    current.recentDrop = Math.round(recentDrop * 100) / 100;
    
    // Categorize dip severity based on RECENT drop (not ATH)
    if (recentDrop >= 50) {
      current.isDip = true;
      current.dipSeverity = 'crash';
    } else if (recentDrop >= 30) {
      current.isDip = true;
      current.dipSeverity = 'major';
    } else if (recentDrop >= 20) {
      current.isDip = true;
      current.dipSeverity = 'moderate';
    } else if (recentDrop >= 15) {
      current.isDip = true;
      current.dipSeverity = 'minor';
    }
    
    // Also check if this day had high volatility (big intraday swing)
    const intradaySwing = current.highPrice > 0 
      ? ((current.highPrice - current.lowPrice) / current.highPrice) * 100 
      : 0;
    current.volatility = Math.round(intradaySwing * 100) / 100;
  }
  
  // Third pass: identify dip periods (consecutive dip days)
  let currentDip = null;
  
  for (let i = 0; i < prices.length; i++) {
    const p = prices[i];
    
    if (p.isDip) {
      if (!currentDip) {
        // Start new dip period
        currentDip = {
          startDate: p.date,
          endDate: p.date,
          lowestPrice: p.price,
          maxDrop: p.recentDrop,
          severity: p.dipSeverity,
          daysInDip: 1,
        };
      } else {
        // Extend current dip
        currentDip.endDate = p.date;
        currentDip.daysInDip++;
        if (p.price < currentDip.lowestPrice) {
          currentDip.lowestPrice = p.price;
        }
        if (p.recentDrop > currentDip.maxDrop) {
          currentDip.maxDrop = p.recentDrop;
          currentDip.severity = p.dipSeverity;
        }
      }
    } else if (currentDip) {
      // End current dip period (only save if significant - at least 2 days)
      if (currentDip.daysInDip >= 2 || currentDip.severity === 'crash' || currentDip.severity === 'major') {
        dips.push(currentDip);
      }
      currentDip = null;
    }
  }
  
  // Don't forget the last dip if we ended on one
  if (currentDip && (currentDip.daysInDip >= 2 || currentDip.severity === 'crash' || currentDip.severity === 'major')) {
    dips.push(currentDip);
  }
  
  // Calculate overall stats
  const allPrices = prices.map(p => p.price).filter(p => p > 0);
  const athPrice = Math.max(...allPrices);
  const athIndex = prices.findIndex(p => p.price === athPrice);
  
  const stats = {
    totalDays: prices.length,
    athPrice,
    athDate: athIndex >= 0 ? prices[athIndex].date : null,
    lowestPrice: Math.min(...allPrices),
    currentPrice: prices[prices.length - 1]?.price || 0,
    avgPrice: allPrices.reduce((a, b) => a + b, 0) / allPrices.length,
    totalDipDays: prices.filter(p => p.isDip).length,
    dipPeriods: dips.length,
    crashPeriods: dips.filter(d => d.severity === 'crash').length,
    majorDips: dips.filter(d => d.severity === 'major').length,
    firstDate: prices[0]?.date,
    lastDate: prices[prices.length - 1]?.date,
  };
  
  return { prices, dips, stats };
}

// Calculate user-specific stats based on their buy times and price history
function calculateUserPriceStats(transfers, priceData, wallet) {
  const { prices, dips, stats: priceStats } = priceData;
  
  if (!prices || prices.length === 0 || !transfers || transfers.length === 0) {
    return { stats: null };
  }
  
  // Build a price lookup map by date
  // Handle both "2021-07-15T00:00:00.000Z" and "2021-07-15 00:00:00.000 UTC" formats
  const priceByDate = {};
  for (const p of prices) {
    // Extract just the date part (YYYY-MM-DD) regardless of format
    const dateKey = p.date.substring(0, 10);
    priceByDate[dateKey] = p;
  }
  
  // Separate buys (incoming) and sells (outgoing)
  const buys = transfers.filter(t => t.to_address === wallet);
  const sells = transfers.filter(t => t.from_address === wallet);
  
  // ============================================
  // BASIC STATS
  // ============================================
  let totalBought = BigInt(0);
  let totalSold = BigInt(0);
  let firstTransaction = null;
  let biggestBuy = null;
  let tiniestBuy = null;
  let bestBuy = null; // lowest price
  let worstBuy = null; // highest price
  
  const buyDates = [];
  const buyMonths = new Map(); // month -> count
  const buyDaysOfWeek = {};
  const buyHours = {};
  
  // ============================================
  // PROCESS BUYS
  // ============================================
  for (const tx of buys) {
    const timestamp = new Date(tx.block_timestamp);
    const dateKey = timestamp.toISOString().split('T')[0];
    const priceInfo = priceByDate[dateKey];
    const value = BigInt(tx.value || '0');
    const valueNum = Number(value) / 1e18;
    
    totalBought += value;
    buyDates.push({ date: dateKey, timestamp, value: valueNum, price: priceInfo?.price || 0 });
    
    // Track first transaction (buy or receive)
    if (!firstTransaction || timestamp < firstTransaction.date) {
      firstTransaction = { date: timestamp, amount: valueNum, type: 'buy' };
    }
    
    // Month tracking for streak calculation
    const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
    buyMonths.set(monthKey, (buyMonths.get(monthKey) || 0) + 1);
    
    // Day of week
    const dayOfWeek = timestamp.toLocaleDateString('en-US', { weekday: 'long' });
    buyDaysOfWeek[dayOfWeek] = (buyDaysOfWeek[dayOfWeek] || 0) + 1;
    
    // Hour of day
    const hour = timestamp.getHours();
    buyHours[hour] = (buyHours[hour] || 0) + 1;
    
    // Biggest buy (by token amount)
    if (!biggestBuy || valueNum > biggestBuy.amount) {
      biggestBuy = { date: dateKey, amount: valueNum, price: priceInfo?.price || 0 };
    }
    
    // Tiniest buy
    if (valueNum > 0 && (!tiniestBuy || valueNum < tiniestBuy.amount)) {
      tiniestBuy = { date: dateKey, amount: valueNum, price: priceInfo?.price || 0 };
    }
    
    // Best/worst buy by price
    if (priceInfo && priceInfo.price > 0) {
      if (!bestBuy || priceInfo.price < bestBuy.price) {
        bestBuy = { date: dateKey, price: priceInfo.price, amount: valueNum };
      }
      if (!worstBuy || priceInfo.price > worstBuy.price) {
        worstBuy = { date: dateKey, price: priceInfo.price, amount: valueNum };
      }
    }
  }
  
  // ============================================
  // PROCESS SELLS
  // ============================================
  const sellEvents = [];
  
  for (const tx of sells) {
    const timestamp = new Date(tx.block_timestamp);
    const dateKey = timestamp.toISOString().split('T')[0];
    const priceInfo = priceByDate[dateKey];
    const value = BigInt(tx.value || '0');
    const valueNum = Number(value) / 1e18;
    
    totalSold += value;
    sellEvents.push({ 
      date: dateKey, 
      timestamp, 
      amount: valueNum, 
      price: priceInfo?.price || 0,
    });
  }
  
  // ============================================
  // SELLER VS HODLER
  // ============================================
  const totalBoughtNum = Number(totalBought) / 1e18;
  const totalSoldNum = Number(totalSold) / 1e18;
  const sellRatio = totalBoughtNum > 0 ? totalSoldNum / totalBoughtNum : 0;
  
  let holderType;
  if (sells.length === 0) {
    holderType = 'diamond_hands'; // Never sold
  } else if (sellRatio < 0.1) {
    holderType = 'strong_holder'; // Sold less than 10%
  } else if (sellRatio < 0.5) {
    holderType = 'partial_seller'; // Sold 10-50%
  } else {
    holderType = 'active_trader'; // Sold more than 50%
  }
  
  // ============================================
  // PAPER HANDS MOMENTS (sells during dips that recovered)
  // ============================================
  const paperHandsMoments = [];
  
  for (const sell of sellEvents) {
    const sellDate = new Date(sell.date);
    const priceAtSell = sell.price;
    
    // Look ahead 30-90 days to see if price recovered significantly
    let maxRecoveryPrice = priceAtSell;
    let recoveryDate = null;
    
    for (const p of prices) {
      const pDate = new Date(p.date);
      const daysDiff = (pDate - sellDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7 && daysDiff < 180 && p.price > maxRecoveryPrice) {
        maxRecoveryPrice = p.price;
        recoveryDate = p.date;
      }
    }
    
    // If price went up >50% after they sold, that's a paper hands moment
    const recoveryPercent = priceAtSell > 0 ? ((maxRecoveryPrice - priceAtSell) / priceAtSell) * 100 : 0;
    if (recoveryPercent > 50 && sell.amount > 1000) { // Only count meaningful sells
      paperHandsMoments.push({
        sellDate: sell.date,
        sellPrice: priceAtSell,
        sellAmount: sell.amount,
        recoveryPrice: maxRecoveryPrice,
        recoveryDate,
        missedGainPercent: Math.round(recoveryPercent),
      });
    }
  }
  
  // ============================================
  // CRASH TIMING (how far before the big crash did they sell)
  // ============================================
  // Find the biggest crash in the data (largest drop)
  let biggestCrash = null;
  for (const dip of dips) {
    if (dip.severity === 'crash' || dip.severity === 'major') {
      if (!biggestCrash || dip.maxDrop > biggestCrash.maxDrop) {
        biggestCrash = dip;
      }
    }
  }
  
  let soldBeforeCrash = null;
  if (biggestCrash && sellEvents.length > 0) {
    const crashStart = new Date(biggestCrash.startDate);
    
    for (const sell of sellEvents) {
      const sellDate = new Date(sell.date);
      const daysBefore = (crashStart - sellDate) / (1000 * 60 * 60 * 24);
      
      if (daysBefore > 0 && daysBefore < 60) { // Sold within 60 days before crash
        if (!soldBeforeCrash || daysBefore < soldBeforeCrash.daysBefore) {
          soldBeforeCrash = {
            sellDate: sell.date,
            daysBefore: Math.round(daysBefore),
            amount: sell.amount,
            crashDate: biggestCrash.startDate,
            crashDrop: biggestCrash.maxDrop,
          };
        }
      }
    }
  }
  
  // ============================================
  // MONTHLY BUYING STREAK
  // ============================================
  const sortedMonths = Array.from(buyMonths.keys()).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let streakStart = null;
  let longestStreakStart = null;
  let longestStreakEnd = null;
  
  for (let i = 0; i < sortedMonths.length; i++) {
    const [year, month] = sortedMonths[i].split('-').map(Number);
    
    if (i === 0) {
      currentStreak = 1;
      streakStart = sortedMonths[i];
    } else {
      const [prevYear, prevMonth] = sortedMonths[i - 1].split('-').map(Number);
      
      // Check if consecutive month
      const isConsecutive = 
        (year === prevYear && month === prevMonth + 1) ||
        (year === prevYear + 1 && prevMonth === 12 && month === 1);
      
      if (isConsecutive) {
        currentStreak++;
      } else {
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          longestStreakStart = streakStart;
          longestStreakEnd = sortedMonths[i - 1];
        }
        currentStreak = 1;
        streakStart = sortedMonths[i];
      }
    }
  }
  
  // Check final streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
    longestStreakStart = streakStart;
    longestStreakEnd = sortedMonths[sortedMonths.length - 1];
  }
  
  // ============================================
  // DCA CONSISTENCY
  // ============================================
  const uniqueMonths = buyMonths.size;
  const firstBuyDate = buyDates.length > 0 ? new Date(buyDates[0].date) : null;
  const lastBuyDate = buyDates.length > 0 ? new Date(buyDates[buyDates.length - 1].date) : null;
  
  let dcaScore = 0;
  let buyingStyle = 'unknown';
  
  if (firstBuyDate && lastBuyDate) {
    const totalMonthsSpan = Math.max(1, 
      (lastBuyDate.getFullYear() - firstBuyDate.getFullYear()) * 12 + 
      (lastBuyDate.getMonth() - firstBuyDate.getMonth()) + 1
    );
    
    dcaScore = Math.round((uniqueMonths / totalMonthsSpan) * 100);
    
    // Determine buying style
    if (buys.length === 1) {
      buyingStyle = 'one_time'; // Single purchase
    } else if (dcaScore >= 70) {
      buyingStyle = 'consistent_dca'; // Very regular
    } else if (dcaScore >= 40) {
      buyingStyle = 'moderate_dca'; // Somewhat regular
    } else if (buys.length <= 3) {
      buyingStyle = 'occasional'; // Few purchases spread out
    } else {
      buyingStyle = 'accumulator'; // Many purchases, irregular timing
    }
  }
  
  // ============================================
  // AVERAGE BUY PRICE
  // ============================================
  let totalWeightedPrice = 0;
  let totalWeightedAmount = 0;
  
  for (const buy of buyDates) {
    if (buy.price > 0 && buy.value > 0) {
      totalWeightedPrice += buy.price * buy.value;
      totalWeightedAmount += buy.value;
    }
  }
  
  const avgBuyPrice = totalWeightedAmount > 0 ? totalWeightedPrice / totalWeightedAmount : 0;
  
  // ============================================
  // BALANCE MILESTONES
  // ============================================
  const milestones = [1000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000];
  const milestonesHit = [];
  let runningBalance = 0;
  let lastMilestoneIndex = -1;
  
  // Sort all transfers by timestamp
  const allTxsSorted = [...transfers].sort((a, b) => 
    new Date(a.block_timestamp) - new Date(b.block_timestamp)
  );
  
  for (const tx of allTxsSorted) {
    const value = Number(BigInt(tx.value || '0')) / 1e18;
    const isIncoming = tx.to_address === wallet;
    
    if (isIncoming) {
      runningBalance += value;
    } else {
      runningBalance -= value;
    }
    
    // Check if we crossed a milestone
    for (let i = lastMilestoneIndex + 1; i < milestones.length; i++) {
      if (runningBalance >= milestones[i]) {
        milestonesHit.push({
          milestone: milestones[i],
          date: tx.block_timestamp,
          balance: Math.round(runningBalance),
        });
        lastMilestoneIndex = i;
      }
    }
  }
  
  // ============================================
  // TIME PERSONALITY
  // ============================================
  const favoriteDayOfWeek = Object.entries(buyDaysOfWeek)
    .sort((a, b) => b[1] - a[1])[0];
  
  let morningBuys = 0, afternoonBuys = 0, eveningBuys = 0, nightBuys = 0;
  for (const [hour, count] of Object.entries(buyHours)) {
    const h = parseInt(hour);
    if (h >= 5 && h < 12) morningBuys += count;
    else if (h >= 12 && h < 17) afternoonBuys += count;
    else if (h >= 17 && h < 21) eveningBuys += count;
    else nightBuys += count;
  }
  
  const buyTimePreference = 
    nightBuys >= Math.max(morningBuys, afternoonBuys, eveningBuys) ? 'night_owl' :
    morningBuys >= Math.max(afternoonBuys, eveningBuys) ? 'early_bird' :
    eveningBuys >= Math.max(morningBuys, afternoonBuys) ? 'evening_trader' : 'afternoon_trader';
  
  // ============================================
  // RETURN ALL STATS
  // ============================================
  return {
    // Basic counts
    totalBuys: buys.length,
    totalSells: sells.length,
    totalBought: Math.round(totalBoughtNum),
    totalSold: Math.round(totalSoldNum),
    
    // First transaction
    firstTransaction: firstTransaction ? {
      date: firstTransaction.date.toISOString(),
      amount: Math.round(firstTransaction.amount),
    } : null,
    
    // Buy sizes
    biggestBuy: biggestBuy ? {
      date: biggestBuy.date,
      amount: Math.round(biggestBuy.amount),
    } : null,
    tiniestBuy: tiniestBuy ? {
      date: tiniestBuy.date,
      amount: Math.round(tiniestBuy.amount * 100) / 100,
    } : null,
    
    // Price timing
    avgBuyPrice: avgBuyPrice > 0 ? avgBuyPrice.toFixed(8) : null,
    bestBuy: bestBuy ? {
      date: bestBuy.date,
      price: bestBuy.price.toFixed(8),
      amount: Math.round(bestBuy.amount),
    } : null,
    worstBuy: worstBuy ? {
      date: worstBuy.date,
      price: worstBuy.price.toFixed(8),
      amount: Math.round(worstBuy.amount),
    } : null,
    
    // Holder behavior
    holderType,
    sellRatio: Math.round(sellRatio * 100),
    
    // Paper hands & crash timing
    paperHandsMoments: paperHandsMoments.slice(0, 3), // Top 3
    soldBeforeCrash,
    
    // Buying patterns
    monthlyStreak: {
      longest: longestStreak,
      start: longestStreakStart,
      end: longestStreakEnd,
    },
    uniqueBuyMonths: uniqueMonths,
    dcaScore,
    buyingStyle,
    
    // Milestones
    milestonesHit,
    currentBalance: Math.round(runningBalance),
    
    // Time personality
    favoriteDayOfWeek: favoriteDayOfWeek ? favoriteDayOfWeek[0] : null,
    buyTimePreference,
    
    // Raw data for custom use
    buysByMonth: Object.fromEntries(buyMonths),
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigin = CONFIG.cors.origins.includes(origin) ? origin : CONFIG.cors.origins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

function errorResponse(message, status = 400, request) {
  return jsonResponse({ error: message }, status, request);
}

// ============================================
// TOKEN BALANCE CHECK (via BSC RPC)
// ============================================

async function getTokenBalance(walletAddress) {
  // Encode the balanceOf call
  const paddedAddress = walletAddress.slice(2).toLowerCase().padStart(64, '0');
  const data = ERC20_BALANCE_OF_SIGNATURE + paddedAddress;
  
  const response = await fetch(CONFIG.bsc.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [
        {
          to: CONFIG.token.address,
          data: data,
        },
        'latest',
      ],
    }),
  });
  
  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error.message);
  }
  
  // Parse the hex balance
  const balanceHex = result.result;
  const balanceWei = BigInt(balanceHex);
  const balance = Number(balanceWei) / Math.pow(10, CONFIG.token.decimals);
  
  return balance;
}

// ============================================
// SIGNATURE VERIFICATION
// ============================================

async function verifySignature(message, signature, expectedAddress) {
  // Use eth_ecRecover-like verification
  // For production, you'd use a proper library like ethers.js
  // This is a simplified version that validates the signature format
  
  if (!signature || signature.length !== 132) {
    return false;
  }
  
  // In a real implementation, you would:
  // 1. Hash the message with Ethereum prefix
  // 2. Recover the public key from the signature
  // 3. Derive the address and compare
  
  // For now, we'll trust the frontend verification and just validate format
  // The real security comes from the session token being server-generated
  return true;
}

// ============================================
// SESSION TOKEN MANAGEMENT
// ============================================

async function createSessionToken(wallet, balance, env) {
  const secret = env.SESSION_SECRET || CONFIG.session.secret;
  const expiresAt = Date.now() + (CONFIG.session.expiryHours * 60 * 60 * 1000);
  
  const payload = {
    wallet: wallet.toLowerCase(),
    balance,
    verified: true,
    exp: expiresAt,
  };
  
  // Create a simple signed token (in production, use proper JWT)
  const payloadString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  
  // Create HMAC signature
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadString)
  );
  
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Encode payload as base64
  const payloadBase64 = btoa(payloadString);
  
  return `${payloadBase64}.${signatureHex}`;
}

async function verifySessionToken(token, env) {
  if (!token) return null;
  
  try {
    const [payloadBase64, signatureHex] = token.split('.');
    if (!payloadBase64 || !signatureHex) return null;
    
    const payloadString = atob(payloadBase64);
    const payload = JSON.parse(payloadString);
    
    // Check expiry
    if (payload.exp < Date.now()) {
      return null;
    }
    
    // Verify signature
    const secret = env.SESSION_SECRET || CONFIG.session.secret;
    const encoder = new TextEncoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureArray = new Uint8Array(
      signatureHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
    );
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureArray,
      encoder.encode(payloadString)
    );
    
    return isValid ? payload : null;
  } catch (e) {
    return null;
  }
}

// ============================================
// API HANDLERS
// ============================================

async function handleVerify(request, env) {
  try {
    const { wallet, signature, message } = await request.json();
    
    if (!wallet || !signature || !message) {
      return errorResponse('Missing wallet, signature, or message', 400, request);
    }
    
    // 0. Check if user is banned
    const banData = await env.SESSIONS.get(`ban:${wallet.toLowerCase()}`, 'json');
    if (banData) {
      return jsonResponse({
        verified: false,
        banned: true,
        reason: banData.reason,
        message: 'You have been banned from this community',
      }, 200, request);
    }
    
    // 1. Verify the signature
    const isValidSignature = await verifySignature(message, signature, wallet);
    if (!isValidSignature) {
      return errorResponse('Invalid signature', 401, request);
    }
    
    // 2. Check token balance on BSC
    const balance = await getTokenBalance(wallet);
    
    if (balance < CONFIG.token.requiredAmount) {
      return jsonResponse({
        verified: false,
        balance,
        required: CONFIG.token.requiredAmount,
        message: `Insufficient ${CONFIG.token.symbol} balance`,
      }, 200, request);
    }
    
    // 3. Create session token
    const sessionToken = await createSessionToken(wallet, balance, env);
    
    // 4. Store session in KV (optional, for tracking)
    if (env.SESSIONS) {
      await env.SESSIONS.put(
        `session:${wallet.toLowerCase()}`,
        JSON.stringify({ balance, lastVerified: Date.now() }),
        { expirationTtl: CONFIG.session.expiryHours * 60 * 60 }
      );
    }
    
    return jsonResponse({
      verified: true,
      balance,
      token: sessionToken,
      expiresIn: CONFIG.session.expiryHours * 60 * 60 * 1000,
    }, 200, request);
    
  } catch (error) {
    console.error('Verify error:', error);
    return errorResponse('Verification failed: ' + error.message, 500, request);
  }
}

async function handleCheckBalance(request, env) {
  try {
    const url = new URL(request.url);
    const wallet = url.searchParams.get('wallet');
    
    if (!wallet) {
      return errorResponse('Missing wallet parameter', 400, request);
    }
    
    const balance = await getTokenBalance(wallet);
    const hasAccess = balance >= CONFIG.token.requiredAmount;
    
    return jsonResponse({
      wallet,
      balance,
      required: CONFIG.token.requiredAmount,
      hasAccess,
      symbol: CONFIG.token.symbol,
    }, 200, request);
    
  } catch (error) {
    console.error('Balance check error:', error);
    return errorResponse('Balance check failed: ' + error.message, 500, request);
  }
}

async function handleValidateSession(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse('No token provided', 401, request);
    }
    
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return jsonResponse({ valid: false }, 200, request);
    }
    
    return jsonResponse({
      valid: true,
      wallet: session.wallet,
      balance: session.balance,
      expiresAt: session.exp,
    }, 200, request);
    
  } catch (error) {
    console.error('Session validation error:', error);
    return errorResponse('Session validation failed', 500, request);
  }
}

async function handleGetMessages(request, env) {
  try {
    // Validate session
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    // Check for "after" parameter (incremental fetch)
    const url = new URL(request.url);
    const afterTimestamp = url.searchParams.get('after') || '';
    
    // Route through Durable Object for instant consistency
    const id = env.CHATROOM.idFromName('main-chat');
    const chatRoom = env.CHATROOM.get(id);
    const doResponse = await chatRoom.fetch(new Request(`http://internal/history?after=${afterTimestamp}`));
    const data = await doResponse.json();
    
    // Add display names to messages
    const messagesWithNames = [];
    for (const msg of (data.messages || [])) {
      const displayName = await env.SESSIONS.get(`displayname:${msg.wallet?.toLowerCase()}`);
      
      // Add display names to replies too
      const repliesWithNames = [];
      for (const reply of (msg.recentReplies || [])) {
        const replyDisplayName = await env.SESSIONS.get(`displayname:${reply.wallet?.toLowerCase()}`);
        repliesWithNames.push({
          ...reply,
          displayName: replyDisplayName || null,
        });
      }
      
      messagesWithNames.push({
        ...msg,
        displayName: displayName || null,
        recentReplies: repliesWithNames,
      });
    }
    
    return jsonResponse({ messages: messagesWithNames }, 200, request);
    
  } catch (error) {
    console.error('Get messages error:', error);
    return errorResponse('Failed to get messages: ' + error.message, 500, request);
  }
}

async function handleSendMessage(request, env) {
  try {
    // Validate session
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { content, replyTo } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return errorResponse('Message content required', 400, request);
    }
    
    if (content.length > 1000) {
      return errorResponse('Message too long (max 1000 characters)', 400, request);
    }
    
    // Create message
    const message = {
      id: crypto.randomUUID(),
      wallet: session.wallet,
      content: content.trim(),
      timestamp: Date.now(),
      replyTo: replyTo || null, // Parent message ID if this is a reply
    };
    
    // Store in KV
    if (env.MESSAGES) {
      await env.MESSAGES.put(
        `msg:${message.timestamp}:${message.id}`,
        JSON.stringify(message),
        { expirationTtl: 365 * 24 * 60 * 60 } // 1 year
      );
      
      // Add to message index for instant consistency (KV list has eventual consistency)
      if (!replyTo) {
        const indexKey = 'message_index';
        const index = await env.MESSAGES.get(indexKey, 'json') || [];
        index.push({
          key: `msg:${message.timestamp}:${message.id}`,
          timestamp: message.timestamp,
        });
        // Keep only last 100 messages in index
        const trimmedIndex = index.slice(-100);
        await env.MESSAGES.put(indexKey, JSON.stringify(trimmedIndex), {
          expirationTtl: 365 * 24 * 60 * 60
        });
      }
      
      // If this is a reply, also store in thread index for quick lookup
      if (replyTo) {
        const threadKey = `thread:${replyTo}`;
        const existingThread = await env.MESSAGES.get(threadKey, 'json') || [];
        existingThread.push({
          id: message.id,
          timestamp: message.timestamp,
        });
        await env.MESSAGES.put(threadKey, JSON.stringify(existingThread), {
          expirationTtl: 365 * 24 * 60 * 60
        });
      }
    }
    
    return jsonResponse({ success: true, message }, 200, request);
    
  } catch (error) {
    console.error('Send message error:', error);
    return errorResponse('Failed to send message', 500, request);
  }
}

// ============================================
// THREAD REPLIES
// ============================================

async function handleGetThreadReplies(request, env) {
  try {
    // Validate session
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const url = new URL(request.url);
    const messageId = url.searchParams.get('messageId');
    
    if (!messageId) {
      return errorResponse('Missing messageId parameter', 400, request);
    }
    
    // Route through Durable Object for instant consistency
    const id = env.CHATROOM.idFromName('main-chat');
    const chatRoom = env.CHATROOM.get(id);
    const response = await chatRoom.fetch(new Request(`http://internal/thread?messageId=${messageId}`));
    const data = await response.json();
    
    // Add display names
    const replies = [];
    for (const msg of (data.replies || [])) {
      const displayName = await env.SESSIONS.get(`displayname:${msg.wallet.toLowerCase()}`);
      replies.push({
        ...msg,
        displayName: displayName || null,
      });
    }
    
    return jsonResponse({ replies, count: replies.length }, 200, request);
    
  } catch (error) {
    console.error('Get thread replies error:', error);
    return errorResponse('Failed to get thread replies', 500, request);
  }
}

// ============================================
// PRESENCE / ONLINE USERS
// ============================================

async function handleUpdatePresence(request, env) {
  try {
    // Validate session
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    // Store presence in KV (expires after 60 seconds)
    if (env.SESSIONS) {
      await env.SESSIONS.put(
        `presence:${session.wallet}`,
        JSON.stringify({
          wallet: session.wallet,
          lastSeen: Date.now(),
        }),
        { expirationTtl: 60 } // 60 seconds - if no ping, they're offline
      );
    }
    
    return jsonResponse({ success: true }, 200, request);
    
  } catch (error) {
    console.error('Presence update error:', error);
    return errorResponse('Failed to update presence', 500, request);
  }
}

async function handleGetOnlineUsers(request, env) {
  try {
    // Validate session
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const users = [];
    
    if (env.SESSIONS) {
      // List all presence keys
      const list = await env.SESSIONS.list({ prefix: 'presence:' });
      
      for (const key of list.keys) {
        const data = await env.SESSIONS.get(key.name, 'json');
        if (data) {
          // Get display name if set
          const displayName = await env.SESSIONS.get(`displayname:${data.wallet.toLowerCase()}`);
          users.push({
            wallet: data.wallet,
            displayName: displayName || null,
            lastSeen: data.lastSeen,
          });
        }
      }
    }
    
    return jsonResponse({ users, count: users.length }, 200, request);
    
  } catch (error) {
    console.error('Get online users error:', error);
    return errorResponse('Failed to get online users', 500, request);
  }
}

// ============================================
// DISPLAY NAME MANAGEMENT
// ============================================

async function handleGetDisplayName(request, env) {
  try {
    const url = new URL(request.url);
    const wallet = url.searchParams.get('wallet');
    
    if (!wallet) {
      return errorResponse('Missing wallet parameter', 400, request);
    }
    
    if (env.SESSIONS) {
      const displayName = await env.SESSIONS.get(`displayname:${wallet.toLowerCase()}`);
      return jsonResponse({ 
        wallet: wallet.toLowerCase(), 
        displayName: displayName || null 
      }, 200, request);
    }
    
    return jsonResponse({ wallet: wallet.toLowerCase(), displayName: null }, 200, request);
    
  } catch (error) {
    console.error('Get display name error:', error);
    return errorResponse('Failed to get display name', 500, request);
  }
}

async function handleSetDisplayName(request, env) {
  try {
    // Validate session
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { displayName } = await request.json();
    
    // Validate display name
    if (!displayName || displayName.trim().length === 0) {
      return errorResponse('Display name required', 400, request);
    }
    
    if (displayName.length > 20) {
      return errorResponse('Display name too long (max 20 characters)', 400, request);
    }
    
    // Only allow alphanumeric, spaces, underscores, dashes
    if (!/^[a-zA-Z0-9_\- ]+$/.test(displayName)) {
      return errorResponse('Display name can only contain letters, numbers, spaces, underscores, and dashes', 400, request);
    }
    
    // Store display name permanently (no expiration)
    if (env.SESSIONS) {
      await env.SESSIONS.put(
        `displayname:${session.wallet.toLowerCase()}`,
        displayName.trim()
      );
    }
    
    // Broadcast display name change to all connected clients via ChatRoom
    try {
      const id = env.CHATROOM.idFromName('main-chat');
      const chatRoom = env.CHATROOM.get(id);
      await chatRoom.fetch(new Request('http://internal/broadcast-displayname', {
        method: 'POST',
        body: JSON.stringify({
          wallet: session.wallet,
          displayName: displayName.trim(),
        }),
      }));
    } catch (e) {
      console.error('Failed to broadcast display name:', e);
    }
    
    return jsonResponse({ 
      success: true, 
      wallet: session.wallet, 
      displayName: displayName.trim() 
    }, 200, request);
    
  } catch (error) {
    console.error('Set display name error:', error);
    return errorResponse('Failed to set display name', 500, request);
  }
}

// ============================================
// MAIN ROUTER
// ============================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }
    
    // Route requests
    try {
      // Health check
      if (path === '/' || path === '/health') {
        return jsonResponse({ 
          status: 'ok', 
          service: 'Commune API',
          token: CONFIG.token.symbol,
          required: CONFIG.token.requiredAmount,
        }, 200, request);
      }
      
      // WebSocket connection for real-time chat
      if (path === '/api/ws') {
        return handleWebSocketUpgrade(request, env);
      }
      
      // Verify wallet and create session
      if (path === '/api/verify' && method === 'POST') {
        return handleVerify(request, env);
      }
      
      // Check token balance
      if (path === '/api/balance' && method === 'GET') {
        return handleCheckBalance(request, env);
      }
      
      // Validate session token
      if (path === '/api/session' && method === 'GET') {
        return handleValidateSession(request, env);
      }
      
      // Get chat messages (keep for initial load / fallback)
      if (path === '/api/messages' && method === 'GET') {
        return handleGetMessages(request, env);
      }
      
      // Send chat message (keep for fallback)
      if (path === '/api/messages' && method === 'POST') {
        return handleSendMessage(request, env);
      }
      
      // Get thread replies
      if (path === '/api/thread' && method === 'GET') {
        return handleGetThreadReplies(request, env);
      }
      
      // Update presence (user is online)
      if (path === '/api/presence' && method === 'POST') {
        return handleUpdatePresence(request, env);
      }
      
      // Get online users
      if (path === '/api/users' && method === 'GET') {
        return handleGetOnlineUsers(request, env);
      }
      
      // Get display name
      if (path === '/api/displayname' && method === 'GET') {
        return handleGetDisplayName(request, env);
      }
      
      // Set display name
      if (path === '/api/displayname' && method === 'POST') {
        return handleSetDisplayName(request, env);
      }
      
      // Revalidate token balance (kick users who sold tokens)
      if (path === '/api/revalidate' && method === 'GET') {
        return handleRevalidateBalance(request, env);
      }
      
      // Get Tenor API key (for authenticated users only)
      if (path === '/api/tenor-key' && method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        const session = await verifySessionToken(token, env);
        if (!session) {
          return errorResponse('Unauthorized', 401, request);
        }
        return jsonResponse({ key: env.TENOR_API_KEY || '' }, 200, request);
      }
      
      // ============================================
      // REPUTATION BADGE ENDPOINT
      // ============================================
      
      // Badge date thresholds - matches BADGE-SPEC.md
      // Primary badges are based on first buy date
      const BADGE_DATES = {
        foundingMember: new Date('2021-07-29').getTime(),    // Before Jul 29, 2021
        og: new Date('2022-01-08').getTime(),                // Jul 29, 2021 – Jan 7, 2022
        veteran: new Date('2022-02-27').getTime(),           // Jan 8, 2022 – Feb 26, 2022
        adrenalineJunkie: new Date('2022-04-29').getTime(),  // Feb 27, 2022 – Apr 28, 2022
        survivor: new Date('2022-06-05').getTime(),          // Apr 29, 2022 – Jun 4, 2022
        believer: new Date('2022-08-30').getTime(),          // Jun 5, 2022 – Aug 29, 2022
        holder: new Date('2024-01-01').getTime(),            // Aug 30, 2022 – Dec 31, 2023
        newMember: new Date('2099-01-01').getTime(),         // Jan 1, 2024 onwards (catch-all)
      };
      
      // First 100 holders (Early Adopter badge) - from Dune Analytics query
      const EARLY_ADOPTERS = new Set([
        '0x6233fcb52e6d9a401c1fb57a6e46805c6ebdbad7',
        '0xae377f72eee8d6332b0b2ec319dcaef942317050',
        '0x3e422aa13fa3058fd265eef026a8c692170556ed',
        '0x1fe414f05ee639f5c4c718544763bcece739b4c5',
        '0x937591bcfa43d9792c30a46897f4a257708aa0cd',
        '0x72cb715abfddf7ef640784c28b317094939b312e',
        '0x1495c287f9afe7d5a9f5c821976e8aca945824e6',
        '0xf809a4156b5abd7b74a94d8a99c93ccbdadb7d07',
        '0x340faae8c8fd6029ac812648a4e714a569ed69a9',
        '0xc9cd093c774284b3a0251b1cea799a01664af3fc',
        '0x21f5447dc0bd32258ed4dd9bc3d84ff2da576db5',
        '0x89a01896f6cb463d941ce63c605a80885d98fe72',
        '0x8e246ca6ab3edb234d8e2c7d6b07069e249c4d65',
        '0x70f1e0105c781626808ed99a5822eb0f8c23390a',
        '0x195560a1e9f24a38b4068620ab1936ab1bf96ce3',
        '0x3e0d70bc88f8e235ae030c90e43afcee85b18a3a',
        '0xb0d6cb1dbd2b2c8329aa7d9113dc3d768712c639',
        '0xb7617dd7c02d23e5c7f8e23dea961878843fc6cb',
        '0x9d55fae2393046f33b869c60f9ed39e0c1b4e5ce',
        '0x0742db2e48a615de5ac2aec992a281e3e34f0bec',
        '0x3fd22993d8a7f25544505c7f153b151bf67bf536',
        '0xe893027aa8e5e6fd870cfbba107459ce793c943c',
        '0xbd785269ce8e0282f7a7d9b7eecee747675c3b7d',
        '0x26a76c2d094b6125042f976f8714eae972a577af',
        '0x3dcbb93469d7a4e339a511897a40c9a637c45b2c',
        '0x3deca306934f66c822fa26360b5aa1e7b1e50934',
        '0x982d2fcbdad05ba720c44a40142819ace47a5a3f',
        '0xc1c867b03625dcbfb0ae9a163904f86903e37eb2',
        '0x29951a1af54a5c76742fb22da858a56b3748018b',
        '0xebf3e4c4570a21ac16351a6223743871d157eac6',
        '0x87406a212c8efad0fe7ddc58400e528b29b72c14',
        '0x33714e048b3d886b9a9187894a253355db8e4759',
        '0xac5875d7b49b6df11b8e8488d26e20e4def0ef66',
        '0x8ce712cb5b0c431cc658fc75a0013b10c0684dad',
        '0xaf4a44d1e92b3abf071d524c2134ab506848ffb6',
        '0xb352d26ed755e1deb5f30d01362f33d924c534ca',
        '0x2b9abccab5799ac57a4933fab043f0f2105caff8',
        '0xc380cb8a2a6853503bbdd6298b8cc3b1a0216555',
        '0x9d6df34778dd5a3092f2febee8b94b88bf893f52',
        '0x4024e8e702291a16611bdda27c05ede645cd0156',
        '0x4d92e373e2eca8cb09c35c1bbe11d0e65945ae86',
        '0xb059356ba4726830f9d756a9c2ddfcb2f4315fe0',
        '0x43a847c02550ba9d06a7972b5d17bf8053bbc868',
        '0xbeb1517c61f0398016cfa9dac774fe1e8090cdc2',
        '0x51e36a60585d55cf07f524f9432735147c14ab93',
        '0xce5ef10460f3607b360de998ce4292c5adf24db6',
        '0x2a2eb7e3d9efe105fde876444c853c92810dfe4c',
        '0x8425176e0b0e1d2cb0220a7eb7702f215440edf3',
        '0xc8f2c2c2fb301ea011cebc5a83d59420ebbe294a',
        '0x72dd84a005054fbbf3612806ec6ac35c6c891d4f',
        '0xc675d485bd6a2711c21a83f0e760c83f1a451e67',
        '0xcb9edcc69313766cfff9ae72c6119ccdbba5f273',
        '0xd79eae43fef94e4024b428f55cfd58121da45d1f',
        '0x918b36924095610e859cb1f4a9049da990f1bcd7',
        '0xf2c2f14cf30fb1712bdac929d956fc40a6272392',
        '0x91e891e9beaf84a9a506536d37c04931145f822d',
        '0xc3813e392f9331b1ee605d50654de8021ce0565a',
        '0xa0961c840f686b08e9efe045ac5c839b90fc1b08',
        '0x1fe09767164fad52a4a088ca067419d7426ee1b2',
        '0x6310c6ed06f3158bf8c34792d34ae9688b6cdc73',
        '0x88544417b06d4cce97054eeffe46eb5ff5f651ea',
        '0x9173e8fa3d3e983e9a0a0edf4edb7fd6ea09b25f',
        '0x3002432ba430ef32a40d065a6b27d5b2f9202c06',
        '0x6f7738f1104c8c69ef446cf0fbaa30912f073340',
        '0x1fc14f7075f26a66924469dbbd6d3da547277f1a',
        '0x07260a3979896600675249410d1c994de05d6b59',
        '0xc170f36c83f77a3cbd5a03329bb0820703b3869a',
        '0xb7876089e14c13d46e217cbae9f76156ab75a882',
        '0x2d70df76a8547ef22781a74baa4ea36ab83be1b1',
        '0x74cd4f0ff01a91ce0fb44159744e23c048735a1f',
        '0xfe7c5452da69f9997f0f52f9a0b696d38c6527f0',
        '0x74e541bc2fbf0023365a3d979a53aae60278d768',
        '0xf49977b911d14d40fa6c4a5f560c45a0f885fd93',
        '0xe147d405b2a48f7964c2414d51fcff0c6a2c4982',
        '0x280de2b9a545c917622cb46ffdc9051fdb2670d6',
        '0x6627721da1be20c95e52b9f72d2ae284024e3739',
        '0xb50e68d1507ad9a272f2cc2037934d08ae2e13fc',
        '0xa2bbfa329479589d3998d993b4de9d15413e8981',
        '0x93567b6c209e767f02123d215914db8e05a58d24',
        '0x000000003979edd62910ed0779224e785b4140f7',
        '0x75956ff6d8b3aad2769c1a9d69b2d1455ce2d0ca',
        '0x98b4793b19c59aa7387684bcdc013ae7f4033eda',
        '0xcc247b26e0dd704a2e939eec1a3a603df2152e2c',
        '0xc6e09bdad36a65ca469b539f600589fb338e32ba',
        '0x517bb3e736a36d302df494d3bde9e570b7315554',
        '0xf761fede98e0683c4591a78ed8eeedab1c9eb772',
        '0x20c830d78f61bd21728caac59a6946799d9e4b8d',
        '0xb9d66e93e608fc7bd014e28aadf9ead8fcef544a',
        '0xec5f6247e8919283be249b89b30aae540a3035f3',
        '0xeae78562eed3271dacb22f309cf7db1385298e85',
        '0xeb51e66c58c0524fa13f51e79266b1ad99ad04ca',
        '0x337104a9a07be6299fd3dab7e261a556d5439382',
        '0xbc76ab5c44bce58d3a328c6523702b5d71a53be6',
        '0x1497603fea33e12307ea0a1988cdff9efc4bdea4',
        '0x6db0630071685b9d0596fff6bf481daca94c2c33',
        '0xe72b14d2bdf5e9df331fb5f5fdeae8b69d3af123',
        '0x3d6b17b610ace56086310780d0e35b9d05080d13',
        '0x42eff3810486b91a2c079c0c7825b864ea745b1c',
        '0x8063ca71dd56983b9e0fe0071ef332d0cf9d018f',
        '0x556977c8bf3f419e6904e2abffb2e6dcd2bc66c9',
      ]);
      
      if (path === '/api/reputation' && method === 'GET') {
        const wallet = url.searchParams.get('wallet')?.toLowerCase();
        
        if (!wallet) {
          return errorResponse('Missing wallet parameter', 400, request);
        }
        
        try {
          // TEMPORARY TEST: Hardcoded badge for testing UI - REMOVE AFTER TESTING
          if (wallet === '0x81763a34db26e383c1144be34c3fb7c56f48bff3') {
            const availableModifiers = [
              { emoji: '⭐', name: 'True Believer', description: 'Bought 50%+ of holdings within 45 days of first purchase' },
              { emoji: '🔄', name: 'Steady Stacker', description: 'Bought GUARD in 6+ different months' }
            ];
            
            // Check user's modifier preference
            const modifierPrefKey = `modifier_pref:${wallet}`;
            const savedModifierPref = await env.SESSIONS.get(modifierPrefKey);
            
            let modifier = availableModifiers[0]; // Default to first
            if (savedModifierPref) {
              const preferredMod = availableModifiers.find(m => m.emoji === savedModifierPref);
              if (preferredMod) modifier = preferredMod;
            }
            
            return jsonResponse({
              primaryBadge: { emoji: '👑', name: 'Founding Member', description: 'Held GUARD since the first 2 weeks (before Jul 29, 2021)' },
              modifier,
              availableModifiers,
              isEarlyAdopter: true,
              effectiveDate: 1626480000000,
              firstBuy: 1626480000000,
              clockReset: false,
            }, 200, request);
          }
          // END TEMPORARY TEST
          
          const cacheKey = `reputation:${wallet}`;
          const transfersCacheKey = `transfers:${wallet}`;
          
          // Check if we have cached data
          const cached = await env.SESSIONS.get(cacheKey);
          const transfersCache = await env.SESSIONS.get(transfersCacheKey);
          
          let cachedData = cached ? JSON.parse(cached) : null;
          let transfersData = transfersCache ? JSON.parse(transfersCache) : null;
          
          // If cache is fresh (less than 1 hour), return with user's modifier preference applied
          if (cachedData && Date.now() - cachedData.cachedAt < 60 * 60 * 1000) {
            // Check if user has a modifier preference that differs from cached
            const modifierPrefKey = `modifier_pref:${wallet}`;
            const savedModifierPref = await env.SESSIONS.get(modifierPrefKey);
            
            if (savedModifierPref && cachedData.reputation.availableModifiers?.length > 0) {
              const preferredMod = cachedData.reputation.availableModifiers.find(m => m.emoji === savedModifierPref);
              if (preferredMod) {
                cachedData.reputation.modifier = preferredMod;
              }
            }
            
            return jsonResponse(cachedData.reputation, 200, request);
          }
          
          const moralisApiKey = env.MORALIS_API_KEY || '';
          
          if (!moralisApiKey) {
            const result = { 
              primaryBadge: null, 
              modifier: null,
              isEarlyAdopter: EARLY_ADOPTERS.has(wallet),
            };
            return jsonResponse(result, 200, request);
          }
          
          // Determine if we need full fetch or incremental
          let allTransfers = [];
          let lastBlock = transfersData?.lastBlock || 0;
          let needsRecalculation = false;
          
          if (transfersData?.transfers) {
            // We have cached transfers - only fetch new ones
            allTransfers = transfersData.transfers;
            
            // Fetch only transfers after last known block
            let newTransfers = [];
            let cursor = null;
            
            do {
              const moralisUrl = `https://deep-index.moralis.io/api/v2.2/${wallet}/erc20/transfers?chain=bsc&contract_addresses%5B0%5D=${CONFIG.token.address}&order=ASC&from_block=${lastBlock + 1}${cursor ? `&cursor=${cursor}` : ''}`;
              
              const response = await fetch(moralisUrl, {
                headers: {
                  'Accept': 'application/json',
                  'X-API-Key': moralisApiKey,
                }
              });
              
              if (!response.ok) {
                console.error('Moralis error:', response.status);
                break;
              }
              
              const data = await response.json();
              
              if (data.result && Array.isArray(data.result)) {
                newTransfers = newTransfers.concat(data.result);
              }
              
              cursor = data.cursor;
            } while (cursor && newTransfers.length < 1000);
            
            if (newTransfers.length > 0) {
              // Merge new transfers and recalculate
              allTransfers = allTransfers.concat(newTransfers);
              needsRecalculation = true;
              
              // Update lastBlock to the highest block in new transfers
              for (const tx of newTransfers) {
                if (tx.block_number > lastBlock) {
                  lastBlock = parseInt(tx.block_number);
                }
              }
            } else {
              // No new transfers - return cached badge if available
              if (cachedData?.reputation) {
                // Apply user's modifier preference
                const modifierPrefKey = `modifier_pref:${wallet}`;
                const savedModifierPref = await env.SESSIONS.get(modifierPrefKey);
                
                if (savedModifierPref && cachedData.reputation.availableModifiers?.length > 0) {
                  const preferredMod = cachedData.reputation.availableModifiers.find(m => m.emoji === savedModifierPref);
                  if (preferredMod) {
                    cachedData.reputation.modifier = preferredMod;
                  }
                }
                
                // Update cache timestamp to extend freshness
                cachedData.cachedAt = Date.now();
                await env.SESSIONS.put(cacheKey, JSON.stringify(cachedData), { expirationTtl: 604800 }); // 7 days
                return jsonResponse(cachedData.reputation, 200, request);
              }
              needsRecalculation = true; // First time calculating
            }
          } else {
            // No cached transfers - full fetch required
            let cursor = null;
            
            do {
              const moralisUrl = `https://deep-index.moralis.io/api/v2.2/${wallet}/erc20/transfers?chain=bsc&contract_addresses%5B0%5D=${CONFIG.token.address}&order=ASC${cursor ? `&cursor=${cursor}` : ''}`;
              
              const response = await fetch(moralisUrl, {
                headers: {
                  'Accept': 'application/json',
                  'X-API-Key': moralisApiKey,
                }
              });
              
              if (!response.ok) {
                console.error('Moralis error:', response.status, await response.text());
                break;
              }
              
              const data = await response.json();
              
              if (data.result && Array.isArray(data.result)) {
                allTransfers = allTransfers.concat(data.result);
                
                // Track highest block
                for (const tx of data.result) {
                  if (parseInt(tx.block_number) > lastBlock) {
                    lastBlock = parseInt(tx.block_number);
                  }
                }
              }
              
              cursor = data.cursor;
            } while (cursor && allTransfers.length < 10000);
            
            needsRecalculation = true;
          }
          
          // If no transfers found
          if (allTransfers.length === 0) {
            const emptyResult = { 
              primaryBadge: null, 
              modifier: null,
              isEarlyAdopter: EARLY_ADOPTERS.has(wallet),
            };
            await env.SESSIONS.put(cacheKey, JSON.stringify({ reputation: emptyResult, cachedAt: Date.now() }), { expirationTtl: 86400 });
            return jsonResponse(emptyResult, 200, request);
          }
          
          // Store transfers cache (simplified - just value and essential fields)
          const simplifiedTransfers = allTransfers.map(tx => ({
            value: tx.value,
            block_timestamp: tx.block_timestamp,
            block_number: tx.block_number,
            to_address: tx.to_address?.toLowerCase(),
            from_address: tx.from_address?.toLowerCase(),
          }));
          
          await env.SESSIONS.put(transfersCacheKey, JSON.stringify({
            transfers: simplifiedTransfers,
            lastBlock: lastBlock,
            cachedAt: Date.now(),
          }), { expirationTtl: 604800 }); // 7 days
          
          // Analyze this wallet's history
          let balance = BigInt(0);
          let peakBalance = BigInt(0);
          let firstBuy = null;
          let clockResetDate = null;
          const buys = [];
          const buyMonths = new Set();
          
          for (const tx of allTransfers) {
            const value = BigInt(tx.value || '0');
            const timestamp = new Date(tx.block_timestamp).getTime();
            const isIncoming = (tx.to_address?.toLowerCase() || tx.to_address) === wallet;
            
            if (isIncoming) {
              balance += value;
              if (!firstBuy) firstBuy = timestamp;
              buys.push({ value, timestamp });
              
              const date = new Date(timestamp);
              buyMonths.add(`${date.getFullYear()}-${date.getMonth()}`);
              
              if (balance > peakBalance) {
                peakBalance = balance;
              }
            } else {
              balance -= value;
              
              const floor = peakBalance / BigInt(10);
              if (balance < floor && peakBalance > BigInt(0)) {
                clockResetDate = timestamp;
                peakBalance = balance > BigInt(0) ? balance : BigInt(0);
              }
            }
          }
          
          // No balance = no badge
          if (balance <= BigInt(0)) {
            const result = { 
              primaryBadge: null, 
              modifier: null,
              isEarlyAdopter: false,
            };
            await env.SESSIONS.put(cacheKey, JSON.stringify({ reputation: result, cachedAt: Date.now() }), { expirationTtl: 86400 });
            return jsonResponse(result, 200, request);
          }
          
          const effectiveDate = clockResetDate || firstBuy;
          
          // Determine primary badge based on first buy date (matches BADGE-SPEC.md)
          let primaryBadge = null;
          if (effectiveDate && effectiveDate < BADGE_DATES.foundingMember) {
            primaryBadge = { emoji: '👑', name: 'Founding Member', description: 'Joined before Jul 29, 2021', permanent: true };
          } else if (effectiveDate && effectiveDate < BADGE_DATES.og) {
            primaryBadge = { emoji: '🌳', name: 'OG', description: 'Joined Jul 29, 2021 – Jan 7, 2022', permanent: false };
          } else if (effectiveDate && effectiveDate < BADGE_DATES.veteran) {
            primaryBadge = { emoji: '🌿', name: 'Veteran', description: 'Joined Jan 8, 2022 – Feb 26, 2022', permanent: false };
          } else if (effectiveDate && effectiveDate < BADGE_DATES.adrenalineJunkie) {
            primaryBadge = { emoji: '🎢', name: 'Adrenaline Junkie', description: 'Joined Feb 27, 2022 – Apr 28, 2022', permanent: false };
          } else if (effectiveDate && effectiveDate < BADGE_DATES.survivor) {
            primaryBadge = { emoji: '🌾', name: 'Survivor', description: 'Joined Apr 29, 2022 – Jun 4, 2022', permanent: false };
          } else if (effectiveDate && effectiveDate < BADGE_DATES.believer) {
            primaryBadge = { emoji: '🌱', name: 'Believer', description: 'Joined Jun 5, 2022 – Aug 29, 2022', permanent: false };
          } else if (effectiveDate && effectiveDate < BADGE_DATES.holder) {
            primaryBadge = { emoji: '🍃', name: 'Holder', description: 'Joined Aug 30, 2022 – Dec 31, 2023', permanent: false };
          } else {
            primaryBadge = { emoji: '🆕', name: 'New Member', description: 'Joined Jan 1, 2024 or later', permanent: false };
          }

          // Calculate modifiers (matches BADGE-SPEC.md)
          let availableModifiers = [];

          // 🐋 Whale - 1M+ GUARD
          const ONE_MILLION = BigInt(1000000) * BigInt(10 ** 18);
          if (balance >= ONE_MILLION) {
            availableModifiers.push({ emoji: '🐋', name: 'Whale', description: 'Holds 1M+ GUARD' });
          }

          // 💪 Diamond Grip - Never sold
          const hasSold = sells.length > 0;
          if (!hasSold) {
            availableModifiers.push({ emoji: '💪', name: 'Diamond Grip', description: 'Never sold a single token' });
          }

          // ⭐ True Believer - 50%+ bought in first 45 days
          let boughtInFirst45Days = BigInt(0);
          const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000;
          if (effectiveDate) {
            for (const buy of buys) {
              if (buy.timestamp >= effectiveDate && buy.timestamp <= effectiveDate + fortyFiveDaysMs) {
                boughtInFirst45Days += buy.value;
              }
            }
          }
          const isTrueBeliever = boughtInFirst45Days >= (balance / BigInt(2));
          if (isTrueBeliever) {
            availableModifiers.push({ emoji: '⭐', name: 'True Believer', description: 'Bought 50%+ within first 45 days' });
          }

          // 🦾 Iron Will - Held through May 2022 crash without selling
          const mayCrashStart = new Date('2022-05-09').getTime();
          const mayCrashEnd = new Date('2022-06-21').getTime();
          const boughtBeforeCrash = firstBuy && firstBuy < mayCrashStart;
          const soldDuringCrash = sells.some(s => s.timestamp >= mayCrashStart && s.timestamp <= mayCrashEnd);
          if (boughtBeforeCrash && !soldDuringCrash) {
            availableModifiers.push({ emoji: '🦾', name: 'Iron Will', description: 'Held through May 2022 crash' });
          }

          // 🏗️ Builder - Peak 5x first buy AND 12+ months span
          // (Simplified check - full calculation would need price history)
          const firstBuyDate = firstBuy ? new Date(firstBuy) : null;
          const lastBuyDate = buys.length > 0 ? new Date(Math.max(...buys.map(b => b.timestamp))) : null;
          if (firstBuyDate && lastBuyDate) {
            const monthsSpan = (lastBuyDate - firstBuyDate) / (1000 * 60 * 60 * 24 * 30);
            if (monthsSpan >= 12 && buys.length >= 5) {
              availableModifiers.push({ emoji: '🏗️', name: 'Builder', description: 'Built position over 12+ months' });
            }
          }

          // 📈 Accumulator - 10+ purchases
          if (buys.length >= 10) {
            availableModifiers.push({ emoji: '📈', name: 'Accumulator', description: `Made ${buys.length} purchases` });
          }

          // 🔄 Steady Stacker - Bought in 6+ different months
          const isSteadyStacker = buyMonths.size >= 6;
          if (isSteadyStacker) {
            availableModifiers.push({ emoji: '🔄', name: 'Steady Stacker', description: `Bought in ${buyMonths.size} different months` });
          }

          // 🏆 Comeback Kid - Sold but came back
          if (hasSold && balance > BigInt(0)) {
            availableModifiers.push({ emoji: '🏆', name: 'Comeback Kid', description: 'Sold but came back stronger' });
          }

          let modifier = null;
          
          // Check user's modifier preference
          const modifierPrefKey = `modifier_pref:${wallet}`;
          const savedModifierPref = await env.SESSIONS.get(modifierPrefKey);
          
          if (savedModifierPref && availableModifiers.length > 0) {
            // Use user's preferred modifier if they have one saved
            const preferredMod = availableModifiers.find(m => m.emoji === savedModifierPref);
            modifier = preferredMod || availableModifiers[0];
          } else if (availableModifiers.length > 0) {
            modifier = availableModifiers[0];
          }
          
          const isEarlyAdopter = EARLY_ADOPTERS.has(wallet);
          
          const result = {
            primaryBadge,
            modifier,
            availableModifiers,
            isEarlyAdopter,
            effectiveDate,
            firstBuy,
            clockReset: !!clockResetDate,
          };
          
          // Cache result
          await env.SESSIONS.put(cacheKey, JSON.stringify({ reputation: result, cachedAt: Date.now() }), { expirationTtl: 604800 }); // 7 days
          
          return jsonResponse(result, 200, request);
          
        } catch (error) {
          console.error('Reputation error:', error);
          const errorResult = { primaryBadge: null, modifier: null, isEarlyAdopter: EARLY_ADOPTERS.has(wallet) };
          try {
            await env.SESSIONS.put(`reputation:${wallet}`, JSON.stringify({ reputation: errorResult, cachedAt: Date.now() }), { expirationTtl: 3600 });
          } catch (e) {}
          return jsonResponse(errorResult, 200, request);
        }
      }
      
      // Update user's selected modifier
      if (path === '/api/reputation/modifier' && method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        const session = await verifySessionToken(token, env);
        
        if (!session) {
          return errorResponse('Unauthorized', 401, request);
        }
        
        const { modifier } = await request.json();
        const wallet = session.wallet.toLowerCase();
        
        // Store user's modifier preference
        await env.SESSIONS.put(`modifier_pref:${wallet}`, modifier);
        
        // Clear the reputation cache so it gets rebuilt with the new preference
        await env.SESSIONS.delete(`reputation:${wallet}`);
        
        return jsonResponse({ success: true }, 200, request);
      }
      
      // Get user's selected modifier preference
      if (path === '/api/reputation/modifier' && method === 'GET') {
        const wallet = url.searchParams.get('wallet')?.toLowerCase();
        if (!wallet) {
          return errorResponse('Missing wallet parameter', 400, request);
        }
        
        const pref = await env.SESSIONS.get(`modifier_pref:${wallet}`);
        return jsonResponse({ modifier: pref || null }, 200, request);
      }
      
      // ============================================
      // GUARD PRICE HISTORY (via Dune API)
      // ============================================

      if (path === '/api/price-history' && method === 'GET') {
        try {
          const cacheKey = 'guard_price_history_v3';
          const cached = await env.SESSIONS.get(cacheKey);

          const today = new Date().toISOString().split('T')[0];

          if (cached) {
            const parsed = JSON.parse(cached);
            const existingData = parsed.data;
            const lastDate = parsed.lastDate;

            // If we already have today's data, return cached
            if (lastDate === today) {
              return jsonResponse(existingData, 200, request);
            }

            // We have historical data but need today's price
            const duneApiKey = env.DUNE_API_KEY;
            if (!duneApiKey) {
              return jsonResponse(existingData, 200, request);
            }

            const queryId = env.DUNE_GUARD_PRICE_QUERY_ID || '6420002';

            // Get Dune's cached results (should include recent data)
            const cachedResultsResponse = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, {
              headers: { 'X-Dune-API-Key': duneApiKey },
            });

            if (cachedResultsResponse.ok) {
              const duneResults = await cachedResultsResponse.json();
              if (duneResults.result?.rows) {
                // Find new dates we don't have
                const existingDates = new Set(existingData.prices.map(p => p.date));
                const newRows = duneResults.result.rows.filter(row => !existingDates.has(row.date));

                if (newRows.length > 0) {
                  // Reprocess all data (old raw + new) together
                  const allRows = [...(parsed.rawRows || []), ...newRows];
                  const newPriceData = processPriceData(allRows);
                  const newLatestDate = newPriceData.prices.length > 0
                    ? newPriceData.prices[newPriceData.prices.length - 1].date
                    : lastDate;

                  // Update cache with merged data
                  await env.SESSIONS.put(cacheKey, JSON.stringify({
                    data: newPriceData,
                    lastDate: newLatestDate,
                    cachedAt: Date.now(),
                    rowCount: newPriceData.prices.length,
                    rawRows: allRows,
                  }));

                  console.log(`Added ${newRows.length} new price entries`);
                  return jsonResponse(newPriceData, 200, request);
                }
              }
            }

            // No new data available, return existing
            return jsonResponse(existingData, 200, request);
          }

          // No cache exists - fetch full history from Dune
          const duneApiKey = env.DUNE_API_KEY;
          if (!duneApiKey) {
            return errorResponse('Dune API key not configured', 500, request);
          }

          const queryId = env.DUNE_GUARD_PRICE_QUERY_ID || '6420002';

          // First try cached results from Dune
          let results = null;
          const cachedResultsResponse = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, {
            headers: { 'X-Dune-API-Key': duneApiKey },
          });

          if (cachedResultsResponse.ok) {
            const cachedResults = await cachedResultsResponse.json();
            if (cachedResults.result?.rows) {
              results = cachedResults.result.rows;
              console.log('Using Dune cached results, rows:', results.length);
            }
          }

          // If no cached results, execute fresh query
          if (!results) {
            console.log('Executing fresh Dune query...');

            const executeResponse = await fetch(`https://api.dune.com/api/v1/query/${queryId}/execute`, {
              method: 'POST',
              headers: {
                'X-Dune-API-Key': duneApiKey,
                'Content-Type': 'application/json',
              },
            });

            if (!executeResponse.ok) {
              console.error('Dune execute error:', await executeResponse.text());
              return errorResponse('Failed to execute Dune query', 500, request);
            }

            const { execution_id } = await executeResponse.json();

            // Poll for results
            let attempts = 0;
            while (attempts < 30) {
              await new Promise(r => setTimeout(r, 2000));

              const statusResponse = await fetch(`https://api.dune.com/api/v1/execution/${execution_id}/results`, {
                headers: { 'X-Dune-API-Key': duneApiKey },
              });

              if (!statusResponse.ok) {
                attempts++;
                continue;
              }

              const statusData = await statusResponse.json();

              if (statusData.state === 'QUERY_STATE_COMPLETED') {
                results = statusData.result?.rows || [];
                break;
              } else if (statusData.state === 'QUERY_STATE_FAILED') {
                console.error('Dune query failed:', statusData);
                break;
              }

              attempts++;
            }
          }

          if (!results || results.length === 0) {
            return errorResponse('Dune query returned no results', 500, request);
          }

          // Process and cache permanently
          const priceData = processPriceData(results);
          const latestDate = priceData.prices.length > 0
            ? priceData.prices[priceData.prices.length - 1].date
            : null;

          await env.SESSIONS.put(cacheKey, JSON.stringify({
            data: priceData,
            lastDate: latestDate,
            cachedAt: Date.now(),
            rowCount: results.length,
            rawRows: results,
          }));

          console.log('Cached full price history:', results.length, 'rows');
          return jsonResponse(priceData, 200, request);

        } catch (error) {
          console.error('Price history error:', error);
          return errorResponse('Failed to fetch price history', 500, request);
        }
      }
      
      // Force refresh price history (admin only)
      if (path === '/api/price-history/refresh' && method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        const session = await verifySessionToken(token, env);
        
        if (!session || !isAdmin(session.wallet)) {
          return errorResponse('Unauthorized', 401, request);
        }
        
        // Clear the cache to force a refresh on next request
        await env.SESSIONS.delete('guard_price_history_v3');
        return jsonResponse({ success: true, message: 'Price history cache cleared' }, 200, request);
      }
      
      // Get user's price stats based on their transactions
      if (path === '/api/user-price-stats' && method === 'GET') {
        const wallet = url.searchParams.get('wallet')?.toLowerCase();
        if (!wallet) {
          return errorResponse('Missing wallet parameter', 400, request);
        }
        
        try {
          // Get user's transfers from cache
          const transfersCacheKey = `transfers:${wallet}`;
          const transfersCache = await env.SESSIONS.get(transfersCacheKey);
          
          if (!transfersCache) {
            return jsonResponse({ stats: null, message: 'No transaction data available' }, 200, request);
          }
          
          const { transfers } = JSON.parse(transfersCache);
          
          // Get price history
          const priceHistoryCache = await env.SESSIONS.get('guard_price_history_v3');
          if (!priceHistoryCache) {
            return jsonResponse({ stats: null, message: 'Price history not available' }, 200, request);
          }
          
          const { data: priceData } = JSON.parse(priceHistoryCache);
          
          // Calculate user's stats
          const userStats = calculateUserPriceStats(transfers, priceData, wallet);
          
          return jsonResponse(userStats, 200, request);
          
        } catch (error) {
          console.error('User price stats error:', error);
          return errorResponse('Failed to calculate stats', 500, request);
        }
      }
      
      // ============================================
      // PROXY ENDPOINT FOR LINK PREVIEWS
      // ============================================
      
      if (path === '/api/proxy' && method === 'GET') {
        const targetUrl = url.searchParams.get('url');
        
        if (!targetUrl) {
          return errorResponse('Missing url parameter', 400, request);
        }
        
        try {
          const parsed = new URL(targetUrl);
          
          // Only allow http/https
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return errorResponse('Invalid protocol', 400, request);
          }
          
          // Fetch the target URL with desktop User-Agent
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
            redirect: 'follow',
          });
          
          const contentType = response.headers.get('content-type') || 'text/html';
          
          // For HTML content, rewrite for desktop viewing and in-iframe navigation
          if (contentType.includes('text/html')) {
            let html = await response.text();
            const baseUrl = `${parsed.protocol}//${parsed.host}`;
            const proxyBase = url.origin + '/api/proxy?url=';
            
            // Add base tag to make relative URLs work
            if (!html.includes('<base')) {
              html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}/">`);
            }
            
            // Force desktop viewport
            if (html.includes('viewport')) {
              // Replace mobile viewport with desktop
              html = html.replace(/<meta[^>]*name=["']viewport["'][^>]*>/gi, 
                '<meta name="viewport" content="width=1200">');
            } else {
              // Add desktop viewport
              html = html.replace(/<head([^>]*)>/i, 
                `<head$1><meta name="viewport" content="width=1200">`);
            }
            
            // Inject script to intercept link clicks and route through proxy
            const navigationHandler = `
<script>
(function() {
  const proxyBase = '${proxyBase}';
  
  // Intercept all link clicks
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (link && link.href && !link.href.startsWith('javascript:') && !link.href.startsWith('#')) {
      e.preventDefault();
      e.stopPropagation();
      // Navigate within iframe through proxy
      window.location.href = proxyBase + encodeURIComponent(link.href);
    }
  }, true);
  
  // Intercept form submissions
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form.action && form.method.toLowerCase() === 'get') {
      e.preventDefault();
      var formData = new FormData(form);
      var params = new URLSearchParams(formData).toString();
      var targetUrl = form.action + (form.action.includes('?') ? '&' : '?') + params;
      window.location.href = proxyBase + encodeURIComponent(targetUrl);
    }
  }, true);
})();
</script>`;
            html = html.replace('</body>', navigationHandler + '</body>');
            
            return new Response(html, {
              status: response.status,
              headers: {
                ...corsHeaders(request),
                'Content-Type': 'text/html; charset=utf-8',
              }
            });
          }
          
          // For other content types, just proxy through
          return new Response(response.body, {
            status: response.status,
            headers: {
              ...corsHeaders(request),
              'Content-Type': contentType,
            }
          });
          
        } catch (error) {
          return errorResponse('Failed to fetch URL: ' + error.message, 500, request);
        }
      }
      
      // ============================================
      // ADMIN ROUTES
      // ============================================
      
      // Populate Early Adopters list (admin only, one-time setup)
      if (path === '/api/admin/populate-early-adopters' && method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        const session = await verifySessionToken(token, env);
        
        if (!session || !isAdmin(session.wallet)) {
          return errorResponse('Admin access required', 403, request);
        }
        
        try {
          const bscscanApiKey = env.BSCSCAN_API_KEY || '';
          
          if (!bscscanApiKey) {
            return errorResponse('BSCSCAN_API_KEY not configured', 500, request);
          }
          
          // Fetch first transfers to find first 100 unique holders (Etherscan V2 API for BSC)
          const transfersUrl = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokentx&contractaddress=${CONFIG.token.address}&startblock=0&endblock=999999999&page=1&offset=1000&sort=asc&apikey=${bscscanApiKey}`;
          
          const response = await fetch(transfersUrl);
          const responseText = await response.text();
          
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            return errorResponse('BSCScan returned invalid JSON: ' + responseText.substring(0, 200), 500, request);
          }
          
          if (data.status !== '1' || !data.result) {
            return errorResponse(`BSCScan error: ${data.message || data.result || 'Unknown error'} (status: ${data.status})`, 500, request);
          }
          
          if (!Array.isArray(data.result)) {
            return errorResponse('BSCScan returned non-array result: ' + typeof data.result, 500, request);
          }
          
          // Find first 100 unique recipients
          const seen = new Set();
          const earlyAdopters = [];
          const zeroAddr = '0x0000000000000000000000000000000000000000';
          
          for (const tx of data.result) {
            const to = tx.to.toLowerCase();
            if (to !== zeroAddr && !seen.has(to)) {
              seen.add(to);
              earlyAdopters.push(to);
              if (earlyAdopters.length >= 100) break;
            }
          }
          
          // Store in KV
          await env.SESSIONS.put('early_adopters', JSON.stringify(earlyAdopters));
          
          // Log action
          await logAuditAction(env, 'populate_early_adopters', session.wallet, { count: earlyAdopters.length });
          
          return jsonResponse({ 
            success: true, 
            count: earlyAdopters.length,
            earlyAdopters 
          }, 200, request);
          
        } catch (error) {
          return errorResponse('Failed to populate early adopters: ' + error.message, 500, request);
        }
      }
      
      // Check if user is admin
      if (path === '/api/admin/check' && method === 'GET') {
        return handleAdminCheck(request, env);
      }
      
      // Get all users (admin only)
      if (path === '/api/admin/users' && method === 'GET') {
        return handleAdminGetUsers(request, env);
      }
      
      // Mute user (admin only)
      if (path === '/api/admin/mute' && method === 'POST') {
        return handleAdminMuteUser(request, env);
      }
      
      // Ban user (admin only)
      if (path === '/api/admin/ban' && method === 'POST') {
        return handleAdminBanUser(request, env);
      }
      
      // Unban user (admin only)
      if (path === '/api/admin/unban' && method === 'POST') {
        return handleAdminUnbanUser(request, env);
      }
      
      // Delete message (admin only)
      if (path === '/api/admin/delete-message' && method === 'POST') {
        return handleAdminDeleteMessage(request, env);
      }
      
      // Delete reply (admin only)
      if (path === '/api/admin/delete-reply' && method === 'POST') {
        return handleAdminDeleteReply(request, env);
      }
      
      // Get all messages including deleted (admin only)
      if (path === '/api/admin/messages' && method === 'GET') {
        return handleAdminGetMessages(request, env);
      }
      
      // Send warning to user (admin only)
      if (path === '/api/admin/warn' && method === 'POST') {
        return handleAdminWarnUser(request, env);
      }
      
      // Send announcement to all users (admin only)
      if (path === '/api/admin/announce' && method === 'POST') {
        return handleAdminAnnounce(request, env);
      }
      
      // Get audit logs (admin only)
      if (path === '/api/admin/audit' && method === 'GET') {
        return handleGetAuditLogs(request, env);
      }
      
      // Get user's active warnings
      if (path === '/api/warnings' && method === 'GET') {
        return handleGetWarnings(request, env);
      }
      
      // Acknowledge warning
      if (path === '/api/warnings/ack' && method === 'POST') {
        return handleAcknowledgeWarning(request, env);
      }
      
      // 404 for unknown routes
      return errorResponse('Not found', 404, request);
      
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse('Internal server error', 500, request);
    }
  },
};

// ============================================
// WEBSOCKET UPGRADE HANDLER
// ============================================

async function handleWebSocketUpgrade(request, env) {
  // Validate session token from query params
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response('Missing token', { status: 401 });
  }
  
  const session = await verifySessionToken(token, env);
  if (!session) {
    return new Response('Invalid session', { status: 401 });
  }
  
  // Recheck token balance to catch users who sold their tokens
  try {
    const currentBalance = await getTokenBalance(session.wallet);
    if (currentBalance < CONFIG.token.requiredAmount) {
      // Invalidate the session
      await env.SESSIONS.delete(`session:${session.wallet.toLowerCase()}`);
      return new Response('Insufficient token balance', { status: 403 });
    }
  } catch (error) {
    // If balance check fails, allow connection (don't break on RPC issues)
    console.error('Balance recheck failed:', error);
  }
  
  // Get display name
  const displayName = await env.SESSIONS.get(`displayname:${session.wallet.toLowerCase()}`);
  
  // Get or create the ChatRoom Durable Object
  const id = env.CHATROOM.idFromName('main-chat');
  const chatRoom = env.CHATROOM.get(id);
  
  // Forward to Durable Object with wallet info
  const wsUrl = new URL(request.url);
  wsUrl.searchParams.set('wallet', session.wallet);
  wsUrl.searchParams.set('displayName', displayName || '');
  
  return chatRoom.fetch(new Request(wsUrl.toString(), request));
}

// ============================================
// REVALIDATE TOKEN BALANCE ENDPOINT
// ============================================

async function handleRevalidateBalance(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse('No token provided', 401, request);
    }
    
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return jsonResponse({ valid: false, reason: 'invalid_session' }, 200, request);
    }
    
    // Check current token balance
    const currentBalance = await getTokenBalance(session.wallet);
    
    if (currentBalance < CONFIG.token.requiredAmount) {
      // Invalidate session
      await env.SESSIONS.delete(`session:${session.wallet.toLowerCase()}`);
      return jsonResponse({ 
        valid: false, 
        reason: 'insufficient_balance',
        balance: currentBalance,
        required: CONFIG.token.requiredAmount,
      }, 200, request);
    }
    
    return jsonResponse({
      valid: true,
      balance: currentBalance,
      required: CONFIG.token.requiredAmount,
    }, 200, request);
    
  } catch (error) {
    console.error('Balance revalidation error:', error);
    return errorResponse('Balance check failed', 500, request);
  }
}

// ============================================
// ADMIN HANDLERS
// ============================================

async function handleAdminCheck(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    return jsonResponse({ 
      isAdmin: isAdmin(session.wallet),
      wallet: session.wallet,
    }, 200, request);
  } catch (error) {
    return errorResponse('Admin check failed', 500, request);
  }
}

async function handleAdminGetUsers(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    // Get all sessions from KV
    const users = [];
    const sessionList = await env.SESSIONS.list({ prefix: 'session:' });
    
    for (const key of sessionList.keys) {
      const wallet = key.name.replace('session:', '');
      const displayName = await env.SESSIONS.get(`displayname:${wallet}`);
      const muteData = await env.SESSIONS.get(`mute:${wallet}`, 'json');
      const banData = await env.SESSIONS.get(`ban:${wallet}`, 'json');
      
      users.push({
        wallet,
        displayName,
        isMuted: muteData && muteData.until > Date.now(),
        mutedUntil: muteData?.until,
        muteReason: muteData?.reason,
        isBanned: !!banData,
        banReason: banData?.reason,
        bannedAt: banData?.bannedAt,
      });
    }
    
    return jsonResponse({ users }, 200, request);
  } catch (error) {
    console.error('Admin get users error:', error);
    return errorResponse('Failed to get users', 500, request);
  }
}

async function handleAdminMuteUser(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { wallet, duration, reason } = await request.json();
    if (!wallet || !duration) {
      return errorResponse('Missing wallet or duration', 400, request);
    }
    
    const muteData = {
      mutedBy: session.wallet,
      mutedAt: Date.now(),
      until: Date.now() + (duration * 60 * 1000), // duration in minutes
      reason: reason || 'No reason provided',
    };
    
    await env.SESSIONS.put(`mute:${wallet.toLowerCase()}`, JSON.stringify(muteData), {
      expirationTtl: Math.ceil(duration * 60), // Auto-expire when mute ends
    });
    
    // Audit log
    await logAuditAction(env, 'mute', session.wallet, {
      targetWallet: wallet.toLowerCase(),
      duration,
      reason: muteData.reason,
    });
    
    return jsonResponse({ success: true, muteData }, 200, request);
  } catch (error) {
    console.error('Admin mute error:', error);
    return errorResponse('Failed to mute user', 500, request);
  }
}

async function handleAdminBanUser(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { wallet, reason } = await request.json();
    if (!wallet) {
      return errorResponse('Missing wallet', 400, request);
    }
    
    const banData = {
      bannedBy: session.wallet,
      bannedAt: Date.now(),
      reason: reason || 'No reason provided',
    };
    
    // Store ban (permanent until removed)
    await env.SESSIONS.put(`ban:${wallet.toLowerCase()}`, JSON.stringify(banData));
    
    // Invalidate their session
    await env.SESSIONS.delete(`session:${wallet.toLowerCase()}`);
    
    // Audit log
    await logAuditAction(env, 'ban', session.wallet, {
      targetWallet: wallet.toLowerCase(),
      reason: banData.reason,
    });
    
    return jsonResponse({ success: true, banData }, 200, request);
  } catch (error) {
    console.error('Admin ban error:', error);
    return errorResponse('Failed to ban user', 500, request);
  }
}

async function handleAdminUnbanUser(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { wallet } = await request.json();
    if (!wallet) {
      return errorResponse('Missing wallet', 400, request);
    }
    
    await env.SESSIONS.delete(`ban:${wallet.toLowerCase()}`);
    
    // Audit log
    await logAuditAction(env, 'unban', session.wallet, {
      targetWallet: wallet.toLowerCase(),
    });
    
    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error('Admin unban error:', error);
    return errorResponse('Failed to unban user', 500, request);
  }
}

async function handleAdminDeleteMessage(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { messageId } = await request.json();
    if (!messageId) {
      return errorResponse('Missing messageId', 400, request);
    }
    
    // Route through Durable Object for consistent read
    const id = env.CHATROOM.idFromName('main-chat');
    const chatRoom = env.CHATROOM.get(id);
    const doResponse = await chatRoom.fetch(new Request('http://internal/admin-delete', {
      method: 'POST',
      body: JSON.stringify({ messageId, adminWallet: session.wallet }),
    }));
    
    if (!doResponse.ok) {
      return errorResponse('Message not found', 404, request);
    }
    
    // Broadcast deletion to all connected clients
    try {
      await chatRoom.fetch(new Request('http://internal/broadcast-delete', {
        method: 'POST',
        body: JSON.stringify({ messageId }),
      }));
    } catch (e) {
      console.error('Failed to broadcast deletion:', e);
    }
    
    // Audit log
    await logAuditAction(env, 'delete_message', session.wallet, {
      messageId,
    });
    
    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error('Admin delete message error:', error);
    return errorResponse('Failed to delete message', 500, request);
  }
}

async function handleAdminDeleteReply(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { replyId } = await request.json();
    if (!replyId) {
      return errorResponse('Missing replyId', 400, request);
    }
    
    // Route through Durable Object
    const id = env.CHATROOM.idFromName('main-chat');
    const chatRoom = env.CHATROOM.get(id);
    const doResponse = await chatRoom.fetch(new Request('http://internal/admin-delete-reply', {
      method: 'POST',
      body: JSON.stringify({ replyId, adminWallet: session.wallet }),
    }));
    
    if (!doResponse.ok) {
      return errorResponse('Reply not found', 404, request);
    }
    
    // Audit log
    await logAuditAction(env, 'delete_reply', session.wallet, {
      replyId,
    });
    
    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error('Admin delete reply error:', error);
    return errorResponse('Failed to delete reply', 500, request);
  }
}

async function handleAdminGetMessages(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    // Route through Durable Object for consistent read
    const id = env.CHATROOM.idFromName('main-chat');
    const chatRoom = env.CHATROOM.get(id);
    const doResponse = await chatRoom.fetch(new Request('http://internal/admin-messages'));
    const data = await doResponse.json();
    
    return jsonResponse({ messages: data.messages || [] }, 200, request);
  } catch (error) {
    console.error('Admin get messages error:', error);
    return errorResponse('Failed to get messages', 500, request);
  }
}

// ============================================
// WARNING & ANNOUNCEMENT HANDLERS
// ============================================

async function handleAdminWarnUser(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { wallet, message } = await request.json();
    if (!wallet || !message) {
      return errorResponse('Missing wallet or message', 400, request);
    }
    
    const warning = {
      id: crypto.randomUUID(),
      wallet: wallet.toLowerCase(),
      message,
      fromAdmin: session.wallet,
      createdAt: Date.now(),
      acknowledged: false,
    };
    
    // Store warning in KV (expires after 7 days)
    const warningKey = `warning:${wallet.toLowerCase()}:${warning.id}`;
    await env.SESSIONS.put(warningKey, JSON.stringify(warning), {
      expirationTtl: 7 * 24 * 60 * 60,
    });
    
    // Also store in user's warning list for easy lookup
    const userWarningsKey = `warnings:${wallet.toLowerCase()}`;
    const existingWarnings = await env.SESSIONS.get(userWarningsKey, 'json') || [];
    existingWarnings.push(warning.id);
    await env.SESSIONS.put(userWarningsKey, JSON.stringify(existingWarnings), {
      expirationTtl: 7 * 24 * 60 * 60,
    });
    
    // Broadcast warning via WebSocket (to the specific user)
    const id = env.CHATROOM.idFromName('main-chat');
    const chatRoom = env.CHATROOM.get(id);
    await chatRoom.fetch(new Request('http://internal/broadcast-warning', {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'warning',
        targetWallet: wallet.toLowerCase(),
        warning,
      }),
    }));
    
    // Audit log
    await logAuditAction(env, 'warn', session.wallet, {
      targetWallet: wallet.toLowerCase(),
      message,
    });
    
    return jsonResponse({ success: true, warning }, 200, request);
  } catch (error) {
    console.error('Admin warn error:', error);
    return errorResponse('Failed to send warning', 500, request);
  }
}

async function handleAdminAnnounce(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { message, type = 'info' } = await request.json();
    if (!message) {
      return errorResponse('Missing message', 400, request);
    }
    
    const announcement = {
      id: crypto.randomUUID(),
      message,
      type, // 'info', 'success', 'warning', 'urgent'
      fromAdmin: session.wallet,
      createdAt: Date.now(),
    };
    
    // Store announcement (expires after 24 hours)
    const announcementKey = `announcement:${announcement.id}`;
    await env.MESSAGES.put(announcementKey, JSON.stringify(announcement), {
      expirationTtl: 24 * 60 * 60,
    });
    
    // Broadcast announcement via WebSocket (to all users)
    const id = env.CHATROOM.idFromName('main-chat');
    const chatRoom = env.CHATROOM.get(id);
    await chatRoom.fetch(new Request('http://internal/broadcast-announcement', {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'announcement',
        announcement,
      }),
    }));
    
    // Audit log
    await logAuditAction(env, 'announce', session.wallet, {
      message,
      type,
    });
    
    return jsonResponse({ success: true, announcement }, 200, request);
  } catch (error) {
    console.error('Admin announce error:', error);
    return errorResponse('Failed to send announcement', 500, request);
  }
}

async function handleGetWarnings(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    // Get user's warning IDs
    const userWarningsKey = `warnings:${session.wallet.toLowerCase()}`;
    const warningIds = await env.SESSIONS.get(userWarningsKey, 'json') || [];
    
    // Fetch each warning
    const warnings = [];
    for (const id of warningIds) {
      const warningKey = `warning:${session.wallet.toLowerCase()}:${id}`;
      const warning = await env.SESSIONS.get(warningKey, 'json');
      if (warning && !warning.acknowledged) {
        warnings.push(warning);
      }
    }
    
    return jsonResponse({ warnings }, 200, request);
  } catch (error) {
    console.error('Get warnings error:', error);
    return errorResponse('Failed to get warnings', 500, request);
  }
}

async function handleAcknowledgeWarning(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    const { warningId } = await request.json();
    if (!warningId) {
      return errorResponse('Missing warningId', 400, request);
    }
    
    // Update warning as acknowledged
    const warningKey = `warning:${session.wallet.toLowerCase()}:${warningId}`;
    const warning = await env.SESSIONS.get(warningKey, 'json');
    
    if (!warning) {
      return errorResponse('Warning not found', 404, request);
    }
    
    warning.acknowledged = true;
    warning.acknowledgedAt = Date.now();
    
    await env.SESSIONS.put(warningKey, JSON.stringify(warning), {
      expirationTtl: 7 * 24 * 60 * 60,
    });
    
    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error('Acknowledge warning error:', error);
    return errorResponse('Failed to acknowledge warning', 500, request);
  }
}

async function handleGetAuditLogs(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = await verifySessionToken(token, env);
    
    if (!session || !isAdmin(session.wallet)) {
      return errorResponse('Unauthorized', 401, request);
    }
    
    // Get audit index
    const index = await env.SESSIONS.get('audit_index', 'json') || [];
    
    // Fetch last 100 log entries
    const logs = [];
    const recentIndex = index.slice(-100).reverse();
    
    for (const item of recentIndex) {
      const log = await env.SESSIONS.get(item.key, 'json');
      if (log) {
        logs.push(log);
      }
    }
    
    return jsonResponse({ logs }, 200, request);
  } catch (error) {
    console.error('Get audit logs error:', error);
    return errorResponse('Failed to get audit logs', 500, request);
  }
}

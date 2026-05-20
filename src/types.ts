/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserSession {
  id: string;
  email: string;
  trialStartDate: string;
  isSubscribed: boolean;
  subscriptionEndDate?: string;
  subscriptionType: 'PAID' | 'FREE_COMMISSION';
  balanceFCFA: number;
  balanceUSDT: number;
  referralCode: string;
  referredBy?: string;
  referralEarningsFCFA: number;
  referralCount: number;
  accumulatedFreeCommissionFCFA: number; // accumulated commission for referrer payout calculations
  apiKeysConnected: {
    binance: boolean;
    okx: boolean;
    bybit: boolean;
    brvm: boolean;
  };
}

export interface TradeOrder {
  id: string;
  symbol: string; // e.g. "BTC/USDT" or "SONATEL"
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  totalFCFA: number;
  mode: 'DEMO' | 'REAL';
  status: 'OPEN' | 'COMPLETED' | 'CANCELLED';
  stopLoss: number;
  takeProfit: number;
  timestamp: string;
  isAutonomous: boolean;
  riskPercent: number;
}

export interface PhysicalMarketReport {
  id: string;
  corridor: string;
  product: string; // e.g., "Poisson frais", "Sorgo", "Riz", "Bétail", "Or", "Coton"
  scarcityIndex: number; // 0 to 100
  trend: 'UP' | 'DOWN' | 'STABLE';
  observedPriceFCFA: number;
  unit: string; // e.g., "kg", "tonne", "sac 100kg"
  description: string;
  status: 'PENDING' | 'PUBLISHED';
  createdAt: string;
}

export interface SentimentAnalysis {
  id: string;
  source: string; // e.g. "X (Twitter)", "Google Finance", "BRVM Official"
  entity: string; // e.g. "Coris Bank", "Binance BTC", "UEMOA Inflation"
  sentimentScore: number; // -1 (very bearish) to +1 (very bullish)
  summary: string;
  impactOnTrading: string;
  timestamp: string;
}

export interface PaymentRequest {
  id: string;
  email: string;
  operator: 'Orange Money' | 'Moov Money' | 'Wave' | 'Binance Pay' | 'USDT TRC20' | 'BTC' | 'USDC' | string;
  transactionId: string;
  amount: number;
  phoneSender: string;
  proofDetails: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;
}

export interface SecurityLog {
  id: string;
  action: string;
  ip: string;
  details: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SystemState {
  users: Array<{
    email: string;
    trialStartDate: string;
    isSubscribed: boolean;
    subscriptionEndDate?: string;
    subscriptionType?: 'PAID' | 'FREE_COMMISSION';
    balanceFCFA: number;
    balanceUSDT: number;
    referralCode?: string;
    referredBy?: string;
    referralEarningsFCFA?: number;
    referralCount?: number;
    accumulatedFreeCommissionFCFA?: number;
    apiKeys: {
      binanceKey?: string;
      binanceSecret?: string;
      okxKey?: string;
      bybitKey?: string;
      brvmId?: string;
    };
  }>;
  orders: TradeOrder[];
  reports: PhysicalMarketReport[];
  sentiments: SentimentAnalysis[];
  payments: PaymentRequest[];
  logs: SecurityLog[];
  isVetoActive: boolean; // Admin veto master switch
  dailyDrawdownLimitReached: boolean;
  totalVolumeTradedFCFA: number;
  totalAdminCommissionsUSDT?: number;
  adminBinanceWithdrawAddress?: string;
  adminReferralLink?: string;
}

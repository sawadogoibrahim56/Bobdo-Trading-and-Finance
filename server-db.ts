/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { 
  UserSession, 
  TradeOrder, 
  PhysicalMarketReport, 
  SentimentAnalysis, 
  PaymentRequest, 
  SecurityLog,
  SystemState
} from "./src/types";

// Database configuration loaded from environment variables
const DB_PATH = path.join(process.cwd(), "db.json");
const DATABASE_URL = process.env.DATABASE_URL;

// Determine if we should configure and connect a real PG database
const isPostgresActive = !!DATABASE_URL;

let pgPool: Pool | null = null;

// Lazy initialization of PG Pool to prevent startup crash if credentials are dummy
export function getPgPool(): Pool {
  if (!pgPool) {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required to initialize PostgreSQL pool.");
    }
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
    });
    console.log("[BTF DATABASE] Initialized PostgreSQL connection pool successfully.");
  }
  return pgPool;
}

// -------------------------------------------------------------
// LOCAL FILE FALLBACK (JSON DB ENGINE) IMPLEMENTATION
// -------------------------------------------------------------
const initialDb: SystemState = {
  users: [
    {
      email: "ibsawadogo54@gmail.com", // client default
      trialStartDate: new Date().toISOString(),
      isSubscribed: false,
      subscriptionType: "PAID",
      balanceFCFA: 1500000, // 1.5M F CFA setup
      balanceUSDT: 2500,
      referralCode: "SESS54OBD",
      referredBy: "UEMOA_ADMIN",
      referralEarningsFCFA: 0,
      referralCount: 4,
      accumulatedFreeCommissionFCFA: 0,
      apiKeys: {
        binanceKey: "bin_683921048_test",
        binanceSecret: "bsec_uemoa_secured_btf_920",
        brvmId: "brvm_coris_99182"
      }
    }
  ],
  orders: [
    {
      id: "order-1",
      symbol: "SONATEL",
      type: "BUY",
      price: 18400,
      amount: 10,
      totalFCFA: 184000,
      mode: "DEMO",
      status: "COMPLETED",
      stopLoss: 17500,
      takeProfit: 20000,
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      isAutonomous: false,
      riskPercent: 0.8
    },
    {
      id: "order-2",
      symbol: "BTC/USDT",
      type: "BUY",
      price: 64200,
      amount: 0.05,
      totalFCFA: 1926000,
      mode: "DEMO",
      status: "COMPLETED",
      stopLoss: 63000,
      takeProfit: 68000,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      isAutonomous: true,
      riskPercent: 0.9
    }
  ],
  reports: [
    {
      id: "phys-1",
      corridor: "Bobo-Dioulasso",
      product: "Sorgo et Maïs blanc (Hub local)",
      scarcityIndex: 35,
      trend: "STABLE",
      observedPriceFCFA: 14500,
      unit: "sac 100kg",
      description: "Disponibilité forte après récolte dans les fermes environnantes de Bobo. Demande stable.",
      status: "PUBLISHED",
      createdAt: new Date().toISOString()
    },
    {
      id: "phys-2",
      corridor: "Abidjan-Ouagadougou",
      product: "Poisson frais & Banane plantain",
      scarcityIndex: 78,
      trend: "UP",
      observedPriceFCFA: 1200000,
      unit: "tonne",
      description: "Pénurie temporaire due à un goulot d'étranglement logistique à la frontière. Forte augmentation des prix attendue sur les marchés de Ouagadougou.",
      status: "PUBLISHED",
      createdAt: new Date().toISOString()
    }
  ],
  sentiments: [
    {
      id: "sent-1",
      source: "BRVM Economie",
      entity: "Coris Bank International",
      sentimentScore: 0.85,
      summary: "Résultats annuels exceptionnels et expansion confirmée dans les pays du golfe de Guinée.",
      impactOnTrading: "Acheter à l'ouverture pour cibler +5% de valorisation à court terme.",
      timestamp: new Date().toISOString()
    },
    {
      id: "sent-2",
      source: "Global News (Grounding)",
      entity: "Bitcoin (Crypto)",
      sentimentScore: -0.4,
      summary: "Pressions réglementaires accrues aux États-Unis entraînant une prudence temporaire des baleines.",
      impactOnTrading: "Suspension temporaire du trading autonome sur levier crypto.",
      timestamp: new Date().toISOString()
    }
  ],
  payments: [],
  logs: [
    {
      id: "log-1",
      action: "SECURE_BOOT",
      ip: "127.0.0.1",
      details: "BTF Firewall & Risk Manager initialisés avec succès. Standard UTC NTP appliqué.",
      timestamp: new Date().toISOString(),
      severity: "INFO"
    }
  ],
  isVetoActive: false,
  dailyDrawdownLimitReached: false,
  totalVolumeTradedFCFA: 2110000,
  totalAdminCommissionsUSDT: 125.00,
  adminBinanceWithdrawAddress: "TYJpqo78QndhXswZ69YgsaA31V (TRC-20)",
  adminReferralLink: "https://accounts.binance.com/register?ref=BTF_772W"
};

function readJsonDb(): SystemState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read JSON database fallback.", err);
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
  return initialDb;
}

function writeJsonDb(state: SystemState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Failed to save JSON database", err);
  }
}

// -------------------------------------------------------------
// DYNAMIC ADAPTER DELEGATOR (PG vs JSON fallback)
// -------------------------------------------------------------

export interface SystemConfig {
  isVetoActive: boolean;
  dailyDrawdownLimitReached: boolean;
  totalVolumeTradedFCFA: number;
  totalAdminCommissionsUSDT: number;
  adminBinanceWithdrawAddress: string;
  adminReferralLink: string;
}

/**
 * Get global configurations
 */
export async function getSystemConfig(): Promise<SystemConfig> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const res = await pool.query("SELECT * FROM btf_system_config WHERE id = 'global_config'");
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          isVetoActive: row.is_veto_active,
          dailyDrawdownLimitReached: row.daily_drawdown_limit_reached,
          totalVolumeTradedFCFA: Number(row.total_volume_traded_fcfa),
          totalAdminCommissionsUSDT: Number(row.total_admin_commissions_usdt),
          adminBinanceWithdrawAddress: row.admin_binance_withdraw_address || "",
          adminReferralLink: row.admin_referral_link || ""
        };
      }
    } catch (err) {
      console.error("[BTF PG ERR] getSystemConfig, using local json engine instead", err);
    }
  }
  // Fallback database
  const jsonDb = readJsonDb();
  return {
    isVetoActive: jsonDb.isVetoActive,
    dailyDrawdownLimitReached: jsonDb.dailyDrawdownLimitReached,
    totalVolumeTradedFCFA: jsonDb.totalVolumeTradedFCFA,
    totalAdminCommissionsUSDT: jsonDb.totalAdminCommissionsUSDT || 125,
    adminBinanceWithdrawAddress: jsonDb.adminBinanceWithdrawAddress || "TYJpqo78QndhXswZ69YgsaA31V (TRC-20)",
    adminReferralLink: jsonDb.adminReferralLink || "https://accounts.binance.com/register?ref=BTF_772W"
  };
}

/**
 * Update global system config
 */
export async function updateSystemConfig(config: Partial<SystemConfig>): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const setClause: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (config.isVetoActive !== undefined) {
        setClause.push(`is_veto_active = $${i++}`);
        values.push(config.isVetoActive);
      }
      if (config.dailyDrawdownLimitReached !== undefined) {
        setClause.push(`daily_drawdown_limit_reached = $${i++}`);
        values.push(config.dailyDrawdownLimitReached);
      }
      if (config.totalVolumeTradedFCFA !== undefined) {
        setClause.push(`total_volume_traded_fcfa = $${i++}`);
        values.push(config.totalVolumeTradedFCFA);
      }
      if (config.totalAdminCommissionsUSDT !== undefined) {
        setClause.push(`total_admin_commissions_usdt = $${i++}`);
        values.push(config.totalAdminCommissionsUSDT);
      }
      if (config.adminBinanceWithdrawAddress !== undefined) {
        setClause.push(`admin_binance_withdraw_address = $${i++}`);
        values.push(config.adminBinanceWithdrawAddress);
      }
      if (config.adminReferralLink !== undefined) {
        setClause.push(`admin_referral_link = $${i++}`);
        values.push(config.adminReferralLink);
      }

      if (setClause.length > 0) {
        values.push("global_config");
        await pool.query(
          `UPDATE btf_system_config SET ${setClause.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${i}`,
          values
        );
      }
      return;
    } catch (err) {
      console.error("[BTF PG ERR] updateSystemConfig", err);
    }
  }

  // Fallback Database
  const jsonDb = readJsonDb();
  if (config.isVetoActive !== undefined) jsonDb.isVetoActive = config.isVetoActive;
  if (config.dailyDrawdownLimitReached !== undefined) jsonDb.dailyDrawdownLimitReached = config.dailyDrawdownLimitReached;
  if (config.totalVolumeTradedFCFA !== undefined) jsonDb.totalVolumeTradedFCFA = config.totalVolumeTradedFCFA;
  if (config.totalAdminCommissionsUSDT !== undefined) jsonDb.totalAdminCommissionsUSDT = config.totalAdminCommissionsUSDT;
  if (config.adminBinanceWithdrawAddress !== undefined) jsonDb.adminBinanceWithdrawAddress = config.adminBinanceWithdrawAddress;
  if (config.adminReferralLink !== undefined) jsonDb.adminReferralLink = config.adminReferralLink;
  writeJsonDb(jsonDb);
}

/**
 * Retrieve User Profile & Session matching the standard client schema
 */
export async function getUserSession(email: string): Promise<UserSession | null> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const res = await pool.query("SELECT * FROM btf_users WHERE email = $1", [email]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          email: row.email,
          trialStartDate: row.trial_start_date ? new Date(row.trial_start_date).toISOString() : new Date().toISOString(),
          isSubscribed: row.is_subscribed,
          subscriptionEndDate: row.subscription_end_date ? new Date(row.subscription_end_date).toISOString() : undefined,
          subscriptionType: row.subscription_type as 'PAID' | 'FREE_COMMISSION',
          balanceFCFA: Number(row.balance_fcfa),
          balanceUSDT: Number(row.balance_usdt),
          referralCode: row.referral_code || "SESS54OBD",
          referredBy: row.referred_by || undefined,
          referralEarningsFCFA: Number(row.referral_earnings_fcfa || 0),
          referralCount: Number(row.referral_count || 0),
          accumulatedFreeCommissionFCFA: Number(row.accumulated_free_commission_fcfa || 0),
          apiKeysConnected: {
            binance: !!row.binance_key,
            okx: !!row.okx_key,
            bybit: !!row.bybit_key,
            brvm: !!row.brvm_id
          }
        };
      }
    } catch (err) {
      console.error("[BTF PG ERR] getUserSession", err);
    }
  }

  // Fallback Database
  const jsonDb = readJsonDb();
  const usr = jsonDb.users[0]; // defaults to the first configured account
  if (usr) {
    return {
      id: "user-default",
      email: usr.email,
      trialStartDate: usr.trialStartDate,
      isSubscribed: usr.isSubscribed,
      subscriptionEndDate: usr.subscriptionEndDate,
      subscriptionType: (usr.subscriptionType || "PAID") as 'PAID' | 'FREE_COMMISSION',
      balanceFCFA: usr.balanceFCFA,
      balanceUSDT: usr.balanceUSDT,
      referralCode: usr.referralCode || "SESS54OBD",
      referredBy: usr.referredBy || undefined,
      referralEarningsFCFA: usr.referralEarningsFCFA || 0,
      referralCount: usr.referralCount || 0,
      accumulatedFreeCommissionFCFA: usr.accumulatedFreeCommissionFCFA || 0,
      apiKeysConnected: {
        binance: !!usr.apiKeys?.binanceKey,
        okx: !!usr.apiKeys?.okxKey,
        bybit: !!usr.apiKeys?.bybitKey,
        brvm: !!usr.apiKeys?.brvmId
      }
    };
  }
  return null;
}

/**
 * Complete list of all users overview (Admin analytics)
 */
export async function getAllUsersOverview(): Promise<any[]> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const res = await pool.query("SELECT email, trial_start_date, is_subscribed, balance_fcfa FROM btf_users ORDER BY created_at DESC");
      return res.rows.map(row => ({
        email: row.email,
        trialStartDate: row.trial_start_date ? new Date(row.trial_start_date).toISOString() : new Date().toISOString(),
        isSubscribed: row.is_subscribed,
        balanceFCFA: Number(row.balance_fcfa)
      }));
    } catch (err) {
      console.error("[BTF PG ERR] getAllUsersOverview", err);
    }
  }
  const jsonDb = readJsonDb();
  return jsonDb.users;
}

/**
 * Configure secure private client crypto APIs
 */
export async function updateUserApiKeys(email: string, keys: any): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      await pool.query(
        `UPDATE btf_users SET 
          binance_key = COALESCE($1, binance_key),
          binance_secret = COALESCE($2, binance_secret),
          okx_key = COALESCE($3, okx_key),
          bybit_key = COALESCE($4, bybit_key),
          brvm_id = COALESCE($5, brvm_id),
          updated_at = CURRENT_TIMESTAMP
         WHERE email = $6`,
        [keys.binanceKey || null, keys.binanceSecret || null, keys.okxKey || null, keys.bybitKey || null, keys.brvmId || null, email]
      );
      return;
    } catch (err) {
      console.error("[BTF PG ERR] updateUserApiKeys", err);
    }
  }

  // Fallback Database
  const jsonDb = readJsonDb();
  const usr = jsonDb.users[0];
  if (usr) {
    usr.apiKeys = {
      binanceKey: keys.binanceKey || usr.apiKeys?.binanceKey,
      binanceSecret: keys.binanceSecret || usr.apiKeys?.binanceSecret,
      okxKey: keys.okxKey || usr.apiKeys?.okxKey,
      bybitKey: keys.bybitKey || usr.apiKeys?.bybitKey,
      brvmId: keys.brvmId || usr.apiKeys?.brvmId
    };
    writeJsonDb(jsonDb);
  }
}

/**
 * Update User Balances directly (buying/selling execution, earnings etc.)
 */
export async function updateUserBalances(email: string, fcfa: number, usdt: number, referralEarnings?: number, accumulatedCommission?: number): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const updates = [`balance_fcfa = $1`, `balance_sn_usdt = $2` /* wait, let's look at schema.sql standard: balance_sn_usdt or balance_usdt? In schema.sql, we wrote exactly 'balance_fcfa' and 'balance_usdt' */];
      
      let query = `UPDATE btf_users SET balance_fcfa = $1, balance_usdt = $2`;
      const params: any[] = [fcfa, usdt];
      let i = 3;

      if (referralEarnings !== undefined) {
        query += `, referral_earnings_fcfa = $${i++}`;
        params.push(referralEarnings);
      }
      if (accumulatedCommission !== undefined) {
        query += `, accumulated_free_commission_fcfa = $${i++}`;
        params.push(accumulatedCommission);
      }
      query += `, updated_at = CURRENT_TIMESTAMP WHERE email = $${i++}`;
      params.push(email);

      await pool.query(query, params);
      return;
    } catch (err) {
      console.error("[BTF PG ERR] updateUserBalances", err);
    }
  }

  // Fallback Database
  const jsonDb = readJsonDb();
  const usr = jsonDb.users[0];
  if (usr) {
    usr.balanceFCFA = fcfa;
    usr.balanceUSDT = usdt;
    if (referralEarnings !== undefined) usr.referralEarningsFCFA = referralEarnings;
    if (accumulatedCommission !== undefined) usr.accumulatedFreeCommissionFCFA = accumulatedCommission;
    writeJsonDb(jsonDb);
  }
}

/**
 * Grant subscription state back to account
 */
export async function updateUserSubscription(email: string, isSubscribed: boolean, type: 'PAID' | 'FREE_COMMISSION', endDate: string | null): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      await pool.query(
        "UPDATE btf_users SET is_subscribed = $1, subscription_type = $2, subscription_end_date = $3, updated_at = CURRENT_TIMESTAMP WHERE email = $4",
        [isSubscribed, type, endDate ? new Date(endDate) : null, email]
      );
      return;
    } catch (err) {
      console.error("[BTF PG ERR] updateUserSubscription", err);
    }
  }

  // Fallback Database
  const jsonDb = readJsonDb();
  const usr = jsonDb.users[0];
  if (usr) {
    usr.isSubscribed = isSubscribed;
    usr.subscriptionType = type;
    usr.subscriptionEndDate = endDate || undefined;
    writeJsonDb(jsonDb);
  }
}

/**
 * Reset simulated balances to starter positions
 */
export async function resetUserAccount(email: string): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      await pool.query(
        `UPDATE btf_users SET 
          balance_fcfa = 1500000.0, 
          balance_usdt = 2500.0, 
          is_subscribed = false,
          subscription_type = 'PAID',
          subscription_end_date = NULL,
          accumulated_free_commission_fcfa = 0.0,
          updated_at = CURRENT_TIMESTAMP
         WHERE email = $1`,
        [email]
      );
      return;
    } catch (err) {
      console.error("[BTF PG ERR] resetUserAccount", err);
    }
  }

  // Fallback
  const jsonDb = readJsonDb();
  const usr = jsonDb.users[0];
  if (usr) {
    usr.balanceFCFA = 1500000;
    usr.balanceUSDT = 2500;
    usr.subscriptionEndDate = undefined;
    usr.isSubscribed = false;
    usr.subscriptionType = "PAID";
    usr.accumulatedFreeCommissionFCFA = 0;
    writeJsonDb(jsonDb);
  }
}

/**
 * Fetch orders ledger
 */
export async function getOrders(): Promise<TradeOrder[]> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const res = await pool.query("SELECT * FROM btf_orders ORDER BY timestamp DESC LIMIT 150");
      return res.rows.map(row => ({
        id: row.id,
        symbol: row.symbol,
        type: row.type as 'BUY' | 'SELL',
        price: Number(row.price),
        amount: Number(row.amount),
        totalFCFA: Number(row.total_fcfa),
        mode: row.mode as 'DEMO' | 'REAL',
        status: row.status as 'OPEN' | 'COMPLETED' | 'CANCELLED',
        stopLoss: Number(row.stop_loss),
        takeProfit: Number(row.take_profit),
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
        isAutonomous: row.is_autonomous,
        riskPercent: Number(row.risk_percent)
      }));
    } catch (err) {
      console.error("[BTF PG ERR] getOrders", err);
    }
  }

  const jsonDb = readJsonDb();
  return jsonDb.orders;
}

/**
 * Add a placed trade order
 */
export async function addOrder(order: TradeOrder): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO btf_orders (id, symbol, type, price, amount, total_fcfa, mode, status, stop_loss, take_profit, is_autonomous, risk_percent, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          order.id, order.symbol, order.type, order.price, order.amount, order.totalFCFA,
          order.mode, order.status, order.stopLoss, order.takeProfit, order.isAutonomous,
          order.riskPercent, new Date(order.timestamp)
        ]
      );
      return;
    } catch (err) {
      console.error("[BTF PG ERR] addOrder", err);
    }
  }

  // Fallback Database
  const jsonDb = readJsonDb();
  jsonDb.orders.unshift(order);
  writeJsonDb(jsonDb);
}

/**
 * Reverse or cancel order via veto
 */
export async function cancelOrderVeto(orderId: string): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      await pool.query("UPDATE btf_orders SET status = 'CANCELLED' WHERE id = $1", [orderId]);
      return;
    } catch (err) {
      console.error("[BTF PG ERR] cancelOrderVeto", err);
    }
  }

  // Fallback
  const jsonDb = readJsonDb();
  const found = jsonDb.orders.find(o => o.id === orderId);
  if (found) {
    found.status = "CANCELLED";
    writeJsonDb(jsonDb);
  }
}

/**
 * Fetch physical market reports
 */
export async function getPhysicalReports(onlyPublished = true): Promise<PhysicalMarketReport[]> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const query = onlyPublished 
        ? "SELECT * FROM btf_physical_reports WHERE status = 'PUBLISHED' ORDER BY created_at DESC"
        : "SELECT * FROM btf_physical_reports ORDER BY created_at DESC";
      const res = await pool.query(query);
      return res.rows.map(row => ({
        id: row.id,
        corridor: row.corridor,
        product: row.product,
        scarcityIndex: Number(row.scarcity_index),
        trend: row.trend as 'UP' | 'DOWN' | 'STABLE',
        observedPriceFCFA: Number(row.observed_price_fcfa),
        unit: row.unit,
        description: row.description || "",
        status: row.status as 'PENDING' | 'PUBLISHED',
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
      }));
    } catch (err) {
      console.error("[BTF PG ERR] getPhysicalReports", err);
    }
  }

  const jsonDb = readJsonDb();
  if (onlyPublished) {
    return jsonDb.reports.filter(r => r.status === "PUBLISHED");
  }
  return jsonDb.reports;
}

/**
 * Add field logistial report
 */
export async function addPhysicalReport(report: PhysicalMarketReport): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO btf_physical_reports (id, corridor, product, scarcity_index, trend, observed_price_fcfa, unit, description, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          report.id, report.corridor, report.product, report.scarcityIndex, report.trend,
          report.observedPriceFCFA, report.unit, report.description, report.status, new Date(report.createdAt)
        ]
      );
      return;
    } catch (err) {
      console.error("[BTF PG ERR] addPhysicalReport", err);
    }
  }

  // Fallback
  const jsonDb = readJsonDb();
  jsonDb.reports.unshift(report);
  writeJsonDb(jsonDb);
}

/**
 * Fetch analyzed insights (Gemini News Scan)
 */
export async function getSentimentAnalyses(): Promise<SentimentAnalysis[]> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const res = await pool.query("SELECT * FROM btf_sentiments ORDER BY timestamp DESC LIMIT 50");
      return res.rows.map(row => ({
        id: row.id,
        source: row.source,
        entity: row.entity,
        sentimentScore: Number(row.sentiment_score),
        summary: row.summary,
        impactOnTrading: row.impact_on_trading,
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()
      }));
    } catch (err) {
      console.error("[BTF PG ERR] getSentimentAnalyses", err);
    }
  }

  const jsonDb = readJsonDb();
  return jsonDb.sentiments;
}

/**
 * Save new AI Scanned News item
 */
export async function addSentimentAnalyses(items: SentimentAnalysis[]): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      for (const item of items) {
        await pool.query(
          `INSERT INTO btf_sentiments (id, source, entity, sentiment_score, summary, impact_on_trading, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [item.id, item.source, item.entity, item.sentimentScore, item.summary, item.impactOnTrading, new Date(item.timestamp)]
        );
      }
      return;
    } catch (err) {
      console.error("[BTF PG ERR] addSentimentAnalyses", err);
    }
  }

  // Fallback
  const jsonDb = readJsonDb();
  jsonDb.sentiments = [...items, ...jsonDb.sentiments].slice(0, 30);
  writeJsonDb(jsonDb);
}

/**
 * Get all payment requests
 */
export async function getPayments(): Promise<PaymentRequest[]> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const res = await pool.query("SELECT * FROM btf_payments ORDER BY timestamp DESC LIMIT 200");
      return res.rows.map(row => ({
        id: row.id,
        email: row.email,
        operator: row.operator,
        transactionId: row.transaction_id,
        amount: Number(row.amount),
        phoneSender: row.phone_sender,
        proofDetails: row.proof_details || "",
        status: row.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()
      }));
    } catch (err) {
      console.error("[BTF PG ERR] getPayments", err);
    }
  }

  const jsonDb = readJsonDb();
  return jsonDb.payments;
}

/**
 * Add SaaS Transfer Payment proof
 */
export async function addPayment(pay: PaymentRequest): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO btf_payments (id, email, operator, transaction_id, amount, phone_sender, proof_details, status, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [pay.id, pay.email, pay.operator, pay.transactionId, pay.amount, pay.phoneSender, pay.proofDetails, pay.status, new Date(pay.timestamp)]
      );
      return;
    } catch (err) {
      console.error("[BTF PG ERR] addPayment", err);
    }
  }

  // Fallback
  const jsonDb = readJsonDb();
  jsonDb.payments.unshift(pay);
  writeJsonDb(jsonDb);
}

/**
 * Update payment approval state
 */
export async function updatePaymentStatus(paymentId: string, status: 'APPROVED' | 'REJECTED'): Promise<PaymentRequest | null> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const res = await pool.query(
        "UPDATE btf_payments SET status = $1 WHERE id = $2 RETURNING *",
        [status, paymentId]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          email: row.email,
          operator: row.operator,
          transactionId: row.transaction_id,
          amount: Number(row.amount),
          phoneSender: row.phone_sender,
          proofDetails: row.proof_details || "",
          status: row.status as 'PENDING' | 'APPROVED' | 'REJECTED',
          timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()
        };
      }
    } catch (err) {
      console.error("[BTF PG ERR] updatePaymentStatus", err);
    }
  }

  // Fallback
  const jsonDb = readJsonDb();
  const found = jsonDb.payments.find(p => p.id === paymentId);
  if (found) {
    found.status = status;
    writeJsonDb(jsonDb);
    return found;
  }
  return null;
}

/**
 * Retrieve firewall risk records
 */
export async function getSecurityLogs(): Promise<SecurityLog[]> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      const res = await pool.query("SELECT * FROM btf_security_logs ORDER BY timestamp DESC LIMIT 200");
      return res.rows.map(row => ({
        id: row.id,
        action: row.action,
        ip: row.ip,
        details: row.details || "",
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
        severity: row.severity as 'INFO' | 'WARNING' | 'CRITICAL'
      }));
    } catch (err) {
      console.error("[BTF PG ERR] getSecurityLogs", err);
    }
  }

  const jsonDb = readJsonDb();
  return jsonDb.logs;
}

/**
 * Record firewall detection incident
 */
export async function addSecurityLog(log: SecurityLog): Promise<void> {
  if (isPostgresActive) {
    try {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO btf_security_logs (id, action, ip, details, severity, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [log.id, log.action, log.ip, log.details, log.severity, new Date(log.timestamp)]
      );
      return;
    } catch (err) {
      console.error("[BTF PG ERR] addSecurityLog", err);
    }
  }

  // Fallback
  const jsonDb = readJsonDb();
  jsonDb.logs.unshift(log);
  if (jsonDb.logs.length > 200) {
    jsonDb.logs = jsonDb.logs.slice(0, 200);
  }
  writeJsonDb(jsonDb);
}

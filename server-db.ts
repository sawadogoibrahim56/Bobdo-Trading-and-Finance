/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from "pg";
import { SystemState, TradeOrder, PhysicalMarketReport, SentimentAnalysis, PaymentRequest, SecurityLog } from "./src/types";

const { Pool } = pg;

// Connection Pool initialization holds reference to either database pool, or null
let pool: pg.Pool | null = null;
export let isRemoteDbConnected = false;

// Initialize PostgreSQL pool under secure SSL mode
export function initPostgresPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("[BTF DATABASE] No DATABASE_URL set. Running exclusively on secure local JSON engine.");
    isRemoteDbConnected = false;
    return null;
  }

  try {
    const useSSL = process.env.DATABASE_SSL !== "false";
    pool = new Pool({
      connectionString,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    isRemoteDbConnected = true;
    console.log("[BTF DATABASE] PostgreSQL connection pool initialized successfully.");
    return pool;
  } catch (err) {
    console.error("[BTF DATABASE] Fatal pool creation error: ", err);
    isRemoteDbConnected = false;
    pool = null;
    return null;
  }
}

// Bootstrap PostgreSQL schemas & tables autonomously on start
export async function bootstrapSchema() {
  if (!pool) return false;

  const client = await pool.connect();
  try {
    console.log("[BTF DATABASE] Actially checking and creating tables if they do not exist...");
    
    // Begin TRANSACTION
    await client.query("BEGIN;");

    // 1. System overall states
    await client.query(`
      CREATE TABLE IF NOT EXISTS btf_system_state (
        id VARCHAR(50) PRIMARY KEY,
        is_veto_active BOOLEAN NOT NULL DEFAULT FALSE,
        daily_drawdown_limit_reached BOOLEAN NOT NULL DEFAULT FALSE,
        total_volume_traded_fcfa NUMERIC NOT NULL DEFAULT 0,
        total_admin_commissions_usdt NUMERIC NOT NULL DEFAULT 0,
        admin_binance_withdraw_address TEXT,
        admin_referral_link TEXT
      );
    `);

    // 2. Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS btf_users (
        email VARCHAR(255) PRIMARY KEY,
        trial_start_date TEXT NOT NULL,
        is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
        subscription_end_date TEXT,
        subscription_type VARCHAR(50),
        balance_fcfa NUMERIC NOT NULL DEFAULT 0,
        balance_usdt NUMERIC NOT NULL DEFAULT 0,
        referral_code VARCHAR(100),
        referred_by VARCHAR(255),
        referral_earnings_fcfa NUMERIC NOT NULL DEFAULT 0,
        referral_count INT NOT NULL DEFAULT 0,
        accumulated_free_commission_fcfa NUMERIC NOT NULL DEFAULT 0,
        api_keys JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);

    // 3. Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS btf_orders (
        id VARCHAR(100) PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL,
        price NUMERIC NOT NULL,
        amount NUMERIC NOT NULL,
        total_fcfa TEXT,
        mode VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        stop_loss NUMERIC,
        take_profit NUMERIC,
        timestamp TEXT NOT NULL,
        is_autonomous BOOLEAN NOT NULL DEFAULT FALSE,
        risk_percent NUMERIC NOT NULL DEFAULT 0,
        user_email VARCHAR(255) DEFAULT 'ibsawadogo54@gmail.com'
      );
    `);

    // Ensure table has the column if already created
    await client.query(`
      ALTER TABLE btf_orders ADD COLUMN IF NOT EXISTS user_email VARCHAR(255) DEFAULT 'ibsawadogo54@gmail.com';
    `);

    // 4. Scanned reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS btf_reports (
        id VARCHAR(100) PRIMARY KEY,
        corridor VARCHAR(255) NOT NULL,
        product VARCHAR(255) NOT NULL,
        scarcity_index INT NOT NULL DEFAULT 50,
        trend VARCHAR(50) NOT NULL,
        observed_price_fcfa NUMERIC NOT NULL,
        unit VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // 5. AI Sentiments
    await client.query(`
      CREATE TABLE IF NOT EXISTS btf_sentiments (
        id VARCHAR(100) PRIMARY KEY,
        source VARCHAR(255) NOT NULL,
        entity VARCHAR(255) NOT NULL,
        sentiment_score NUMERIC NOT NULL,
        summary TEXT,
        impact_on_trading TEXT,
        timestamp TEXT NOT NULL
      );
    `);

    // 6. Payments histories
    await client.query(`
      CREATE TABLE IF NOT EXISTS btf_payments (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        operator VARCHAR(100) NOT NULL,
        transaction_id VARCHAR(100) NOT NULL,
        amount NUMERIC NOT NULL,
        phone_sender VARCHAR(50) NOT NULL,
        proof_details TEXT,
        status VARCHAR(50) NOT NULL,
        timestamp TEXT NOT NULL
      );
    `);

    // 7. Physical Firewalls / Security logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS btf_logs (
        id VARCHAR(100) PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        ip VARCHAR(50) NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL
      );
    `);

    await client.query("COMMIT;");
    console.log("[BTF DATABASE] DB Schema validation and creation completed successfully.");
    return true;
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("[BTF DATABASE] Fatal schema creation error: ", err);
    return false;
  } finally {
    client.release();
  }
}

// Loads whole db from PostgreSQL
export async function loadStateFromPostgres(): Promise<SystemState | null> {
  if (!pool) return null;

  try {
    const client = await pool.connect();
    try {
      // 1. Get system config row
      const configRes = await client.query("SELECT * FROM btf_system_state WHERE id = 'main'");
      
      // 2. Get users
      const usersRes = await client.query("SELECT * FROM btf_users");

      // Check if DB is completely empty. If no user, trigger seeding
      if (usersRes.rows.length === 0) {
        client.release();
        return null;
      }

      // 3. Get orders (limit 300 to prevent oversized states)
      const ordersRes = await client.query("SELECT * FROM btf_orders ORDER BY timestamp DESC LIMIT 300");

      // 4. Get reports
      const reportsRes = await client.query("SELECT * FROM btf_reports ORDER BY created_at DESC LIMIT 300");

      // 5. Get sentiments
      const sentimentsRes = await client.query("SELECT * FROM btf_sentiments ORDER BY timestamp DESC LIMIT 100");

      // 6. Get payments
      const paymentsRes = await client.query("SELECT * FROM btf_payments ORDER BY timestamp DESC LIMIT 200");

      // 7. Get logs
      const logsRes = await client.query("SELECT * FROM btf_logs ORDER BY timestamp DESC LIMIT 200");

      const sysRow = configRes.rows[0] || {};

      // Transform rows back into client format
      const users = usersRes.rows.map(row => ({
        email: row.email,
        trialStartDate: row.trial_start_date,
        isSubscribed: row.is_subscribed,
        subscriptionEndDate: row.subscription_end_date,
        subscriptionType: row.subscription_type,
        balanceFCFA: parseFloat(row.balance_fcfa),
        balanceUSDT: parseFloat(row.balance_usdt),
        referralCode: row.referral_code,
        referredBy: row.referred_by,
        referralEarningsFCFA: parseFloat(row.referral_earnings_fcfa),
        referralCount: row.referral_count,
        accumulatedFreeCommissionFCFA: parseFloat(row.accumulated_free_commission_fcfa),
        apiKeys: row.api_keys || {}
      }));

      const orders: TradeOrder[] = ordersRes.rows.map(row => ({
        id: row.id,
        symbol: row.symbol,
        type: row.type,
        price: parseFloat(row.price),
        amount: parseFloat(row.amount),
        totalFCFA: parseFloat(row.total_fcfa || "0"),
        mode: row.mode,
        status: row.status,
        stopLoss: parseFloat(row.stop_loss || "0"),
        takeProfit: parseFloat(row.take_profit || "0"),
        timestamp: row.timestamp,
        isAutonomous: row.is_autonomous,
        riskPercent: parseFloat(row.risk_percent || "0"),
        userEmail: row.user_email || "ibsawadogo54@gmail.com"
      }));

      const reports: PhysicalMarketReport[] = reportsRes.rows.map(row => ({
        id: row.id,
        corridor: row.corridor,
        product: row.product,
        scarcityIndex: row.scarcity_index,
        trend: row.trend,
        observedPriceFCFA: parseFloat(row.observed_price_fcfa),
        unit: row.unit,
        description: row.description,
        status: row.status,
        createdAt: row.created_at
      }));

      const sentiments: SentimentAnalysis[] = sentimentsRes.rows.map(row => ({
        id: row.id,
        source: row.source,
        entity: row.entity,
        sentimentScore: parseFloat(row.sentiment_score),
        summary: row.summary,
        impactOnTrading: row.impact_on_trading,
        timestamp: row.timestamp
      }));

      const payments: PaymentRequest[] = paymentsRes.rows.map(row => ({
        id: row.id,
        email: row.email,
        operator: row.operator,
        transactionId: row.transaction_id,
        amount: parseFloat(row.amount),
        phoneSender: row.phone_sender,
        proofDetails: row.proof_details,
        status: row.status,
        timestamp: row.timestamp
      }));

      const logs: SecurityLog[] = logsRes.rows.map(row => ({
        id: row.id,
        action: row.action,
        ip: row.ip,
        details: row.details,
        timestamp: row.timestamp,
        severity: row.severity
      }));

      console.log(`[BTF DATABASE] Data loaded successfully from remote PostgreSQL: ${users.length} users, ${orders.length} orders.`);

      return {
        users,
        orders,
        reports,
        sentiments,
        payments,
        logs,
        isVetoActive: sysRow.is_veto_active !== undefined ? sysRow.is_veto_active : false,
        dailyDrawdownLimitReached: sysRow.daily_drawdown_limit_reached !== undefined ? sysRow.daily_drawdown_limit_reached : false,
        totalVolumeTradedFCFA: parseFloat(sysRow.total_volume_traded_fcfa || "2110000"),
        totalAdminCommissionsUSDT: parseFloat(sysRow.total_admin_commissions_usdt || "125.00"),
        adminBinanceWithdrawAddress: sysRow.admin_binance_withdraw_address || "TYJpqo78QndhXswZ69YgsaA31V (TRC-20)",
        adminReferralLink: sysRow.admin_referral_link || "https://accounts.binance.com/register?ref=BTF_772W"
      } as SystemState;

    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[BTF DATABASE] FAILED loading system state from PostgreSQL, fallback will be used:", err);
    return null;
  }
}

// Background upsert of full state to remote PostgreSQL
export async function saveStateToPostgres(state: SystemState): Promise<boolean> {
  if (!pool) return false;

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

      // 1. System state config
      await client.query(`
        INSERT INTO btf_system_state (
          id, is_veto_active, daily_drawdown_limit_reached, total_volume_traded_fcfa, 
          total_admin_commissions_usdt, admin_binance_withdraw_address, admin_referral_link
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          is_veto_active = EXCLUDED.is_veto_active,
          daily_drawdown_limit_reached = EXCLUDED.daily_drawdown_limit_reached,
          total_volume_traded_fcfa = EXCLUDED.total_volume_traded_fcfa,
          total_admin_commissions_usdt = EXCLUDED.total_admin_commissions_usdt,
          admin_binance_withdraw_address = EXCLUDED.admin_binance_withdraw_address,
          admin_referral_link = EXCLUDED.admin_referral_link
      `, [
        "main",
        state.isVetoActive,
        state.dailyDrawdownLimitReached,
        state.totalVolumeTradedFCFA,
        state.totalAdminCommissionsUSDT || 125.00,
        state.adminBinanceWithdrawAddress || "TYJpqo78QndhXswZ69YgsaA31V (TRC-20)",
        state.adminReferralLink || "https://accounts.binance.com/register?ref=BTF_772W"
      ]);

      // 2. Users upsert
      for (const u of state.users) {
        await client.query(`
          INSERT INTO btf_users (
            email, trial_start_date, is_subscribed, subscription_end_date, subscription_type,
            balance_fcfa, balance_usdt, referral_code, referred_by, referral_earnings_fcfa,
            referral_count, accumulated_free_commission_fcfa, api_keys
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (email) DO UPDATE SET
            trial_start_date = EXCLUDED.trial_start_date,
            is_subscribed = EXCLUDED.is_subscribed,
            subscription_end_date = EXCLUDED.subscription_end_date,
            subscription_type = EXCLUDED.subscription_type,
            balance_fcfa = EXCLUDED.balance_fcfa,
            balance_usdt = EXCLUDED.balance_usdt,
            referral_code = EXCLUDED.referral_code,
            referred_by = EXCLUDED.referred_by,
            referral_earnings_fcfa = EXCLUDED.referral_earnings_fcfa,
            referral_count = EXCLUDED.referral_count,
            accumulated_free_commission_fcfa = EXCLUDED.accumulated_free_commission_fcfa,
            api_keys = EXCLUDED.api_keys
        `, [
          u.email,
          u.trialStartDate,
          u.isSubscribed,
          u.subscriptionEndDate || null,
          u.subscriptionType || "PAID",
          u.balanceFCFA,
          u.balanceUSDT,
          u.referralCode || "SESS54OBD",
          u.referredBy || null,
          u.referralEarningsFCFA || 0,
          u.referralCount || 0,
          u.accumulatedFreeCommissionFCFA || 0,
          JSON.stringify(u.apiKeys || {})
        ]);
      }

      // 3. Orders upsert
      // Only keep and store up to 300 orders in remote database
      const orderBatch = state.orders.slice(0, 300);
      for (const o of orderBatch) {
        await client.query(`
          INSERT INTO btf_orders (
            id, symbol, type, price, amount, total_fcfa, mode, status,
            stop_loss, take_profit, timestamp, is_autonomous, risk_percent, user_email
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO NOTHING
        `, [
          o.id, o.symbol, o.type, o.price, o.amount, o.totalFCFA?.toString(), o.mode, o.status,
          o.stopLoss, o.takeProfit, o.timestamp, o.isAutonomous, o.riskPercent, o.userEmail || "ibsawadogo54@gmail.com"
        ]);
      }

      // 4. Reports upsert
      const reportBatch = state.reports.slice(0, 200);
      for (const r of reportBatch) {
        await client.query(`
          INSERT INTO btf_reports (
            id, corridor, product, scarcity_index, trend, observed_price_fcfa,
            unit, description, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status
        `, [
          r.id, r.corridor, r.product, r.scarcityIndex, r.trend, r.observedPriceFCFA,
          r.unit, r.description, r.status, r.createdAt
        ]);
      }

      // 5. Sentiments upsert
      const sentBatch = state.sentiments.slice(0, 100);
      for (const s of sentBatch) {
        await client.query(`
          INSERT INTO btf_sentiments (
            id, source, entity, sentiment_score, summary, impact_on_trading, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [
          s.id, s.source, s.entity, s.sentimentScore, s.summary, s.impactOnTrading, s.timestamp
        ]);
      }

      // 6. Payments upsert
      const payBatch = state.payments.slice(0, 200);
      for (const p of payBatch) {
        await client.query(`
          INSERT INTO btf_payments (
            id, email, operator, transaction_id, amount, phone_sender, proof_details, status, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status
        `, [
          p.id, p.email, p.operator, p.transactionId, p.amount, p.phoneSender, p.proofDetails, p.status, p.timestamp
        ]);
      }

      // 7. Firewalls/Security Logs upsert
      const logBatch = state.logs.slice(0, 200);
      for (const l of logBatch) {
        await client.query(`
          INSERT INTO btf_logs (
            id, action, ip, details, timestamp, severity
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `, [
          l.id, l.action, l.ip, l.details, l.timestamp, l.severity
        ]);
      }

      await client.query("COMMIT;");
      return true;
    } catch (err) {
      await client.query("ROLLBACK;");
      console.error("[BTF DATABASE] FAILED committing transactions to Postgres:", err);
      return false;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[BTF DATABASE] Pool connectivity error back-storing state:", err);
    return false;
  }
}

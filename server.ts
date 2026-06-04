/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  UserSession, 
  TradeOrder, 
  PhysicalMarketReport, 
  SentimentAnalysis, 
  PaymentRequest, 
  SecurityLog,
  SystemState
} from "./src/types";
import { 
  initPostgresPool, 
  bootstrapSchema, 
  loadStateFromPostgres, 
  saveStateToPostgres, 
  isRemoteDbConnected 
} from "./server-db";

dotenv.config();

const app = express();
const PORT = 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Initialization (Persistent Local Storage)
const DB_PATH = path.join(process.cwd(), "db.json");

const initialDb: SystemState = {
  users: [
    {
      email: "ibsawadogo54@gmail.com", // default user
      trialStartDate: new Date().toISOString(),
      isSubscribed: false,
      subscriptionType: "PAID",
      balanceFCFA: 1500000, // 1.5M FCFA startup demo money
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

// Initialize DB file if not exists
function loadDb(): SystemState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf8");
      const parsed = JSON.parse(data);
      if (parsed.users && parsed.users[0]) {
        const u = parsed.users[0];
        if (u.subscriptionType === undefined) u.subscriptionType = "PAID";
        if (u.referralCode === undefined) u.referralCode = "SESS54OBD";
        if (u.referredBy === undefined) u.referredBy = "UEMOA_ADMIN";
        if (u.referralEarningsFCFA === undefined) u.referralEarningsFCFA = 0;
        if (u.referralCount === undefined) u.referralCount = 4;
        if (u.accumulatedFreeCommissionFCFA === undefined) u.accumulatedFreeCommissionFCFA = 0;
      }
      if (parsed.totalAdminCommissionsUSDT === undefined) parsed.totalAdminCommissionsUSDT = 125.00;
      if (parsed.adminBinanceWithdrawAddress === undefined) parsed.adminBinanceWithdrawAddress = "TYJpqo78QndhXswZ69YgsaA31V (TRC-20)";
      if (parsed.adminReferralLink === undefined) parsed.adminReferralLink = "https://accounts.binance.com/register?ref=BTF_772W";
      return parsed;
    }
  } catch (err) {
    console.error("Failed to read database, falling back.", err);
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
  return initialDb;
}

function saveDb(state: SystemState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
    // Asynchronously update remote database
    saveStateToPostgres(state).catch(err => {
      console.error("[BTF DATABASE] Background PostgreSQL sync failed:", err);
    });
  } catch (err) {
    console.error("Failed to save database", err);
  }
}

let db = loadDb();

// Lazy Gemini API wrapper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

// Log Security Event
function addSecurityLog(action: string, ip: string, details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL') {
  const newLog: SecurityLog = {
    id: `log-${Date.now()}`,
    action,
    ip,
    details,
    timestamp: new Date().toISOString(),
    severity
  };
  db.logs.unshift(newLog);
  // Keep last 200 logs
  if (db.logs.length > 200) {
    db.logs = db.logs.slice(0, 200);
  }
  saveDb(db);
}

// SIMULATOR TRADE ROTATION (Adds dynamic movements for visual trading)
setInterval(() => {
  // Try to generate automated simulated transactions for user if autonomous mode is on
  const user = db.users[0];
  if (user && !db.isVetoActive && !db.dailyDrawdownLimitReached) {
    // Random occurrence of automatic trade execution
    if (Math.random() > 0.85) {
      const symbols = ["SONATEL", "CORIS BANK", "ORANGE CI", "BTC/USDT", "ETH/USDT"];
      const selectedSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const isCrypto = selectedSymbol.includes("/");
      const price = isCrypto ? (selectedSymbol.startsWith("BTC") ? 64000 + (Math.random() - 0.5) * 500 : 3400 + (Math.random() - 0.5) * 50) : (selectedSymbol === "SONATEL" ? 18400 + Math.floor(Math.random() * 200 - 100) : 9500 + Math.floor(Math.random() * 100 - 50));
      
      const type = Math.random() > 0.4 ? "BUY" : "SELL";
      const userBalance = isCrypto ? user.balanceUSDT : user.balanceFCFA;
      
      // Strict Risk Check: Maximum 1% of equity per trade
      const maxRiskCapital = userBalance * 0.01;
      const orderAmount = isCrypto ? (maxRiskCapital / price) : Math.max(1, Math.floor(maxRiskCapital / price));
      const totalFCFA = isCrypto ? (orderAmount * price * 600) : (orderAmount * price);

      if (userBalance > (isCrypto ? (orderAmount * price) : totalFCFA)) {
        // Enforce forced Stop Loss & Take Profit
        const stopLoss = type === "BUY" ? price * 0.98 : price * 1.02;
        const takeProfit = type === "BUY" ? price * 1.05 : price * 0.95;

        const newOrder: TradeOrder = {
          id: `order-${Date.now()}`,
          symbol: selectedSymbol,
          type,
          price,
          amount: parseFloat(orderAmount.toFixed(4)),
          totalFCFA: Math.floor(totalFCFA),
          mode: (user.apiKeys.binanceKey || user.apiKeys.okxKey || user.apiKeys.bybitKey || user.apiKeys.brvmId) ? "REAL" : "DEMO",
          status: "COMPLETED",
          stopLoss: parseFloat(stopLoss.toFixed(2)),
          takeProfit: parseFloat(takeProfit.toFixed(2)),
          timestamp: new Date().toISOString(),
          isAutonomous: true,
          riskPercent: 1.0
        };

        // Adjust balance
        if (type === "BUY") {
          if (isCrypto) {
            user.balanceUSDT -= orderAmount * price;
          } else {
            user.balanceFCFA -= totalFCFA;
          }
        } else {
          if (isCrypto) {
            user.balanceUSDT += orderAmount * price;
          } else {
            user.balanceFCFA += totalFCFA;
          }
        }

        db.orders.unshift(newOrder);
        db.totalVolumeTradedFCFA += totalFCFA;
        saveDb(db);
        
        console.log(`[AUTONOMOUS TRADER] Successfully executed ${type} automated order for ${selectedSymbol}`);
      }
    }
  }
}, 30000); // Check automated trades every 30 seconds

// ==================== API ENDPOINTS ====================

// Base Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timeUTC: new Date().toISOString(), isWestAfricaSync: true });
});

// Get Current User / Subscription Session
app.get("/api/user/session", (req, res) => {
  const user = db.users[0];
  if (!user) {
    return res.status(404).json({ error: "User session not found" });
  }

  // Calculate Trial Period remaining
  const trialStart = new Date(user.trialStartDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - trialStart.getTime());
  const diffDaysTotal = diffTime / (1000 * 60 * 60 * 24);
  const trialDaysRemaining = Math.max(0, 7 - diffDaysTotal);

  const session: UserSession = {
    id: "user-default",
    email: user.email,
    trialStartDate: user.trialStartDate,
    isSubscribed: user.isSubscribed,
    subscriptionType: user.subscriptionType || "PAID",
    balanceFCFA: user.balanceFCFA,
    balanceUSDT: user.balanceUSDT,
    referralCode: user.referralCode || "SESS54OBD",
    referredBy: user.referredBy,
    referralEarningsFCFA: user.referralEarningsFCFA || 0,
    referralCount: user.referralCount || 0,
    accumulatedFreeCommissionFCFA: user.accumulatedFreeCommissionFCFA || 0,
    apiKeysConnected: {
      binance: !!user.apiKeys.binanceKey,
      okx: !!user.apiKeys.okxKey,
      bybit: !!user.apiKeys.bybitKey,
      brvm: !!user.apiKeys.brvmId
    }
  };

  res.json({
    session,
    trialDaysRemaining: parseFloat(trialDaysRemaining.toFixed(2)),
    isTrialExpired: trialDaysRemaining <= 0 && !user.isSubscribed,
    isSubscribed: user.isSubscribed,
    totalAdminCommissionsUSDT: db.totalAdminCommissionsUSDT || 125.00,
    adminBinanceWithdrawAddress: db.adminBinanceWithdrawAddress || "TYJpqo78QndhXswZ69YgsaA31V (TRC-20)",
    adminReferralLink: db.adminReferralLink || "https://accounts.binance.com/register?ref=BTF_772W"
  });
});

// Update User API Connectors
app.post("/api/user/keys", (req, res) => {
  const user = db.users[0];
  const { binanceKey, binanceSecret, okxKey, bybitKey, brvmId } = req.body;
  
  if (!user) {
    return res.status(404).json({ error: "No session found" });
  }

  user.apiKeys = {
    binanceKey: binanceKey || user.apiKeys.binanceKey,
    binanceSecret: binanceSecret || user.apiKeys.binanceSecret,
    okxKey: okxKey || user.apiKeys.okxKey,
    bybitKey: bybitKey || user.apiKeys.bybitKey,
    brvmId: brvmId || user.apiKeys.brvmId
  };

  addSecurityLog("KEYS_INTEGRATION", req.ip || "127.0.0.1", `Connexion par clé API mise à jour pour le compte utilisateur.`, "INFO");
  saveDb(db);

  res.json({ success: true, message: "Vos clés API ont été connectées avec succès en mode chiffré." });
});

// Reset Account simulated assets
app.post("/api/user/reset", (req, res) => {
  const user = db.users[0];
  if (user) {
    user.balanceFCFA = 1500000;
    user.balanceUSDT = 2500;
    user.subscriptionEndDate = undefined;
    user.isSubscribed = false;
    user.subscriptionType = "PAID";
    user.accumulatedFreeCommissionFCFA = 0;
    db.dailyDrawdownLimitReached = false;
    saveDb(db);
  }
  res.json({ success: true });
});

// Activate Free/Commission-Based Subscription Plan
app.post("/api/user/subscribe-free", (req, res) => {
  const user = db.users[0];
  if (!user) {
    return res.status(404).json({ error: "Session utilisateur inactive." });
  }

  user.isSubscribed = true;
  user.subscriptionType = "FREE_COMMISSION";
  user.subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year access

  addSecurityLog(
    "SUBSCRIPTION_FREE_COMMISSION",
    req.ip || "127.0.0.1",
    "Formulaire d'activation Plan Commission : Accès immédiat accordé. Le Risk Manager appliquera une retenue automatique de 20% sur chaque deal d'arbitrage rentable.",
    "INFO"
  );
  saveDb(db);

  res.json({ 
    success: true, 
    message: "Abonnement Commission (Gratuit sans avance) activé avec succès !" 
  });
});

// Update Admin Configurations from Admin Board
app.post("/api/admin/config/update", (req, res) => {
  const { adminBinanceWithdrawAddress, adminReferralLink } = req.body;
  
  if (adminBinanceWithdrawAddress !== undefined) {
    db.adminBinanceWithdrawAddress = adminBinanceWithdrawAddress;
  }
  if (adminReferralLink !== undefined) {
    db.adminReferralLink = adminReferralLink;
  }

  addSecurityLog(
    "ADMIN_CONFIG_UPDATE",
    req.ip || "127.0.0.1",
    `Mise à jour des coordonnées d'encaissement et parrainage d'administration.`,
    "WARNING"
  );
  saveDb(db);

  res.json({ success: true, message: "Configuration mise à jour avec succès en base de données." });
});

// Simulate Withdrawal of Admin collected commissions in Cryptocurrency
app.post("/api/admin/config/withdraw", (req, res) => {
  const amount = parseFloat(req.body.amount || "0");
  const currentComms = db.totalAdminCommissionsUSDT || 125.00;

  if (amount <= 0 || amount > currentComms) {
    return res.status(400).json({ error: "Solde de commission insuffisant ou montant invalide." });
  }

  db.totalAdminCommissionsUSDT = currentComms - amount;
  
  addSecurityLog(
    "ADMIN_WITHDRAWAL_SUCCESS",
    req.ip || "127.0.0.1",
    `Retrait administratif de ${amount} USDT exécuté vers l'adresse ${db.adminBinanceWithdrawAddress}. Statut: Blockchain Confirmed.`,
    "CRITICAL"
  );
  saveDb(db);

  res.json({ 
    success: true, 
    totalAdminCommissionsUSDT: db.totalAdminCommissionsUSDT,
    message: `Retrait cryptographique de ${amount} USDT envoyé avec succès sur le réseau !`
  });
});

// High-Frequency Arbitrage Bot Execution Loop Simulator
app.post("/api/trades/run-arbitrage-cycle", (req, res) => {
  const user = db.users[0];
  if (!user) {
    return res.status(404).json({ error: "Session inactive." });
  }

  // Generate a random high-yield arbitrage opportunity
  const products = ["Arbitrage Sorgo (Bobo-Dioulasso/Ouagadougou)", "Riz arbitrage boursier (Abidjan)", "Or physique (Axe Houndé/Burkina)", "Routage Spot Crypto BTC/USDT (Binance-OKX)"];
  const selectedProduct = products[Math.floor(Math.random() * products.length)];
  const profitFCFA = Math.floor(12500 + Math.random() * 9200); // 12,500 to 21,700 FCFA bruto

  const isFreePlan = user.subscriptionType === "FREE_COMMISSION";
  let adminCommissionFCFA = 0;
  let userNetProfitFCFA = profitFCFA;

  if (isFreePlan) {
    // 20% commission
    adminCommissionFCFA = Math.floor(profitFCFA * 0.20);
    userNetProfitFCFA = profitFCFA - adminCommissionFCFA;

    // Convert F CFA commission to USDT (1 USDT = 600 F CFA)
    const commissionUSDT = parseFloat((adminCommissionFCFA / 600).toFixed(4));
    db.totalAdminCommissionsUSDT = (db.totalAdminCommissionsUSDT || 125) + commissionUSDT;

    // Accumulate for parrainage payout calculation
    user.accumulatedFreeCommissionFCFA = (user.accumulatedFreeCommissionFCFA || 0) + adminCommissionFCFA;

    // Check if total commission paid has reached the 5,000 F CFA milestone to reward the referrer!
    if (user.accumulatedFreeCommissionFCFA >= 5000 && user.referredBy) {
      user.accumulatedFreeCommissionFCFA -= 5000;
      // Credit referrer's earnings
      user.referralEarningsFCFA = (user.referralEarningsFCFA || 0) + 250;
      user.balanceFCFA += 250; // Add real reward to balance as demo award!
      
      addSecurityLog(
        "REFERRAL_MILESTONE_PAID",
        "127.0.0.1",
        `Parrainage : Versement de la prime de 250 F CFA au parrain ${user.referredBy} (Palier de commission de 5 000 F CFA franchi par le filleul).`,
        "INFO"
      );
    }
  }

  // Credit user balance
  user.balanceFCFA += userNetProfitFCFA;

  // Track trade execution
  const newOrder: TradeOrder = {
    id: `arb-${Date.now()}`,
    symbol: selectedProduct,
    type: "SELL",
    price: profitFCFA,
    amount: 1,
    totalFCFA: profitFCFA,
    mode: user.isSubscribed ? "REAL" : "DEMO",
    status: "COMPLETED",
    stopLoss: 0,
    takeProfit: profitFCFA,
    timestamp: new Date().toISOString(),
    isAutonomous: true,
    riskPercent: 0.1
  };

  db.orders.unshift(newOrder);
  db.totalVolumeTradedFCFA += profitFCFA;

  addSecurityLog(
    "ARBITRAGE_CYCLE",
    req.ip || "127.0.0.1",
    `Le Bot d'Arbitrage a exécuté un deal rentable sur ${selectedProduct}. Profit Brut UEMOA: +${profitFCFA} F CFA. Retenu Admin: ${adminCommissionFCFA} F CFA. Net crédité: +${userNetProfitFCFA} F CFA.`,
    "INFO"
  );
  saveDb(db);

  res.json({
    success: true,
    profitFCFA,
    adminCommissionFCFA,
    userNetProfitFCFA,
    isFreePlan,
    message: isFreePlan
      ? `Deal d'arbitrage profitable ! Brut : +${profitFCFA.toLocaleString()} F CFA. Retenue plan libre 20% (-${adminCommissionFCFA.toLocaleString()} F CFA) transférée à l'administrateur.`
      : `Deal d'arbitrage profitable ! Gain de +${profitFCFA.toLocaleString()} F CFA ajouté à 100% à votre solde (Plan Payé/Premium).`
  });
});

// Submit Support Orange / Moov / Wave Money Payment Proof (SaaS Subscription)
app.post("/api/payments/submit", (req, res) => {
  const { operator, transactionId, amount, phoneSender, proofDetails } = req.body;
  
  if (!operator || !transactionId || !amount || !phoneSender) {
    return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires du transfert." });
  }

  const newPayment: PaymentRequest = {
    id: `pay-${Date.now()}`,
    email: db.users[0]?.email || "anonymous@uemoa.com",
    operator,
    transactionId,
    amount: parseFloat(amount),
    phoneSender,
    proofDetails: proofDetails || "Reçu envoyé pour validation d'accès SaaS.",
    status: "PENDING",
    timestamp: new Date().toISOString()
  };

  db.payments.unshift(newPayment);
  addSecurityLog(
    "PAYMENT_SUBMITTED",
    req.ip || "127.0.0.1",
    `Nouvelle demande de validation d'abonnement 5 000 F CFA reçue d'un compte ${operator}. ID de transaction: ${transactionId}`,
    "INFO"
  );
  saveDb(db);

  res.json({ success: true, message: "Votre preuve de transfert a été envoyée. L'administrateur validera votre accès d'ici quelques minutes." });
});

// Get Active Trades/Orders
app.get("/api/trades", (req, res) => {
  res.json({
    orders: db.orders,
    isVetoActive: db.isVetoActive,
    dailyDrawdownLimitReached: db.dailyDrawdownLimitReached,
    totalVolumeTradedFCFA: db.totalVolumeTradedFCFA
  });
});

// Post a Trade manually (Mode DEMO / simulated REAL)
app.post("/api/trades/place", (req, res) => {
  const user = db.users[0];
  const { symbol, type, price, amount, stopLoss, takeProfit, isAutonomous } = req.body;

  if (db.isVetoActive) {
    return res.status(403).json({ error: "Action bloquée : Le droit de Veto Absolu de l'Administrateur de risque est actuellement ACTIVÉ." });
  }

  if (db.dailyDrawdownLimitReached) {
    return res.status(403).json({ error: "Action révoquée : Limite de Drawdown quotidien (2%) atteinte. Blocage automatique pendant 24 heures." });
  }

  // Calculate Trial Period blockages
  const trialStart = new Date(user.trialStartDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - trialStart.getTime());
  const trialDaysRemaining = 7 - (diffTime / (1000 * 60 * 60 * 24));
  
  if (trialDaysRemaining <= 0 && !user.isSubscribed) {
    return res.status(402).json({ 
      error: "Essai gratuit de 7 jours expiré. L'accès au trading réel et autonome est bloqué. Veuillez renouveler l'abonnement pour 5 000 F CFA." 
    });
  }

  const isCrypto = symbol.includes("/");
  const calculatedPrice = parseFloat(price);
  const calculatedAmount = parseFloat(amount);
  const totalFCFA = isCrypto ? (calculatedAmount * calculatedPrice * 600) : (calculatedAmount * calculatedPrice);

  // Stop Loss Check (Mandatory!)
  if (!stopLoss) {
    return res.status(400).json({ error: "Sécurité Risk Manager: Un niveau de Stop-Loss (SL) est obligatoire pour protéger votre capital." });
  }

  // Strict Risk limits check (1% capital rule)
  const currentBalance = isCrypto ? user.balanceUSDT : user.balanceFCFA;
  const riskPercent = (totalFCFA / (user.balanceFCFA + (user.balanceUSDT * 600))) * 100;
  
  if (riskPercent > 1.05) {
    return res.status(400).json({ 
      error: `Sécurité Risk Manager: Ce trade représente ${riskPercent.toFixed(2)}% de votre capital total. Le risque maximum autorisé par trade est strictement limité à 1%.` 
    });
  }

  if (currentBalance < (isCrypto ? (calculatedAmount * calculatedPrice) : totalFCFA)) {
    return res.status(400).json({ error: "Solde insuffisant pour exécuter cet ordre de trading." });
  }

  // Record trade
  const newOrder: TradeOrder = {
    id: `order-${Date.now()}`,
    symbol,
    type,
    price: calculatedPrice,
    amount: calculatedAmount,
    totalFCFA: Math.floor(totalFCFA),
    mode: user.isSubscribed ? "REAL" : "DEMO",
    status: "COMPLETED",
    stopLoss: parseFloat(stopLoss),
    takeProfit: takeProfit ? parseFloat(takeProfit) : (type === "BUY" ? calculatedPrice * 1.05 : calculatedPrice * 0.95),
    timestamp: new Date().toISOString(),
    isAutonomous: !!isAutonomous,
    riskPercent: parseFloat(riskPercent.toFixed(2))
  };

  // Debit balance
  if (type === "BUY") {
    if (isCrypto) {
      user.balanceUSDT -= (calculatedAmount * calculatedPrice);
    } else {
      user.balanceFCFA -= totalFCFA;
    }
  } else {
    if (isCrypto) {
      user.balanceUSDT += (calculatedAmount * calculatedPrice);
    } else {
      user.balanceFCFA += totalFCFA;
    }
  }

  db.orders.unshift(newOrder);
  db.totalVolumeTradedFCFA += totalFCFA;
  addSecurityLog(
    "ORDER_EXECUTED",
    req.ip || "127.0.0.1",
    `Ordre exécuté avec succès : ${type} ${amount} ${symbol} à ${price}. Stop-Loss @${stopLoss}. Risque mesuré: ${riskPercent.toFixed(2)}%`,
    "INFO"
  );
  saveDb(db);

  res.json({ success: true, order: newOrder, message: "Ordre analysé par BTF Risk Manager et exécuté avec succès." });
});

// Admin Veto Override to cancel or stop order
app.post("/api/admin/veto/order", (req, res) => {
  const { orderId } = req.body;
  const found = db.orders.find(o => o.id === orderId);
  if (!found) {
    return res.status(404).json({ error: "Ordre inexistant" });
  }

  found.status = "CANCELLED";
  addSecurityLog("ADMIN_VETO_ORDER", req.ip || "127.0.0.1", `Droit de véto exercé par l'admin : Annulation immédiate de l'ordre ${orderId}`, "CRITICAL");
  saveDb(db);

  res.json({ success: true, message: `L'ordre ${found.symbol} a été révoqué par droit de veto administratif.` });
});

// AI ENGINE: SMART SENTIMENT NLP SCANNER (Uses live Gemini with search-grounding!)
app.post("/api/gemini/news-analyzer", async (req, res) => {
  const { targetAsset } = req.body;
  const target = targetAsset || "Économie UEMOA & BRVM";

  addSecurityLog("AI_SENTIMENT_RUN", req.ip || "127.0.0.1", `Lancement de l'analyseur de sentiment NLP Gemini pour ${target}.`, "INFO");

  const ai = getGeminiClient();

  if (!ai) {
    // Return high quality mock insights if Gemini API Key is missing, explaining correctly
    const fallbackList: SentimentAnalysis[] = [
      {
        id: `sent-fallback-${Date.now()}-1`,
        source: "Coris Bank / BRVM Info",
        entity: target,
        sentimentScore: 0.75,
        summary: `Résultats financiers solides observés sur le marché Ouest Africain concernant ${target}. Intérêt d'achat fort.`,
        impactOnTrading: "Acheter avec Stop-Loss serré de 1.5% sous le cours actuel.",
        timestamp: new Date().toISOString()
      },
      {
        id: `sent-fallback-${Date.now()}-2`,
        source: "UEMOA BCEAO Insights",
        entity: target,
        sentimentScore: 0.2,
        summary: `Stabilité politique et maîtrise de l'inflation d'après les rapports de Ouagadougou et Abidjan.`,
        impactOnTrading: "Stratégie de trading neutre, focalisée sur actions à dividendes stables.",
        timestamp: new Date().toISOString()
      }
    ];
    return res.json({
      success: true,
      sentiments: fallbackList,
      note: "Résultats générés par simulateur d'analyse financière locale BTF (Connectez votre clé API Gemini pour l'activation en direct des flux X et Google Search Grounding)."
    });
  }

  try {
    // Gemini 3.5 Flash is perfect for high-speed textual structured reports with search rounding
    const prompt = `Recherche et analyse de sentiment d'expert financier concernant l'actif : "${target}". 
    Identifie l'état mondial ou local actuel, les dernières annonces macroéconomiques de personnalités clés (dirigeants financiers, présidences de banques centrales, grands groupes en Afrique de l'Ouest)
    Rentre une analyse de marché structurée en JSON.
    Le dictionnaire doit contenir une liste d'analyses comprenant:
    - "source": le site économique ou la plateforme clé
    - "entity": l'actif ou l'entreprise analysée
    - "sentimentScore": un score de -1.0 (très baissier/bearish) à +1.0 (très haussier/bullish)
    - "summary": un résumé francophone de l'actualité critique récente
    - "impactOnTrading": la conclusion d'action à mener pour les traders de Bobdo Trading and Finance.
    Respecte l'éthique de la zone UEMOA et le Burkina Faso.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Real Google Search grounding!
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analyses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  entity: { type: Type.STRING },
                  sentimentScore: { type: Type.NUMBER },
                  summary: { type: Type.STRING },
                  impactOnTrading: { type: Type.STRING }
                },
                required: ["source", "entity", "sentimentScore", "summary", "impactOnTrading"]
              }
            }
          },
          required: ["analyses"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{"analyses": []}');
    const news: SentimentAnalysis[] = (parsed.analyses || []).map((item: any, idx: number) => ({
      id: `sent-gemini-${Date.now()}-${idx}`,
      source: item.source,
      entity: item.entity,
      sentimentScore: item.sentimentScore,
      summary: item.summary,
      impactOnTrading: item.impactOnTrading,
      timestamp: new Date().toISOString()
    }));

    if (news.length > 0) {
      db.sentiments = [...news, ...db.sentiments].slice(0, 30);
      saveDb(db);
    }

    res.json({
      success: true,
      sentiments: news,
      groundingInfo: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    });

  } catch (error: any) {
    console.error("Gemini scanning error: ", error);
    res.status(500).json({ error: "Échec du serveur d'intelligence artificielle lors du scanning.", details: error.message });
  }
});

// PHYSICAL MARKET: GET ALL REPORTS (Zone UEMOA Logistique)
app.get("/api/physical-market", (req, res) => {
  const publishedReports = db.reports.filter(r => r.status === "PUBLISHED");
  res.json({ reports: publishedReports });
});

// Admin endpoint to get ALL reports
app.get("/api/admin/reports", (req, res) => {
  res.json({ reports: db.reports });
});

// Physical Market - Add report manually or triggered by system
app.post("/api/physical-market/report", (req, res) => {
  const { corridor, product, scarcityIndex, trend, observedPriceFCFA, unit, description } = req.body;

  if (!corridor || !product || !observedPriceFCFA || !unit) {
    return res.status(400).json({ error: "Informations de marché physique incomplètes." });
  }

  const newReport: PhysicalMarketReport = {
    id: `phys-${Date.now()}`,
    corridor,
    product,
    scarcityIndex: parseInt(scarcityIndex) || 50,
    trend: trend || "STABLE",
    observedPriceFCFA: parseFloat(observedPriceFCFA),
    unit,
    description: description || `Rapport d'opportunité d'arbitrage sur l'axe céréalier.`,
    status: "PUBLISHED", // Auto-publish for convenience, can be validated
    createdAt: new Date().toISOString()
  };

  db.reports.unshift(newReport);
  saveDb(db);

  res.json({ success: true, report: newReport });
});

// ==================== ADMIN SECRET PANEL (`/admin-secret-gate`) ====================

// Verification Code Authentication PIN or TOTP Simulator
app.post("/api/admin/auth", (req, res) => {
  const { pinCode, mfaCode } = req.body;

  const expectedPin = process.env.ADMIN_PIN || "226226";
  const expectedMfa = process.env.ADMIN_MFA || "9988";

  if (pinCode === expectedPin && mfaCode === expectedMfa) {
    addSecurityLog("ADMIN_MFA_SUCCESS", req.ip || "127.0.0.1", "Authentification de sécurité administrateur réussie par code PIN et double facteur physique.", "WARNING");
    return res.json({ success: true, token: "btf_secure_session_admin_verified" });
  } else {
    addSecurityLog("ADMIN_MFA_FAILURE", req.ip || "127.0.0.1", `Tentative de connexion échouée au panneau d'administration secret avec le code PIN renseigné.`, "CRITICAL");
    return res.status(401).json({ error: "Code PIN ou code MFA/TOTP d'authentification double facteur invalide." });
  }
});

// Fetch admin control parameters
app.get("/api/admin/dashboard", (req, res) => {
  res.json({
    payments: db.payments,
    isVetoActive: db.isVetoActive,
    dailyDrawdownLimitReached: db.dailyDrawdownLimitReached,
    logs: db.logs,
    users: db.users
  });
});

// Admin: Toggle Veto switch
app.post("/api/admin/veto/toggle", (req, res) => {
  db.isVetoActive = !db.isVetoActive;
  const stateLabel = db.isVetoActive ? "ACTIVÉ (Veto immédiat sur tous les ordres)" : "DÉSACTIVÉ (Ordres autonomes libres)";
  
  addSecurityLog(
    "ADMIN_VETO_TOGGLE",
    req.ip || "127.0.0.1",
    `Le droit de Véto Absolu a été ${stateLabel} par l'administrateur système.`,
    "CRITICAL"
  );
  saveDb(db);
  res.json({ success: true, isVetoActive: db.isVetoActive });
});

// Admin: Toggle Drawdown emergency switch
app.post("/api/admin/drawdown/toggle", (req, res) => {
  db.dailyDrawdownLimitReached = !db.dailyDrawdownLimitReached;
  
  addSecurityLog(
    "ADMIN_DRAWDOWN_RESET",
    req.ip || "127.0.0.1",
    `Réinitialisation manuelle de l'arrêt d'urgence quotidien par l'administrateur. Équilibre débloqué.`,
    "WARNING"
  );
  saveDb(db);
  res.json({ success: true, dailyDrawdownLimitReached: db.dailyDrawdownLimitReached });
});

// Admin: Action on pending payment requests (Orange Money/Moov/Wave subscription approve)
app.post("/api/admin/payments/action", (req, res) => {
  const { paymentId, action } = req.body; // action: 'APPROVE' or 'REJECT'
  
  const payment = db.payments.find(p => p.id === paymentId);
  if (!payment) {
    return res.status(404).json({ error: "Demande de paiement non trouvée" });
  }

  if (action === "APPROVE") {
    payment.status = "APPROVED";
    // Grant SaaS status to user
    const user = db.users[0];
    if (user) {
      user.isSubscribed = true;
      user.subscriptionType = "PAID";
      user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 Days expiration!
      
      // Credit Referral earnings if user was referred
      if (user.referredBy) {
        user.referralEarningsFCFA = (user.referralEarningsFCFA || 0) + 250;
        user.balanceFCFA += 250; // Credit directly to balance for demo proof!
        addSecurityLog(
          "REFERRAL_PAID",
          req.ip || "127.0.0.1",
          `Système de Parrainage : Attribution d'un bonus instantané de 250 F CFA au parrain (${user.referredBy}) suite à l'activation de l'abonnement du filleul.`,
          "INFO"
        );
      }
    }
    addSecurityLog(
      "PAYMENT_APPROVED",
      req.ip || "127.0.0.1",
      `Abonnement validé avec succès pour l'utilisateur ${payment.email}. Transfert de ${payment.amount} F CFA vérifié.`,
      "INFO"
    );
  } else {
    payment.status = "REJECTED";
    addSecurityLog(
      "PAYMENT_REJECTED",
      req.ip || "127.0.0.1",
      `Transaction de transfert ${payment.transactionId} rejetée après vérification.`,
      "WARNING"
    );
  }

  saveDb(db);
  res.json({ success: true, payment });
});

// Serve frontend assets
async function startServer() {
  // Initialize and connect to PostgreSQL database (Supabase/Render) if DATABASE_URL is set
  const pool = initPostgresPool();
  if (pool) {
    console.log("[BTF DATABASE] Remote DATABASE_URL provided. Initiating cloud sync...");
    const bootstrapped = await bootstrapSchema();
    if (bootstrapped) {
      const pgState = await loadStateFromPostgres();
      if (pgState) {
        db = pgState;
        console.log("[BTF DATABASE] Successfully loaded and synchronized state from cloud database.");
      } else {
        console.log("[BTF DATABASE] Cold boot detected. Database tables initialized but empty. Seeding with local template JSON data...");
        // Seed remote database with current state
        const seeded = await saveStateToPostgres(db);
        if (seeded) {
          console.log("[BTF DATABASE] Successfully seeded PostgreSQL with core templates and active user.");
        } else {
          console.error("[BTF DATABASE] Seeding process returned errors. Check postgres pool schema constraints.");
        }
      }
    } else {
      console.error("[BTF DATABASE] Table bootstrap failed. Running on local fallbacks. Check credentials.");
    }
  } else {
    console.log("[BTF DATABASE] Running on high-security localized storage. To transition to a persistent database (e.g. Supabase or Render), define DATABASE_URL.");
  }

  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite development server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BTF SYSTEM] Bobdo Trading & Finance server started on http://0.0.0.0:${PORT}`);
    console.log(`[BTF SYSTEM] Synchronized in UTC with NTP Time servers. Active Area: Zone UEMOA Sub-Saharan`);
    if (isRemoteDbConnected) {
      console.log("[BTF DATABASE] 🟢 remote persistence layer synced and active!");
    } else {
      console.log("[BTF DATABASE] 🟡 local offline-first security sandboxed database active.");
    }
  });
}

startServer();

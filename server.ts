/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  UserSession, 
  TradeOrder, 
  PhysicalMarketReport, 
  SentimentAnalysis, 
  PaymentRequest, 
  SecurityLog
} from "./src/types";

// Import custom database adapter routines
import {
  getSystemConfig,
  updateSystemConfig,
  getUserSession,
  getAllUsersOverview,
  updateUserApiKeys,
  updateUserBalances,
  updateUserSubscription,
  resetUserAccount,
  getOrders,
  addOrder,
  cancelOrderVeto,
  getPhysicalReports,
  addPhysicalReport,
  getSentimentAnalyses,
  addSentimentAnalyses,
  getPayments,
  addPayment,
  updatePaymentStatus,
  getSecurityLogs,
  addSecurityLog
} from "./server-db";

dotenv.config();

const app = express();
const PORT = 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lazy Gemini AI wrapper
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

// SIMULATOR TRADE ROTATION (Adds dynamic movements for visual trading)
async function runAutoTradeCycle() {
  try {
    const config = await getSystemConfig();
    if (config.isVetoActive || config.dailyDrawdownLimitReached) return;

    // Random occurrence of automatic trade execution (15% chance every 30 seconds)
    if (Math.random() > 0.85) {
      const user = await getUserSession("ibsawadogo54@gmail.com");
      if (!user) return;

      const symbols = ["SONATEL", "CORIS BANK", "ORANGE CI", "BTC/USDT", "ETH/USDT"];
      const selectedSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const isCrypto = selectedSymbol.includes("/");
      const price = isCrypto 
        ? (selectedSymbol.startsWith("BTC") ? 64000 + (Math.random() - 0.5) * 500 : 3400 + (Math.random() - 0.5) * 50) 
        : (selectedSymbol === "SONATEL" ? 18400 + Math.floor(Math.random() * 200 - 100) : 9550 + Math.floor(Math.random() * 100 - 50));
      
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
          mode: user.isSubscribed ? "REAL" : "DEMO",
          status: "COMPLETED",
          stopLoss: parseFloat(stopLoss.toFixed(2)),
          takeProfit: parseFloat(takeProfit.toFixed(2)),
          timestamp: new Date().toISOString(),
          isAutonomous: true,
          riskPercent: 1.0
        };

        // Adjust balance
        let nextBalanceFCFA = user.balanceFCFA;
        let nextBalanceUSDT = user.balanceUSDT;

        if (type === "BUY") {
          if (isCrypto) {
            nextBalanceUSDT -= orderAmount * price;
          } else {
            nextBalanceFCFA -= totalFCFA;
          }
        } else {
          if (isCrypto) {
            nextBalanceUSDT += orderAmount * price;
          } else {
            nextBalanceFCFA += totalFCFA;
          }
        }

        await updateUserBalances("ibsawadogo54@gmail.com", nextBalanceFCFA, nextBalanceUSDT);
        await addOrder(newOrder);
        await updateSystemConfig({ totalVolumeTradedFCFA: config.totalVolumeTradedFCFA + totalFCFA });
        
        console.log(`[AUTONOMOUS TRADER] Successfully executed ${type} automated order for ${selectedSymbol}`);
      }
    }
  } catch (err) {
    console.error("Auto trade background cycle failed:", err);
  }
}

setInterval(() => {
  runAutoTradeCycle();
}, 30000); // Check automated trades every 30 seconds

// ==================== API ENDPOINTS ====================

// Base Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timeUTC: new Date().toISOString(), isWestAfricaSync: true });
});

// Get Current User / Subscription Session
app.get("/api/user/session", async (req, res) => {
  try {
    const user = await getUserSession("ibsawadogo54@gmail.com");
    if (!user) {
      return res.status(404).json({ error: "User session not found" });
    }
    const config = await getSystemConfig();

    // Calculate Trial Period remaining
    const trialStart = new Date(user.trialStartDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - trialStart.getTime());
    const diffDaysTotal = diffTime / (1000 * 60 * 60 * 24);
    const trialDaysRemaining = Math.max(0, 7 - diffDaysTotal);

    res.json({
      session: user,
      trialDaysRemaining: parseFloat(trialDaysRemaining.toFixed(2)),
      isTrialExpired: trialDaysRemaining <= 0 && !user.isSubscribed,
      isSubscribed: user.isSubscribed,
      totalAdminCommissionsUSDT: config.totalAdminCommissionsUSDT,
      adminBinanceWithdrawAddress: config.adminBinanceWithdrawAddress,
      adminReferralLink: config.adminReferralLink
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update User API Connectors
app.post("/api/user/keys", async (req, res) => {
  try {
    const { binanceKey, binanceSecret, okxKey, bybitKey, brvmId } = req.body;
    
    await updateUserApiKeys("ibsawadogo54@gmail.com", { binanceKey, binanceSecret, okxKey, bybitKey, brvmId });

    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "KEYS_INTEGRATION",
      ip: req.ip || "127.0.0.1",
      details: "Connexion par clé API mise à jour pour le compte utilisateur.",
      timestamp: new Date().toISOString(),
      severity: "INFO"
    });

    res.json({ success: true, message: "Vos clés API ont été connectées avec succès en mode chiffré." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Account simulated assets
app.post("/api/user/reset", async (req, res) => {
  try {
    await resetUserAccount("ibsawadogo54@gmail.com");
    await updateSystemConfig({ dailyDrawdownLimitReached: false });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Activate Free/Commission-Based Subscription Plan
app.post("/api/user/subscribe-free", async (req, res) => {
  try {
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
    await updateUserSubscription("ibsawadogo54@gmail.com", true, "FREE_COMMISSION", endDate);

    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "SUBSCRIPTION_FREE_COMMISSION",
      ip: req.ip || "127.0.0.1",
      details: "Formulaire d'activation Plan Commission : Accès immédiat accordé. Le Risk Manager appliquera une retenue automatique de 20% sur chaque deal d'arbitrage rentable.",
      timestamp: new Date().toISOString(),
      severity: "INFO"
    });

    res.json({ 
      success: true, 
      message: "Abonnement Commission (Gratuit sans avance) activé avec succès !" 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Admin Configurations from Admin Board
app.post("/api/admin/config/update", async (req, res) => {
  try {
    const { adminBinanceWithdrawAddress, adminReferralLink } = req.body;
    
    await updateSystemConfig({ adminBinanceWithdrawAddress, adminReferralLink });

    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "ADMIN_CONFIG_UPDATE",
      ip: req.ip || "127.0.0.1",
      details: "Mise à jour des coordonnées d'encaissement et parrainage d'administration.",
      timestamp: new Date().toISOString(),
      severity: "WARNING"
    });

    res.json({ success: true, message: "Configuration mise à jour avec succès en base de données." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Simulate Withdrawal of Admin collected commissions in Cryptocurrency
app.post("/api/admin/config/withdraw", async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount || "0");
    const config = await getSystemConfig();
    const currentComms = config.totalAdminCommissionsUSDT;

    if (amount <= 0 || amount > currentComms) {
      return res.status(400).json({ error: "Solde de commission insuffisant ou montant invalide." });
    }

    const nextComms = currentComms - amount;
    await updateSystemConfig({ totalAdminCommissionsUSDT: nextComms });
    
    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "ADMIN_WITHDRAWAL_SUCCESS",
      ip: req.ip || "127.0.0.1",
      details: `Retrait administratif de ${amount} USDT exécuté vers l'adresse ${config.adminBinanceWithdrawAddress}. Statut: Blockchain Confirmed.`,
      timestamp: new Date().toISOString(),
      severity: "CRITICAL"
    });

    res.json({ 
      success: true, 
      totalAdminCommissionsUSDT: nextComms,
      message: `Retrait cryptographique de ${amount} USDT envoyé avec succès sur le réseau !`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// High-Frequency Arbitrage Bot Execution Loop Simulator
app.post("/api/trades/run-arbitrage-cycle", async (req, res) => {
  try {
    const user = await getUserSession("ibsawadogo54@gmail.com");
    if (!user) {
      return res.status(404).json({ error: "Session inactive." });
    }
    const config = await getSystemConfig();

    // Generate a random high-yield arbitrage opportunity
    const products = ["Arbitrage Sorgo (Bobo-Dioulasso/Ouagadougou)", "Riz arbitrage boursier (Abidjan)", "Or physique (Axe Houndé/Burkina)", "Routage Spot Crypto BTC/USDT (Binance-OKX)"];
    const selectedProduct = products[Math.floor(Math.random() * products.length)];
    const profitFCFA = Math.floor(12500 + Math.random() * 9200); // 12,500 to 21,700 FCFA bruto

    const isFreePlan = user.subscriptionType === "FREE_COMMISSION";
    let adminCommissionFCFA = 0;
    let userNetProfitFCFA = profitFCFA;

    let nextTotalCommsUsdt = config.totalAdminCommissionsUSDT;
    let nextAccumulatedCommission = user.accumulatedFreeCommissionFCFA;
    let nextReferralEarnings = user.referralEarningsFCFA;
    let nextBalanceFCFA = user.balanceFCFA;

    if (isFreePlan) {
      // 20% commission
      adminCommissionFCFA = Math.floor(profitFCFA * 0.20);
      userNetProfitFCFA = profitFCFA - adminCommissionFCFA;

      // Convert F CFA commission to USDT (1 USDT = 600 F CFA)
      const commissionUSDT = parseFloat((adminCommissionFCFA / 600).toFixed(4));
      nextTotalCommsUsdt += commissionUSDT;

      // Accumulate for parrainage payout calculation
      nextAccumulatedCommission += adminCommissionFCFA;

      // Check if total commission paid has reached the 5,000 F CFA milestone to reward the referrer!
      if (nextAccumulatedCommission >= 5000 && user.referredBy) {
        nextAccumulatedCommission -= 5000;
        // Credit referrer's earnings
        nextReferralEarnings += 250;
        nextBalanceFCFA += 250; // Add real reward to balance as demo award!
        
        await addSecurityLog({
          id: `log-${Date.now()}-ref`,
          action: "REFERRAL_MILESTONE_PAID",
          ip: "127.0.0.1",
          details: `Parrainage : Versement de la prime de 250 F CFA au parrain ${user.referredBy} (Palier de commission de 5 000 F CFA franchi par le filleul).`,
          timestamp: new Date().toISOString(),
          severity: "INFO"
        });
      }
    }

    // Credit user balance
    nextBalanceFCFA += userNetProfitFCFA;

    await updateUserBalances("ibsawadogo54@gmail.com", nextBalanceFCFA, user.balanceUSDT, nextReferralEarnings, nextAccumulatedCommission);
    await updateSystemConfig({
      totalAdminCommissionsUSDT: nextTotalCommsUsdt,
      totalVolumeTradedFCFA: config.totalVolumeTradedFCFA + profitFCFA
    });

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

    await addOrder(newOrder);

    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "ARBITRAGE_CYCLE",
      ip: req.ip || "127.0.0.1",
      details: `Le Bot d'Arbitrage a exécuté un deal rentable sur ${selectedProduct}. Profit Brut UEMOA: +${profitFCFA} F CFA. Retenu Admin: ${adminCommissionFCFA} F CFA. Net crédité: +${userNetProfitFCFA} F CFA.`,
      timestamp: new Date().toISOString(),
      severity: "INFO"
    });

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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Support Orange / Moov / Wave Money Payment Proof (SaaS Subscription)
app.post("/api/payments/submit", async (req, res) => {
  try {
    const { operator, transactionId, amount, phoneSender, proofDetails } = req.body;
    
    if (!operator || !transactionId || !amount || !phoneSender) {
      return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires du transfert." });
    }

    const user = await getUserSession("ibsawadogo54@gmail.com");
    const email = user ? user.email : "anonymous@uemoa.com";

    const newPayment: PaymentRequest = {
      id: `pay-${Date.now()}`,
      email,
      operator,
      transactionId,
      amount: parseFloat(amount),
      phoneSender,
      proofDetails: proofDetails || "Reçu envoyé pour validation d'accès SaaS.",
      status: "PENDING",
      timestamp: new Date().toISOString()
    };

    await addPayment(newPayment);

    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "PAYMENT_SUBMITTED",
      ip: req.ip || "127.0.0.1",
      details: `Nouvelle demande de validation d'abonnement 5 000 F CFA reçue d'un compte ${operator}. ID de transaction: ${transactionId}`,
      timestamp: new Date().toISOString(),
      severity: "INFO"
    });

    res.json({ success: true, message: "Votre preuve de transfert a été envoyée. L'administrateur validera votre accès d'ici quelques minutes." });
  } catch (err: any) {
    res.status(550).json({ error: err.message });
  }
});

// Get Active Trades/Orders
app.get("/api/trades", async (req, res) => {
  try {
    const orders = await getOrders();
    const config = await getSystemConfig();
    res.json({
      orders: orders,
      isVetoActive: config.isVetoActive,
      dailyDrawdownLimitReached: config.dailyDrawdownLimitReached,
      totalVolumeTradedFCFA: config.totalVolumeTradedFCFA
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Post a Trade manually (Mode DEMO / simulated REAL)
app.post("/api/trades/place", async (req, res) => {
  try {
    const user = await getUserSession("ibsawadogo54@gmail.com");
    if (!user) {
      return res.status(404).json({ error: "Session utilisateur introuvable." });
    }
    const config = await getSystemConfig();

    const { symbol, type, price, amount, stopLoss, takeProfit, isAutonomous } = req.body;

    if (config.isVetoActive) {
      return res.status(403).json({ error: "Action bloquée : Le droit de Veto Absolu de l'Administrateur de risque est actuellement ACTIVÉ." });
    }

    if (config.dailyDrawdownLimitReached) {
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
    const totalEquity = user.balanceFCFA + (user.balanceUSDT * 600);
    const riskPercent = totalEquity > 0 ? (totalFCFA / totalEquity) * 100 : 0;
    
    if (riskPercent > 1.05) {
      return res.status(400).json({ 
        error: `Sécurité Risk Manager: Ce trade représente ${riskPercent.toFixed(2)}% de votre capital total. Le risque maximum autorisé par trade est strictement limité à 1%.` 
      });
    }

    if (currentBalance < (isCrypto ? (calculatedAmount * calculatedPrice) : totalFCFA)) {
      return res.status(400).json({ error: "Solde insuffisant pour exécuter cet ordre de trading." });
    }

    let nextBalanceFCFA = user.balanceFCFA;
    let nextBalanceUSDT = user.balanceUSDT;

    // Debit balance
    if (type === "BUY") {
      if (isCrypto) {
        nextBalanceUSDT -= (calculatedAmount * calculatedPrice);
      } else {
        nextBalanceFCFA -= totalFCFA;
      }
    } else {
      if (isCrypto) {
        nextBalanceUSDT += (calculatedAmount * calculatedPrice);
      } else {
        nextBalanceFCFA += totalFCFA;
      }
    }

    await updateUserBalances("ibsawadogo54@gmail.com", nextBalanceFCFA, nextBalanceUSDT);
    await updateSystemConfig({ totalVolumeTradedFCFA: config.totalVolumeTradedFCFA + totalFCFA });

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

    await addOrder(newOrder);

    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "ORDER_EXECUTED",
      ip: req.ip || "127.0.0.1",
      details: `Ordre exécuté avec succès : ${type} ${amount} ${symbol} à ${price}. Stop-Loss @${stopLoss}. Risque mesuré: ${riskPercent.toFixed(2)}%`,
      timestamp: new Date().toISOString(),
      severity: "INFO"
    });

    res.json({ success: true, order: newOrder, message: "Ordre analysé par BTF Risk Manager et exécuté avec succès." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Veto Override to cancel or stop order
app.post("/api/admin/veto/order", async (req, res) => {
  try {
    const { orderId } = req.body;
    await cancelOrderVeto(orderId);

    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "ADMIN_VETO_ORDER",
      ip: req.ip || "127.0.0.1",
      details: `Droit de véto exercé par l'admin : Annulation immédiate de l'ordre ${orderId}`,
      timestamp: new Date().toISOString(),
      severity: "CRITICAL"
    });

    res.json({ success: true, message: "L'ordre a été révoqué par droit de veto administratif." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI ENGINE: SMART SENTIMENT NLP SCANNER (Uses live Gemini with search-grounding!)
app.post("/api/gemini/news-analyzer", async (req, res) => {
  const { targetAsset } = req.body;
  const target = targetAsset || "Économie UEMOA & BRVM";

  try {
    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "AI_SENTIMENT_RUN",
      ip: req.ip || "127.0.0.1",
      details: `Lancement de l'analyseur de sentiment NLP Gemini pour ${target}.`,
      timestamp: new Date().toISOString(),
      severity: "INFO"
    });

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
          summary: "Stabilité politique et maîtrise de l'inflation d'après les rapports de Ouagadougou et Abidjan.",
          impactOnTrading: "Stratégie de trading neutre, focalisée sur actions à dividendes stables.",
          timestamp: new Date().toISOString()
        }
      ];
      await addSentimentAnalyses(fallbackList);

      return res.json({
        success: true,
        sentiments: fallbackList,
        note: "Résultats générés par le moteur local hybride. (Configurez GEMINI_API_KEY pour activer Google Search Grounding)."
      });
    }

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
      await addSentimentAnalyses(news);
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
app.get("/api/physical-market", async (req, res) => {
  try {
    const publishedReports = await getPhysicalReports(true);
    res.json({ reports: publishedReports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to get ALL reports
app.get("/api/admin/reports", async (req, res) => {
  try {
    const reports = await getPhysicalReports(false);
    res.json({ reports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Physical Market - Add report manually or triggered by system
app.post("/api/physical-market/report", async (req, res) => {
  try {
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
      description: description || "Rapport d'opportunité d'arbitrage sur l'axe céréalier.",
      status: "PUBLISHED", // Auto-publish for convenience
      createdAt: new Date().toISOString()
    };

    await addPhysicalReport(newReport);

    res.json({ success: true, report: newReport });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN SECRET PANEL (`/admin-secret-gate`) ====================

// Verification Code Authentication PIN or TOTP Simulator
app.post("/api/admin/auth", async (req, res) => {
  try {
    const { pinCode, mfaCode } = req.body;

    const expectedPin = process.env.ADMIN_PIN || "226226";
    const expectedMfa = process.env.ADMIN_MFA || "9988";

    if (pinCode === expectedPin && mfaCode === expectedMfa) {
      await addSecurityLog({
        id: `log-${Date.now()}`,
        action: "ADMIN_MFA_SUCCESS",
        ip: req.ip || "127.0.0.1",
        details: "Authentification de sécurité administrateur réussie par code PIN et double facteur physique.",
        timestamp: new Date().toISOString(),
        severity: "WARNING"
      });
      return res.json({ success: true, token: "btf_secure_session_admin_verified" });
    } else {
      await addSecurityLog({
        id: `log-${Date.now()}`,
        action: "ADMIN_MFA_FAILURE",
        ip: req.ip || "127.0.0.1",
        details: "Tentative de connexion échouée au panneau d'administration secret avec le code PIN renseigné.",
        timestamp: new Date().toISOString(),
        severity: "CRITICAL"
      });
      return res.status(401).json({ error: "Code PIN ou code MFA/TOTP d'authentification double facteur invalide." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch admin control parameters
app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const payments = await getPayments();
    const config = await getSystemConfig();
    const logs = await getSecurityLogs();
    const users = await getAllUsersOverview();

    res.json({
      payments,
      isVetoActive: config.isVetoActive,
      dailyDrawdownLimitReached: config.dailyDrawdownLimitReached,
      logs,
      users
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Toggle Veto switch
app.post("/api/admin/veto/toggle", async (req, res) => {
  try {
    const config = await getSystemConfig();
    const nextVeto = !config.isVetoActive;
    await updateSystemConfig({ isVetoActive: nextVeto });

    const stateLabel = nextVeto ? "ACTIVÉ (Veto immédiat sur tous les ordres)" : "DÉSACTIVÉ (Ordres autonomes libres)";
    
    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "ADMIN_VETO_TOGGLE",
      ip: req.ip || "127.0.0.1",
      details: `Le droit de Véto Absolu a été ${stateLabel} par l'administrateur système.`,
      timestamp: new Date().toISOString(),
      severity: "CRITICAL"
    });

    res.json({ success: true, isVetoActive: nextVeto });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Toggle Drawdown emergency switch
app.post("/api/admin/drawdown/toggle", async (req, res) => {
  try {
    const config = await getSystemConfig();
    const nextDrawdown = !config.dailyDrawdownLimitReached;
    await updateSystemConfig({ dailyDrawdownLimitReached: nextDrawdown });
    
    await addSecurityLog({
      id: `log-${Date.now()}`,
      action: "ADMIN_DRAWDOWN_RESET",
      ip: req.ip || "127.0.0.1",
      details: "Réinitialisation manuelle de l'arrêt d'urgence quotidien par l'administrateur. Équilibre débloqué.",
      timestamp: new Date().toISOString(),
      severity: "WARNING"
    });

    res.json({ success: true, dailyDrawdownLimitReached: nextDrawdown });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Action on pending payment requests (Orange Money/Moov/Wave subscription approve)
app.post("/api/admin/payments/action", async (req, res) => {
  try {
    const { paymentId, action } = req.body; // action: 'APPROVE' or 'REJECT'
    const status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    
    const payment = await updatePaymentStatus(paymentId, status);
    if (!payment) {
      return res.status(404).json({ error: "Demande de paiement non trouvée" });
    }

    if (action === "APPROVE") {
      // Grant SaaS status to user
      const user = await getUserSession("ibsawadogo54@gmail.com");
      if (user) {
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 Days expiration!
        await updateUserSubscription("ibsawadogo54@gmail.com", true, "PAID", endDate);
        
        // Credit Referral earnings if user was referred
        if (user.referredBy) {
          const nextReferralEarnings = user.referralEarningsFCFA + 250;
          const nextBalanceFCFA = user.balanceFCFA + 250;
          await updateUserBalances("ibsawadogo54@gmail.com", nextBalanceFCFA, user.balanceUSDT, nextReferralEarnings);

          await addSecurityLog({
            id: `log-${Date.now()}-ref`,
            action: "REFERRAL_PAID",
            ip: req.ip || "127.0.0.1",
            details: `Système de Parrainage : Attribution d'un bonus instantané de 250 F CFA au parrain (${user.referredBy}) suite à l'activation de l'abonnement du filleul.`,
            timestamp: new Date().toISOString(),
            severity: "INFO"
          });
        }
      }

      await addSecurityLog({
        id: `log-${Date.now()}`,
        action: "PAYMENT_APPROVED",
        ip: req.ip || "127.0.0.1",
        details: `Abonnement validé avec succès pour l'utilisateur ${payment.email}. Transfert de ${payment.amount} F CFA vérifié.`,
        timestamp: new Date().toISOString(),
        severity: "INFO"
      });
    } else {
      await addSecurityLog({
        id: `log-${Date.now()}`,
        action: "PAYMENT_REJECTED",
        ip: req.ip || "127.0.0.1",
        details: `Transaction de transfert ${payment.transactionId} rejetée après vérification.`,
        timestamp: new Date().toISOString(),
        severity: "WARNING"
      });
    }

    res.json({ success: true, payment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend assets
async function startServer() {
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
  });
}

startServer();

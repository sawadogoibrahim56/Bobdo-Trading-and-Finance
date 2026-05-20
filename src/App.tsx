/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Lock, RefreshCw, AlertCircle, HelpCircle, Shield, Globe } from "lucide-react";
import Navigation from "./components/Navigation";
import HelpManual from "./components/HelpManual";
import TradeRoom from "./components/TradeRoom";
import PhysicalMarket from "./components/PhysicalMarket";
import AISentiment from "./components/AISentiment";
import Billing from "./components/Billing";
import AdminPanel from "./components/AdminPanel";
import { UserSession, TradeOrder, PhysicalMarketReport, SentimentAnalysis, PaymentRequest, SecurityLog } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("trade");
  const [session, setSession] = useState<UserSession | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(7);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // App Toast Notifications for safe double verification inside iframe
  const [appNotification, setAppNotification] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setAppNotification({ message, type });
    setTimeout(() => {
      setAppNotification(prev => prev && prev.message === message ? null : prev);
    }, 8500);
  };

  // States fetched from backend APIs
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [isVetoActive, setIsVetoActive] = useState(false);
  const [dailyDrawdownLimitReached, setDailyDrawdownLimitReached] = useState(false);
  const [totalVolume, setTotalVolume] = useState(0);

  const [physicalReports, setPhysicalReports] = useState<PhysicalMarketReport[]>([]);
  const [sentiments, setSentiments] = useState<SentimentAnalysis[]>([]);
  const [paymentsHistory, setPaymentsHistory] = useState<PaymentRequest[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [usersOverview, setUsersOverview] = useState<any[]>([]);

  const [apiError, setApiError] = useState<string | null>(null);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [actionTrigger, setActionTrigger] = useState(0);

  const triggerRefresh = () => setActionTrigger(prev => prev + 1);

  // Fetch initial and updated states from port 3000 Node server APIs
  useEffect(() => {
    const fetchStates = async () => {
      setIsStateLoading(true);
      try {
        // 1. User session
        const sessRes = await fetch("/api/user/session");
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          setSession(sessData.session);
          setIsTrialExpired(sessData.isTrialExpired);
          setTrialDaysRemaining(sessData.trialDaysRemaining);
          setIsSubscribed(sessData.isSubscribed);
        }

        // 2. Trades and Veto rules
        const tradeRes = await fetch("/api/trades");
        if (tradeRes.ok) {
          const tradeData = await tradeRes.json();
          setOrders(tradeData.orders);
          setIsVetoActive(tradeData.isVetoActive);
          setDailyDrawdownLimitReached(tradeData.dailyDrawdownLimitReached);
          setTotalVolume(tradeData.totalVolumeTradedFCFA);
        }

        // 3. Physical Market
        const physRes = await fetch("/api/physical-market");
        if (physRes.ok) {
          const physData = await physRes.json();
          setPhysicalReports(physData.reports || []);
        }

        // 4. Admin telemetry (will populate list if authorized, or remain silent otherwise)
        const adminRes = await fetch("/api/admin/dashboard");
        if (adminRes.ok) {
          const adminData = await adminRes.json();
          setPaymentsHistory(adminData.payments || []);
          setSecurityLogs(adminData.logs || []);
          setUsersOverview(adminData.users || []);
        }

        setApiError(null);
      } catch (err) {
        console.error("Critical API loading error", err);
        setApiError("Erreur: Impossible de joindre le pare-feu ou le serveur BTF. Vérifiez que l'application a démarré.");
      } finally {
        setIsStateLoading(false);
      }
    };

    fetchStates();
  }, [actionTrigger]);

  // Execute a trade through backend
  const handlePlaceOrder = async (orderPayload: any) => {
    try {
      const resp = await fetch("/api/trades/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        showNotification(data.error || "Une erreur est survenue lors de l'exécution.", "error");
        return false;
      }
      triggerRefresh();
      showNotification("Votre ordre de trading a été exécuté instantanément et inscrit au registre.", "success");
      return true;
    } catch (err) {
      showNotification("Erreur réseau de placement d'ordre.", "error");
      return false;
    }
  };

  // Perform Veto-Cancel order (Admin action)
  const handleCancelOrderVeto = async (orderId: string) => {
    try {
      const resp = await fetch("/api/admin/veto/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      if (resp.ok) {
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit subscription Orange/Moov/Wave payment
  const handleSubmitPayment = async (paymentPayload: any) => {
    try {
      const resp = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload)
      });
      return resp.ok;
    } catch (err) {
      return false;
    }
  };

  // Submit Physical market report
  const handleSubmitPhysicalReport = async (reportPayload: any) => {
    try {
      const resp = await fetch("/api/physical-market/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportPayload)
      });
      return resp.ok;
    } catch (err) {
      return false;
    }
  };

  // Trigger real Google Search grounded NLP scanner
  const handleTriggerAIScan = async (targetAsset: string) => {
    try {
      const resp = await fetch("/api/gemini/news-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAsset })
      });
      if (resp.ok) {
        const data = await resp.json();
        // pre-merge to let client see findings instantly
        setSentiments(data.sentiments);
        triggerRefresh();
        return data.sentiments;
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  // Toggle absolute veto master switch on server
  const handleToggleVeto = async () => {
    try {
      const resp = await fetch("/api/admin/veto/toggle", { method: "POST" });
      if (resp.ok) {
        triggerRefresh();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Toggle Drawdown limit reached manually check
  const handleToggleDrawdown = async () => {
    try {
      const resp = await fetch("/api/admin/drawdown/toggle", { method: "POST" });
      if (resp.ok) {
        triggerRefresh();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Verify and approve/reject Orange / Moov / Wave transfers
  const handleVerifyPayment = async (paymentId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const resp = await fetch("/api/admin/payments/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action: action === "APPROVE" ? "APPROVE" : "REJECT" })
      });
      if (resp.ok) {
        triggerRefresh();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Connect user keys
  const handleUpdateKeys = async (keysData: any) => {
    try {
      const resp = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keysData)
      });
      if (resp.ok) {
        triggerRefresh();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Reset demo accounts money
  const handleResetSimulatedCapital = async () => {
    try {
      const resp = await fetch("/api/user/reset", { method: "POST" });
      if (resp.ok) {
        triggerRefresh();
        showNotification("Capital simulé réinitialisé à 1 500 000 F CFA et 2 500 USDT !", "success");
      } else {
        showNotification("Impossible de réinitialiser le capital simulé.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Erreur de connexion lors de la réinitialisation du capital.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans text-sm md:text-base">
      
      {/* Floating Custom Notification Banner (replaces iframe-blocked alert popup) */}
      {appNotification && (
        <div id="custom-app-toast" className={`fixed top-6 right-6 z-50 max-w-md p-4 rounded-xl border shadow-2xl transition-all duration-350 bg-slate-900 ${
          appNotification.type === "success" 
            ? "border-emerald-500 text-emerald-400" 
            : appNotification.type === "error" 
            ? "border-red-500 text-red-500" 
            : "border-amber-500 text-amber-500"
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-inherit" />
            <div className="flex-1 space-y-1">
              <span className="font-mono text-[9px] uppercase font-bold tracking-widest block opacity-75">
                {appNotification.type === "success" ? "OPÉRATION RÉUSSIE" : "RÈGLE DE SÉCURITÉ / RISK ALERTE"}
              </span>
              <p className="text-xs sm:text-sm text-slate-150 font-semibold leading-relaxed">
                {appNotification.message}
              </p>
            </div>
            <button 
              id="btn-close-toast"
              onClick={() => setAppNotification(null)} 
              className="text-slate-400 hover:text-white font-bold p-1 bg-slate-950/40 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Dynamic API/Server down alerts */}
      {apiError && (
        <div className="bg-amber-500 text-slate-950 px-6 py-3 flex items-center justify-between font-semibold text-xs border-b border-amber-600 gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button 
            id="btn-retry-api"
            onClick={triggerRefresh} 
            className="flex items-center gap-1.5 bg-slate-950 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" /> Réessayer
          </button>
        </div>
      )}

      {/* Persistent Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        session={session} 
        isTrialExpired={isTrialExpired}
        trialDaysRemaining={trialDaysRemaining}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main active screens wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 transition-all duration-300">
        
        {activeTab === "trade" && (
          <TradeRoom 
            session={session}
            orders={orders}
            isVetoActive={isVetoActive}
            dailyDrawdownLimitReached={dailyDrawdownLimitReached}
            totalVolume={totalVolume}
            triggerRefresh={triggerRefresh}
            onPlaceOrder={handlePlaceOrder}
            onCancelOrderVeto={handleCancelOrderVeto}
            onUpdateKeys={handleUpdateKeys}
            isTrialExpired={isTrialExpired}
          />
        )}

        {activeTab === "physical" && (
          <PhysicalMarket 
            reports={physicalReports} 
            onSubmitReport={handleSubmitPhysicalReport} 
            triggerRefresh={triggerRefresh}
          />
        )}

        {activeTab === "ai" && (
          <AISentiment 
            sentiments={sentiments} 
            onTriggerScan={handleTriggerAIScan} 
          />
        )}

        {activeTab === "billing" && (
          <Billing 
            session={session}
            paymentHistory={paymentsHistory}
            isTrialExpired={isTrialExpired}
            trialDaysRemaining={trialDaysRemaining}
            onSubmitPayment={handleSubmitPayment}
            triggerRefresh={triggerRefresh}
          />
        )}

        {activeTab === "admin-secret-gate" && (
          <AdminPanel 
            payments={paymentsHistory}
            logs={securityLogs}
            isVetoActive={isVetoActive}
            dailyDrawdownLimitReached={dailyDrawdownLimitReached}
            onToggleVeto={handleToggleVeto}
            onToggleDrawdown={handleToggleDrawdown}
            onVerifyPayment={handleVerifyPayment}
            triggerRefresh={triggerRefresh}
            usersOverview={usersOverview}
            reports={physicalReports}
          />
        )}
      </main>

      {/* Polished custom footer, keeping outer background perfectly empty but useful */}
      <footer className="glass-panel mt-12 px-6 py-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        
        {/* Slogan details and legal conditions */}
        <div className="space-y-1 text-center sm:text-left">
          <p className="font-semibold text-slate-400">© 2026 Bobdo Trading and Finance (BTF) S.A.</p>
          <p className="max-w-md">
            Système de couverture autonome conforme aux régulations de l'UEMOA. Tous droits réservés.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-4 flex-wrap justify-center">
          
          {/* Test reset buttons helper for convenience */}
          <button
            id="footer-btn-reset-cap"
            onClick={handleResetSimulatedCapital}
            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-2.5 py-1 rounded border border-slate-800 transition-colors cursor-pointer"
          >
            Réinitialiser Capital Simulé (.demo)
          </button>

          {/* Locked secret gate router link */}
          <button
            id="footer-btn-admin-panel"
            onClick={() => setActiveTab("admin-secret-gate")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 cursor-pointer ${
              activeTab === "admin-secret-gate"
                ? "bg-red-500/10 border-red-500 text-red-400"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-red-500/40"
            }`}
            title="Espace secret d'administration double facteur"
          >
            <Lock className="h-3 w-3" />
            <span>Portail Admin Securisé</span>
          </button>
        </div>
      </footer>
      
      {/* Immersive global help popup with high readability and beautiful layout */}
      <HelpManual isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

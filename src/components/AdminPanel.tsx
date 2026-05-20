/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShieldAlert, Key, ToggleLeft, ToggleRight, CheckCircle, XCircle, AlertTriangle, Cpu, Terminal, RefreshCw, Users, Database, FileText, Globe, Check
} from "lucide-react";
import { PaymentRequest, SecurityLog, PhysicalMarketReport } from "../types";

interface AdminPanelProps {
  payments: PaymentRequest[];
  logs: SecurityLog[];
  isVetoActive: boolean;
  dailyDrawdownLimitReached: boolean;
  onToggleVeto: () => Promise<boolean>;
  onToggleDrawdown: () => Promise<boolean>;
  onVerifyPayment: (id: string, action: 'APPROVE' | 'REJECT') => Promise<boolean>;
  triggerRefresh: () => void;
  usersOverview: any[];
  reports: PhysicalMarketReport[]; // added physical market reports for direct audit
}

export default function AdminPanel({
  payments,
  logs,
  isVetoActive,
  dailyDrawdownLimitReached,
  onToggleVeto,
  onToggleDrawdown,
  onVerifyPayment,
  triggerRefresh,
  usersOverview,
  reports
}: AdminPanelProps) {
  const [pinCode, setPinCode] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated audit validation list for reports just inside state to persist locally
  const [certifiedReports, setCertifiedReports] = useState<Record<string, boolean>>({});

  // Admin config states for crypto address, commission wallet, and parrainage link
  const [adminBinanceWithdrawAddress, setAdminBinanceWithdrawAddress] = useState("");
  const [adminReferralLink, setAdminReferralLink] = useState("");
  const [totalAdminCommissionsUSDT, setTotalAdminCommissionsUSDT] = useState(125.00);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthorized) {
      fetch("/api/user/session")
        .then(res => res.json())
        .then(data => {
          if (data) {
            setAdminBinanceWithdrawAddress(data.adminBinanceWithdrawAddress || "TYJpqo78QndhXswZ69YgsaA31V (TRC-20)");
            setAdminReferralLink(data.adminReferralLink || "https://accounts.binance.com/register?ref=BTF_772W");
            setTotalAdminCommissionsUSDT(data.totalAdminCommissionsUSDT || 125.00);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isAuthorized]);

  const handleUpdateAdminConfig = async () => {
    setAdminSuccessMsg(null);
    setAdminErrorMsg(null);
    try {
      const resp = await fetch("/api/admin/config/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminBinanceWithdrawAddress, adminReferralLink })
      });
      const data = await resp.json();
      if (resp.ok) {
        setAdminSuccessMsg(data.message || "Paramètres enregistrés avec succès !");
        triggerRefresh();
      } else {
        setAdminErrorMsg(data.error || "Une erreur est survenue lors de l'enregistrement config.");
      }
    } catch(err) {
      setAdminErrorMsg("Erreur réseau lors de la mise à jour");
    }
  };

  const handleWithdrawCommissions = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg(null);
    setAdminErrorMsg(null);
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setAdminErrorMsg("Veuillez saisir un montant de retrait supérieur à 0.");
      return;
    }
    try {
      const resp = await fetch("/api/admin/config/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: withdrawAmount })
      });
      const data = await resp.json();
      if (resp.ok) {
        setAdminSuccessMsg(data.message || "Retrait validé et envoyé sur votre compte Binance !");
        setTotalAdminCommissionsUSDT(data.totalAdminCommissionsUSDT);
        setWithdrawAmount("");
        triggerRefresh();
      } else {
        setAdminErrorMsg(data.error || "Une erreur boursière bloque l'opération de retrait.");
      }
    } catch (err) {
      setAdminErrorMsg("Erreur réseau boursier lors de la transaction.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinCode, mfaCode })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsAuthorized(true);
        triggerRefresh();
      } else {
        setAuthError(data.error || "Coordonnées d'authentification invalides.");
      }
    } catch (err) {
      setAuthError("Erreur de communication avec le serveur de sécurité.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionPayment = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const s = await onVerifyPayment(id, action);
    if (s) {
      triggerRefresh();
    }
  };

  const handleCertifyReport = (reportId: string) => {
    setCertifiedReports(prev => ({ ...prev, [reportId]: true }));
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="glass-panel p-6 rounded-2xl border border-red-500/20 shadow-2xl space-y-5 bg-slate-950">
          <div className="text-center space-y-2">
            <div className="p-3 bg-red-500/10 rounded-full text-red-400 w-12 h-12 flex items-center justify-center mx-auto">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="text-base font-display font-bold text-white uppercase tracking-wider">
              Accès Administrateur de Risque Sécurisé
            </h2>
            <p className="text-xs text-slate-400">
              Veuillez saisir votre code d'habilitation double facteur.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Code PIN d'Immédiateté</label>
              <input
                id="input-admin-pin"
                type="password"
                maxLength={8}
                placeholder="Indication démo : 226226"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-center tracking-widest text-white py-2.5 rounded-xl outline-none focus:border-red-500 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTP / MFA PHYSIQUE</label>
              <input
                id="input-admin-mfa"
                type="password"
                maxLength={6}
                placeholder="Indication démo : 9988"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-center tracking-widest text-white py-2.5 rounded-xl outline-none focus:border-red-500 font-mono"
                required
              />
            </div>

            {authError && (
              <div id="admin-auth-error" className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-2.5 rounded-lg text-center font-semibold">
                {authError}
              </div>
            )}

            <button
              id="btn-admin-submit-auth"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-red-500 text-slate-950 hover:bg-red-600 font-bold rounded-xl text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Key className="h-4 w-4" />
              <span>S'authentifier sur le portail</span>
            </button>
          </form>
          
          <div className="text-[9px] text-slate-500 text-center leading-relaxed font-mono">
            Toutes les tentatives de brute-forcing sont immédiatement rapportées à l'adresse de prévention BTF et l'adresse IP associée est bannie de la zone UEMOA.
          </div>
        </div>
      </div>
    );
  }

  const pendingPayments = payments.filter(p => p.status === "PENDING");

  return (
    <div className="space-y-6">
      
      {/* Risk Master Control Dashboard Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
        
        {/* Toggle Veto widget */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 space-y-3 bg-slate-900/40">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Droit de Veto Absolu</h4>
            <span className={`w-2.5 h-2.5 rounded-full ${isVetoActive ? "bg-red-500 animate-ping" : "bg-slate-700"}`} />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-100 uppercase">
              {isVetoActive ? "ACTIF (ORDRES BLOQUÉS)" : "INACTIF (AUTONOME LIBRE)"}
            </span>
            <button
              id="btn-toggle-veto"
              onClick={onToggleVeto}
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              {isVetoActive ? (
                <ToggleRight className="h-8 w-8 text-red-400" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-500" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-505 leading-snug">
            Bloque instantanément l'exécution autonome ou manuelle de tous les ordres d'achat et de vente.
          </p>
        </div>

        {/* Drawdown Indicator widget */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 space-y-3 bg-slate-900/40">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drawdown Quotidien 2%</h4>
            <span className={`w-2.5 h-2.5 rounded-full ${dailyDrawdownLimitReached ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-100 uppercase">
              {dailyDrawdownLimitReached ? "DÉPASSEment (BLOQUÉ)" : "SÉCURISÉ (CONFORME)"}
            </span>
            <button
              id="btn-toggle-drawdown"
              onClick={onToggleDrawdown}
              className="bg-slate-800 text-[10px] px-2.5 py-1 rounded border border-slate-700 hover:bg-slate-705 text-slate-300 font-bold cursor-pointer"
            >
              {dailyDrawdownLimitReached ? "DÉVERROUILLER" : "SIMULER CRASH"}
            </button>
          </div>
          <p className="text-[10px] text-slate-505 leading-snug">
            Coupe automatique de secours qui fige la plateforme en cas de dévalorisation journalière brute.
          </p>
        </div>

        {/* Pending payments counter widget */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 space-y-3 bg-slate-900/40">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Abonnements SaaS</h4>
            <span className="text-xs bg-slate-900 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-400">
              {pendingPayments.length} attente
            </span>
          </div>
          <div className="pt-2">
            <span className="text-[11px] text-slate-400 uppercase block">Total facturé :</span>
            <span className="text-base font-display font-bold text-white">
              {(pendingPayments.length * 5000).toLocaleString()} F CFA
            </span>
          </div>
        </div>

        {/* Database records counts */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 space-y-3 bg-slate-900/40">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base de données</h4>
            <Database className="h-4 w-4 text-slate-500" />
          </div>
          <div className="pt-2">
            <span className="text-[11px] text-slate-400 uppercase block">SaaS Sync :</span>
            <span className="text-base font-display font-bold text-white">
              {usersOverview.length || 1} utilisateurs
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left columns: Validate Transfer Orders deck + Reports audit */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Validation of Receipts panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Auditer les demandes d'activation d'abonnement SaaS</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">Orange/Moov/Wave</span>
            </h3>

            {pendingPayments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/20 rounded-xl border border-slate-900">
                Aucun reçu de virement de 5 000 F CFA en attente d'audit pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((pay) => (
                  <div id={`admin-pay-card-${pay.id}`} key={pay.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold font-mono uppercase">
                          {pay.operator}
                        </span>
                        <span className="text-xs font-display font-bold text-white ml-2 uppercase font-mono">ID: {pay.transactionId}</span>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold font-mono">{pay.amount.toLocaleString()} F CFA</span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <p>• Téléphone émetteur : <strong className="text-slate-200">{pay.phoneSender}</strong></p>
                      <p>• Compte Email : <strong className="text-slate-200">{pay.email}</strong></p>
                      <p>• Note jointe : <span className="italic">"{pay.proofDetails}"</span></p>
                    </div>

                    <div className="flex gap-2.5 pt-1.5 justify-end">
                      <button
                        id={`btn-deny-${pay.id}`}
                        onClick={() => handleActionPayment(pay.id, "REJECT")}
                        className="px-3.5 py-1.5 text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-slate-950 rounded-lg transition-all cursor-pointer"
                      >
                        REJETER (FAUX)
                      </button>
                      <button
                        id={`btn-approve-${pay.id}`}
                        onClick={() => handleActionPayment(pay.id, "APPROVE")}
                        className="px-3.5 py-1.5 text-[10px] font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-600 rounded-lg transition-all cursor-pointer"
                      >
                        APPROUVER (ACTIVER)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NEW MODULE: AUDIT AND CERTIFICATION OF ARBITRAGE SURVEYS (LOCAL / INT'L) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Portail de contrôle : Rapports d'Enquêtes Terrain & Web</span>
              <span className="text-[10px] bg-indigo-505/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-bold">Abonnés Collecteurs</span>
            </h3>

            {reports.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/20 rounded-xl border border-slate-900">
                Aucun rapport de terrain soumis par les collecteurs d'arbitrage.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-505 font-bold text-[9px] uppercase tracking-wider font-mono">
                      <th className="pb-3 text-left">PRODUIT & CORP</th>
                      <th className="pb-3 text-center">INDICE RARETÉ</th>
                      <th className="pb-3 text-right">PRIX ENQUÊTÉ</th>
                      <th className="pb-3 text-center">TENDANCE</th>
                      <th className="pb-3 text-right">DÉCISION ADMIN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {reports.map((rep) => {
                      const isInt = rep.description?.includes("[Source: INTERNATIONAL]") || rep.corridor === "Indicateurs Mondiaux";
                      const isCertified = certifiedReports[rep.id];

                      return (
                        <tr id={`admin-survey-row-${rep.id}`} key={rep.id} className="hover:bg-slate-900/40">
                          <td className="py-3">
                            <div className="space-y-0.5">
                              <span className="font-bold text-white block text-[11px]">{rep.product}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8.5px] px-1 rounded font-bold uppercase ${
                                  isInt ? "bg-[#eab308]/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                  {isInt ? "Mondial" : "UEMOA"}
                                </span>
                                <span className="text-[10px] text-slate-500 italic max-w-[140px] truncate" title={rep.description}>
                                  {rep.description?.replace(/\[Source: (LOCAL|INTERNATIONAL)\]\s?/, "")}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center text-slate-300 font-bold">
                            {rep.scarcityIndex}%
                          </td>
                          <td className="py-3 text-right font-bold text-slate-200">
                            {rep.observedPriceFCFA.toLocaleString()} FCFA
                          </td>
                          <td className="py-3 text-center">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              rep.trend === "UP" ? "text-red-400" : rep.trend === "DOWN" ? "text-emerald-400" : "text-slate-400"
                            }`}>
                              {rep.trend}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {isCertified ? (
                              <span className="text-emerald-400 text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                                ✓ CERTIFIÉ & SYNC
                              </span>
                            ) : (
                              <button
                                id={`btn-certify-survey-${rep.id}`}
                                onClick={() => handleCertifyReport(rep.id)}
                                className="bg-emerald-500 text-slate-950 hover:bg-emerald-600 font-mono font-bold text-[9px] px-2 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                Certifier l'enquête
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Users active summary */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Registre Général des Comptes (Base Supabase)</span>
              <span className="text-[10px] text-slate-550 font-mono">1 Session de démonstration</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold text-[9px] uppercase tracking-wider font-mono">
                    <th className="pb-3">EMAIL D'ACCÈS</th>
                    <th className="pb-3">DÉBUT ESSAI</th>
                    <th className="pb-3 text-center">ÉTAT ABONNEMENT</th>
                    <th className="pb-3 text-right">SOLDE COUVERTURE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {usersOverview.map((usr, i) => (
                    <tr id={`usr-row-${i}`} key={i} className="hover:bg-slate-900/40">
                      <td className="py-2.5 font-semibold text-slate-200">{usr.email}</td>
                      <td className="py-2.5 text-slate-500 text-[10.5px]">
                        {new Date(usr.trialStartDate).toISOString().substring(0, 10)}
                      </td>
                      <td className="py-2.5 text-center">
                        {usr.isSubscribed ? (
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                            ACTIF 30 JOURS
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px]">
                            ESSAI TRADING7J
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">
                        {usr.balanceFCFA?.toLocaleString() || "1 500 000"} F CFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Wallet Config, Commissions, and Firewall Logs */}
        <div className="space-y-6">
          
          {/* WALLET DE COMMISSION & CONFIGURATION SÉCURISÉE */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5 bg-slate-900/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-emerald-400" />
              <span>Wallet Admin & Parrainage</span>
            </h3>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Cagnotte Commission USDT accumulée :</span>
              <span className="text-xl font-display font-black text-emerald-400 font-mono">
                {totalAdminCommissionsUSDT.toFixed(4)} USDT
              </span>
              <span className="text-[9px] text-slate-500 block font-mono">Converti à la performance UEMOA</span>
            </div>

            {/* Config Edit Form */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Adresse USDT Admin TRC-20 (Dépôt)</label>
                <input
                  id="admin-withdraw-address-input"
                  type="text"
                  placeholder="par ex. TYJpqo78Qnd..."
                  value={adminBinanceWithdrawAddress}
                  onChange={(e) => setAdminBinanceWithdrawAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Lien Affilié Binance de l'Administrateur</label>
                <input
                  id="admin-ref-link-input"
                  type="text"
                  placeholder="par ex. https://accounts.binance..."
                  value={adminReferralLink}
                  onChange={(e) => setAdminReferralLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-205 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                id="btn-update-admin-config"
                onClick={handleUpdateAdminConfig}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer border border-slate-700"
              >
                Enregistrer les Coordonnées Admin
              </button>
            </div>

            {/* Withdrawal Trigger form */}
            <form onSubmit={handleWithdrawCommissions} className="space-y-2 pt-2 border-t border-slate-900">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider block font-mono">Retrait du Solde USDT</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Transférez vos actifs accumulés directement vers votre compte d'encaissement Binance.
              </p>
              
              <div className="flex gap-2.5">
                <input
                  id="admin-withdraw-amount-input"
                  type="number"
                  step="any"
                  placeholder="Montant USDT"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-505 font-mono"
                />
                <button
                  id="btn-admin-submit-withdraw"
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Retirer
                </button>
              </div>

              {adminSuccessMsg && (
                <div className="text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-2">
                  {adminSuccessMsg}
                </div>
              )}
              {adminErrorMsg && (
                <div className="text-red-400 text-[10px] font-semibold bg-red-500/10 border border-red-500/20 p-2 rounded-lg mt-2">
                  {adminErrorMsg}
                </div>
              )}
            </form>
          </div>

          {/* Interactive Firewall threat logs terminal */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="h-4.5 w-4.5 text-red-400" />
                <span>Journal d'audit Firewall</span>
              </h3>
              <button
                id="btn-refresh-logs"
                onClick={triggerRefresh}
                className="text-slate-500 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Terminal body */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 h-[500px] overflow-y-auto space-y-3 font-mono text-[10px] leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-10 font-mono">
                  Secured shield active. No unauthorized logs captured.
                </div>
              ) : (
                logs.map((log) => {
                  const isCritical = log.severity === "CRITICAL";
                  const isWarning = log.severity === "WARNING";
                  return (
                    <div id={`log-node-${log.id}`} key={log.id} className="border-b border-slate-900 pb-2 space-y-1">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className={`font-bold ${
                          isCritical ? "text-red-500 font-extrabold animate-pulse" : isWarning ? "text-amber-500" : "text-slate-450"
                        }`}>
                          [{log.action}]
                        </span>
                        <span className="text-slate-600">{new Date(log.timestamp).toISOString().substring(11, 19)} UTC</span>
                      </div>
                      <p className="text-slate-350">{log.details}</p>
                      <div className="text-slate-600 text-[8.5px]">
                        Source IP: {log.ip} • Severity: {log.severity}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

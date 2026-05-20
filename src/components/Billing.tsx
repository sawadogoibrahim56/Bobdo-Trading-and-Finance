/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  DollarSign, Send, HelpCircle, CheckCircle, Clock, ShieldAlert, BadgeCheck, FileText, 
  Award, Copy, Check, Users, ShieldCheck, Share2, Coins, ArrowRight, Zap, RefreshCw, Layers
} from "lucide-react";
import { UserSession, PaymentRequest } from "../types";

interface BillingProps {
  session: UserSession | null;
  paymentHistory: PaymentRequest[];
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  onSubmitPayment: (paymentData: any) => Promise<boolean>;
  triggerRefresh: () => void;
}

export default function Billing({
  session,
  paymentHistory,
  isTrialExpired,
  trialDaysRemaining,
  onSubmitPayment,
  triggerRefresh
}: BillingProps) {
  // Plan Selection State: 'PAID' or 'FREE_COMMISSION'
  const [selectedPlanType, setSelectedPlanType] = useState<'PAID' | 'FREE_COMMISSION'>(
    session?.subscriptionType === 'FREE_COMMISSION' ? 'FREE_COMMISSION' : 'PAID'
  );

  // Method of Premium Payment: Mobile money or Crypto
  const [paymentCategory, setPaymentCategory] = useState<'MOBILE_MONEY' | 'CRYPTOMONNAIE'>('MOBILE_MONEY');

  // Specific providers
  const [operator, setOperator] = useState<string>("Orange Money");
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("5000");
  const [phoneSender, setPhoneSender] = useState("");
  const [proofDetails, setProofDetails] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fallback visual phone numbers or crypto deposit keys
  const OPERATOR_PHONES: Record<string, string> = {
    "Orange Money": "76 99 XX XX (Saisir votre code confidentiel *144#)",
    "Moov Money": "60 11 XX XX (Composez *155#)",
    "Wave": "Utilisez le scan Wave ou transférez sur le numéro d'agent standard +226 70 XX XX XX"
  };

  const CRYPTO_DEPOSITS: Record<string, string> = {
    "Binance Pay ID": "99388102 (Destinataire: Bobdo Trading & Finance Holding)",
    "USDT TRC20": "TYJpqo78QndhXswZ69YgsaA31V (Réseau TRON - TRC20 uniquement)",
    "USDC ERC20": "0x9df48d2ab89ea342152f36bc6bcfaea331ceee9e",
    "BTC / Bitcoin": "bc1qxy2kg3f707628fxxxyyyzzzqqq111222333"
  };

  const referralLink = `https://btf-uemoa.com/?ref=${session?.referralCode || "SESS54OBD"}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSubscribeFreePlan = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const resp = await fetch("/api/user/subscribe-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await resp.json();
      if (resp.ok) {
        setStatusMessage(data.message || "Abonnement Plan commission activé ! Profitez de tous nos signaux et boursiers.");
        triggerRefresh();
      } else {
        setErrorMessage(data.error || "Une erreur est survenue lors de l'activation.");
      }
    } catch (err) {
      setErrorMessage("Erreur de communication avec le serveur boursier.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    if (!transactionId || !phoneSender) {
      setErrorMessage("Veuillez renseigner un ID de transaction valide et un numéro d'envoi ou adresse de paiement.");
      setIsLoading(false);
      return;
    }

    const payload = {
      operator,
      transactionId,
      amount,
      phoneSender,
      proofDetails: proofDetails || `Paiement d'abonnement premium 5 000 FCFA effectué via ${operator}.`
    };

    const success = await onSubmitPayment(payload);
    if (success) {
      setStatusMessage(`Reçu cryptographique/mobile ${operator} transmis ! L'administrateur valide manuellement votre accès sous 15 minutes max. Merci pour votre fidélité.`);
      setTransactionId("");
      setPhoneSender("");
      setProofDetails("");
      triggerRefresh();
    } else {
      setErrorMessage("Échec de la soumission de votre vœu de paiement. Réessayez.");
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      
      {/* Upper Status Banner Section - Larger Fonts & Beautiful frames */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Trial Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-5 bg-gradient-to-r from-slate-900/40 to-slate-950">
          <div className="p-4 bg-amber-500/10 rounded-xl text-amber-400">
            <Clock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Période d'Essai Gratuit</h4>
            <div className="flex items-baseline gap-2">
              <span className={`font-display font-extrabold text-2xl ${isTrialExpired ? 'text-red-500 font-black' : 'text-emerald-400'}`}>
                {isTrialExpired ? "Expiré" : `${trialDaysRemaining} jours`}
              </span>
              {!isTrialExpired && <span className="text-xs text-slate-500">restants</span>}
            </div>
            <p className="text-xs text-slate-400">Simulation de trading active et libre.</p>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-5 bg-gradient-to-r from-slate-900/40 to-slate-950">
          <div className={`p-4 rounded-xl ${session?.isSubscribed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
            <BadgeCheck className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Statut Réseau BTF</h4>
            <div>
              <span className={`font-display font-extrabold text-xl ${session?.isSubscribed ? 'text-emerald-400' : 'text-red-500'}`}>
                {session?.isSubscribed 
                  ? (session.subscriptionType === 'FREE_COMMISSION' ? "Plan Commission Actif" : "Premium 100% Validé") 
                  : "Accès d'essai limité"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {session?.isSubscribed 
                ? "Connexions de trading authentiques autorisées." 
                : "Abonnement requis pour le trading direct automatique."}
            </p>
          </div>
        </div>

        {/* Active Model Tariff */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-5 bg-gradient-to-r from-slate-900/40 to-slate-950">
          <div className="p-4 bg-indigo-505/10 rounded-xl text-indigo-400">
            <Coins className="h-7 w-7 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Modèle d'Exécution</h4>
            <div>
              <span className="font-display font-extrabold text-2xl text-slate-200">
                {session?.subscriptionType === 'FREE_COMMISSION' ? "0 F CFA (Partage 20%)" : "5 000 F CFA / mois"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {session?.subscriptionType === 'FREE_COMMISSION' 
                ? "Prélèvement de 20% sur profits boursiers." 
                : "100% des bénéfices vous sont versés."}
            </p>
          </div>
        </div>

      </div>

      {/* CORE SUBSCRIPTION OPTIONS PANEL */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold font-mono uppercase tracking-widest">
            Sélection de votre structure de rechargement
          </span>
          <h2 className="text-xl font-display font-black text-white">Comment souhaitez-vous utiliser le Bot Bobdo Trading ?</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Nous proposons un modèle forfaitaire sans surprise et un modèle libre à la performance. Choisissez le plan adapté à votre capital et vos disponibilités financières.
          </p>
        </div>

        {/* Responsive Grid layout for Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* PLAN A: PREPAID PREMIUM (AMBER / GOLD CARD) */}
          <div className={`p-6 rounded-3xl border-4 transition-all duration-300 ${
            selectedPlanType === 'PAID' 
              ? 'border-amber-500 bg-gradient-to-br from-slate-900 to-amber-950/40 shadow-2xl shadow-amber-950/30 transform scale-102' 
              : 'border-amber-500/20 bg-slate-950/30 hover:border-amber-500/50'
          }`}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-black text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  OPTION RECOMMANDÉE • FORFAIT CLOUD
                </span>
                <h3 className="text-xl font-display font-black text-white mt-1.5">Abonnement Mensuel Premium</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-display font-black text-amber-500">5 000 F CFA</span>
                <span className="text-xs text-slate-450 block font-mono">par mois net</span>
              </div>
            </div>

            <ul className="mt-5 space-y-3.5 text-slate-300 text-xs sm:text-sm">
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <span><strong>Conservez 100% de vos gains</strong> d'arbitrage croisé régional.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <span>Paiement flexible : Mobile Money ou <strong>Crypto-USDT (Binance Pay)</strong>.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <span>Veto automatique désengagé sur vos clés API boursières réelles.</span>
              </li>
            </ul>

            <button
              id="set-plan-paid-btn"
              onClick={() => setSelectedPlanType('PAID')}
              className={`w-full mt-6 py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedPlanType === 'PAID'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-850'
              }`}
            >
              Sélectionner le Plan Premium (5 000 F)
            </button>
          </div>

          {/* PLAN B: FREE COMMISSION (VIOLET / INDIGO CARD) */}
          <div className={`p-6 rounded-3xl border-4 transition-all duration-300 ${
            selectedPlanType === 'FREE_COMMISSION' 
              ? 'border-violet-500 bg-gradient-to-br from-slate-900 to-violet-950/40 shadow-2xl shadow-violet-950/30 transform scale-102' 
              : 'border-violet-500/20 bg-slate-950/30 hover:border-violet-500/50'
          }`}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-black text-violet-400 bg-violet-500/10 border border-violet-500/30 px-2.5 py-0.5 rounded-full">
                  ZÉRO FRAIS D'AVANCE • LIBRE
                </span>
                <h3 className="text-xl font-display font-black text-white mt-1.5">Plan Commission Performance</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-display font-black text-violet-400">0 F CFA</span>
                <span className="text-xs text-slate-450 block font-mono">Partage 20% (profits)</span>
              </div>
            </div>

            <ul className="mt-5 space-y-3.5 text-slate-300 text-xs sm:text-sm">
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                <span><strong>Pas d'argent requis à l'entrée</strong> pour souscrire.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                <span><strong>Prélèvement direct de 20% commission</strong> sur chaque deal d'arbitrage profitable.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                <span>Commission convertie et transférée aux affiliés et à l'administrateur.</span>
              </li>
            </ul>

            <button
              id="set-plan-free-btn"
              onClick={() => setSelectedPlanType('FREE_COMMISSION')}
              className={`w-full mt-6 py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedPlanType === 'FREE_COMMISSION'
                  ? 'bg-violet-500 text-white shadow-lg'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-850'
              }`}
            >
              Sélectionner le Plan Commission (Gratuit)
            </button>
          </div>

        </div>

        {/* Free plan action trigger */}
        {selectedPlanType === 'FREE_COMMISSION' && (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 text-center max-w-xl mx-auto space-y-4">
            <Layers className="h-10 w-10 text-indigo-400 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white font-display">Activer l'accès illimité sans payer</h4>
              <p className="text-xs text-slate-400 font-mono">
                En activant ce plan, vous autorisez notre Risk Manager à retenir 20% de vos plus-values boursières.
              </p>
            </div>
            
            <button
              id="btn-activate-free-plan-direct"
              onClick={handleSubscribeFreePlan}
              disabled={isLoading || session?.subscriptionType === 'FREE_COMMISSION'}
              className="px-6 py-2 text-xs font-black bg-indigo-505 text-white hover:bg-indigo-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {session?.subscriptionType === 'FREE_COMMISSION' 
                ? "✓ VOTRE ABONNEMENT COMMISSION EST DÉJÀ ACTIF" 
                : "ACTIVER MON COMPTE AVEC LE PLAN COMMISSION MAINTENANT"}
            </button>
          </div>
        )}
      </div>

      {/* DETAILED PREMIUM FORM (Only visible when PAID selected) */}
      {selectedPlanType === 'PAID' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Main Payment Forms Deck */}
          <div className="lg:col-span-3">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-4 border-slate-700 bg-slate-900/40 space-y-6 shadow-2xl">
              
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Paiements Internationaux & Locaux</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30 font-mono">SÉCURISATION SSL</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sélectionnez votre méthode préférée ci-dessous (Mobile Money standard de l'UEMOA ou Cryptomonnaie internationale USDT/BTC).
                </p>
              </div>

              {/* Toggle Category Button */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-1.5 rounded-xl border border-slate-900">
                <button
                  id="tab-pay-mobile"
                  onClick={() => {
                    setPaymentCategory('MOBILE_MONEY');
                    setOperator('Orange Money');
                  }}
                  className={`py-2 rounded-lg font-bold text-xs cursor-pointer text-center transition-all ${
                    paymentCategory === 'MOBILE_MONEY' 
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800/80 shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔋 Mobile Money Local
                </button>
                <button
                  id="tab-pay-crypto"
                  onClick={() => {
                    setPaymentCategory('CRYPTOMONNAIE');
                    setOperator('USDT TRC20');
                  }}
                  className={`py-2 rounded-lg font-bold text-xs cursor-pointer text-center transition-all ${
                    paymentCategory === 'CRYPTOMONNAIE' 
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800/80 shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🚀 Cryptomonnaie (Binance / Adresse)
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                
                {/* 1. Mobile Money selector */}
                {paymentCategory === 'MOBILE_MONEY' ? (
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">F CFA Opérateur</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(["Orange Money", "Moov Money", "Wave"] as const).map((op) => (
                        <button
                          id={`op-select-${op.replace(" ", "")}`}
                          key={op}
                          type="button"
                          onClick={() => setOperator(op)}
                          className={`py-3 px-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            operator === op
                              ? "bg-slate-800 border-emerald-500 text-emerald-400 shadow-md"
                              : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white"
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>

                    <div className="bg-slate-950/70 p-4.5 rounded-xl border border-slate-900 space-y-2">
                      <span className="text-[11px] font-bold text-white font-mono block">CONSIGNES ENVOI MOBILE MONEY :</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        Veuillez composer votre code de transfert pour envoyer <strong className="text-white">5 000 F CFA</strong> au guichet :
                      </p>
                      <div className="text-emerald-400 font-extrabold bg-slate-900 p-3 rounded-lg border border-slate-850/80 font-mono text-[11px] select-all">
                        {OPERATOR_PHONES[operator] || OPERATOR_PHONES["Orange Money"]}
                      </div>
                    </div>
                  </div>
                ) : (
                  // 2. Cryptomonnaie payment methods
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sélectionner la Devise Crypto (Équivalent 5000 F CFA / ~8.50 USDT)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["USDT TRC20", "Binance Pay ID", "USDC ERC20", "BTC / Bitcoin"] as const).map((crypto) => (
                        <button
                          id={`op-crypto-select-${crypto.replace(/[\s/]/g, "")}`}
                          key={crypto}
                          type="button"
                          onClick={() => setOperator(crypto)}
                          className={`py-2.5 px-1 rounded-xl border text-center font-bold text-[10px] sm:text-xs transition-all cursor-pointer ${
                            operator === crypto
                              ? "bg-slate-850 border-emerald-500 text-emerald-400 shadow-md"
                              : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white"
                          }`}
                        >
                          {crypto}
                        </button>
                      ))}
                    </div>

                    <div className="bg-slate-950/70 p-4.5 rounded-xl border border-slate-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white font-mono block">COUPON CRYPTo DÉBITEUR :</span>
                        <span className="text-[10px] text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded">
                          Taux: 1 USDT = 600 FCFA
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        Veuillez transférer exactement <strong className="text-white">8.50 USDT</strong> (ou équivalent) à l'adresse de dépôt administrative :
                      </p>
                      <div className="text-emerald-400 font-extrabold bg-slate-900 p-3 rounded-lg border border-slate-850/80 font-mono text-center text-xs break-all select-all">
                        {CRYPTO_DEPOSITS[operator] || CRYPTO_DEPOSITS["USDT TRC20"]}
                      </div>
                      <p className="text-[10px] text-slate-500 italic font-mono">
                        ⚠️ Note : Les transferts blockchains exigent une validation par transaction ID. Gardez bien votre preuve ou TxID.
                      </p>
                    </div>
                  </div>
                )}

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {paymentCategory === 'CRYPTOMONNAIE' ? "ID de Transaction / TxID Hash" : "Référence de Transaction SMS / ID local"}
                    </label>
                    <input
                      id="input-billing-trans"
                      type="text"
                      placeholder={paymentCategory === 'CRYPTOMONNAIE' ? "ex. b89ea342152f36bc6bcfaea331ceee9e9f..." : "ex. TX1928271.1822 ou MP09187"}
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frais d'activation configurés</label>
                    <input
                      id="input-billing-val"
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-400 px-3 py-2.5 rounded-xl font-mono outline-none cursor-not-allowed"
                      value={paymentCategory === 'CRYPTOMONNAIE' ? "8.50 USDT (~5000 F CFA)" : "5000 F CFA"}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {paymentCategory === 'CRYPTOMONNAIE' ? "Votre adresse crypto de paiement (Destinateur)" : "Votre numéro de téléphone d'envoi / Expéditeur"}
                  </label>
                  <input
                    id="input-billing-sender"
                    type="text"
                    placeholder={paymentCategory === 'CRYPTOMONNAIE' ? "ex: 0x9df4... ou Binance Pay ID" : "ex: +226 76 XX XX XX"}
                    value={phoneSender}
                    onChange={(e) => setPhoneSender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Complément de preuve (optionnel)</label>
                  <textarea
                    id="textarea-billing-note"
                    rows={2}
                    placeholder="Saisissez des indications complémentaires si nécessaire pour accélérer l'approbation manuelle administrative."
                    value={proofDetails}
                    onChange={(e) => setProofDetails(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>

                {statusMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl font-semibold">
                    {statusMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl font-semibold">
                    {errorMessage}
                  </div>
                )}

                <button
                  id="btn-bill-premium-action"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                  <span>Soumettre ma validation premium</span>
                </button>

              </form>

            </div>
          </div>

          {/* Submitted Logs/Receipts Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-emerald-400" />
                <span>Registre Personnel des Dépôts</span>
              </h3>

              {paymentHistory.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                  Aucune preuve de dépôt soumise pour l'instant.
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {paymentHistory.map((pay) => (
                    <div id={`pay-node-${pay.id}`} key={pay.id} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase p-1 bg-slate-900 rounded border border-slate-800">
                          {pay.operator}
                        </span>
                        
                        {pay.status === "PENDING" ? (
                          <span className="text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 animate-pulse">
                            En Attente Auto
                          </span>
                        ) : pay.status === "APPROVED" ? (
                          <span className="text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            Validé ✓
                          </span>
                        ) : (
                          <span className="text-red-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                            Rejeté ✕
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono p-1.5 bg-slate-950 rounded select-all break-all text-slate-350">
                        {pay.transactionId}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-505 pt-2 border-t border-slate-900">
                        <span className="truncate max-w-[120px]">Src: {pay.phoneSender}</span>
                        <span className="text-emerald-400 font-bold">{pay.amount.toLocaleString()} F CFA</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shield check disclaimer */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-emerald-500/5 flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold text-[10px] text-emerald-400 uppercase tracking-widest block font-mono">Assurance Boursière Immuable</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Notre infrastructure n'enregistre jamais de données bancaires en clair ou de clés privées de paiements. Toutes les transactions blockchains/SMS sont auditées de façon cryptographique.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* NEW SYSTEM: COMPREHENSIVE DYNAMIC REFERRAL PLATFORM (SYSTÈME DE PARRAINAGE) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div className="space-y-1">
            <h3 className="text-base font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="h-5.5 w-5.5 text-[#eab308]" />
              <span>Programme d'Affiliation & Parrainage UEMOA</span>
            </h3>
            <p className="text-xs text-slate-400">
              Développez l’écosystème financier de Bobdo et gagnez des primes directes de parrainage de 250 F CFA par affiliation qualifiée !
            </p>
          </div>
          
          {/* Active stats badge */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex items-center gap-3">
            <Users className="h-5 w-5 text-emerald-400" />
            <div className="text-right">
              <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Votre Code unique</span>
              <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                {session?.referralCode || "SESS54OBD"}
              </span>
            </div>
          </div>
        </div>

        {/* Informative Step guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] font-bold">
              <span className="bg-emerald-500 text-slate-950 h-5 w-5 rounded-full flex items-center justify-center font-bold">1</span>
              <span>PARTAGEZ VOTRE CRÉODENCE</span>
            </div>
            <p className="text-[11px] text-slate-350 leading-relaxed">
              Copiez et transmettez votre lien de recommandation à vos amis, partenaires de trading et groupes d'Afrique de l'Ouest.
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
            <div className="flex items-center gap-2 text-[#eab308] font-mono text-[10px] font-bold">
              <span className="bg-[#eab308] text-slate-950 h-5 w-5 rounded-full flex items-center justify-center font-bold">2</span>
              <span>SOUSCRIPTION DU FILLEUL</span>
            </div>
            <p className="text-[11px] text-slate-350 leading-relaxed">
              Dès qu'un filleul active l’abonnement Premium boursier à 5 000 F CFA net, vous gagnez immédiatement <strong className="text-white">250 F CFA</strong> crédités !
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] font-bold">
              <span className="bg-indigo-500 text-white h-5 w-5 rounded-full flex items-center justify-center font-bold">3</span>
              <span>PALIER PLAN COMMISSION</span>
            </div>
            <p className="text-[11px] text-slate-350 leading-relaxed">
              Si vos filleuls préfèrent le plan libre sans avance, vous encaissez <strong className="text-white">250 F CFA</strong> chaque fois que leurs commissions versées à l’admin franchissent 5 000 F CFA.
            </p>
          </div>

        </div>

        {/* Copy Shareable Link Area */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col sm:flex-row items-center gap-3">
          <input
            id="input-ref-link"
            type="text"
            className="flex-1 bg-slate-900 text-slate-300 text-xs px-3 py-2.5 rounded-xl border border-slate-800 font-mono outline-none cursor-text select-all"
            value={referralLink}
            readOnly
          />
          <button
            id="btn-copy-ref-link"
            onClick={handleCopyReferral}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-mono font-bold text-slate-950 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedLink ? "Lien Copié !" : "Copier mon lien de parrainage"}</span>
          </button>
        </div>

        {/* KPI Counter grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Invités Recrutés</span>
            <span className="text-2xl font-display font-black text-white font-mono">{session?.referralCount || 0}</span>
            <span className="text-[10px] text-slate-400 block font-mono">fiables connectés</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Vos Primes Encaissées</span>
            <span className="text-2xl font-display font-black text-emerald-400 font-mono">
              {(session?.referralEarningsFCFA || 0).toLocaleString()} F CFA
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">ajouts de solde réels</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Curseur commission filleul</span>
            <span className="text-2xl font-display font-black text-indigo-400 font-mono">
              {(session?.accumulatedFreeCommissionFCFA || 0).toLocaleString()} / 5 000 F
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">prochain versement de 250 F</span>
          </div>

        </div>

        {/* Simulated Affiliates list to prove the working traction */}
        <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-850 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-2">
            <Share2 className="h-4 w-4 text-emerald-400" />
            <span>Filleuls récents inscrits par votre parrainage</span>
          </h4>
          <div className="space-y-2 text-xs font-mono text-slate-400">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
              <span className="text-white">a***_kabre54@gmail.com</span>
              <span className="text-[10px] p-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Abonné Premium (+250 F)</span>
              <span className="text-slate-550">Inscrit le 14/05/2026</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
              <span className="text-white">s***_omoney@uemoa.bf</span>
              <span className="text-[10px] p-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Abonné Premium (+250 F)</span>
              <span className="text-slate-550">Inscrit le 12/05/2026</span>
            </div>
            <div className="flex justify-between items-center py-1.5 font-mono">
              <span className="text-white">p***_ouaga@outlook.fr</span>
              <span className="text-[10px] p-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">Plan Commission Libre (20%)</span>
              <span className="text-slate-550">Inscrit le 10/05/2026</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

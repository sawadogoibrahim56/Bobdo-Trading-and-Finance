/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Shield, Mail, ArrowRight, UserCheck, Sparkles, Server } from "lucide-react";

interface AuthOnboardingProps {
  onLogin: (email: string) => void;
}

export default function AuthOnboarding({ onLogin }: AuthOnboardingProps) {
  const [activeTab, setActiveTab] = useState<"real" | "demo">("real");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setIsLoading(true);
    try {
      // Direct enrollment on server to setup persistent Postgres DB entry
      const response = await fetch("/api/user/session", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email.trim().toLowerCase()
        }
      });

      if (response.ok) {
        onLogin(email.trim().toLowerCase());
      } else {
        setError("Erreur de synchronisation avec le pare-feu de sécurité BTF.");
      }
    } catch (err) {
      setError("Le serveur BTF est injoignable. Démarrez le dev-server ou vérifiez votre réseau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = () => {
    onLogin("ibsawadogo54@gmail.com");
  };

  return (
    <div id="auth-onboarding-screen" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_65%)] pointer-events-none" />
      
      <div className="w-full max-w-xl glass-panel border border-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 bg-gradient-to-b from-slate-950 to-slate-900/40">
        
        {/* Brand Header */}
        <div className="text-center space-y-3.5 pb-8 border-b border-slate-900">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Bobdo Security Hub</span>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight mt-1.5">
            BOBDO <span className="text-emerald-400">Trading &amp; Finance</span>
          </h1>
          <p className="text-slate-400 text-slate-350 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Réseau de couverture autonome pour l'arbitrage physique de commodités agricoles et le trading de crypto-actifs mondiaux. Conforme aux normes réglementaires de l'UEMOA.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 bg-slate-950 border border-slate-900 rounded-2xl p-1 mt-6">
          <button
            id="tab-auth-real"
            onClick={() => { setActiveTab("real"); setError(null); }}
            className={`py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === "real"
                ? "bg-slate-900 border border-slate-800 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>S'inscrire / Compte Réel</span>
          </button>
          <button
            id="tab-auth-demo"
            onClick={() => { setActiveTab("demo"); setError(null); }}
            className={`py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === "demo"
                ? "bg-slate-900 border border-slate-800 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Server className="h-3.5 w-3.5 text-slate-500" />
            <span>Accès Démo Instantané</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        {activeTab === "real" ? (
          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div className="space-y-2">
              <label htmlFor="auth-email-input" className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-slate-500" />
                <span>Votre Adresse E-mail (Identifiant Unique)</span>
              </label>
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="Ex. kaborereel@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 text-sm text-slate-100 placeholder-slate-600 px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-slate-900/50 transition-all font-mono"
              />
              <p className="text-[10px] text-slate-400 leading-normal">
                Nouveau compte créé à la volée. Stockage sécurisé et crypté dans l'infrastructure de la micro-finance de trading.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="auth-ref-input" className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider block">
                Code de parrainage (Optionnel)
              </label>
              <input
                id="auth-ref-input"
                type="text"
                placeholder="Ex. SESS54OBD (Permet d'annuler les frais)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 text-sm text-slate-100 placeholder-slate-600 px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <button
              id="btn-submit-onboarding"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <span>{isLoading ? "VÉRIFICATION..." : "Créer / Ouvrir mon Portefeuille"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="p-4.5 rounded-2xl bg-slate-950/60 border border-slate-900 text-slate-350 text-xs sm:text-sm space-y-3">
              <p className="leading-relaxed">
                Le compte démonstration vous permet d'explorer immédiatement l'ensemble des modules pré-configurés :
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400 font-mono text-xs">
                <li>Capital Fictif : <span className="text-emerald-400">1 500 000 F CFA</span></li>
                <li>Fonds Cryptographiques : <span className="text-emerald-400">2 500 USDT</span></li>
                <li>Flux de salle des marchés BRVM interactif</li>
                <li>Raccordement simulé d'exchanges mondiaux</li>
              </ul>
            </div>

            <button
              id="btn-submit-demo"
              onClick={handleDemoClick}
              className="w-full py-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 hover:text-white hover:bg-slate-850 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <span>Entrer avec le Compte Démonstration</span>
            </button>
          </div>
        )}

        {/* SSL indicator */}
        <div className="mt-8 text-center text-[10px] text-slate-600 flex items-center justify-center gap-1.5 uppercase tracking-widest leading-none">
          <Shield className="h-3 w-3 text-emerald-500/60" />
          <span>SERVEURS CHIFFRÉS SSL GRADE SÉCURITÉ MILITAIRE</span>
        </div>
      </div>
    </div>
  );
}

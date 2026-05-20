/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, HelpCircle, Shield, Award, Send, Coins, Globe, Clock, Layers, Sparkles, 
  ArrowRight, Users, CheckCircle, Smartphone, Lock, AlertCircle, RefreshCw, Key
} from "lucide-react";

interface HelpManualProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpManual({ isOpen, onClose }: HelpManualProps) {
  const [activeTab, setActiveTab] = useState<'distribution' | 'binance' | 'payment' | 'concept'>('distribution');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Large visual card with a thick, satisfying border structure and mix of high-contrast colors */}
      <div className="bg-slate-900 border-4 border-slate-700 max-w-5xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]">
        
        {/* Colorful header with gold gradient background */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-amber-950 p-6 border-b-4 border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg border-2 border-slate-850 animate-pulse">
              <Sparkles className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black text-white flex items-center gap-2">
                <span>MANUEL GÉNÉRAL DE SÉCURITÉ & PROTOCOLES</span>
                <span className="text-xs bg-amber-550 text-slate-950 font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-widest">
                  Aide & FAQ
                </span>
              </h2>
              <p className="text-xs text-slate-350 mt-0.5">
                Comprendre le fonctionnement autonome, la distribution de commissions, l'intégration Binance et la gestion des dépôts.
              </p>
            </div>
          </div>
          <button
            id="btn-close-help-manual"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950/60 hover:bg-red-500 hover:text-white border-2 border-slate-800 transition-colors text-slate-400 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection Area - Visual Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-950/80 p-2.5 border-b-2 border-slate-800 gap-1.5">
          <button
            id="tab-help-distribution"
            onClick={() => setActiveTab('distribution')}
            className={`py-2.5 px-3 rounded-xl font-display font-black text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'distribution'
                ? 'bg-amber-500 text-slate-950 shadow-md transform scale-102 ring-2 ring-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>1. Parrainage Automatisé</span>
          </button>
          
          <button
            id="tab-help-binance"
            onClick={() => setActiveTab('binance')}
            className={`py-2.5 px-3 rounded-xl font-display font-black text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'binance'
                ? 'bg-indigo-505 text-white shadow-md transform scale-102 ring-2 ring-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>2. Liaison Binance API</span>
          </button>

          <button
            id="tab-help-payment"
            onClick={() => setActiveTab('payment')}
            className={`py-2.5 px-3 rounded-xl font-display font-black text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'payment'
                ? 'bg-emerald-500 text-slate-950 shadow-md transform scale-102 ring-2 ring-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>3. Dépôts (OM / Wave / Crypto)</span>
          </button>

          <button
            id="tab-help-concept"
            onClick={() => setActiveTab('concept')}
            className={`py-2.5 px-3 rounded-xl font-display font-black text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'concept'
                ? 'bg-violet-500 text-white shadow-md transform scale-102 ring-2 ring-violet-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>4. Modèles de Recharges</span>
          </button>
        </div>

        {/* Scrollable multi-color panel body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900/60 custom-scrollbar">

          {/* TAB 1: HOW BOBO HANDLES AFFILIATE FEES & DISTRIBUTION */}
          {activeTab === 'distribution' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-extrabold text-white">🏆 Distribution Automatisée des Primes d'Affiliation</h3>
                <p className="text-xs text-slate-400">
                  Découvrez comment notre grand livre (Ledger) automatise à 100% le partage de richesse entre les parrains et leurs filleuls sans action requise de votre part.
                </p>
              </div>

              {/* Grid of Distinct Highlighted Cards (Mix of colors: Amber/Gold, Violet, Blue) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Gold Card: Instant pre-paid reward */}
                <div className="bg-amber-950/40 p-5 rounded-2xl border-4 border-amber-500 text-slate-200 space-y-3.5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-lg">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 block uppercase">BONUS INSTANTANÉ PREMIUM</span>
                      <h4 className="text-sm font-black text-white">Filleul Forfaitaire Payé (5 000 F)</h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Lorsqu'un filleul déploie l'accès premium forfaitaire en payant <strong className="text-white">5 000 F CFA</strong>, notre moteur d'allocation redistribue immédiatement une prime de <span className="text-amber-400 font-extrabold text-sm">250 F CFA</span> au parrain. 
                  </p>
                  <p className="text-xs text-slate-400 font-mono bg-slate-950 p-2 rounded border border-amber-500/20">
                    💡 Processus: Automatique & Virtuel. Crédité instantanément au solde disponible du parrain dans le système boursier.
                  </p>
                </div>

                {/* Violet Card: Milestone-based fee deduction */}
                <div className="bg-violet-950/40 p-5 rounded-2xl border-4 border-violet-500 text-slate-200 space-y-3.5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500 text-white rounded-lg">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-violet-400 block uppercase font-black">PALIER COMMISSION COMMERCIALE</span>
                      <h4 className="text-sm font-black text-white">Filleul avec Plan Libre (20%)</h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Si votre filleul choisit d'exécuter le bot sans frais d'avance (Plan Commission), une redevance de 20% sur ses bénéfices est prélevée. À chaque franchissement d'un montant combiné de <strong className="text-white">5 000 F CFA</strong> reversé à l'administrateur, le parrain reçoit instantanément <span className="text-violet-400 font-extrabold text-sm">250 F CFA</span> de gain résiduel !
                  </p>
                  <p className="text-xs text-slate-400 font-mono bg-slate-950 p-2 rounded border border-violet-500/20">
                    🔋 Suivi: Le compteur de commission en temps réel suit la contribution cumulée de chaque filleul de façon transparente.
                  </p>
                </div>

              </div>

              {/* Informative Blue Bar detailing the transaction mechanics */}
              <div className="bg-indigo-950/40 p-5 rounded-2xl border-4 border-indigo-500 space-y-2">
                <span className="text-[10px] font-mono font-bold text-indigo-400 block uppercase">PROTOCOLE ULTRA-VÉLOCE DE DISTRIBUTION :</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Contrairement aux systèmes pyramidaux traditionnels ou aux banques lentes qui exigent 48 heures d'attente, l'attribution est résolue par notre <strong className="text-white">Risk Manager API</strong> boursier en micro-secondes. Les primes de parrainage augmentent directement votre capital de trading disponible, vous permettant de capitaliser instantanément sur de plus grosses opérations d'arbitrage régionales.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: REQUESTS AND SECURE TRANSFERS WITH BINANCE API */}
          {activeTab === 'binance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-extrabold text-white">🔌 Liaison Binance, Protection des Actifs & Retraits Administrateur</h3>
                <p className="text-xs text-slate-400">
                  Découvrez comment Bobdo interagit avec le réseau Binance et pourquoi votre capital d'investissement ne court absolument aucun risque.
                </p>
              </div>

              {/* Grid with 3 distinctive column colors : Violet, Grey, Gold */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Violet Card: Veto Protection */}
                <div className="bg-violet-950/30 p-4 rounded-xl border-4 border-violet-500 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-violet-400 shrink-0" />
                    <h4 className="text-xs font-bold text-white uppercase font-mono">1. Veto "No-Withdrawal"</h4>
                  </div>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    Les clés API que vous transmettez doivent obligatoirement être générées avec la case <strong className="text-white">"Enable Withdrawals" désactivée (décochée)</strong> sur Binance.
                  </p>
                  <p className="text-[11.5px] text-violet-300 font-mono">
                    🛡️ Résultat: Le robot n'a aucun pouvoir de retrait d'actifs. Il peut seulement lire les prix et lancer des ordres locaux d'achat/vente à haute vitesse.
                  </p>
                </div>

                {/* 2. Grey Card: Request dispatching */}
                <div className="bg-slate-900 p-4 rounded-xl border-4 border-slate-600 space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-slate-400 shrink-0" />
                    <h4 className="text-xs font-bold text-white uppercase font-mono">2. Automatisation API</h4>
                  </div>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    Le serveur Bobdo transmet des requêtes standardisées <strong className="text-white">REST / WebSockets</strong> cryptées en TLS 1.3 directement aux datacenters de Binance pour exécuter les arbitrage Spot.
                  </p>
                  <p className="text-[11.5px] text-slate-400 font-mono">
                    🤖 Résolution: Les plus-values atterrissent instantanément dans votre portefeuille Binance réel de façon autonome.
                  </p>
                </div>

                {/* 3. Gold Card: Reverse Comm Allocation */}
                <div className="bg-amber-950/20 p-4 rounded-xl border-4 border-amber-500 space-y-3">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-400 shrink-0" />
                    <h4 className="text-xs font-bold text-white uppercase font-mono">3. Reverse Commissions</h4>
                  </div>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    Pour le plan libre performance (FREE), à chaque arbitrage gagnant, la commission de 20% est convertie virtuellement en <strong className="text-white">USDT</strong> et cumulée côté administrateur.
                  </p>
                  <p className="text-[11.5px] text-amber-500 font-mono font-bold">
                    💰 Retrait Blockchain Admin: L'administrateur peut ensuite retirer cette cagnotte d'un simple clic vers son adresse crypto TRC-20 sécurisée !
                  </p>
                </div>

              </div>

              {/* Warning box explicitly detailing safety and how we bypass local network failures */}
              <div className="bg-slate-950 p-4.5 rounded-xl border-2 border-red-500/40 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-extrabold">
                  <AlertCircle className="h-4.5 w-4.5" />
                  <span>SÉCURITÉ INFRANGIBLE COINBASE & BINANCE CLOUD SECURITY :</span>
                </div>
                <p className="leading-relaxed">
                  Grâce au modèle server-side asynchrone (Module E), toutes vos connexions d'API s'authentifient sur une adresse IP fixe hébergée sur des serveurs haute fidélité. Aucun risque de blocage géographique (ban IP) par Binance lié aux connexions intermittentes d'Afrique de l'Ouest (Côte d'Ivoire, Burkina Faso, Mali, Sénégal, etc.).
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: PAYMENT TICKETS AND SUBMISSION CHANNELS */}
          {activeTab === 'payment' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-extrabold text-white">🎟️ Soumission de Validation: Comment marchent les requêtes de dépôts ?</h3>
                <p className="text-xs text-slate-400">
                  Découvrez comment soumettre précisément un ticket de paiement local (Mobile Money) ou de transfert blockchain pour activer instantanément votre accès Premium d'écosystème.
                </p>
              </div>

              {/* 3 Colorful visual cards: Green for Orange, Gold for Wave/Moov, Blue for Crypto */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Green Card: Local Mobile money submission */}
                <div className="bg-emerald-950/30 p-5 rounded-xl border-4 border-emerald-500 space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-emerald-400 shrink-0" />
                    <h4 className="text-xs font-black text-white uppercase">Mobile Money (F CFA)</h4>
                  </div>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed">
                    Transférez vos <strong className="text-white">5 000 F CFA</strong> à notre caisse d'encaissement via les menus standards d'Afrique (OM *144#, Moov *155#, Wave). Vous obtenez un SMS de reçu détaillé contenant un <strong className="text-white">ID de transaction</strong> unique.
                  </p>
                  <p className="text-[11px] text-emerald-400 font-mono">
                    📝 Rédigez le ticket: Renseignez cet ID local et votre numéro émetteur dans le formulaire d'abonnement.
                  </p>
                </div>

                {/* 2. Gold Card: Crypto blockchain submission */}
                <div className="bg-amber-950/30 p-5 rounded-xl border-4 border-amber-500 space-y-3">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-400 shrink-0" />
                    <h4 className="text-xs font-black text-white uppercase">Cryptomonnaie (USDT/BTC)</h4>
                  </div>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed">
                    Envoyez exactement <strong className="text-white">8.50 USDT</strong> (sur TRC20, Binance Pay ou USDC) au wallet officiel affiché à l'écran. La blockchain génère instantanément un reçu cryptographique immuable contenant un hash public (<strong className="text-white">TxID</strong>).
                  </p>
                  <p className="text-[11px] text-amber-500 font-mono">
                    📝 Rédigez le ticket: Renseignez l'adresse expéditrice et le TxID.
                  </p>
                </div>

                {/* 3. Blue Card: Double Audit & Activation queue */}
                <div className="bg-indigo-950/30 p-5 rounded-xl border-4 border-indigo-500 space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-400 shrink-0" />
                    <h4 className="text-xs font-black text-white uppercase">Validation de l'Admin under 15 min</h4>
                  </div>
                  <p className="text-[11.5px] text-indigo-200 leading-relaxed">
                    Dès soumission, le ticket s'inscrit en base de données avec le statut <strong className="text-amber-400 p-0.5 bg-amber-500/10 rounded border border-amber-500/20">PENDING</strong>. L'administrateur de Bobdo Trading vérifie le grand livre SMS de l'opérateur local ou l'explorateur blockchain TRON, puis approuve d'un clic !
                  </p>
                  <p className="text-[11px] text-indigo-400 font-mono">
                    🎯 Changement immédiat: Votre statut bascule à PAID et active le Risk Manager d'arbitrage réel !
                  </p>
                </div>

              </div>

              {/* Summary table of tickets inside the Pop-up to make the layout extremely satisfying and dense */}
              <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">VISUALISATION DU PROTOCOLE DE ROUTAGE DES FONDS :</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-400">
                  <div className="p-2 border border-slate-900 rounded bg-slate-900">
                    <span className="text-[10px] text-slate-500 block">SOUDEUR</span>
                    <span className="text-white font-bold text-[11px]">Utilisateur émetteur</span>
                  </div>
                  <div className="p-2 border border-slate-900 rounded bg-slate-900">
                    <span className="text-[10px] text-slate-500 block">SUPPORT</span>
                    <span className="text-emerald-400 font-bold text-[11px]">Validation TxID</span>
                  </div>
                  <div className="p-2 border border-slate-900 rounded bg-slate-900">
                    <span className="text-[10px] text-slate-500 block">ALLOCATEUR</span>
                    <span className="text-indigo-400 font-bold text-[11px]">Server API Express</span>
                  </div>
                  <div className="p-2 border border-slate-900 rounded bg-slate-900">
                    <span className="text-[10px] text-slate-500 block">CONTRAT ACTIF</span>
                    <span className="text-[#eab308] font-bold text-[11px]">Premium déverrouillé</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: PLAN COMPARISON & PERFORMANCE INDEX */}
          {activeTab === 'concept' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-extrabold text-white">💎 Analyse Comparative de votre Accès</h3>
                <p className="text-xs text-slate-400">
                  Faites le choix le plus stratégique selon votre capital d'investissement boursier et votre profil de gain.
                </p>
              </div>

              {/* Interactive side-by-side dense comparison cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Brown / Gold frame for Forfait Premium */}
                <div className="p-5 rounded-xl border-4 border-amber-500 bg-amber-950/20 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-amber-500/20">
                    <h4 className="font-display font-black text-white text-base">Plan Forfaitaire Premium</h4>
                    <span className="text-[11px] font-mono font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase">
                      Le plus rentable
                    </span>
                  </div>
                  
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">✓</span>
                      <span>Coût fixe sans surprise de <strong className="text-white">5 000 F CFA</strong> net par mois.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">✓</span>
                      <span><strong className="text-white">Gains 100% conservés</strong> par l'utilisateur du bot.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">✓</span>
                      <span>Idéal à partir de <strong className="text-white">25 000 F CFA</strong> de marge d'arbitrage.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">✓</span>
                      <span>Double système d'affiliation actif (Primes d'invitation instantanées).</span>
                    </li>
                  </ul>
                  
                  <div className="p-3 bg-slate-950 rounded border border-amber-500/20 text-center font-mono text-[10.5px] text-slate-400">
                    Frais de maintenance cloud inclus dans le forfait mensuel de base.
                  </div>
                </div>

                {/* Dark Blue / Violet frame for Commission Performance */}
                <div className="p-5 rounded-xl border-4 border-indigo-505 bg-indigo-950/20 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-indigo-550/20">
                    <h4 className="font-display font-black text-white text-base">Plan Commission Performance</h4>
                    <span className="text-[11px] font-mono font-bold bg-indigo-500 text-white px-2 py-0.5 rounded uppercase font-extrabold">
                      Zéro dollar requis
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold font-black">✓</span>
                      <span>Activation gratuite et instantanée, sans aucune avance forfaitaire nécessaire.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold font-black">✓</span>
                      <span>Retenue forfaitaire de <strong className="text-white">20% sur chaque deal profitable</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold font-black">✓</span>
                      <span>Notre Risk Manager distribue automatiquement et convertit les 20% vers le grand livre USDT.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold font-black">✓</span>
                      <span>Le parrain touche sa prime boursière par paliers de 5 000 F cumulés.</span>
                    </li>
                  </ul>

                  <div className="p-3 bg-slate-950 rounded border border-indigo-500/20 text-center font-mono text-[10.5px] text-slate-400">
                    Parfait pour démarrer sans capital initial à consacrer à l'abonnement.
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal footer containing clear, human confirmation actions */}
        <div className="bg-slate-950 px-6 py-4 border-t-4 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Bobdo Secure System Gateway • Conforme directives régionales UEMOA 2026</span>
          </div>
          <button
            id="btn-close-help-manual-bottom"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-amber-500 hover:bg-amber-600 font-display font-black text-slate-950 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
          >
            J'ai compris, fermer le manuel
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Shield, Cpu, Flame, Globe, Clock, DollarSign, HelpCircle, Sparkles } from "lucide-react";
import { UserSession } from "../types";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  session: UserSession | null;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  onOpenHelp: () => void;
}

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  session, 
  isTrialExpired, 
  trialDaysRemaining,
  onOpenHelp
}: NavigationProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  useEffect(() => {
    // Keep high precision UTC clock updated
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { id: "trade", label: "Trade Room", icon: Flame },
    { id: "physical", label: "Marchés UEMOA", icon: Globe },
    { id: "ai", label: "Scanner NLP", icon: Cpu },
    { id: "billing", label: "Abonnement", icon: DollarSign, badge: isTrialExpired ? "Inactif" : "" }
  ];

  // Helper to handle user manual toggle
  const handleManualToggle = () => {
    setIsHeaderCollapsed(prev => !prev);
  };

  return (
    <div className="sticky top-0 z-50 flex flex-col w-full shadow-2xl">
      {/* 🔴 LIVE PRICE ROLLER TICKER (UEMOA/CRYPTO) AT THE TOP */}
      <div id="btf-top-price-roller" className="w-full bg-slate-950 border-b border-slate-800/80 py-2.5 px-4 overflow-hidden flex items-center h-10 select-none relative z-50">
        <div className="absolute left-0 top-0 bottom-0 bg-slate-950 border-r border-slate-800/80 px-4 flex items-center gap-2 z-10 shrink-0 shadow-lg">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-505 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono tracking-widest text-slate-200 font-extrabold uppercase gap-1 flex items-center">
            <span>COURTIER</span>
            <span className="text-emerald-400 text-[10px]">LIVE</span>
          </span>
        </div>

        <div className="marquee-container pl-36 w-full flex items-center h-full">
          <div className="marquee-track flex items-center gap-14 text-sm font-mono py-1">
            {/* Set 1 */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">SONATEL</span>
              <span className="text-slate-100 font-extrabold">18 450 F</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +0.45%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">CORIS BANK</span>
              <span className="text-slate-100 font-extrabold">9 550 F</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +1.20%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">ORANGE CI</span>
              <span className="text-slate-100 font-extrabold">11 120 F</span>
              <span className="text-red-400 font-extrabold text-xs flex items-center">▼ -0.15%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">BCEAO XOF/USD</span>
              <span className="text-slate-100 font-extrabold">604,25 F</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +0.10%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">BTC/USDT</span>
              <span className="text-slate-100 font-extrabold">64 200 $</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +2.35%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">ETH/USDT</span>
              <span className="text-slate-100 font-extrabold">3 400 $</span>
              <span className="text-red-400 font-extrabold text-xs flex items-center">▼ -0.45%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">SOL/USDT</span>
              <span className="text-slate-100 font-extrabold">170,40 $</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +1.80%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">BNB/USDT</span>
              <span className="text-slate-100 font-extrabold">580,15 $</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +0.95%</span>
            </div>

            {/* Set 2 (Duplicated for infinite seamless flow) */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">SONATEL</span>
              <span className="text-slate-100 font-extrabold">18 450 F</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +0.45%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">CORIS BANK</span>
              <span className="text-slate-100 font-extrabold">9 550 F</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +1.20%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">ORANGE CI</span>
              <span className="text-slate-100 font-extrabold">11 120 F</span>
              <span className="text-red-400 font-extrabold text-xs flex items-center">▼ -0.15%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">BCEAO XOF/USD</span>
              <span className="text-slate-100 font-extrabold">604,25 F</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +0.10%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">BTC/USDT</span>
              <span className="text-slate-100 font-extrabold">64 200 $</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +2.35%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">ETH/USDT</span>
              <span className="text-slate-100 font-extrabold">3 400 $</span>
              <span className="text-red-400 font-extrabold text-xs flex items-center">▼ -0.45%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">SOL/USDT</span>
              <span className="text-slate-100 font-extrabold">170,40 $</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +1.80%</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-slate-400 font-bold">BNB/USDT</span>
              <span className="text-slate-100 font-extrabold">580,15 $</span>
              <span className="text-emerald-400 font-extrabold text-xs flex items-center">▲ +0.95%</span>
            </div>
          </div>
        </div>
      </div>

      <header className={`glass-panel transition-all duration-300 ease-in-out ${
        isHeaderCollapsed 
          ? "py-3 px-4 md:px-6 border-b-2 border-slate-800 bg-slate-950/98 backdrop-blur shadow-xl"
          : "py-5 md:py-6 px-4 md:px-6 border-b-2 border-slate-800 bg-slate-900/90"
      } select-none overflow-visible w-full`}>
        
        {/* Pull down and up control deck */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1">
          <button
            id="btn-manual-toggle-header"
            onClick={handleManualToggle}
            className="bg-slate-900 text-xs text-amber-500 border-2 border-slate-700 hover:border-amber-400 hover:text-white px-5 py-2.5 rounded-full shadow-2xl cursor-pointer flex items-center gap-2 font-mono uppercase font-black tracking-wider transition-all hover:scale-105 active:scale-95"
            title={isHeaderCollapsed ? "Déployer le bandeau d'en-tête" : "Réduire le bandeau d'en-tête"}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{isHeaderCollapsed ? "↓ Déployer le rideau" : "↑ Relever le rideau"}</span>
          </button>
        </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        
        {/* Brand logo & Slogan - Completely stabilized to prevent visual wobbling when collapsed */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="bg-gradient-to-tr from-amber-500 to-emerald-500 p-2.5 rounded-lg shadow-md shrink-0">
            <Shield className="h-6 w-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-black text-base sm:text-lg md:text-xl leading-none tracking-tight text-white">
                Bobdo Trading <span className="text-emerald-400">& Finance</span>
              </h1>
              {!isHeaderCollapsed && (
                <span className="bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-slate-700">
                  BTF v1.3
                </span>
              )}
            </div>
            {!isHeaderCollapsed && (
              <p className="text-xs text-slate-350 max-w-sm hidden sm:block mt-1 font-medium">
                L’argent simple, sécurisé et intelligent pour l’Afrique de l’Ouest.
              </p>
            )}
          </div>
        </div>

        {/* Tabs Menu */}
        <nav className={`flex items-center gap-2 bg-slate-900/60 rounded-xl border border-slate-800 max-w-full overflow-x-auto ${
          isHeaderCollapsed ? "p-1.5" : "p-2.5"
        }`}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`nav-btn-${item.id}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-lg text-sm font-bold transition-all duration-300 relative shrink-0 ${
                  isHeaderCollapsed ? "px-3.5 py-2" : "px-5 py-3"
                } ${
                  isActive
                    ? "bg-slate-800 text-emerald-400 border border-emerald-500/10 shadow-lg"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <IconComponent className={`h-4.5 w-4.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.badge && !isHeaderCollapsed && (
                  <span className="text-[10px] bg-red-500/15 text-red-500 border border-red-500/30 font-black px-2 py-0.5 rounded animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right status Indicators */}
        <div className={`flex items-center gap-4 flex-wrap md:flex-nowrap justify-end w-full md:w-auto transition-all`}>
          
          {/* Visual High-Contrast Help and Protocol Action Button */}
          <button
            id="btn-trigger-global-help"
            onClick={onOpenHelp}
            className={`flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-display font-black rounded-xl shadow-lg shadow-amber-950/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-amber-500/10 ${
              isHeaderCollapsed ? "px-4 py-2 text-xs" : "px-5 py-2.5 text-sm"
            }`}
            title="Consulter le guide des protocoles, transactions, Binance et distribution automatique d'affiliation"
          >
            <HelpCircle className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>Aide & Protocoles</span>
            {!isHeaderCollapsed && (
              <span className="bg-slate-950 text-amber-400 font-mono text-[10px] px-2 py-0.5 rounded font-black animate-pulse">AIDE</span>
            )}
          </button>

          {/* UTC Time (Only show if not collapsed on small screens to save valuable space) */}
          <div className={`flex items-center gap-2 text-slate-300 font-mono text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-lg shadow-inner ${
            isHeaderCollapsed ? "px-3 py-2 hidden lg:flex" : "px-4 py-2.5"
          }`}>
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>{currentTime}</span>
          </div>

          {/* Account balance quick state */}
          {session && (
            <div className={`flex items-center gap-3.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10 shrink-0 ${
              isHeaderCollapsed ? "px-3.5 py-1.5" : "px-4.5 py-2.5"
            }`}>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Compte</div>
                <div className="font-mono text-sm sm:text-base font-black text-emerald-400">
                  {session.balanceFCFA.toLocaleString()} F
                </div>
              </div>
              <div className="h-5 w-[1px] bg-slate-800" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">USDT</div>
                <div className="font-mono text-sm sm:text-base font-black text-slate-200">
                  {session.balanceUSDT.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
    </div>
  );
}

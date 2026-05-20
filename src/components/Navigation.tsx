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
  const [isLocked, setIsLocked] = useState(false); // New locking mechanism: secure the banner position

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

  // Secure scroll handler: if the user locks or manually toggles, auto-scrolling won't override it erratically
  useEffect(() => {
    if (isLocked) return;

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (isLocked) return;
      if (window.scrollY > lastScrollY && window.scrollY > 80) {
        setIsHeaderCollapsed(true);
      } else {
        setIsHeaderCollapsed(false);
      }
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLocked]);

  const menuItems = [
    { id: "trade", label: "Trade Room", icon: Flame },
    { id: "physical", label: "Marchés UEMOA", icon: Globe },
    { id: "ai", label: "Scanner NLP", icon: Cpu },
    { id: "billing", label: "Abonnement", icon: DollarSign, badge: isTrialExpired ? "Inactif" : "" }
  ];

  // Helper to handle user manual toggle and safely lock the state to prevent wobbly swings
  const handleManualToggle = () => {
    const nextState = !isHeaderCollapsed;
    setIsHeaderCollapsed(nextState);
    setIsLocked(true); // Securely lock to manual mode so it stays solid at this setting
  };

  const handleResetToAuto = () => {
    setIsLocked(false);
    // instant adjustment based on current position
    setIsHeaderCollapsed(window.scrollY > 80);
  };

  return (
    <header className={`glass-panel sticky top-0 z-50 transition-all duration-300 ease-in-out ${
      isHeaderCollapsed 
        ? "py-2 px-4 md:px-6 border-b-2 border-slate-800 bg-slate-950/98 backdrop-blur shadow-xl"
        : "py-4 md:py-5 px-4 md:px-6 border-b-2 border-slate-800 bg-slate-900/90"
    } select-none overflow-visible`}>
      
      {/* Pull down and up control deck - The physical hinge stabilization button */}
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1">
        <button
          id="btn-manual-toggle-header"
          onClick={handleManualToggle}
          className="bg-slate-900 text-[10px] text-amber-500 border-2 border-slate-700 hover:border-amber-400 hover:text-white px-4 py-1.5 rounded-full shadow-2xl cursor-pointer flex items-center gap-1.5 font-mono uppercase font-black tracking-wider transition-all hover:scale-105 active:scale-95"
          title={isHeaderCollapsed ? "Déployer pour agrandir le rideau" : "Masquer pour libérer l'espace"}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>{isHeaderCollapsed ? "↓ Tirer le Rideau" : "↑ Relever le Rideau"}</span>
          <span className="text-slate-500 text-[9px] font-bold">({isLocked ? "Verrouillé" : "Auto"})</span>
        </button>

        {isLocked && (
          <button
            onClick={handleResetToAuto}
            className="bg-slate-950 text-[9px] text-slate-400 hover:text-emerald-400 border border-slate-800 px-2 py-1.5 rounded-full hover:border-emerald-500 transition-all cursor-pointer font-mono uppercase font-bold"
            title="Réactiver le mode automatique basé sur le défilement (scroll)"
          >
            🔄 Libérer
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        
        {/* Brand logo & Slogan - Completely stabilized to prevent visual wobbling when collapsed */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-gradient-to-tr from-amber-500 to-emerald-500 p-2 rounded-lg shadow-md shrink-0">
            <Shield className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-sm sm:text-base leading-none tracking-tight text-white">
                Bobdo Trading <span className="text-emerald-400">& Finance</span>
              </h1>
              {!isHeaderCollapsed && (
                <span className="bg-slate-800 text-slate-400 font-mono text-[8px] uppercase font-bold px-1 py-0.2 rounded border border-slate-700">
                  BTF v1.3
                </span>
              )}
            </div>
            {!isHeaderCollapsed && (
              <p className="text-[10px] text-slate-400 max-w-xs hidden sm:block mt-0.5">
                L’argent simple, sécurisé et intelligent pour l’Afrique de l’Ouest.
              </p>
            )}
          </div>
        </div>

        {/* Tabs Menu */}
        <nav className={`flex items-center gap-1.5 bg-slate-900/60 rounded-xl border border-slate-800 max-w-full overflow-x-auto ${
          isHeaderCollapsed ? "p-1" : "p-2"
        }`}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`nav-btn-${item.id}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-300 relative shrink-0 ${
                  isHeaderCollapsed ? "px-3 py-1.5" : "px-4 py-2.5"
                } ${
                  isActive
                    ? "bg-slate-800 text-emerald-400 font-bold border border-emerald-500/10 shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/45"
                }`}
              >
                <IconComponent className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.badge && !isHeaderCollapsed && (
                  <span className="text-[9px] bg-red-500/15 text-red-500 border border-red-500/30 font-extrabold px-1.5 py-0.2 rounded animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right status Indicators */}
        <div className={`flex items-center gap-3.5 flex-wrap md:flex-nowrap justify-end w-full md:w-auto transition-all ${
          isHeaderCollapsed ? "scale-95 origin-right" : ""
        }`}>
          
          {/* Visual High-Contrast Help and Protocol Action Button */}
          <button
            id="btn-trigger-global-help"
            onClick={onOpenHelp}
            className={`flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-display font-black rounded-xl shadow-lg shadow-amber-950/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-amber-500/10 ${
              isHeaderCollapsed ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-xs"
            }`}
            title="Consulter le guide des protocoles, transactions, Binance et distribution automatique d'affiliation"
          >
            <HelpCircle className="h-4 w-4 stroke-[2.5]" />
            <span>Aide & Protocoles</span>
            {!isHeaderCollapsed && (
              <span className="bg-slate-950 text-amber-400 font-mono text-[9px] px-1.5 py-0.2 rounded font-extrabold animate-pulse">AIDE</span>
            )}
          </button>

          {/* UTC Time (Only show if not collapsed on small screens to save valuable space) */}
          <div className={`flex items-center gap-2 text-slate-400 font-mono text-xs bg-slate-900 border border-slate-800 rounded-lg shadow-inner ${
            isHeaderCollapsed ? "px-2.5 py-1.5 hidden lg:flex" : "px-3.5 py-2"
          }`}>
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            <span>{currentTime}</span>
          </div>

          {/* Account balance quick state */}
          {session && (
            <div className={`flex items-center gap-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 shrink-0 ${
              isHeaderCollapsed ? "px-3 py-1" : "px-4 py-2"
            }`}>
              <div className="text-right">
                <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Compte</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-emerald-400">
                  {session.balanceFCFA.toLocaleString()} F
                </div>
              </div>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="text-right">
                <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">USDT</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-slate-200">
                  {session.balanceUSDT.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

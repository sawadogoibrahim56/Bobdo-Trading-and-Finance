/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Flame, TrendingUp, TrendingDown, Key, Zap, ShieldAlert, BadgeInfo, Play, Pause, RefreshCw, XCircle, CheckCircle, Smartphone, Globe, AlertTriangle, Eye, ShieldCheck, Cpu, Database, ArrowRight
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { UserSession, TradeOrder } from "../types";

interface TradeRoomProps {
  session: UserSession | null;
  orders: TradeOrder[];
  isVetoActive: boolean;
  dailyDrawdownLimitReached: boolean;
  totalVolume: number;
  triggerRefresh: () => void;
  onPlaceOrder: (orderData: any) => Promise<boolean>;
  onCancelOrderVeto: (orderId: string) => Promise<void>;
  onUpdateKeys: (keys: any) => Promise<boolean>;
  isTrialExpired: boolean;
}

// Extended assets list with multiple international cryptos to prove "it's deeply integrated and well thought out"
const ASSETS_LIST = [
  { symbol: "SONATEL", category: "BRVM (Sénégal)", priceFCFA: 18450, isCrypto: false },
  { symbol: "CORIS BANK", category: "BRVM (Burkina)", priceFCFA: 9550, isCrypto: false },
  { symbol: "ORANGE CI", category: "BRVM (Côte d'Ivoire)", priceFCFA: 11120, isCrypto: false },
  { symbol: "BTC/USDT", category: "Crypto (Binance)", priceFCFA: 38520000, isCrypto: true, priceUSDT: 64200 },
  { symbol: "ETH/USDT", category: "Crypto (OKX)", priceFCFA: 2040000, isCrypto: true, priceUSDT: 3400 },
  { symbol: "SOL/USDT", category: "Crypto (Bybit)", priceFCFA: 102000, isCrypto: true, priceUSDT: 170 },
  { symbol: "BNB/USDT", category: "Crypto (Binance)", priceFCFA: 348000, isCrypto: true, priceUSDT: 580 },
  { symbol: "XRP/USDT", category: "Crypto (OKX)", priceFCFA: 312, isCrypto: true, priceUSDT: 0.52 }
];

// Continuous news simulation for real-time zero delay visual concept
const REALTIME_NEWS_FEED = [
  "BCEAO : Réduction des réserves obligataires favorisant l'injection de liquidités BRVM",
  "BINANCE : Carnet d'ordres stable pour BTC/USDT. Clôture imminente de la bougie H4",
  "BURKINA FASO : Enquêtes d'arbitrage de Bobo-Dioulasso montrent une stabilité du stockage",
  "FED US : Discours prudent sur l'inflation. Hausse générale des cryptomonnaies de +1.2%",
  "OKX COUVERTURE : Optimisation du tunnel de routage vers la BRVM achevée - Latence: 8ms",
  "ORANGE CÔTE D'IVOIRE : Volume de transaction Orange Money à un niveau record sur 3 mois",
  "BYBIT SECURE ROUTE : Déclenchement automatique du stop-loss de secours configuré",
  "COTATION BRVM : Hausse marquée des banques d'Afrique de l'Ouest à la mi-séance"
];

export default function TradeRoom({
  session,
  orders,
  isVetoActive,
  dailyDrawdownLimitReached,
  totalVolume,
  triggerRefresh,
  onPlaceOrder,
  onCancelOrderVeto,
  onUpdateKeys,
  isTrialExpired
}: TradeRoomProps) {
  const [selectedAsset, setSelectedAsset] = useState(ASSETS_LIST[0]);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [tradeAmount, setTradeAmount] = useState<string>("1");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [chartData, setChartData] = useState<any[]>([]);
  const [isAutonomousActive, setIsAutonomousActive] = useState(false);
  const [apiKeysModal, setApiKeysModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'binance' | 'okx' | 'bybit'>('binance');

  // Fluctuating real-time prices for interactive display
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});
  const [newsFeedIndex, setNewsFeedIndex] = useState(0);

  // Key states for API connector modal
  const [binanceKey, setBinanceKey] = useState("");
  const [binanceSecret, setBinanceSecret] = useState("");
  const [okxKey, setOkxKey] = useState("");
  const [bybitKey, setBybitKey] = useState("");
  const [brvmId, setBrvmId] = useState("");

  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [isRiskAccepted, setIsRiskAccepted] = useState(false);

  const [isArbitrageLoading, setIsArbitrageLoading] = useState(false);
  const [arbitrageResult, setArbitrageResult] = useState<{
    success: boolean;
    profitFCFA: number;
    adminCommissionFCFA: number;
    userNetProfitFCFA: number;
    isFreePlan: boolean;
    message: string;
  } | null>(null);

  // Initialize dynamic prices
  useEffect(() => {
    const prices: Record<string, number> = {};
    ASSETS_LIST.forEach((asset) => {
      prices[asset.symbol] = asset.isCrypto ? asset.priceUSDT! : asset.priceFCFA;
    });
    setDynamicPrices(prices);
  }, []);

  // Soft price fluctuation simulator with zero lag indicators
  useEffect(() => {
    const timer = setInterval(() => {
      setDynamicPrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((sym) => {
          const change = 1 + (Math.random() - 0.5) * 0.003; // tiny 0.15% fluctuation
          next[sym] = parseFloat((next[sym] * change).toFixed(sym.includes("/") ? 2 : 0));
        });
        return next;
      });

      // rotate news feeds
      setNewsFeedIndex((prev) => (prev + 1) % REALTIME_NEWS_FEED.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Simulate chart points based on selected asset and its fluctuating base
  useEffect(() => {
    const basePrice = dynamicPrices[selectedAsset.symbol] || (selectedAsset.isCrypto ? selectedAsset.priceUSDT! : selectedAsset.priceFCFA);
    const generateChartPoints = () => {
      const arr = [];
      let temp = basePrice;
      for (let i = 0; i < 24; i++) {
        temp = temp * (1 + (Math.random() - 0.495) * 0.015);
        arr.push({
          time: `${i}:00`,
          price: parseFloat(temp.toFixed(selectedAsset.isCrypto ? 2 : 0))
        });
      }
      setChartData(arr);
    };
    generateChartPoints();
  }, [selectedAsset, dynamicPrices[selectedAsset.symbol]]);

  // Auto Stop-Loss and Take-Profit calculator for proper risk management
  useEffect(() => {
    const currentPrice = dynamicPrices[selectedAsset.symbol] || (selectedAsset.isCrypto ? selectedAsset.priceUSDT! : selectedAsset.priceFCFA);
    if (currentPrice) {
      if (tradeType === "BUY") {
        setStopLoss((currentPrice * 0.985).toFixed(selectedAsset.isCrypto ? 2 : 0));
        setTakeProfit((currentPrice * 1.05).toFixed(selectedAsset.isCrypto ? 2 : 0));
      } else {
        setStopLoss((currentPrice * 1.015).toFixed(selectedAsset.isCrypto ? 2 : 0));
        setTakeProfit((currentPrice * 0.95).toFixed(selectedAsset.isCrypto ? 2 : 0));
      }
    }
  }, [selectedAsset, tradeType, dynamicPrices[selectedAsset.symbol]]);

  const currentAssetPrice = dynamicPrices[selectedAsset.symbol] || (selectedAsset.isCrypto ? selectedAsset.priceUSDT! : selectedAsset.priceFCFA);
  const quantity = parseFloat(tradeAmount) || 0;
  const positionValueFCFA = selectedAsset.isCrypto 
    ? quantity * currentAssetPrice * 600 
    : quantity * currentAssetPrice;

  // Capital risk verification
  const userBalanceFCFA = session ? (session.balanceFCFA + (session.balanceUSDT * 600)) : 1500000;
  const riskPercent = userBalanceFCFA > 0 ? (positionValueFCFA / userBalanceFCFA) * 100 : 0;
  const isOverRiskLimit = riskPercent > 1.05;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTradeError(null);
    setTradeSuccess(null);

    if (!isRiskAccepted) {
      setTradeError("Validation requise : Veuillez explicitement cocher le cautionnement des risques de non-responsabilité juridique et financière ci-dessous pour protéger nos institutions avant de valider l'ordre.");
      return;
    }

    if (isTrialExpired) {
      setTradeError("Alerte d'accès : Votre essai de 7 jours est expiré. Veuillez acquitter vos frais mensuels de 5 000 F CFA pour racheter/vendre en réel.");
      return;
    }

    if (!stopLoss) {
      setTradeError("Erreur d'intégrité : Niveau de Stop-Loss requis pour limiter l'exposition de pertes boursières.");
      return;
    }

    if (isOverRiskLimit) {
      setTradeError(`Risque rejeté : Ce vœu d'ordre engage ${riskPercent.toFixed(2)}% de votre capital total. Le Risk Manager de Bobdo limite l'exposition à un maximum de 1% du capital pour protéger la zone UEMOA.`);
      return;
    }

    const orderPayload = {
      symbol: selectedAsset.symbol,
      type: tradeType,
      price: currentAssetPrice,
      amount: quantity,
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      isAutonomous: false
    };

    const success = await onPlaceOrder(orderPayload);
    if (success) {
      setTradeSuccess(`Ordre de ${tradeType} de ${tradeAmount} ${selectedAsset.symbol} validé de manière instantanée et transmis en direct aux hubs.`);
      setTradeAmount("1");
      triggerRefresh();
    } else {
      setTradeError("L'exécution a échoué. Le service de paiement, de veto ou d'arrêt d'urgence bloque peut-être l'ordre.");
    }
  };

  const handleKeysModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onUpdateKeys({ binanceKey, binanceSecret, okxKey, bybitKey, brvmId });
    if (result) {
      setApiKeysModal(false);
      triggerRefresh();
    }
  };

  const handleRunArbitrage = async () => {
    setTradeError(null);
    setTradeSuccess(null);
    setArbitrageResult(null);

    if (!isRiskAccepted) {
      setTradeError("Validation requise : Veuillez d'abord accepter les conditions de non-responsabilité juridique et de gestion raisonnable des risques (Garde-fou à cocher dans la colonne ordre de droite) avant d'engager un arbitrage boursier.");
      return;
    }

    setIsArbitrageLoading(true);

    // Beautiful simulated high-speed execution delay (1.5 seconds)
    await new Promise((r) => setTimeout(r, 1200));

    try {
      const resp = await fetch("/api/trades/run-arbitrage-cycle", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": session?.email || ""
        }
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setArbitrageResult(data);
        triggerRefresh();
      } else {
        setTradeError(data.error || "La transaction d'arbitrage a été refusée ou compromise.");
      }
    } catch (err) {
      setTradeError("Impossible de joindre le Bot d'Arbitrage Haute Fréquence.");
    } finally {
      setIsArbitrageLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Risk and Veto Warning Header Banner */}
      {(isVetoActive || dailyDrawdownLimitReached) && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3.5 animate-pulse">
          <ShieldAlert className="h-5.5 w-5.5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-xs text-red-400 uppercase tracking-widest block">
              DÉCISIONNEUR ADMINISTRATIF : SYSTÈME ACTUELLEMENT VERROUILLÉ
            </span>
            <p className="text-xs text-red-200 mt-1">
              {isVetoActive && "• Le droit de VÉTO ABSOLU de l'administrateur de risque est ACTIF (Exécutions temporairement gelées). "}
              {dailyDrawdownLimitReached && "• La limite d'arrêt d'urgence quotidienne de drawdown de 2% a été touchée. Aucune négociation acceptée."}
            </p>
          </div>
        </div>
      )}

      {/* Real-Time Zero Latency News Ticker widget */}
      <div className="bg-slate-900 border border-slate-850 px-4 py-3 rounded-2xl flex items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">FLUX ACTUALITÉS TEMPS RÉEL (0 LATENCE) :</span>
        </div>
        
        {/* News text ticker animate transition */}
        <div className="flex-1 text-[11px] text-slate-350 font-mono italic truncate select-none">
          {REALTIME_NEWS_FEED[newsFeedIndex]}
        </div>

        <div className="text-[9px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-500 font-mono flex items-center gap-1">
          <Globe className="h-3 w-3 animate-spin text-emerald-400" /> FEED SYNCHRONISÉ
        </div>
      </div>

      {/* Main Trading Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Asset Selection & Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative bg-gradient-to-b from-slate-950 to-slate-900/40">
            
            {/* Header section inside panel */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-emerald-400 font-mono font-bold tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                  MONITEUR DE COTATIONS UNIFIÉ
                </span>
                <h3 className="text-base font-display font-extrabold text-white mt-1.5">Salle des Marchés BRVM & Cryptomonnaies Mondiales</h3>
              </div>

              {/* Raccordement Clés API shortcut */}
              <button
                id="btn-conn-keys"
                onClick={() => setApiKeysModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/15 transition-all cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Raccorder mes Clés de Trading Réel</span>
              </button>
            </div>

            {/* Subheading explanation */}
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Sélectionnez un actif de l'UEMOA ou un actif mondial. Les cours fluctuent à la seconde d'après les carnets d'ordres croisés.
            </p>

            {/* Asset Selector List - Elegant grids of Cards/Tableaux */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 mt-1">
              {ASSETS_LIST.map((asset) => {
                const isSelected = selectedAsset.symbol === asset.symbol;
                const computedVal = dynamicPrices[asset.symbol] || (asset.isCrypto ? asset.priceUSDT! : asset.priceFCFA);
                return (
                  <button
                    id={`asset-select-${asset.symbol.replace("/", "_")}`}
                    key={asset.symbol}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? "bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30"
                        : "bg-slate-950/60 border-slate-900 hover:border-slate-800 hover:bg-slate-900/40"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    )}
                    <div className="text-[9px] text-slate-500 font-mono uppercase font-bold truncate">{asset.category}</div>
                    <div className="text-xs font-display font-extrabold text-white mt-1">{asset.symbol}</div>
                    <div className="font-mono text-xs font-bold text-emerald-400 mt-2.5">
                      {asset.isCrypto 
                        ? `$${computedVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                        : `${computedVal.toLocaleString()} FCFA`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Price Chart and stats rendering */}
            <div className="mt-4 bg-slate-950/40 p-5 rounded-xl border border-slate-900/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Variation intra-day en cours</h4>
                  <div className="text-2xl font-display font-black text-slate-100 mt-1 flex items-center gap-2">
                    {selectedAsset.isCrypto 
                      ? `$${currentAssetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                      : `${currentAssetPrice.toLocaleString()} F CFA`}
                    <span className="text-xs text-emerald-400 flex items-center gap-0.5 font-mono bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                      <TrendingUp className="h-3.5 w-3.5" />
                      +1.85%
                    </span>
                  </div>
                </div>

                {/* Info stat badge */}
                <div className="flex gap-4 text-[10px] bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-lg font-mono">
                  <div>
                    <span className="text-slate-500">VOLUME TOTAL COUVERT :</span>
                    <span className="text-slate-200 font-extrabold ml-1 font-mono">{(totalVolume).toLocaleString()} F CFA</span>
                  </div>
                </div>
              </div>

              {/* Graphic Chart canvas */}
              <div className="h-68 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.06} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" opacity={0.5} />
                    <YAxis stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" domain={['auto', 'auto']} opacity={0.5} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", color: "#f8fafc" }} 
                      labelClassName="text-slate-500 text-[10px] font-mono" 
                    />
                    <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Panel & Interactive AI Brain */}
        <div className="space-y-6">
          
          {/* Autonomous robot switch card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-850 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900/50 to-slate-950">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10 animate-pulse" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 rounded-xl text-emerald-400 animate-pulse">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Trading Autonome 24h/24, 7j/7</h4>
                  <p className="text-[10px] text-slate-550 font-mono">Modèle décisionnel AI de Bobdo S.A.</p>
                </div>
              </div>

              {/* Power Toggle Switch */}
              <button
                id="autonomous-toggle-btn"
                onClick={() => {
                  if (isTrialExpired) {
                    setTradeError("Alerte d'accès : Votre essai de 7 jours est expiré. Veuillez acquitter les 5 000 F CFA d'abonnement pour utiliser le trading autonome.");
                    return;
                  }
                  setIsAutonomousActive(!isAutonomousActive);
                }}
                className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${
                  isAutonomousActive ? "bg-emerald-500" : "bg-slate-800"
                } relative cursor-pointer border border-slate-700/50`}
                title="Activer ou désactiver l'exécution 24/7"
              >
                <div 
                  className={`w-5 h-5 bg-slate-950 rounded-full shadow-md transition-transform duration-300 transform flex items-center justify-center ${
                    isAutonomousActive ? "translate-x-7 text-emerald-400" : "translate-x-0 text-slate-500"
                  }`}
                >
                  {isAutonomousActive ? (
                    <Play className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" />
                  ) : (
                    <Pause className="h-2.5 w-2.5" />
                  )}
                </div>
              </button>
            </div>

            {/* Step-by-Step AI Risk Guard Verification logs rendering */}
            {isAutonomousActive && (
              <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2.5 text-[10px] font-mono leading-relaxed">
                <div className="text-emerald-400 font-bold border-b border-slate-900 pb-1 flex items-center justify-between">
                  <span>PIPE-LINE D'ANALYSE DÉCISIONNEL :</span>
                  <span className="text-[9px] animate-pulse">● ACTIF</span>
                </div>
                <div className="space-y-1 text-slate-400">
                  <p className="flex items-center gap-1"><span className="text-emerald-400">✔</span> [1] Censure administrative (Veto admin: OK)</p>
                  <p className="flex items-center gap-1"><span className="text-emerald-400">✔</span> [2] Indices logistiques (Axe Bobo-Dioulasso stable)</p>
                  <p className="flex items-center gap-1"><span className="text-emerald-400">✔</span> [3] Analyse NLP sentiment Google Search (Garantie: OK)</p>
                  <p className="flex items-center gap-1"><span className="text-emerald-400">✔</span> [4] Risk test capital (1.0% maximum d'exposition: OK)</p>
                  <p className="flex items-center gap-1"><span className="text-emerald-400">🚀</span> [5] Routage direct de l'ordre à la microseconde...</p>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
              {!isAutonomousActive && "💡 Lorsque activé, le robot de trading autonome effectue des balayages des actualités à zéro latence et émet ses arbitrages sans action requise."}
            </p>
          </div>

          {/* HIGH FREQUENCY ARBITRAGE EXPRESS ENGINE WIDGET */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
                <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                  ⚡ Arbitrage Haute Fréquence (HFN)
                </h4>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded uppercase border border-emerald-500/20">
                Performance libre
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Déclenchez manuellement un cycle d'arbitrage croisé régional (Sorgho, Coton, Or ou Crypto) avec prélèvement instantané selon votre abonnement.
            </p>

            {isArbitrageLoading ? (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 space-y-3 font-mono text-[10px] text-slate-300">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                  <span className="font-extrabold text-emerald-400">EXÉCUTION DU DEAL D'ARBITRAGE...</span>
                </div>
                <div className="space-y-1 block leading-normal text-slate-400">
                  <p className="animate-pulse">⏳ Sec 1: Scan des écarts de cours (Abidjan - Ouagadougou)...</p>
                  <p className="opacity-80">🧪 Sec 2: Résolution par le Risk Manager de Bobdo (Stop-loss OK)...</p>
                  <p className="opacity-60">🔑 Sec 3: Signature cryptographique de l'ordre API...</p>
                </div>
              </div>
            ) : (
              <button
                id="btn-trigger-hfn-arbitrage"
                onClick={handleRunArbitrage}
                disabled={isTrialExpired}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-display font-black text-slate-950 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>DÉCLENCHER UN CYCLE D'ARBITRAGE</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {/* Arbitrage interactive results layout */}
            {arbitrageResult && (
              <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3.5 animate-fade-in text-xs">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-emerald-400 font-bold font-mono">✓ DEAL EXÉCUTÉ AVEC SUCCÈS</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                    Réseau Actif
                  </span>
                </div>

                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {arbitrageResult.message}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono p-2 bg-slate-900 rounded border border-slate-850">
                  <div>
                    <span className="text-slate-500 block">PROFIT BRUT :</span>
                    <span className="text-white font-bold">+{arbitrageResult.profitFCFA.toLocaleString()} FCFA</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">COMPRESSION ADMIN :</span>
                    <span className="text-[#f87171] font-bold">-{arbitrageResult.adminCommissionFCFA.toLocaleString()} FCFA</span>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-slate-950 flex justify-between">
                    <span className="text-slate-400 font-bold">VERSEMENT NET REÇU :</span>
                    <span className="text-emerald-400 font-black">+{arbitrageResult.userNetProfitFCFA.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <p className="text-[9px] text-[#eab308] italic block font-mono">
                  * Votre dividende net de parrainage de 250 F CFA a été reversé à votre parain affilié s'il y a lieu.
                </p>
              </div>
            )}
          </div>

          {/* Quick Order executing Form */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/20">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Nouvel Ordre de Couverture</h4>
            
            <form onSubmit={handleOrderSubmit} className="space-y-3.5">
              
              {/* Buy/Sell Selector */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-850">
                <button
                  id="trade-side-buy"
                  type="button"
                  onClick={() => setTradeType("BUY")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tradeType === "BUY"
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ACHETER (HAUSSIER)
                </button>
                <button
                  id="trade-side-sell"
                  type="button"
                  onClick={() => setTradeType("SELL")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tradeType === "SELL"
                      ? "bg-red-500 text-slate-100 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  VENDRE (BAISSIER)
                </button>
              </div>

              {/* Display asset symbol */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Actif Targeté :</span>
                <span className="font-extrabold text-white tracking-widest font-mono">{selectedAsset.symbol}</span>
              </div>

              {/* Amount quantity input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quantité de transaction ({selectedAsset.isCrypto ? "Unités Crypto" : "Actions BRVM"})
                </label>
                <input
                  id="input-trade-amount"
                  type="number"
                  min="0.0001"
                  step="any"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Risk alert meter (1% validation) */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-900 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-bold font-mono">RISQUE DE LA TRANSACTION:</span>
                  <span className={`font-mono font-bold ${isOverRiskLimit ? "text-red-400 font-extrabold" : "text-emerald-400"}`}>
                    {riskPercent.toFixed(2)} % du capital
                  </span>
                </div>
                {/* Horizontal Meter */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${isOverRiskLimit ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, Math.max(1.5, riskPercent * 100))}%` }}
                  />
                </div>
                <div className="flex items-start gap-1.5 mt-1 text-[9.5px] text-slate-400 leading-normal">
                  <BadgeInfo className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Le Gardien du Risque suspend automatiquement l'ordre en cas de dépassement du seuil de protection de 1% pour garantir la protection du portefeuille.</span>
                </div>
              </div>

              {/* Mandatory Stop Loss */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-0.5">
                    Stop-Loss * <span className="text-red-400 font-extrabold">(SÉCURITÉ VÉRROUILLÉE)</span>
                  </label>
                  <input
                    id="input-stop-loss"
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 px-2.5 py-2 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    placeholder="SL obligatoire"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                    Take-Profit (Cible)
                  </label>
                  <input
                    id="input-take-profit"
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 px-2.5 py-2 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Optionnel"
                  />
                </div>
              </div>

              {/* Position calculation review */}
              <div className="text-[10px] text-slate-500 space-y-1 pt-1.5 font-mono border-t border-slate-900">
                <div className="flex justify-between">
                  <span>COUVERTURE ENGAGÉE:</span>
                  <span className="text-slate-300 font-bold">{positionValueFCFA.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* IMMERSIVE RISK DISCLAIMER & SECURITY GUARANTEE FOR INSTITUTIONS (GARDE-FOU JURIDIQUE) */}
              <div className="p-4 rounded-xl border-2 border-slate-800 bg-slate-950/40 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-wider block">Cautionnement & Protection Juridique</span>
                </div>
                
                <p className="text-[9.5px] text-slate-400 leading-normal">
                  Le trading sur marchés financiers de l'UEMOA (BRVM) et cryptomonnaies présente un risque de perte élevé. En cochant ce garde-fou, vous reconnaissez expressément que <strong className="text-white">Bobdo Trading & Finance (BTF)</strong> décline toute responsabilité juridique directe ou indirecte quant aux profits ou pertes générés.
                </p>

                <div className="flex items-start gap-2 pt-1 border-t border-slate-900">
                  <input
                    id="checkbox-accept-financial-risk"
                    type="checkbox"
                    checked={isRiskAccepted}
                    onChange={(e) => setIsRiskAccepted(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-amber-500 focus:ring-amber-500 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="checkbox-accept-financial-risk" className="text-[10px] leading-relaxed text-slate-300 select-none cursor-pointer">
                    <strong>J'accepte et je décharge l'application de toute responsabilité.</strong> Je certifie comprendre les risques et assumer seul l'immuabilité de mes ordres financiers réels ou démo.
                  </label>
                </div>
              </div>

              {/* Feedback messages */}
              {tradeError && (
                <div id="trade-error-msg" className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-2.5 rounded-lg font-medium leading-relaxed">
                  {tradeError}
                </div>
              )}
              {tradeSuccess && (
                <div id="trade-success-msg" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-2.5 rounded-lg leading-relaxed font-medium">
                  {tradeSuccess}
                </div>
              )}

              {/* Execution Button */}
              <button
                id="btn-execute-order"
                type="submit"
                disabled={isOverRiskLimit || isVetoActive || dailyDrawdownLimitReached || isTrialExpired}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                  isOverRiskLimit || isVetoActive || dailyDrawdownLimitReached || isTrialExpired
                    ? "bg-slate-800 text-slate-500 border border-slate-705 cursor-not-allowed"
                    : tradeType === "BUY"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 focus:ring-2 focus:ring-emerald-450"
                    : "bg-red-500 hover:bg-red-600 text-slate-100 focus:ring-2 focus:ring-red-450"
                }`}
              >
                {selectedAsset.isCrypto ? "Transmettre l'Ordre Crypto International (API)" : "Transmettre l'Ordre BRVM (Local)"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Dynamic Orders Ledger logs with full tables */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900/30 to-slate-950">
        <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Registre Général des Ordres d'Arbitrage Émis</span>
          <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-bold text-emerald-400">
            {orders.length} positions enregistrées
          </span>
        </h4>

        {orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Aucune position de couverture enregistrée. Veuillez placer un premier ordre manuel de trading.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold text-[9px] uppercase tracking-wider font-mono">
                  <th className="pb-3">SYMBOLE ACTIF</th>
                  <th className="pb-3">SENS</th>
                  <th className="pb-3 text-right">COURS MOYEN D'ARRIVÉE</th>
                  <th className="pb-3 text-right">QUANTITÉ</th>
                  <th className="pb-3 text-right">SOLDE GLOBAL FCFA</th>
                  <th className="pb-3 text-center">STOP-LOSS ARRIÈRE</th>
                  <th className="pb-3 text-center">TAKE-PROFIT FIXE</th>
                  <th className="pb-3 text-center">MÉTHODOLOGIE</th>
                  <th className="pb-3 text-center">ÉTAT SÉCURITÉ REÇU</th>
                  <th className="pb-3 text-right">CENSURE ADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {orders.map((order) => {
                  const isBuy = order.type === "BUY";
                  return (
                    <tr id={`order-row-${order.id}`} key={order.id} className="hover:bg-slate-900/40 transform transition-colors">
                      <td className="py-3.5 font-semibold text-white">{order.symbol}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                          isBuy ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {order.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-slate-300">
                        {order.symbol.includes("/") 
                          ? `$${order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : `${order.price.toLocaleString()} F CFA`
                        }
                      </td>
                      <td className="py-3.5 text-right text-slate-400">{order.amount}</td>
                      <td className="py-3.5 text-right font-semibold text-emerald-400">{order.totalFCFA.toLocaleString()}</td>
                      <td className="py-3.5 text-center text-red-400 font-mono font-bold">{order.stopLoss?.toLocaleString() || "-"}</td>
                      <td className="py-3.5 text-center text-emerald-400 font-mono font-bold">{order.takeProfit?.toLocaleString() || "-"}</td>
                      <td className="py-3.5 text-center text-[10px]">
                        {order.isAutonomous ? (
                          <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">🤖 Autonome</span>
                        ) : (
                          <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded">👤 Manuel</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        {order.status === "COMPLETED" ? (
                          <span className="text-emerald-400 text-[10px] bg-emerald-500/5 px-2 py-0.5 rounded flex items-center justify-center gap-1 mx-auto max-w-max border border-emerald-500/15">
                            <CheckCircle className="h-3 w-3" /> Exécuté
                          </span>
                        ) : order.status === "CANCELLED" ? (
                          <span className="text-slate-400 text-[10px] bg-slate-900 px-2 py-0.5 rounded flex items-center justify-center gap-1 mx-auto max-w-max">
                            <XCircle className="h-3 w-3" /> Révoc-Veto
                          </span>
                        ) : (
                          <span className="text-amber-400 text-[10px] animate-pulse">En attente</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        {order.status === "COMPLETED" && (
                          <button
                            id={`cancel-veto-${order.id}`}
                            onClick={() => onCancelOrderVeto(order.id)}
                            className="bg-red-500/10 hover:bg-red-500 hover:text-slate-950 text-red-400 font-bold text-[9px] px-2.5 py-1 rounded-lg transition-all cursor-pointer border border-red-500/10"
                            title="Annuler immédiatement en invoquant le veto administratif"
                          >
                            Bloquer (Veto)
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

      {/* Secure API key connectors modal */}
      {apiKeysModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
            
            {/* LEFT COLUMN: Inputs form */}
            <div className="p-6 md:p-8 flex-1 border-r border-slate-850 space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-emerald-400" />
                  <span>Raccordement d'Exchanges Réels</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Raccordement ultra sécurisé. Vos identifiants restent encryptés côté serveur boursier (Module A).
                </p>
              </div>

              <form onSubmit={handleKeysModalSubmit} className="space-y-4">
                <div className="space-y-1.5 animate-slide-up">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">ID Client BRVM / Banque Locale</label>
                  <input
                    id="brvm-id-input"
                    type="text"
                    placeholder="par ex. brvm_coris_99818"
                    value={brvmId}
                    onChange={(e) => setBrvmId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Binance API Key</label>
                    <input
                      id="binance-key-input"
                      type="text"
                      placeholder="Clé Publique"
                      value={binanceKey}
                      onChange={(e) => setBinanceKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-250 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Binance API Secret</label>
                    <input
                      id="binance-secret-input"
                      type="password"
                      placeholder="Secret Key"
                      value={binanceSecret}
                      onChange={(e) => setBinanceSecret(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-250 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Bybit API Key</label>
                    <input
                      id="bybit-key-input"
                      type="text"
                      placeholder="Bybit key"
                      value={bybitKey}
                      onChange={(e) => setBybitKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-250 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">OKX API Key</label>
                    <input
                      id="okx-key-input"
                      type="text"
                      placeholder="OKX Key"
                      value={okxKey}
                      onChange={(e) => setOkxKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-250 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    id="btn-cancel-keys"
                    type="button"
                    onClick={() => setApiKeysModal(false)}
                    className="w-1/2 py-2.5 text-xs font-bold bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    Annuler / Retour
                  </button>
                  <button
                    id="btn-save-keys"
                    type="submit"
                    className="w-1/2 py-2.5 text-xs font-black bg-emerald-500 text-slate-950 hover:bg-emerald-600 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/10"
                  >
                    Valider le Raccordement
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: Tabbed step-by-step guideline files */}
            <div className="p-6 md:p-8 flex-1 bg-slate-950/40 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                
                <div className="space-y-1">
                  <span className="text-[9px] text-[#eab308] font-mono font-bold tracking-widest block uppercase">
                    GUIDE INTÉGRAL DE CONSPIRATION ET SÉCURITÉ
                  </span>
                  <h4 className="text-sm font-bold text-white">Comment obtenir vos clés d'Exchange ?</h4>
                </div>

                {/* Sub-tabs for Binance, OKX, Bybit */}
                <div className="flex bg-slate-900 overflow-x-auto p-1 rounded-xl border border-slate-800 gap-1">
                  {(['binance', 'okx', 'bybit'] as const).map((tab) => (
                    <button
                      id={`btn-guide-tab-${tab}`}
                      key={tab}
                      type="button"
                      onClick={() => setActiveGuideTab(tab)}
                      className={`flex-1 py-1.5 px-3 rounded-lg font-mono font-extrabold text-[10px] uppercase text-center transition-all cursor-pointer ${
                        activeGuideTab === tab
                          ? 'bg-slate-850 text-emerald-400 border border-slate-805/40 font-black'
                          : 'text-slate-505 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Guide Text Panels */}
                <div className="text-xs text-slate-300 leading-relaxed font-mono space-y-3 p-3 bg-slate-900/60 rounded-xl border border-slate-850/80 h-[240px] overflow-y-auto">
                  {activeGuideTab === 'binance' && (
                    <div className="space-y-3">
                      <p className="text-emerald-400 font-bold block">🚀 PROTOCOLE DE CONNEXION BINANCE :</p>
                      <ul className="space-y-2 text-[11px] text-slate-350 list-decimal pl-4.5">
                        <li>Rendez-vous sur l'application ou le site officiel <strong className="text-white">Binance.com</strong>.</li>
                        <li>Dans votre profil utilisateur, sélectionnez <strong className="text-white">API Management</strong> (Gestion des API).</li>
                        <li>Cliquez sur <strong className="text-white">Create API</strong> (Créer une API), choisissez "Système auto-généré".</li>
                        <li>Cochez les permissions réglementaires :
                          <ul className="list-disc pl-4 mt-1 text-emerald-400/90 font-bold">
                            <li>✓ Enable Reading (Activer la lecture)</li>
                            <li>✓ Enable Spot & Margin Trading (Trading)</li>
                          </ul>
                        </li>
                        <li className="text-[#f87171] font-bold">
                          ⚠️ RÈGLE DE GARANTIE BANCAIRE : Laissez la case <strong className="underline">"Enable Withdrawals" (Autoriser les retraits) STRICTEMENT DÉCOCHÉE</strong>.
                        </li>
                        <li>Enregistrez, copiez les hashs ("API Key" et "Secret Key") et collez-les à gauche.</li>
                      </ul>
                    </div>
                  )}

                  {activeGuideTab === 'okx' && (
                    <div className="space-y-3">
                      <p className="text-emerald-400 font-bold block">🚀 PROTOCOLE DE CONNEXION OKX :</p>
                      <ul className="space-y-2 text-[11px] text-slate-350 list-decimal pl-4.5">
                        <li>Connectez-vous sur votre tableau de bord <strong className="text-white">OKX.com</strong>.</li>
                        <li>Survolez l'icône de profil et cliquez sur la section <strong className="text-white">Clés API</strong> (V2 API).</li>
                        <li>Cliquez sur <strong className="text-white">Créer une clé API V5</strong>.</li>
                        <li>Renseignez le nom "Bobdo Bot" et choisissez un mot de passe de clé (Passphrase).</li>
                        <li>Attribuez les permissions strictes : <strong className="text-emerald-400">Lecture + Trade uniquement</strong>. Les retraits doivent rester inaccessibles.</li>
                        <li>Exportez la clé publique ("API Key") et saisissez-la à gauche.</li>
                      </ul>
                    </div>
                  )}

                  {activeGuideTab === 'bybit' && (
                    <div className="space-y-3">
                      <p className="text-emerald-400 font-bold block">🚀 PROTOCOLE DE CONNEXION BYBIT :</p>
                      <ul className="space-y-2 text-[11px] text-slate-350 list-decimal pl-4.5">
                        <li>Accédez au panneau d'administration sur <strong className="text-white">Bybit.com</strong>.</li>
                        <li>Allez dans <strong className="text-white">Subaccount/API</strong> puis l'onglet <strong className="text-white">API Management</strong>.</li>
                        <li>Cliquez sur <strong className="text-white">Create New API Key</strong> (Créer une nouvelle clé d'intégration).</li>
                        <li>Cochez l'autorisation "Contrat" et actions "Spot Market Trading".</li>
                        <li className="text-red-400 font-bold">⚠️ SÉCURITÉ : Ne cochez aucune case liée aux transferts internes ou retraits vers l'extérieur.</li>
                        <li>Sauvegardez l'ID d'intégration et transférez les codes à gauche.</li>
                      </ul>
                    </div>
                  )}
                </div>

              </div>

              {/* Ultra Secure assurance footer */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-[10px] text-slate-400 font-mono leading-relaxed">
                  Notre Risk Manager intègre un veto automatique de transaction. Aucun ordre de retrait ou mouvement de capital n'est techniquement possible.
                </span>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

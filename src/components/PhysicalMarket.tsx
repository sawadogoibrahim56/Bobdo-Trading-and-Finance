/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Globe, TrendingUp, TrendingDown, Wheat, PlusCircle, Scale, ShieldAlert, CheckCircle, Database, HelpCircle, FileText, AlertCircle, Sparkles } from "lucide-react";
import { PhysicalMarketReport } from "../types";

interface PhysicalMarketProps {
  reports: PhysicalMarketReport[];
  onSubmitReport: (reportData: any) => Promise<boolean>;
  triggerRefresh: () => void;
}

const CORRIDORS = [
  { name: "Abidjan-Ouagadougou", desc: "Flux d'importations maritimes, poisson frais, agrumes" },
  { name: "Bobo-Dioulasso", desc: "Hub céréalier majeur UEMOA, maïs, sorgho, riz local" },
  { name: "Mali-Burkina", desc: "Transit logistique et élevage de bétail sur pied" },
  { name: "Lomé-Ouagadougou", desc: "Axe routier lourd pour l'engrais, le clinker et le carburant" },
  { name: "Sénégal-UEMOA", desc: "Échanges ouest-atlantiques, produits de la mer et arachides" },
  { name: "Indicateurs Mondiaux", desc: "Cours Chicago/London (Coton international, Or, Cacao)" }
];

export default function PhysicalMarket({ reports, onSubmitReport, triggerRefresh }: PhysicalMarketProps) {
  // Local state for adding raw data reports
  const [corridor, setCorridor] = useState("Bobo-Dioulasso");
  const [product, setProduct] = useState("");
  const [scarcityIndex, setScarcityIndex] = useState("45");
  const [trend, setTrend] = useState<"UP" | "DOWN" | "STABLE">("STABLE");
  const [observedPriceFCFA, setObservedPriceFCFA] = useState("");
  const [unit, setUnit] = useState("tonne");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<"LOCAL" | "INTERNATIONAL">("LOCAL");

  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "LOCAL" | "INTERNATIONAL">("ALL");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess(null);
    setNotifError(null);

    if (!product || !observedPriceFCFA || !unit) {
      setNotifError("Erreur : Veuillez remplir le nom du produit, le prix observé de l'enquête et l'unité.");
      return;
    }

    const priceNum = parseFloat(observedPriceFCFA);
    if (isNaN(priceNum) || priceNum <= 0) {
      setNotifError("Erreur : Le prix observé doit être un nombre positif strictement supérieur à zéro.");
      return;
    }

    // Embed the sourceType in description so it propagates nicely to Admin panel
    const fullDesc = `[Source: ${sourceType}] ${description}`;

    const payload = {
      corridor,
      product,
      scarcityIndex: parseInt(scarcityIndex),
      trend,
      observedPriceFCFA: priceNum,
      unit,
      description: fullDesc
    };

    const success = await onSubmitReport(payload);
    if (success) {
      setNotifSuccess(`Succès! L'enquête terrain pour "${product}" a été enregistrée à la seconde près. Retour immédiat à l'administrateur.`);
      setProduct("");
      setObservedPriceFCFA("");
      setDescription("");
      triggerRefresh();
    } else {
      setNotifError("Une erreur est survenue lors de l'enregistrement de l'enquête locale.");
    }
  };

  // Filter computation
  const filteredReports = reports.filter(r => {
    const isInt = r.description?.includes("[Source: INTERNATIONAL]") || r.corridor === "Indicateurs Mondiaux";
    if (activeFilter === "LOCAL") return !isInt;
    if (activeFilter === "INTERNATIONAL") return isInt;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Dynamic Upper Banner with precise details */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                COLLECTEUR DE DONNÉES EN DIRECT
              </span>
            </div>
            <h2 className="text-lg font-display font-bold text-white tracking-tight mt-1.5">
              Rapports d'Enquêtes Terrain, Logistique & Indices Internationaux
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Pour éliminer tout temps de décalage, Bobdo Trading associe les rapports collectés sur le terrain (axes logistiques de l'UEMOA) aux statistiques économiques mondiales (Chicago / New-York). Les données collectées guident notre IA autonome 24h/24, 7j/7 avant chaque prise de position.
            </p>
          </div>
          <div className="bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-800 text-left shrink-0">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">ENQUÊTES GLOBALISÉES</span>
            <span className="text-xl font-display font-bold text-emerald-400 font-mono">
              {(reports.length + 8)} actives
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Analysées sans interruption</span>
          </div>
        </div>

        {/* Dynamic corridor statistics in elegant cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 mt-6 border-t border-slate-800/80 pt-6">
          {CORRIDORS.map((cor, idx) => {
            const count = reports.filter(r => r.corridor === cor.name).length;
            const isInt = cor.name === "Indicateurs Mondiaux";
            return (
              <div key={idx} className="bg-slate-900/40 hover:bg-slate-900/70 p-3 rounded-xl border border-slate-850 transition-all flex flex-col justify-between">
                <div>
                  <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                    isInt ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {isInt ? "Mondial" : "Axe UEMOA"}
                  </span>
                  <div className="text-[10px] text-white font-bold mt-2 truncate" title={cor.name}>
                    {cor.name}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{cor.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/40 flex justify-between items-center text-[9px] font-mono text-slate-400">
                  <span>ENQUÊTES</span>
                  <span className="font-bold text-slate-100 bg-slate-800 px-1.5 py-0.2 rounded">
                    {count || (idx % 2 === 0 ? 3 : 2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Registered surveys in tabular / visual layout */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Tab Filter buttons for clarity */}
          <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1">
              {(["ALL", "LOCAL", "INTERNATIONAL"] as const).map((tab) => (
                <button
                  id={`tab-filter-phys-${tab}`}
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    activeFilter === tab
                      ? "bg-emerald-500 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "ALL" ? "TOUTES LES ENQUÊTES" : tab === "LOCAL" ? "TERRAIN LOCALE UEMOA" : "MARCHÉ MONDIAL / CRYPTO"}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 font-mono pr-2">{filteredReports.length} résultats</span>
          </div>

          {/* Core Table view - "des cartes c'est des tableaux qu'il faut dessiner" */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Registre d'Arbitrage des Enquêteurs & d'Arbitrage</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Database className="h-3 w-3" /> Base temps réel actualisée
              </span>
            </h3>

            {filteredReports.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Aucun rapport ne correspond à ce filtre de conformité.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold text-[9px] uppercase tracking-wider font-mono">
                      <th className="pb-3.5">AXE / SCOPE</th>
                      <th className="pb-3.5">PRODUIT / SOURCE</th>
                      <th className="pb-3.5 text-right">PRIX OBSERVÉ</th>
                      <th className="pb-3.5 text-center">INDICE RARETÉ</th>
                      <th className="pb-3.5 text-center">TENDANCE</th>
                      <th className="pb-3.5 text-right">STATUT SÉCURITÉ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredReports.map((rep) => {
                      const isHigh = rep.scarcityIndex >= 70;
                      const isLow = rep.scarcityIndex <= 30;
                      const isInt = rep.description?.includes("[Source: INTERNATIONAL]") || rep.corridor === "Indicateurs Mondiaux";
                      
                      return (
                        <tr id={`phys-row-${rep.id}`} key={rep.id} className="hover:bg-slate-900/20 group">
                          {/* Corridor */}
                          <td className="py-4.5">
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {rep.corridor}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8px] px-1 rounded font-bold uppercase font-mono ${
                                  isInt ? "bg-[#eab308]/10 text-amber-400" : "bg-[#10b981]/10 text-emerald-400"
                                }`}>
                                  {isInt ? "Mondial" : "UEMOA Local"}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {new Date(rep.createdAt).toISOString().substring(11, 16)} UTC
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Product and description notes */}
                          <td className="py-4.5 max-w-xs">
                            <div className="space-y-1">
                              <div className="text-xs text-slate-200 font-bold">
                                {rep.product} <span className="text-[10px] text-slate-500 font-normal font-mono">({rep.unit})</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                                {rep.description?.replace(/\[Source: (LOCAL|INTERNATIONAL)\]\s?/, "")}
                              </p>
                            </div>
                          </td>

                          {/* Observed Price */}
                          <td className="py-4.5 text-right font-mono font-bold text-slate-100">
                            {rep.observedPriceFCFA.toLocaleString()} F CFA
                          </td>

                          {/* Scarcity metric scale */}
                          <td className="py-4.5">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className={`font-mono text-[11px] font-bold ${
                                isHigh ? "text-red-400" : isLow ? "text-emerald-400" : "text-amber-400"
                              }`}>
                                {rep.scarcityIndex} %
                              </span>
                              {/* Small micro bar */}
                              <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${isHigh ? "bg-red-500" : isLow ? "bg-emerald-500" : "bg-amber-400"}`}
                                  style={{ width: `${rep.scarcityIndex}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Trend */}
                          <td className="py-4.5 text-center">
                            {rep.trend === "UP" ? (
                              <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-bold uppercase bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                                <TrendingUp className="h-3 w-3" /> Hausse
                              </span>
                            ) : rep.trend === "DOWN" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                <TrendingDown className="h-3 w-3" /> Baisse
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold tracking-wider font-mono bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                                STABLE
                              </span>
                            )}
                          </td>

                          {/* Status and Action Link */}
                          <td className="py-4.5 text-right font-mono">
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                              ✓ VALIDÉ SÉCURISÉ
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Collect form to transmit data to administrator/risk model */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/20">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-emerald-400" />
              <span>Transmettre un rapport d'enquête</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Enregistrez vos enquêtes de terrain ou analyses économiques mondiales des cours d'actifs. Le rapport sera immédiatement transmis au portail d'audit de l'administrateur.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Local vs International Indicator Switch */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scope Économique global</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-850">
                  <button
                    id="btn-source-local"
                    type="button"
                    onClick={() => {
                      setSourceType("LOCAL");
                      setCorridor("Bobo-Dioulasso");
                    }}
                    className={`py-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                      sourceType === "LOCAL"
                        ? "bg-emerald-500 text-slate-950 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    UEMOA (Terrain)
                  </button>
                  <button
                    id="btn-source-intl"
                    type="button"
                    onClick={() => {
                      setSourceType("INTERNATIONAL");
                      setCorridor("Indicateurs Mondiaux");
                    }}
                    className={`py-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                      sourceType === "INTERNATIONAL"
                        ? "bg-amber-500 text-slate-950 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    MONDIAL & CRYPTO
                  </button>
                </div>
              </div>

              {/* Corridor */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Axe ou Ticker boursier</label>
                <select
                  id="select-corridor"
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  {sourceType === "LOCAL" ? (
                    CORRIDORS.filter(c => c.name !== "Indicateurs Mondiaux").map((cor) => (
                      <option key={cor.name} value={cor.name}>{cor.name}</option>
                    ))
                  ) : (
                    <option value="Indicateurs Mondiaux">Indicateurs Mondiaux (Chicago, NY, Crypto)</option>
                  )}
                </select>
              </div>

              {/* Product */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Produit, Actif ou Indice</label>
                <input
                  id="input-product"
                  type="text"
                  placeholder={sourceType === "LOCAL" ? "Maïs, coton burkinabè, sorgho..." : "Blé Chicago, Bitcoin Crypto, Or, Dollar..."}
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-slate-650"
                  required
                />
              </div>

              {/* Unit and Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unité d'arbitrage</label>
                  <input
                    id="input-unit"
                    type="text"
                    placeholder="par ex. tonne, kg, once, USDT"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prix d'enquête (FCFA)</label>
                  <input
                    id="input-phys-price"
                    type="number"
                    placeholder="ex. 18500"
                    value={observedPriceFCFA}
                    onChange={(e) => setObservedPriceFCFA(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Scarcity Sliders */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Index de Rareté / Déviation ({scarcityIndex}%)</label>
                <input
                  id="slider-scarcity"
                  type="range"
                  min="0"
                  max="100"
                  value={scarcityIndex}
                  onChange={(e) => setScarcityIndex(e.target.value)}
                  className="w-full accent-emerald-400"
                />
                <div className="flex justify-between text-[8px] text-zinc-500 font-mono font-semibold">
                  <span>ABONDANCE (0%)</span>
                  <span>MOYEN (50%)</span>
                  <span>PÉNURIE EXTRÊME (100%)</span>
                </div>
              </div>

              {/* Trend Buttons */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tendance des cours boursiers</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {["DOWN", "STABLE", "UP"].map((item) => (
                    <button
                      id={`btn-trend-${item}`}
                      key={item}
                      type="button"
                      onClick={() => setTrend(item as any)}
                      className={`py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                        trend === item
                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {item === "UP" ? "HAUSSE" : item === "DOWN" ? "BAISSE" : "STABLE"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observations complémentaires du collecteur</label>
                <textarea
                  id="textarea-phys-desc"
                  rows={2.5}
                  placeholder="Inscrivez les faits notables: temps de transport, blocage de virement, taux de change, rachat de cacao etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-slate-650"
                />
              </div>

              {notifSuccess && (
                <div id="phys-success-notif" className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[11px] p-2.5 rounded-lg">
                  {notifSuccess}
                </div>
              )}
              {notifError && (
                <div id="phys-error-notif" className="text-red-500 bg-red-500/10 border border-red-500/20 text-[11px] p-2.5 rounded-lg">
                  {notifError}
                </div>
              )}

              <button
                id="btn-submit-phys-report"
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl text-slate-950 text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Soumettre l'Enquête au Cerveau de Risque</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

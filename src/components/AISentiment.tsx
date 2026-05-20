/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Cpu, Search, RefreshCw, MessageSquare, Flame, Check, Sparkles, TrendingUp, AlertTriangle, BadgeCheck } from "lucide-react";
import { SentimentAnalysis } from "../types";

interface AISentimentProps {
  sentiments: SentimentAnalysis[];
  onTriggerScan: (entity: string) => Promise<SentimentAnalysis[]>;
}

const POPULAR_TOPICS = [
  "Coris Bank International",
  "Sonatel Sénégal",
  "Orange Côte d'Ivoire",
  "BCEAO Inflation UEMOA",
  "Bitcoin Crypto",
  "Coton & Or Burkina Faso"
];

export default function AISentiment({ sentiments, onTriggerScan }: AISentimentProps) {
  const [searchValue, setSearchValue] = useState("Coris Bank");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SentimentAnalysis[]>(sentiments);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);

  const handleScan = async (topic: string) => {
    setIsScanning(true);
    setSearchValue(topic);
    try {
      const result = await onTriggerScan(topic);
      if (result && result.length > 0) {
        setScanResult(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Input Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
        <div className="flex items-center gap-3 mb-2">
          <Cpu className="h-6 w-6 text-emerald-400" />
          <h2 className="text-base font-display font-bold text-white uppercase tracking-wider">
            Scanner Sentiment NLP Intégrateur Gemini - Grounding Google Search
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Saisissez une entreprise cotée à la BRVM ou un actif mondial. Notre moteur d'analyse Gemini formulera des requêtes sur Google Search, scrutera les dernières annonces macroéconomiques mondiales de personnalités publiques de premier plan, et retournera un score de sentiment pondéré.
        </p>

        {/* Search Input and button */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-6 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              id="input-nlp-search"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Ex: BCEAO Inflation UEMOA, Sonatel, Bitcoin..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
          <button
            id="btn-nlp-scan"
            onClick={() => handleScan(searchValue)}
            disabled={isScanning}
            className="bg-emerald-500 hover:bg-emerald-600 font-bold px-6 py-2.5 rounded-xl text-slate-950 text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Analyse en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Rechercher & Analyser</span>
              </>
            )}
          </button>
        </div>

        {/* Suggestion Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Raccourcis intelligents :</span>
          {POPULAR_TOPICS.map((topic, index) => (
            <button
              id={`shortcut-nlp-${index}`}
              key={index}
              onClick={() => handleScan(topic)}
              className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 font-mono px-2.5 py-1 rounded-md border border-slate-800 cursor-pointer"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Sentiment Analysis Output Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Render Scanned news nodes from server */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Résultats du Scanner de Sentiment Actuel</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5" /> IA Décideur Activé
              </span>
            </h3>

            {isScanning ? (
              <div className="py-20 text-center space-y-4">
                <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mx-auto" />
                <div className="text-xs text-slate-400 font-mono animate-pulse">
                  Recherches Grounding Google Finance en direct • Vérification de la presse ouest-africaine...
                </div>
                <div className="text-[10px] text-slate-500 max-w-sm mx-auto">
                  "Scurte de manière immuable l'indice de rareté et le flux logistique pour formuler la décision optimale de take-profit."
                </div>
              </div>
            ) : scanResult.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Aucun rapport généré. Tapez une requête ci-dessus pour éveiller le cerveau NLP de Bobdo.
              </div>
            ) : (
              <div className="space-y-4">
                {scanResult.map((sent) => {
                  const scoreObj = mapScore(sent.sentimentScore);
                  return (
                    <div 
                      id={`nlp-card-${sent.id}`}
                      key={sent.id} 
                      className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 hover:border-slate-705 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-emerald-400 font-bold font-mono tracking-widest bg-slate-900 border border-slate-850 px-2 py-0.5 rounded uppercase">
                            {sent.source}
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1">Actif visé : {sent.entity}</h4>
                        </div>

                        {/* Sentiment indicator Gauge with custom color labels */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded font-mono uppercase ${scoreObj.badgeStyle}`}>
                            {scoreObj.label} (Score: {sent.sentimentScore.toFixed(2)})
                          </span>
                        </div>
                      </div>

                      {/* Summary block */}
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-2 bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                        {sent.summary}
                      </p>

                      {/* Action response guidance */}
                      <div className="flex items-start gap-2 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-[11px] text-slate-300">
                        <TrendingUp className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-400">Actionneur de Trading Recommandé :</strong> {sent.impactOnTrading}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Grounding / Logic Explanation info */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pourquoi le NLP ?</h3>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              En trading moderne, 80 % des mouvements de cours brutaux et inhabituels (BRVM ou crypto) sont provoqués par des fuites financières, des déclarations de PDG ou des crises d'approvisionnement logistiques annoncées sur le net.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-slate-800 shrink-0 font-mono">1</div>
                <p className="text-[11px] text-slate-400"><strong>Extraction NLP :</strong> Convertit le langage d'actualité brute en facteurs de décision négatifs ou positifs.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-slate-800 shrink-0 font-mono">2</div>
                <p className="text-[11px] text-slate-400"><strong>Pondération de risque :</strong> Les sentiments baissiers sur le coton ou le cacao arrêtent immédiatement les ordres automatisés de risque.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-slate-800 shrink-0 font-mono">3</div>
                <p className="text-[11px] text-slate-400"><strong>Intégrité UEMOA :</strong> Adapte la lecture des sentiments à l'éthique économique de l'Afrique de l'Ouest sub-saharienne.</p>
              </div>
            </div>

            {/* Safety alert message */}
            <div className="bg-amber-500/5 border border-amber-500/15 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-500 font-medium">
                Sachez que les sentiments boursiers d'opinion constituent une assistance stratégique et non un conseil financier d'investissement garanti à 100%. Protégez toujours vos stop-loss.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Convert score to proper styling and translation label
function mapScore(score: number) {
  if (score >= 0.45) {
    return {
      label: "Très Haussier",
      badgeStyle: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    };
  } else if (score >= 0.1) {
    return {
      label: "Légèrement Haussier",
      badgeStyle: "bg-emerald-500/5 text-emerald-300 border border-emerald-300/10"
    };
  } else if (score <= -0.45) {
    return {
      label: "Très Baissier",
      badgeStyle: "bg-red-500/10 text-red-400 border border-red-500/20"
    };
  } else if (score <= -0.1) {
    return {
      label: "Légèrement Baissier",
      badgeStyle: "bg-red-500/5 text-red-350 border border-red-300/10"
    };
  } else {
    return {
      label: "Neutre",
      badgeStyle: "bg-slate-800 text-slate-400 border border-slate-700"
    };
  }
}

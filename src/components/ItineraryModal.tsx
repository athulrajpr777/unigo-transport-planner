import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { RouteOption, RoutePlanResult, WeatherCondition } from '../types.ts';
import { WeatherWidget } from './WeatherWidget.tsx';
import {
  X,
  Leaf,
  Clock,
  CheckCircle2,
  Copy,
  TrendingDown,
  IndianRupee,
} from 'lucide-react';

interface ItineraryModalProps {
  route: RouteOption;
  plan: RoutePlanResult;
  onClose: () => void;
}

export const ItineraryModal: React.FC<ItineraryModalProps> = ({ route, plan, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [originWeather, setOriginWeather] = useState<WeatherCondition | undefined>(plan.originWeather);
  const [destinationWeather, setDestinationWeather] = useState<WeatherCondition | undefined>(plan.destinationWeather);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);

  const formatTransitText = (text?: string): string => {
    if (!text) return '';
    return text
      .replace(/\bcus_ksrtc\b/gi, 'KSRTC Bus')
      .replace(/\bbus_ksrtc\b/gi, 'KSRTC Bus')
      .replace(/\brail_train\b/gi, 'Train')
      .replace(/\btrain_rail\b/gi, 'Train')
      .replace(/\bmetro_rail\b/gi, 'Metro')
      .replace(/\bwalk_foot\b/gi, 'Walk')
      .replace(/_/g, ' ');
  };

  // If weather was not pre-fetched in plan, fetch it on mount
  useEffect(() => {
    if (!originWeather || !destinationWeather) {
      handleRefreshWeather();
    }
  }, [plan.resolvedFrom, plan.resolvedTo]);

  const handleRefreshWeather = async () => {
    const fromLoc = plan.resolvedFrom || plan.from;
    const toLoc = plan.resolvedTo || plan.to;
    if (!fromLoc || !toLoc) return;

    setIsRefreshingWeather(true);
    try {
      const res = await fetch(
        `/api/weather?from=${encodeURIComponent(fromLoc)}&to=${encodeURIComponent(toLoc)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.originWeather) setOriginWeather(data.originWeather);
        if (data.destinationWeather) setDestinationWeather(data.destinationWeather);
      }
    } catch (err) {
      console.warn('Failed to refresh itinerary weather:', err);
    } finally {
      setIsRefreshingWeather(false);
    }
  };

  const isCheapest = route.priorityCategory === 'cheapest' || route.isRecommended;
  const isEco = route.priorityCategory === 'eco_friendly';

  // Approximate smartphone charges saved: 1 kg CO2 ≈ 120 full smartphone recharges
  const phoneRecharges = Math.round(route.co2SavedKg * 120);

  const handleCopy = () => {
    const originWeatherText = originWeather
      ? `Departure Weather: ${originWeather.temperature}°C, ${originWeather.conditionText}`
      : '';
    const destWeatherText = destinationWeather
      ? `Arrival Weather: ${destinationWeather.temperature}°C, ${destinationWeather.conditionText}`
      : '';
    const weatherLine =
      originWeatherText || destWeatherText
        ? `\nLive Route Weather:\n• ${originWeatherText}\n• ${destWeatherText}\n`
        : '';

    const text = `UniGo Sustainable Route from ${plan.resolvedFrom} to ${plan.resolvedTo} (${route.categoryLabel}):
Duration: ${route.durationMinutes} mins | Distance: ${route.distanceKm} km | Cost: ₹${route.estimatedCostInr}
CO2 Avoided: ${route.co2SavedKg} kg (-${route.co2SavingsPercent}% vs solo car)${weatherLine}
Steps:
${route.segments.map((s, i) => `${i + 1}. [${s.modeLabel}] ${s.title}: ${s.detail} (${s.durationMinutes}m)`).join('\n')}
Planned with UniGo India`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      id="itinerary-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
    >
      <motion.div
        id="itinerary-modal-container"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#132E3F]/90 backdrop-blur-xl text-[#E2E8F0] w-full max-w-2xl rounded-2xl border border-[#1E4357]/75 shadow-2xl shadow-black overflow-hidden max-h-[90vh] flex flex-col gpu-smooth"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E4357]/75 bg-[#0F2634]/90">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isCheapest
                  ? 'bg-[#0A1C16]/90 border-[#C5A869] text-[#C5A869]'
                  : isEco
                  ? 'bg-[#0A1C16]/90 border-[#10B981]/60 text-[#10B981]'
                  : 'bg-[#0A1C16]/90 border-[#1E4537]/75 text-[#8BA59B]'
              }`}
            >
              {isCheapest ? (
                <IndianRupee className="w-5 h-5 text-[#C5A869]" />
              ) : isEco ? (
                <Leaf className="w-5 h-5 text-[#10B981]" />
              ) : (
                <Clock className="w-5 h-5 text-[#8BA59B]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#FAF6EC]">{route.categoryLabel} Route</h3>
                {isCheapest && (
                  <span className="bg-[#C5A869]/15 text-[#DFCCA3] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#C5A869]/30 flex items-center">
                    Recommended Choice
                  </span>
                )}
                {isEco && !isCheapest && (
                  <span className="bg-[#10B981]/15 text-[#6EE7B7] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#10B981]/30">
                    Zero-Emission Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8BA59B] mt-0.5">
                {plan.resolvedFrom} → {plan.resolvedTo}
              </p>
            </div>
          </div>
          <button
            id="close-itinerary-modal-btn"
            onClick={onClose}
            aria-label="Close itinerary details"
            className="p-1.5 rounded-lg text-[#8BA59B] hover:text-[#FAF6EC] hover:bg-[#16352B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#07161F]/90 backdrop-blur-sm p-4 rounded-xl border border-[#1E4357]/60">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8BA59B]">CO2 Avoided</p>
              <p className="text-lg font-bold text-[#C5A869]">-{route.co2SavedKg} kg</p>
              <p className="text-[10px] text-[#5EEAD4]">{route.co2SavingsPercent}% cleaner</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8BA59B]">Est. Duration</p>
              <p className="text-lg font-bold text-[#FAF6EC]">{route.durationMinutes} min</p>
              <p className="text-[10px] text-[#8BA59B]">{route.distanceKm} km total</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8BA59B]">Estimated Cost</p>
              <p className="text-lg font-bold text-[#FAF6EC]">₹{route.estimatedCostInr}</p>
              <p className="text-[10px] text-[#8BA59B]">vs ₹{plan.baselineSoloCarCostInr} fuel</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8BA59B]">Transfers</p>
              <p className="text-lg font-bold text-[#FAF6EC]">{route.transfersCount}</p>
              <p className="text-[10px] text-[#8BA59B]">Transit connection</p>
            </div>
          </div>

          {/* Environmental Equivalent Box */}
          <div className="bg-[#0B241C]/90 backdrop-blur-sm border border-[#C5A869]/30 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0A1C16]/90 border border-[#C5A869] text-[#C5A869] flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-[#C5A869]" />
            </div>
            <div className="text-xs text-[#D1DCD9]">
              <p className="font-bold text-sm text-[#FAF6EC]">
                Climate Impact of this choice
              </p>
              <p className="text-[11px] text-[#8BA59B] mt-0.5">
                By choosing this sustainable multimodal combination, you eliminate{' '}
                <strong className="text-[#C5A869]">{route.co2SavedKg} kg of CO2</strong> from entering urban air. That equals
                powering a smartphone for <strong className="text-[#C5A869]">{phoneRecharges} full recharge cycles</strong>!
              </p>
            </div>
          </div>

          {/* Current Weather Along Itinerary (Origin & Destination) */}
          <WeatherWidget
            variant="modal"
            originWeather={originWeather}
            destinationWeather={destinationWeather}
            originName={plan.resolvedFrom || plan.from}
            destinationName={plan.resolvedTo || plan.to}
            onRefreshWeather={handleRefreshWeather}
            isRefreshing={isRefreshingWeather}
          />

          {/* Step-by-Step Multimodal Segments */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#C5A869] mb-3">
              Step-by-Step Multimodal Itinerary
            </h4>
            <div className="space-y-4">
              {route.segments.map((segment, idx) => (
                <div key={segment.id || idx} className="relative flex items-start gap-4">
                  {/* Step indicator circle */}
                  <div className="w-8 h-8 rounded-full bg-[#0A1C16]/90 text-[#DFCCA3] font-bold text-xs flex items-center justify-center shrink-0 z-10 border border-[#C5A869]/50 shadow-xs">
                    {idx + 1}
                  </div>

                  {/* Connecting vertical line */}
                  {idx < route.segments.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 -ml-px bg-[#1E4537]/75"></div>
                  )}

                  {/* Segment Details */}
                  <div className="flex-1 pb-3 bg-[#07161F]/90 backdrop-blur-sm p-3.5 rounded-xl border border-[#1E4357]/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-[#DFCCA3]">
                        {formatTransitText(segment.modeLabel)}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-[#8BA59B]">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-[#C5A869]" />
                          {segment.durationMinutes} mins
                        </span>
                        <span>•</span>
                        <span>{segment.distanceKm} km</span>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-[#FAF6EC]">{formatTransitText(segment.title)}</p>
                    <p className="text-xs text-[#8BA59B] mt-1">{formatTransitText(segment.detail)}</p>
                    {segment.notes && (
                      <p className="text-[11px] text-[#5EEAD4] mt-2 font-medium bg-[#0A1C16]/90 border border-[#14B8A6]/30 px-2.5 py-1 rounded inline-block">
                        ✓ {segment.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights */}
          {route.highlights && route.highlights.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#C5A869] mb-2">
                Route Highlights
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#D1DCD9]">
                {route.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 bg-[#07161F]/90 backdrop-blur-xs p-2.5 rounded-lg border border-[#1E4357]/60">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A869] shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#0F2634]/90 border-t border-[#1E4357]/75 flex items-center justify-between">
          <button
            id="copy-itinerary-btn"
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#B5C7C1] hover:text-[#FAF6EC] px-3 py-2 rounded-lg border border-[#1E4537]/75 hover:border-[#C5A869] hover:bg-[#142F25] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5EEAD4]" />
                <span className="text-[#5EEAD4]">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#C5A869]" />
                <span>Copy Directions</span>
              </>
            )}
          </button>

          <button
            id="close-modal-bottom-btn"
            type="button"
            onClick={onClose}
            className="bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] text-[#0A1C16] px-5 py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all cursor-pointer border border-[#C5A869]"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

import React from 'react';
import type { RouteOption, WeatherCondition } from '../types.ts';
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
  Clock,
  Zap,
  Bus,
  TrainFront,
  Footprints,
  Bike,
  Car,
} from 'lucide-react';
import { WeatherWidget } from './WeatherWidget.tsx';

interface RouteCardProps {
  route: RouteOption;
  onSelect: (route: RouteOption) => void;
  isSelected?: boolean;
  originWeather?: WeatherCondition | null;
  destinationWeather?: WeatherCondition | null;
  originName?: string;
  destinationName?: string;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onSelect,
  isSelected = false,
  originWeather,
  destinationWeather,
  originName = 'Start',
  destinationName = 'End',
}) => {
  const isRecommended = Boolean(route.isRecommended || route.priorityCategory === 'cheapest');

  // Format any raw technical snake_case identifiers like cus_ksrtc, rail_train, etc.
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

  // Helper to render an elegant transit icon or strictly 1-letter badge that NEVER overflows
  const renderSegmentBadge = (
    badgeCode: string,
    mode?: string,
    modeLabel?: string,
    title?: string
  ) => {
    const raw = `${badgeCode || ''} ${mode || ''} ${modeLabel || ''} ${title || ''}`.toLowerCase();

    // 1. Train / Express Rail (including rail_train)
    if (raw.includes('rail') || raw.includes('train') || raw.includes('emu') || raw.includes('express')) {
      return (
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-[#0A1C16] text-[#93C5FD] border border-[#38BDF8]/40 overflow-hidden shadow-xs"
          title={formatTransitText(modeLabel) || 'Train'}
        >
          <TrainFront className="w-3.5 h-3.5" />
        </div>
      );
    }

    // 2. Metro
    if (raw.includes('metro')) {
      return (
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-[#0A1C16] text-[#DFCCA3] border border-[#C5A869]/40 overflow-hidden shadow-xs"
          title={formatTransitText(modeLabel) || 'Metro'}
        >
          <TrainFront className="w-3.5 h-3.5" />
        </div>
      );
    }

    // 3. Bus / KSRTC / BMTC (including cus_ksrtc, bus_ksrtc)
    if (
      raw.includes('bus') ||
      raw.includes('ksrtc') ||
      raw.includes('bmtc') ||
      raw.includes('dtc') ||
      raw.includes('best') ||
      raw.includes('cus')
    ) {
      return (
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-[#0A1C16] text-[#D5BE8A] border border-[#C5A869]/40 overflow-hidden shadow-xs"
          title={formatTransitText(modeLabel) || 'Bus'}
        >
          <Bus className="w-3.5 h-3.5" />
        </div>
      );
    }

    // 4. Walk / Footprints
    if (raw.includes('walk') || raw.includes('foot') || raw.includes('pedestrian')) {
      return (
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-[#0A1C16] text-[#8BA59B] border border-[#8BA59B]/40 overflow-hidden shadow-xs"
          title={formatTransitText(modeLabel) || 'Walk'}
        >
          <Footprints className="w-3.5 h-3.5" />
        </div>
      );
    }

    // 5. Smart Cycle / Bike
    if (raw.includes('cycle') || raw.includes('bike') || raw.includes('pedal')) {
      return (
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-[#0A1C16] text-[#5EEAD4] border border-[#14B8A6]/40 overflow-hidden shadow-xs"
          title={formatTransitText(modeLabel) || 'Smart Cycle'}
        >
          <Bike className="w-3.5 h-3.5" />
        </div>
      );
    }

    // 6. E-Rickshaw / Auto
    if (raw.includes('auto') || raw.includes('rickshaw') || raw.includes('erick')) {
      return (
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-[#0A1C16] text-[#D8B4FE] border border-[#C084FC]/40 overflow-hidden shadow-xs"
          title={formatTransitText(modeLabel) || 'E-Rickshaw / Auto'}
        >
          <Zap className="w-3.5 h-3.5" />
        </div>
      );
    }

    // 7. Carpool / Shared Cab
    if (raw.includes('car') || raw.includes('cab') || raw.includes('pool') || raw.includes('taxi')) {
      return (
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-[#0A1C16] text-[#93C5FD] border border-[#38BDF8]/40 overflow-hidden shadow-xs"
          title={formatTransitText(modeLabel) || 'Carpool / Cab'}
        >
          <Car className="w-3.5 h-3.5" />
        </div>
      );
    }

    // Strict 1-character uppercase fallback to guarantee zero overflow
    const char = (badgeCode || 'T').trim().charAt(0).toUpperCase();
    return (
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 bg-[#0A1C16] text-[#DFCCA3] border border-transparent overflow-hidden shadow-xs"
        title={formatTransitText(modeLabel) || 'Transit'}
      >
        {char}
      </div>
    );
  };

  return (
    <div
      id={`route-card-${route.id}`}
      className={`rounded-2xl p-6 flex flex-col relative transition-all duration-200 ease-out gpu-smooth backdrop-blur-md hover:-translate-y-1.5 border border-[#1E4357]/70 hover:border-[#C5A869]/50 ${
        isRecommended
          ? 'bg-gradient-to-b from-[#113243]/90 to-[#0A1F2B]/90 shadow-xl shadow-black/50 hover:shadow-2xl hover:shadow-black/70'
          : 'bg-[#07161F]/90 shadow-lg shadow-black/40 hover:bg-[#0C2230]/90 hover:shadow-xl hover:shadow-black/60'
      }`}
    >
      {/* Recommended Tag for Cheapest preference */}
      {isRecommended && (
        <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] text-[#0A1C16] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center shadow-md shadow-black/40 transition-transform duration-200 hover:scale-105">
          <span>Recommended</span>
        </div>
      )}

      {/* Card Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[#FAF6EC] font-extrabold text-lg">{route.categoryLabel}</h3>
          <span className="text-[11px] font-bold text-[#DFCCA3] bg-[#071712]/80 px-2.5 py-1 rounded-lg border border-transparent">
            ₹{route.estimatedCostInr}
          </span>
        </div>
        <p className="text-[#8BA59B] text-xs mt-1 line-clamp-1">{route.subtitle}</p>
      </div>

      {/* Real-time Weather in Itinerary Tile */}
      {(originWeather || destinationWeather) && (
        <WeatherWidget
          variant="tile"
          originWeather={originWeather}
          destinationWeather={destinationWeather}
          originName={originName}
          destinationName={destinationName}
        />
      )}

      {/* Multimodal Segments Timeline */}
      <div className="flex-1 space-y-3 mb-4">
        {route.segments.slice(0, 3).map((segment, sIdx) => {
          const isLast = sIdx === Math.min(route.segments.length, 3) - 1;
          return (
            <div key={segment.id || sIdx} className="relative">
              <div className="flex items-start gap-3">
                {renderSegmentBadge(
                  segment.badgeCode,
                  segment.mode,
                  segment.modeLabel,
                  segment.title
                )}
                <div className="text-sm min-w-0 flex-1">
                  <p className="font-semibold text-[#F0F4F2] text-xs sm:text-sm truncate">
                    {formatTransitText(segment.title)}
                  </p>
                  <p className="text-[11px] text-[#8BA59B] truncate">
                    {formatTransitText(segment.detail) ||
                      `${segment.distanceKm} km • ${segment.durationMinutes} mins`}
                  </p>
                </div>
                <span className="text-[10px] text-[#A2B8AF] shrink-0 font-medium">
                  {segment.durationMinutes}m
                </span>
              </div>
              {!isLast && (
                <div className="border-l-2 border-dashed border-[#1E4537] ml-3 h-3 my-0.5"></div>
              )}
            </div>
          );
        })}
        {route.segments.length > 3 && (
          <p className="text-[10px] text-[#8BA59B] ml-9 italic">
            + {route.segments.length - 3} more connected transit steps
          </p>
        )}
      </div>

      {/* Key Sustainability Feature Badge */}
      {route.highlights && route.highlights[0] && (
        <div className="mb-4 bg-[#071712]/80 rounded-xl px-3 py-2 border border-transparent flex items-center gap-2 text-[11px] text-[#B5C7C1] backdrop-blur-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A869] shrink-0" />
          <span className="truncate">{route.highlights[0]}</span>
        </div>
      )}

      {/* Metrics Row: CO2 Savings and Duration */}
      <div className="mt-auto pt-4 border-t border-[#1A382E]/60 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase text-[#8BA59B] font-bold">CO2 Savings</p>
          <p
            className={`font-bold text-xl flex items-baseline ${
              isRecommended ? 'text-[#C5A869]' : 'text-[#FAF6EC]'
            }`}
          >
            -{route.co2SavedKg}
            <span className="text-xs ml-1 font-normal text-[#8BA59B]">kg</span>
          </p>
          <p className="text-[10px] text-[#5EEAD4] font-medium">
            {route.co2SavingsPercent}% cleaner
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase text-[#8BA59B] font-bold">Duration</p>
          <p className="text-[#FAF6EC] font-bold text-xl flex items-baseline">
            {route.durationMinutes}
            <span className="text-xs ml-1 font-normal text-[#8BA59B]">min</span>
          </p>
          <p className="text-[10px] text-[#8BA59B] font-medium">
            {route.distanceKm} km total
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        id={`select-route-btn-${route.id}`}
        onClick={() => onSelect(route)}
        className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer group active:scale-[0.98] border border-transparent ${
          isRecommended
            ? 'bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] hover:brightness-110 text-[#0A1C16] shadow-md shadow-black/40'
            : 'bg-[#132D24] text-[#D1DCD9] hover:bg-[#18392E] hover:text-[#FAF6EC]'
        }`}
      >
        <span>View Full Itinerary</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
      </button>
    </div>
  );
};

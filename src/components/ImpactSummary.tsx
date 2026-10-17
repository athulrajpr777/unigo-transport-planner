import React from 'react';
import type { RoutePlanResult, TravelPreference } from '../types.ts';
import { Leaf, Car } from 'lucide-react';

interface ImpactSummaryProps {
  plan: RoutePlanResult;
  selectedPreference: TravelPreference;
  onSelectPreference: (pref: TravelPreference) => void;
}

export const ImpactSummary: React.FC<ImpactSummaryProps> = ({
  plan,
  selectedPreference,
  onSelectPreference,
}) => {
  const ecoRoute = plan.routes.find((r) => r.priorityCategory === 'eco_friendly') || plan.routes[0];
  const maxSavings = ecoRoute ? ecoRoute.co2SavedKg : 2.0;

  const preferences: { key: TravelPreference; label: string }[] = [
    { key: 'all', label: 'All Options' },
    { key: 'cheapest', label: '💰 Cheapest' },
    { key: 'eco_friendly', label: '🌱 Eco-Friendly' },
    { key: 'efficient', label: '⚡ Fastest' },
    { key: 'convenient', label: '🛋️ Convenient' },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Route context header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C5A869]">
              {plan.cityOrRegion}
            </span>
            <span className="text-xs text-[#1E4357]">•</span>
            <span className="text-xs text-[#8BA59B]">
              Est. {plan.distanceEstimateKm} km journey
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#FAF6EC] tracking-tight mt-0.5">
            {plan.resolvedFrom} <span className="text-[#C5A869] mx-1.5">→</span> {plan.resolvedTo}
          </h2>
        </div>

        {/* Comparison pill in subtle dark blue with transparent outline */}
        <div className="flex items-center gap-3 bg-[#07161F]/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-transparent shadow-md text-xs">
          <div className="flex items-center gap-1.5 text-[#F87171]">
            <Car className="w-3.5 h-3.5" />
            <span>Solo Car: ~{plan.baselineSoloCarCo2Kg} kg CO2</span>
          </div>
          <div className="h-3 w-px bg-[#1E4357]/75"></div>
          <div className="flex items-center gap-1.5 text-[#C5A869] font-bold">
            <Leaf className="w-3.5 h-3.5 text-[#C5A869]" />
            <span>Eco Choice: -{maxSavings} kg saved</span>
          </div>
        </div>
      </div>

      {/* Travel Priority Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-[#8BA59B] whitespace-nowrap mr-1">
          Travel Priority:
        </span>
        {preferences.map((pref) => {
          const isActive = selectedPreference === pref.key;
          return (
            <button
              key={pref.key}
              id={`filter-${pref.key}-btn`}
              onClick={() => onSelectPreference(pref.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border border-transparent ${
                isActive
                  ? 'bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] text-[#0A1C16] shadow-md shadow-black/30'
                  : 'bg-[#07161F]/80 text-[#B5C7C1] hover:bg-[#163329] hover:text-[#FAF6EC]'
              }`}
            >
              <span>{pref.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

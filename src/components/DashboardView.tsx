import React, { useState } from 'react';
import {
  BarChart3,
  TrendingDown,
  TreePine,
  Zap,
  CheckCircle2,
  Calendar,
  Users,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import type { SavedCommute } from '../types.ts';

interface DashboardViewProps {
  savedCommutes: SavedCommute[];
  onAddCommute: (commute: SavedCommute) => void;
  onNavigateToPlanner: (from?: string, to?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  savedCommutes,
  onAddCommute,
  onNavigateToPlanner,
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [manualFrom, setManualFrom] = useState('');
  const [manualTo, setManualTo] = useState('');
  const [manualDistance, setManualDistance] = useState('14');
  const [manualMode, setManualMode] = useState('Metro & Electric Auto');
  const [manualPassengers, setManualPassengers] = useState(1);

  // Aggregated totals
  const totalKm = savedCommutes.reduce((acc, c) => acc + c.distanceKm, 0);
  const totalCo2SavedKg = Number(
    savedCommutes.reduce((acc, c) => acc + c.co2SavedKg, 0).toFixed(1)
  );
  // 1 tree absorbs approximately 21 kg of CO2 per year
  const treesEquivalent =
    totalCo2SavedKg > 0 ? Math.max(0.1, Math.round((totalCo2SavedKg / 21) * 10) / 10) : 0;
  // Litres of petrol avoided (~0.08L per km in typical city traffic)
  const fuelSavedLitres = Math.round(totalKm * 0.08);

  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFrom || !manualTo) return;

    const dist = Number(manualDistance) || 10;
    // ~190g CO2 per km solo petrol car, metro is ~20g per km -> saves ~170g per km
    const co2Saved = Number(((dist * 0.17) * manualPassengers).toFixed(2));

    const newEntry: SavedCommute = {
      id: `commute-${Date.now()}`,
      from: manualFrom.trim(),
      to: manualTo.trim(),
      date: new Date().toISOString().split('T')[0],
      mode: manualMode,
      distanceKm: dist,
      co2SavedKg: co2Saved,
      passengers: manualPassengers,
    };

    onAddCommute(newEntry);
    setManualFrom('');
    setManualTo('');
    setShowLogModal(false);
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-[#0E202B]/75 backdrop-blur-md border border-[#1E4357]/70 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-black/50">
        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#C5A869]/40 to-transparent" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#C5A869]/15 text-[#DFCCA3] border border-[#C5A869]/30 mb-2.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Personal Eco Mobility Telemetry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FAF6EC] tracking-tight">
              Carbon Abatement & Distance Dashboard
            </h2>
            <p className="text-sm text-[#8BA59B] max-w-2xl mt-1">
              Live tracking of greenhouse gas emissions eliminated, total electric & clean kilometers
              logged, and equivalent tree years contributed by replacing solo car trips.
            </p>
          </div>

          <button
            id="log-commute-btn"
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] hover:brightness-110 text-[#0A1C16] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md border border-[#C5A869] cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Commute</span>
          </button>
        </div>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
          {/* Carbon Reduced */}
          <div className="p-4 rounded-xl bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#8BA59B] mb-2 font-semibold">
              <span>Carbon Reduced</span>
              <div className="w-7 h-7 rounded-lg bg-[#C5A869]/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-[#C5A869]" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#FAF6EC] flex items-baseline gap-1">
                <span>{totalCo2SavedKg}</span>
                <span className="text-sm font-bold text-[#C5A869]">kg CO₂</span>
              </div>
              <p className="text-[11px] text-[#718F82] mt-1">
                Net GHG emissions avoided vs solo car
              </p>
            </div>
          </div>

          {/* Clean Distance Travelled */}
          <div className="p-4 rounded-xl bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#8BA59B] mb-2 font-semibold">
              <span>Distance Travelled</span>
              <div className="w-7 h-7 rounded-lg bg-[#C5A869]/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#C5A869]" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#FAF6EC] flex items-baseline gap-1">
                <span>{Math.round(totalKm)}</span>
                <span className="text-sm font-bold text-[#C5A869]">km</span>
              </div>
              <p className="text-[11px] text-[#718F82] mt-1">
                Via Metro, EV cabs, electric buses & walking
              </p>
            </div>
          </div>

          {/* Forest Sequestration */}
          <div className="p-4 rounded-xl bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#8BA59B] mb-2 font-semibold">
              <span>Tree Years Equivalent</span>
              <div className="w-7 h-7 rounded-lg bg-[#C5A869]/10 flex items-center justify-center">
                <TreePine className="w-4 h-4 text-[#C5A869]" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#FAF6EC] flex items-baseline gap-1">
                <span>{treesEquivalent}</span>
                <span className="text-sm font-bold text-[#C5A869]">trees</span>
              </div>
              <p className="text-[11px] text-[#718F82] mt-1">
                Annual absorption of mature Indian peepal/neem
              </p>
            </div>
          </div>

          {/* Fossil Fuel Saved */}
          <div className="p-4 rounded-xl bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#8BA59B] mb-2 font-semibold">
              <span>Fuel Avoided</span>
              <div className="w-7 h-7 rounded-lg bg-[#C5A869]/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#C5A869]" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#FAF6EC] flex items-baseline gap-1">
                <span>{fuelSavedLitres}</span>
                <span className="text-sm font-bold text-[#C5A869]">litres</span>
              </div>
              <p className="text-[11px] text-[#718F82] mt-1">
                Petrol/diesel combustion prevented
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historic Saved Commutes List */}
      <div className="bg-[#11261F]/75 backdrop-blur-md border border-[#1E4537]/75 rounded-2xl p-6 shadow-xl shadow-black/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C5A869]" />
            <h3 className="text-base font-bold text-[#FAF6EC]">Recorded Clean Journeys</h3>
          </div>
          <span className="text-xs text-[#8BA59B]">
            {savedCommutes.length} total logged journeys
          </span>
        </div>

        {savedCommutes.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-[#1E4537]/75 rounded-xl">
            <p className="text-sm text-[#8BA59B]">No journeys recorded yet.</p>
            <p className="text-xs text-[#668277] mt-1">
              Plan any route in the Quick Planner or click &apos;Log Commute&apos; to track carbon saved.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedCommutes.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 hover:border-[#C5A869]/40 transition-all gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#11261F]/75 border border-[#204537]/75 flex items-center justify-center shrink-0 mt-0.5">
                    <Compass className="w-4 h-4 text-[#C5A869]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#FAF6EC]">
                        {item.from} <span className="text-[#C5A869]">→</span> {item.to}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#8BA59B] mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#668277]" />
                        {item.date}
                      </span>
                      <span>•</span>
                      <span>{item.mode}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#668277]" />
                        {item.passengers} pax
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-[#C5A869]">
                      -{item.co2SavedKg} kg CO₂
                    </p>
                    <p className="text-[11px] text-[#718F82]">{item.distanceKm} km</p>
                  </div>
                  <button
                    onClick={() => onNavigateToPlanner(item.from, item.to)}
                    className="p-1.5 rounded-lg border border-[#1E4537]/75 bg-[#11261F]/75 hover:border-[#C5A869] text-[#DFCCA3] transition-all cursor-pointer"
                    title="Re-plan this route"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Commute Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0E251E]/95 backdrop-blur-xl border border-[#1E4537]/75 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-[#FAF6EC] mb-1">Log a Clean Commute</h3>
            <p className="text-xs text-[#8BA59B] mb-4">
              Add a past trip taken via metro, electric bus, train, or active cycling.
            </p>

            <form onSubmit={handleCreateManualLog} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#DFCCA3] uppercase tracking-wider block mb-1">
                  Origin (From)
                </label>
                <input
                  type="text"
                  required
                  value={manualFrom}
                  onChange={(e) => setManualFrom(e.target.value)}
                  placeholder="e.g. Rajiv Chowk"
                  className="w-full px-3.5 py-2 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 rounded-xl text-sm text-[#F0F4F2] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#DFCCA3] uppercase tracking-wider block mb-1">
                  Destination (To)
                </label>
                <input
                  type="text"
                  required
                  value={manualTo}
                  onChange={(e) => setManualTo(e.target.value)}
                  placeholder="e.g. Cyber Hub, Gurugram"
                  className="w-full px-3.5 py-2 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 rounded-xl text-sm text-[#F0F4F2] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#DFCCA3] uppercase tracking-wider block mb-1">
                    Distance (Km)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={manualDistance}
                    onChange={(e) => setManualDistance(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 rounded-xl text-sm text-[#F0F4F2] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#DFCCA3] uppercase tracking-wider block mb-1">
                    Passengers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={manualPassengers}
                    onChange={(e) => setManualPassengers(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 rounded-xl text-sm text-[#F0F4F2] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#DFCCA3] uppercase tracking-wider block mb-1">
                  Primary Mode
                </label>
                <select
                  value={manualMode}
                  onChange={(e) => setManualMode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 rounded-xl text-sm text-[#F0F4F2] outline-none cursor-pointer"
                >
                  <option value="Delhi Metro & Cycle Share" className="bg-[#0A1C16] text-[#FAF6EC]">Metro & Cycle Share</option>
                  <option value="Suburban Electric EMU Train" className="bg-[#0A1C16] text-[#FAF6EC]">Suburban EMU Train</option>
                  <option value="Electric City Bus (BMTC/BEST/DTC)" className="bg-[#0A1C16] text-[#FAF6EC]">Electric City Bus</option>
                  <option value="Vande Bharat Express" className="bg-[#0A1C16] text-[#FAF6EC]">Vande Bharat Express</option>
                  <option value="Shared Electric Auto / Rickshaw" className="bg-[#0A1C16] text-[#FAF6EC]">Shared E-Auto Feeder</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8BA59B] hover:text-white border border-[#1E4537]/75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C5A869] text-[#0A1C16] hover:brightness-110"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

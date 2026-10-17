import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Loader2,
  Navigation,
  MapPin,
  TrainFront,
  TrainTrack,
  Plane,
  Building2,
  Landmark,
  Store,
  Compass,
} from 'lucide-react';
import type { PlaceSuggestion } from '../types.ts';
import { POPULAR_INDIAN_PLACES } from '../data/indianPlaces.ts';

interface TripPlannerBoxProps {
  from: string;
  to: string;
  travelDate: string;
  passengerCount: number;
  departureTime: string;
  onChangeFrom: (val: string) => void;
  onChangeTo: (val: string) => void;
  onChangeTravelDate: (val: string) => void;
  onChangePassengerCount: (val: number) => void;
  onChangeDepartureTime: (val: string) => void;
  onSwap: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

function getPlaceIcon(type: PlaceSuggestion['type']) {
  switch (type) {
    case 'transit':
      return <TrainFront className="w-4 h-4 text-[#C5A869]" />;
    case 'station':
      return <TrainTrack className="w-4 h-4 text-[#C5A869]" />;
    case 'airport':
      return <Plane className="w-4 h-4 text-[#60A5FA]" />;
    case 'landmark':
      return <Landmark className="w-4 h-4 text-[#F6AD55]" />;
    case 'tech_park':
      return <Building2 className="w-4 h-4 text-[#34D399]" />;
    case 'commercial':
      return <Store className="w-4 h-4 text-[#F687B3]" />;
    case 'locality':
    default:
      return <MapPin className="w-4 h-4 text-[#C5A869]" />;
  }
}

export const TripPlannerBox: React.FC<TripPlannerBoxProps> = ({
  from,
  to,
  travelDate,
  passengerCount,
  departureTime,
  onChangeFrom,
  onChangeTo,
  onChangeTravelDate,
  onChangePassengerCount,
  onChangeDepartureTime,
  onSwap,
  onSubmit,
  isLoading,
}) => {
  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const fromContainerRef = useRef<HTMLDivElement>(null);
  const toContainerRef = useRef<HTMLDivElement>(null);

  // When route calculation starts or finishes, turn off any autocomplete spinners and close dropdowns
  useEffect(() => {
    if (isLoading) {
      setIsSearchingFrom(false);
      setIsSearchingTo(false);
      setActiveField(null);
      setFromSuggestions([]);
      setToSuggestions([]);
    }
  }, [isLoading]);

  // Autocomplete for Origin
  useEffect(() => {
    const q = from.trim().toLowerCase();
    if (!q || activeField !== 'from') {
      setIsSearchingFrom(false);
      setFromSuggestions([]);
      return;
    }

    setIsSearchingFrom(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setFromSuggestions(data.suggestions);
            setIsSearchingFrom(false);
            return;
          }
        }
      } catch (e) {
        // Fallback to local places
      }
      const local = POPULAR_INDIAN_PLACES.filter(
        (p) =>
          p.primary.toLowerCase().includes(q) ||
          p.secondary.toLowerCase().includes(q) ||
          (p.city && p.city.toLowerCase().includes(q))
      ).slice(0, 6);
      setFromSuggestions(local);
      setIsSearchingFrom(false);
    }, 200);

    return () => {
      clearTimeout(timer);
      setIsSearchingFrom(false);
    };
  }, [from, activeField]);

  // Autocomplete for Destination
  useEffect(() => {
    const q = to.trim().toLowerCase();
    if (!q || activeField !== 'to') {
      setIsSearchingTo(false);
      setToSuggestions([]);
      return;
    }

    setIsSearchingTo(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setToSuggestions(data.suggestions);
            setIsSearchingTo(false);
            return;
          }
        }
      } catch (e) {
        // Fallback
      }
      const local = POPULAR_INDIAN_PLACES.filter(
        (p) =>
          p.primary.toLowerCase().includes(q) ||
          p.secondary.toLowerCase().includes(q) ||
          (p.city && p.city.toLowerCase().includes(q))
      ).slice(0, 6);
      setToSuggestions(local);
      setIsSearchingTo(false);
    }, 200);

    return () => {
      clearTimeout(timer);
      setIsSearchingTo(false);
    };
  }, [to, activeField]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        fromContainerRef.current &&
        !fromContainerRef.current.contains(e.target as Node) &&
        toContainerRef.current &&
        !toContainerRef.current.contains(e.target as Node)
      ) {
        setActiveField(null);
        setIsSearchingFrom(false);
        setIsSearchingTo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFrom = (item: PlaceSuggestion) => {
    const formatted = item.city ? `${item.primary}, ${item.city}` : item.primary;
    onChangeFrom(formatted);
    setIsSearchingFrom(false);
    setFromSuggestions([]);
    setActiveField(null);
    setHighlightedIndex(-1);
  };

  const handleSelectTo = (item: PlaceSuggestion) => {
    const formatted = item.city ? `${item.primary}, ${item.city}` : item.primary;
    onChangeTo(formatted);
    setIsSearchingTo(false);
    setToSuggestions([]);
    setActiveField(null);
    setHighlightedIndex(-1);
  };

  return (
    <section className="w-full max-w-4xl bg-[#132E3F]/75 backdrop-blur-md rounded-2xl border border-[#1E4357]/70 p-6 sm:p-7 mb-8 shadow-xl shadow-black/50 relative z-30">
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#C5A869]/35 to-transparent" />

      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#07161F]/80 border border-[#C5A869] flex items-center justify-center backdrop-blur-xs">
            <Compass className="w-4 h-4 text-[#C5A869]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#FAF6EC]">Multi-Passenger Trip Planner</h2>
            <p className="text-xs text-[#8BA59B]">
              Configure travel date, departure window, and group passenger size for customized transit
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Origin & Destination Row */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-end">
          {/* Starting Point (From) */}
          <div className="md:col-span-5 relative" ref={fromContainerRef}>
            <label
              htmlFor="trip-from-input"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#DFCCA3] mb-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Starting Point (From)</span>
            </label>
            <div className="relative">
              <input
                id="trip-from-input"
                type="text"
                value={from}
                onChange={(e) => {
                  onChangeFrom(e.target.value);
                  setActiveField('from');
                }}
                onFocus={() => setActiveField('from')}
                required
                disabled={isLoading}
                autoComplete="off"
                placeholder="Station, tech park, address in India..."
                className="w-full pl-4 pr-10 py-2.5 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20 rounded-xl text-sm text-[#F0F4F2] placeholder-[#668277] transition-all outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {isSearchingFrom && activeField === 'from' && !isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A869] animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-[#668277]" />
                )}
                {from && !isLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      onChangeFrom('');
                      setActiveField('from');
                    }}
                    aria-label="Clear starting point"
                    className="text-xs text-[#668277] hover:text-[#DFCCA3] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {activeField === 'from' && fromSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0E251E]/95 backdrop-blur-lg border border-[#1E4537]/75 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {fromSuggestions.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleSelectFrom(item)}
                    className="w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors border-b border-[#143328] last:border-0 cursor-pointer hover:bg-[#132E24]"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#0A1C16] border border-[#204537] flex items-center justify-center shrink-0 mt-0.5">
                      {getPlaceIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#FAF6EC] truncate">{item.primary}</p>
                      <p className="text-[11px] text-[#88A398] truncate">{item.secondary}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center pb-1">
            <button
              id="trip-swap-locations-btn"
              type="button"
              onClick={onSwap}
              disabled={isLoading || (!from && !to)}
              title="Swap Locations"
              className="p-2 rounded-xl border border-[#1E4537]/75 bg-[#0A1C16]/75 backdrop-blur-sm hover:bg-[#16352B] hover:border-[#C5A869] text-[#DFCCA3] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <ArrowLeftRight className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* Destination (To) */}
          <div className="md:col-span-5 relative" ref={toContainerRef}>
            <label
              htmlFor="trip-to-input"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#DFCCA3] mb-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Destination (To)</span>
            </label>
            <div className="relative">
              <input
                id="trip-to-input"
                type="text"
                value={to}
                onChange={(e) => {
                  onChangeTo(e.target.value);
                  setActiveField('to');
                }}
                onFocus={() => setActiveField('to')}
                required
                disabled={isLoading}
                autoComplete="off"
                placeholder="Where do you want to go?"
                className="w-full pl-4 pr-10 py-2.5 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20 rounded-xl text-sm text-[#F0F4F2] placeholder-[#668277] transition-all outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {isSearchingTo && activeField === 'to' && !isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A869] animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-[#668277]" />
                )}
                {to && !isLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      onChangeTo('');
                      setActiveField('to');
                    }}
                    aria-label="Clear destination"
                    className="text-xs text-[#668277] hover:text-[#DFCCA3] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {activeField === 'to' && toSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0E251E]/95 backdrop-blur-lg border border-[#1E4537]/75 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {toSuggestions.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleSelectTo(item)}
                    className="w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors border-b border-[#143328] last:border-0 cursor-pointer hover:bg-[#132E24]"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#0A1C16] border border-[#204537] flex items-center justify-center shrink-0 mt-0.5">
                      {getPlaceIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#FAF6EC] truncate">{item.primary}</p>
                      <p className="text-[11px] text-[#88A398] truncate">{item.secondary}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Date, Passengers & Departure Time Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Travel Date */}
          <div>
            <label
              htmlFor="trip-date-input"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#DFCCA3] mb-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Travel Date</span>
            </label>
            <input
              id="trip-date-input"
              type="date"
              value={travelDate}
              onChange={(e) => onChangeTravelDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 focus:border-[#C5A869] rounded-xl text-sm text-[#F0F4F2] outline-none"
            />
          </div>

          {/* Number of Passengers */}
          <div>
            <label
              htmlFor="trip-passengers-select"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#DFCCA3] mb-1.5"
            >
              <Users className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Passengers</span>
            </label>
            <select
              id="trip-passengers-select"
              value={passengerCount}
              onChange={(e) => onChangePassengerCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 focus:border-[#C5A869] rounded-xl text-sm text-[#F0F4F2] outline-none cursor-pointer"
            >
              <option value={1} className="bg-[#0A1C16] text-[#FAF6EC]">1 Passenger (Solo Commuter)</option>
              <option value={2} className="bg-[#0A1C16] text-[#FAF6EC]">2 Passengers (Duo / Ride-pool)</option>
              <option value={3} className="bg-[#0A1C16] text-[#FAF6EC]">3 Passengers (Small Family)</option>
              <option value={4} className="bg-[#0A1C16] text-[#FAF6EC]">4 Passengers (Group)</option>
              <option value={5} className="bg-[#0A1C16] text-[#FAF6EC]">5+ Passengers (Large Group)</option>
            </select>
          </div>

          {/* Departure Window */}
          <div>
            <label
              htmlFor="trip-time-select"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#DFCCA3] mb-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Departure Window</span>
            </label>
            <select
              id="trip-time-select"
              value={departureTime}
              onChange={(e) => onChangeDepartureTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 focus:border-[#C5A869] rounded-xl text-sm text-[#F0F4F2] outline-none cursor-pointer"
            >
              <option value="Now / Immediate" className="bg-[#0A1C16] text-[#FAF6EC]">Depart Now</option>
              <option value="Morning Peak (08:00 - 10:30)" className="bg-[#0A1C16] text-[#FAF6EC]">Morning Peak (8:00 - 10:30 AM)</option>
              <option value="Mid-day Off-Peak (11:00 - 16:00)" className="bg-[#0A1C16] text-[#FAF6EC]">Mid-day Off-Peak (11:00 AM - 4:00 PM)</option>
              <option value="Evening Rush (17:30 - 20:30)" className="bg-[#0A1C16] text-[#FAF6EC]">Evening Rush (5:30 - 8:30 PM)</option>
              <option value="Late Evening (21:00+)" className="bg-[#0A1C16] text-[#FAF6EC]">Late Evening (After 9:00 PM)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            id="trip-plan-submit-btn"
            type="submit"
            disabled={isLoading || !from.trim() || !to.trim()}
            className="w-full sm:w-auto min-w-[200px] bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] hover:brightness-110 text-[#0A1C16] py-3 px-6 rounded-xl font-bold text-sm transition-all duration-150 active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/40 cursor-pointer border border-[#C5A869]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0A1C16]" />
                <span>Computing Itinerary...</span>
              </>
            ) : (
              <>
                <span>Plan Group Transit</span>
                <ArrowRight className="w-4 h-4 text-[#0A1C16] group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

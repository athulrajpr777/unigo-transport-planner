import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  Loader2,
  MapPin,
  Navigation,
  TrainFront,
  Plane,
  TrainTrack,
  Building2,
  Landmark,
  Store,
  Compass,
  Search,
} from 'lucide-react';
import type { PlaceSuggestion } from '../types.ts';
import { POPULAR_INDIAN_PLACES } from '../data/indianPlaces.ts';

interface SearchBoxProps {
  from: string;
  to: string;
  onChangeFrom: (val: string) => void;
  onChangeTo: (val: string) => void;
  onSwap: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

// Icon helper for Google Maps style place categories
function getPlaceIcon(type: PlaceSuggestion['type']) {
  switch (type) {
    case 'transit':
      return <TrainFront className="w-4 h-4 text-[#E5B842]" />;
    case 'station':
      return <TrainTrack className="w-4 h-4 text-[#F3C053]" />;
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
      return <MapPin className="w-4 h-4 text-[#E5B842]" />;
  }
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  from,
  to,
  onChangeFrom,
  onChangeTo,
  onSwap,
  onSubmit,
  isLoading,
}) => {
  // Autocomplete state
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const fromContainerRef = useRef<HTMLDivElement>(null);
  const toContainerRef = useRef<HTMLDivElement>(null);

  // Filter or fetch suggestions helper
  const filterSuggestions = (query: string): PlaceSuggestion[] => {
    const q = query.trim().toLowerCase();
    if (!q) return []; // Don't preload any locations when empty
    return POPULAR_INDIAN_PLACES.filter((p) => {
      const primary = p.primary.toLowerCase();
      const secondary = p.secondary.toLowerCase();
      const city = (p.city || '').toLowerCase();
      const state = (p.state || '').toLowerCase();
      return (
        primary.includes(q) ||
        secondary.includes(q) ||
        city.includes(q) ||
        state.includes(q)
      );
    }).slice(0, 6);
  };

  // Live autocomplete for "From" field
  useEffect(() => {
    if (activeField !== 'from') return;

    // Instant local filter first
    const instant = filterSuggestions(from);
    setFromSuggestions(instant);

    if (from.trim().length >= 2) {
      setIsSearchingFrom(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(from.trim())}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
              setFromSuggestions(data.suggestions);
            }
          }
        } catch {
          // Keep instant local matches if fetch fails
        } finally {
          setIsSearchingFrom(false);
        }
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setIsSearchingFrom(false);
    }
  }, [from, activeField]);

  // Live autocomplete for "To" field
  useEffect(() => {
    if (activeField !== 'to') return;

    // Instant local filter first
    const instant = filterSuggestions(to);
    setToSuggestions(instant);

    if (to.trim().length >= 2) {
      setIsSearchingTo(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(to.trim())}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
              setToSuggestions(data.suggestions);
            }
          }
        } catch {
          // Keep instant local matches if fetch fails
        } finally {
          setIsSearchingTo(false);
        }
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setIsSearchingTo(false);
    }
  }, [to, activeField]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        fromContainerRef.current &&
        !fromContainerRef.current.contains(e.target as Node) &&
        toContainerRef.current &&
        !toContainerRef.current.contains(e.target as Node)
      ) {
        setActiveField(null);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selection handlers
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

  // Keyboard navigation for dropdown
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'from' | 'to',
    suggestions: PlaceSuggestion[]
  ) => {
    if (activeField !== field || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[highlightedIndex];
        if (field === 'from') handleSelectFrom(selected);
        else handleSelectTo(selected);
      }
    } else if (e.key === 'Escape') {
      setActiveField(null);
      setHighlightedIndex(-1);
    }
  };

  return (
    <section className="w-full max-w-4xl bg-[#132E3F]/75 backdrop-blur-md rounded-2xl border border-[#1E4357]/70 p-6 sm:p-7 mb-8 shadow-xl shadow-black/50 relative z-30">
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#C5A869]/35 to-transparent" />

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-end">
          {/* Starting Point (From) */}
          <div className="md:col-span-4 relative" ref={fromContainerRef}>
            <label
              htmlFor="from-input"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#DFCCA3] mb-2"
            >
              <Navigation className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Starting Point (From)</span>
            </label>
            <div className="relative">
              <input
                id="from-input"
                type="text"
                value={from}
                onChange={(e) => {
                  onChangeFrom(e.target.value);
                  setActiveField('from');
                  setHighlightedIndex(-1);
                }}
                onFocus={() => {
                  setActiveField('from');
                  setHighlightedIndex(-1);
                }}
                onKeyDown={(e) => handleKeyDown(e, 'from', fromSuggestions)}
                required
                disabled={isLoading}
                autoComplete="off"
                placeholder="Search station, tech park, address in India..."
                className="w-full pl-4 pr-10 py-3 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20 rounded-xl text-sm text-[#F0F4F2] placeholder-[#668277] transition-all outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {isSearchingFrom && activeField === 'from' && !isLoading && (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A869] animate-spin" />
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

            {/* Autocomplete Dropdown for "From" (Only when typed) */}
            {activeField === 'from' && from.trim().length > 0 && fromSuggestions.length > 0 && (
              <div
                id="from-autocomplete-dropdown"
                className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0D231B]/95 backdrop-blur-lg border border-[#1E4537]/75 rounded-xl shadow-2xl shadow-black/80 overflow-hidden max-h-72 overflow-y-auto"
              >
                {fromSuggestions.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleSelectFrom(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors border-b border-[#143328] last:border-0 cursor-pointer ${
                      highlightedIndex === idx
                        ? 'bg-[#183B2D] text-white'
                        : 'hover:bg-[#132E24] text-[#D1DCD9]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#0A1C16] border border-[#204537] flex items-center justify-center shrink-0 mt-0.5">
                      {getPlaceIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#FAF6EC] truncate">
                          {item.primary}
                        </p>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#C5A869]/15 text-[#DFCCA3] border border-[#C5A869]/30 shrink-0">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#88A398] truncate mt-0.5">
                        {item.secondary}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap / Direction Arrow Button */}
          <div className="md:col-span-1 flex justify-center pb-1 md:pb-2">
            <button
              id="swap-locations-btn"
              type="button"
              onClick={onSwap}
              disabled={isLoading || (!from && !to)}
              title="Swap starting point and destination"
              aria-label="Swap starting point and destination"
              className="p-2.5 rounded-xl text-[#C5A869] bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E4234]/75 hover:border-[#C5A869] hover:bg-[#142E24] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 cursor-pointer shadow-xs group"
            >
              <ArrowLeftRight className="w-4 h-4 hidden md:block group-hover:rotate-180 transition-transform duration-300" />
              <ArrowRight className="w-4 h-4 md:hidden rotate-90 group-hover:translate-y-0.5 transition-transform duration-200" />
            </button>
          </div>

          {/* Destination (To) */}
          <div className="md:col-span-4 relative" ref={toContainerRef}>
            <label
              htmlFor="to-input"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#DFCCA3] mb-2"
            >
              <MapPin className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Destination (To)</span>
            </label>
            <div className="relative">
              <input
                id="to-input"
                type="text"
                value={to}
                onChange={(e) => {
                  onChangeTo(e.target.value);
                  setActiveField('to');
                  setHighlightedIndex(-1);
                }}
                onFocus={() => {
                  setActiveField('to');
                  setHighlightedIndex(-1);
                }}
                onKeyDown={(e) => handleKeyDown(e, 'to', toSuggestions)}
                required
                disabled={isLoading}
                autoComplete="off"
                placeholder="Search destination, airport, market in India..."
                className="w-full pl-4 pr-10 py-3 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20 rounded-xl text-sm text-[#F0F4F2] placeholder-[#668277] transition-all outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {isSearchingTo && activeField === 'to' && !isLoading && (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A869] animate-spin" />
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

            {/* Autocomplete Dropdown for "To" (Only when typed) */}
            {activeField === 'to' && to.trim().length > 0 && toSuggestions.length > 0 && (
              <div
                id="to-autocomplete-dropdown"
                className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0D231B]/95 backdrop-blur-lg border border-[#1E4537]/75 rounded-xl shadow-2xl shadow-black/80 overflow-hidden max-h-72 overflow-y-auto"
              >
                {toSuggestions.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleSelectTo(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors border-b border-[#143328] last:border-0 cursor-pointer ${
                      highlightedIndex === idx
                        ? 'bg-[#183B2D] text-white'
                        : 'hover:bg-[#132E24] text-[#D1DCD9]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#0A1C16] border border-[#204537] flex items-center justify-center shrink-0 mt-0.5">
                      {getPlaceIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#FAF6EC] truncate">
                          {item.primary}
                        </p>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#C5A869]/15 text-[#DFCCA3] border border-[#C5A869]/30 shrink-0">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#88A398] truncate mt-0.5">
                        {item.secondary}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Find Routes Button */}
          <div className="md:col-span-2">
            <button
              id="find-routes-btn"
              type="submit"
              disabled={isLoading || !from.trim() || !to.trim()}
              className="w-full bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] hover:brightness-110 text-[#0A1C16] py-3 px-4 rounded-xl font-bold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/40 cursor-pointer border border-[#C5A869] active:scale-[0.98] group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A1C16]" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <span>Find Routes</span>
                  <ArrowRight className="w-4 h-4 text-[#0A1C16] group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

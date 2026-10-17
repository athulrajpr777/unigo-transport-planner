import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  ArrowRight,
  Sparkles,
  MapPin,
  Train,
  Loader2,
  CalendarCheck,
  Route,
  RotateCcw,
} from 'lucide-react';
import type { ExploreDestination } from '../types.ts';

// Initial verified curated destinations in India connected via clean electrified transit
export const INITIAL_EXPLORE_DESTINATIONS: ExploreDestination[] = [
  {
    id: 'exp-1',
    name: 'India Gate & Kartavya Path',
    city: 'New Delhi',
    state: 'Delhi',
    category: 'National Heritage & Cultural Vista',
    description:
      'Iconic ceremonial boulevard with sprawling tree-lined green lawns, pedestrian plazas, and integrated public bicycle share stations.',
    highlightTransit: 'Central Secretariat Metro (Yellow/Violet) + 400m tree-lined walk',
    sampleFrom: 'Connaught Place, Delhi',
    co2SavingsPreview: '2.1 kg CO₂ saved',
    tags: ['Metro Direct', 'Cycle Docks', 'Zero Emission Zone'],
  },
  {
    id: 'exp-2',
    name: 'Cubbon Park & Vidhana Soudha',
    city: 'Bengaluru',
    state: 'Karnataka',
    category: 'Botanical Green Heart',
    description:
      '300 acres of lush botanical canopy in the heart of Bengaluru, connected directly at the station exit with no fossil traffic permitted on weekends.',
    highlightTransit: 'Cubbon Park Metro Station (Namma Metro Purple Line Exit A)',
    sampleFrom: 'Indiranagar, Bengaluru',
    co2SavingsPreview: '2.8 kg CO₂ saved',
    tags: ['Purple Line Metro', 'SmartBike Share', 'Pedestrian Haven'],
  },
  {
    id: 'exp-3',
    name: 'Marine Drive & Chhatrapati Shivaji Terminus',
    city: 'Mumbai',
    state: 'Maharashtra',
    category: 'Coastal Promenade & World Heritage',
    description:
      'The Queen’s Necklace waterfront promenade and Victorian Gothic railway terminus with high-frequency electrified local EMU train connectivity.',
    highlightTransit: 'Churchgate Western EMU / CSMT Central Terminal',
    sampleFrom: 'Andheri, Mumbai',
    co2SavingsPreview: '4.5 kg CO₂ saved',
    tags: ['Suburban Electric Rail', 'Coastal Promenade', 'Electric AC Bus'],
  },
  {
    id: 'exp-4',
    name: 'Qutub Minar & Mehrauli Archaeological Park',
    city: 'New Delhi',
    state: 'Delhi',
    category: 'UNESCO World Heritage',
    description:
      'Historic 73m minaret surrounded by expansive heritage forest reserves, easily reached via electric feeder rickshaws and metro.',
    highlightTransit: 'Qutub Minar Metro Station (Yellow Line) + Electric Feeder Auto',
    sampleFrom: 'Hauz Khas, Delhi',
    co2SavingsPreview: '1.9 kg CO₂ saved',
    tags: ['Yellow Line', 'E-Rickshaw Feeder', 'Heritage Park'],
  },
  {
    id: 'exp-5',
    name: 'Howrah Bridge & Victoria Memorial',
    city: 'Kolkata',
    state: 'West Bengal',
    category: 'Iconic Riverfront & Classical Grandeur',
    description:
      'Historic riverfront vistas accessible via the new underwater Green Line metro beneath the Hooghly River and historic electric trams.',
    highlightTransit: 'Howrah underwater Metro (Green Line) / Esplanade interchange',
    sampleFrom: 'Salt Lake Sector V, Kolkata',
    co2SavingsPreview: '3.4 kg CO₂ saved',
    tags: ['Underwater Metro', 'Electric Tram', 'Hooghly River Ferry'],
  },
  {
    id: 'exp-6',
    name: 'Sabarmati Riverfront Promenade',
    city: 'Ahmedabad',
    state: 'Gujarat',
    category: 'Sustainable Riverfront Park',
    description:
      '11.5 km of landscaped active transit corridors with dedicated cycling tracks, electric ferries, and Ahmedabad Metro/BRTS stations.',
    highlightTransit: 'Old High Court Metro Interchange / Sabarmati Riverfront Walk',
    sampleFrom: 'SG Highway, Ahmedabad',
    co2SavingsPreview: '2.6 kg CO₂ saved',
    tags: ['Ahmedabad Metro', 'Riverfront Bike Track', 'Janmarg BRTS'],
  },
  {
    id: 'exp-7',
    name: 'Charminar & Golconda Fort',
    city: 'Hyderabad',
    state: 'Telangana',
    category: 'Medieval Architecture & Bazaars',
    description:
      'Historic 16th-century monument and stone fortress reached by Hyderabad Metro followed by zero-emission TSRTC electric city buses.',
    highlightTransit: 'MGBS Interchange Metro Station + TSRTC Pushpak Electric Bus',
    sampleFrom: 'Hitec City, Hyderabad',
    co2SavingsPreview: '4.1 kg CO₂ saved',
    tags: ['Green Line Metro', 'Electric City Bus', 'Heritage Corridor'],
  },
  {
    id: 'exp-8',
    name: 'Amer Fort & Maota Lake Vista',
    city: 'Jaipur',
    state: 'Rajasthan',
    category: 'UNESCO Hilltop Fort',
    description:
      'Magnificent 16th-century red sandstone fortress overlooking reflective Maota Lake, connected via low-floor electric AC city buses.',
    highlightTransit: 'Jaipur Metro to Badi Chaupar + AC Electric Bus Route 5 / E-Rickshaw',
    sampleFrom: 'Jaipur Junction Railway Station',
    co2SavingsPreview: '3.8 kg CO₂ saved',
    tags: ['Pink Line Metro', 'Electric City Bus', 'Heritage Shuttle'],
  },
];

interface ExplorePlacesViewProps {
  onPlanTripToPlace: (fromLocation: string, destinationName: string) => void;
}

export const ExplorePlacesView: React.FC<ExplorePlacesViewProps> = ({ onPlanTripToPlace }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [places, setPlaces] = useState<ExploreDestination[]>(INITIAL_EXPLORE_DESTINATIONS);
  const [selectedCityFilter, setSelectedCityFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSearchedPlace, setActiveSearchedPlace] = useState('');

  const quickCities = [
    'All',
    'Delhi',
    'Bengaluru',
    'Mumbai',
    'Kolkata',
    'Hyderabad',
    'Jaipur',
    'Goa',
    'Kochi',
    'Varanasi',
  ];

  // Fetch nearest attractions for any place using Gemini API
  const fetchAttractionsForPlace = async (targetPlace: string) => {
    const trimmed = targetPlace.trim();
    if (!trimmed || trimmed === 'All') {
      setSelectedCityFilter('All');
      setActiveSearchedPlace('');
      setPlaces(INITIAL_EXPLORE_DESTINATIONS);
      return;
    }

    setIsLoading(true);
    setActiveSearchedPlace(trimmed);

    try {
      const response = await fetch(`/api/places/explore?location=${encodeURIComponent(trimmed)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.destinations) && data.destinations.length > 0) {
          setPlaces(data.destinations);
          return;
        }
      }
      // If endpoint returns empty or fails, filter local list or generate
      const fallbackMatches = INITIAL_EXPLORE_DESTINATIONS.filter(
        (p) =>
          p.city.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.description.toLowerCase().includes(trimmed.toLowerCase())
      );
      if (fallbackMatches.length > 0) {
        setPlaces(fallbackMatches);
      }
    } catch (err) {
      console.warn('Error fetching attractions via Gemini API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchAttractionsForPlace(searchQuery.trim());
  };

  const handleCityFilterChange = (city: string) => {
    setSelectedCityFilter(city);
    if (city === 'All') {
      setSearchQuery('');
      setActiveSearchedPlace('');
      setPlaces(INITIAL_EXPLORE_DESTINATIONS);
    } else {
      setSearchQuery(city);
      fetchAttractionsForPlace(city);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCityFilter('All');
    setActiveSearchedPlace('');
    setPlaces(INITIAL_EXPLORE_DESTINATIONS);
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Top Banner with Search & Go input box */}
      <div className="bg-[#0E202B]/75 backdrop-blur-md border border-[#1E4357]/70 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/50 relative">
        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#C5A869]/40 to-transparent" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#C5A869]/15 text-[#DFCCA3] border border-[#C5A869]/30 mb-2">
              <Compass className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Eco Tourism & Urban Exploration</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FAF6EC] tracking-tight">
              Explore Nearest Attractions & Clean-Transit Destinations
            </h2>
            <p className="text-sm text-[#8BA59B] max-w-2xl mt-1">
              Enter any city, town, landmark, or region to discover nearest attractions and map sustainable public transit routes with verified carbon savings.
            </p>
          </div>
        </div>

        {/* Input box for user to enter ANY location and Go button */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-8 relative">
              <input
                id="explore-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter any city or place (e.g. Jaipur, Varanasi, Shimla, Mysore, Pondicherry, Kochi)..."
                className="w-full pl-4 pr-10 py-3 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20 rounded-xl text-sm text-[#F0F4F2] placeholder-[#668277] outline-none"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Search className="w-4 h-4 text-[#C5A869]" />
              </div>
            </div>

            <div className="md:col-span-4 flex gap-2">
              <button
                type="submit"
                id="explore-go-btn"
                disabled={isLoading || !searchQuery.trim()}
                className="flex-1 bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] hover:brightness-110 text-[#0A1C16] py-3 px-5 rounded-xl font-bold text-sm shadow-md border border-[#C5A869] cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A1C16]" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Search Nearest Attractions</span>
                    <ArrowRight className="w-4 h-4 text-[#0A1C16]" />
                  </>
                )}
              </button>

              {(searchQuery || activeSearchedPlace) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-3 rounded-xl border border-[#1E4537]/75 text-xs font-semibold text-[#8BA59B] hover:text-[#FAF6EC] bg-[#0A1C16]/75 backdrop-blur-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Reset to default destinations"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C5A869]" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Optional: User Current Location Origin */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-1 text-xs text-[#8BA59B]">
            <span className="font-semibold text-[#DFCCA3]">Your Starting Point (Optional):</span>
            <input
              type="text"
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              placeholder="e.g. Hauz Khas, Delhi or Indiranagar, Bengaluru or Hotel / Railway Station"
              className="flex-1 px-3 py-1.5 bg-[#0A1C16]/75 backdrop-blur-sm border border-[#1E3F32]/75 focus:border-[#C5A869] rounded-lg text-xs text-[#F0F4F2] outline-none placeholder-[#587368]"
            />
          </div>
        </form>

        {/* Quick Location Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-5 mt-2 border-t border-[#1E4537]/60 scrollbar-none">
          <span className="text-[11px] font-bold text-[#8BA59B] uppercase tracking-wider mr-2 shrink-0">
            Popular Hubs:
          </span>
          {quickCities.map((city) => {
            const isSelected = selectedCityFilter === city;
            return (
              <button
                key={city}
                onClick={() => handleCityFilterChange(city)}
                className={`text-xs px-3 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#C5A869] text-[#0A1C16] font-bold border-[#C5A869]'
                    : 'bg-[#0A1C16]/75 backdrop-blur-xs text-[#8BA59B] border-[#1E3F32]/75 hover:text-[#FAF6EC] hover:border-[#C5A869]/40'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Location Indicator Banner */}
      {activeSearchedPlace && (
        <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-[#0E202B]/75 border border-[#1E4357]/70 text-xs">
          <div className="flex items-center gap-2 text-[#FAF6EC]">
            <Sparkles className="w-4 h-4 text-[#C5A869]" />
            <span>
              Nearest attractions and transit connections for{' '}
              <strong className="text-[#DFCCA3]">&quot;{activeSearchedPlace}&quot;</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#8BA59B]">
            Found {places.length} eco-accessible attractions
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 px-4 bg-[#0E202B]/75 backdrop-blur-md border border-[#1E4357]/70 rounded-2xl text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#C5A869] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-[#FAF6EC]">
            Searching nearest attractions for &quot;{activeSearchedPlace || searchQuery}&quot;...
          </h3>
        </div>
      )}

      {/* Places Cards Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {places.length === 0 ? (
            <div className="col-span-2 text-center py-16 px-4 bg-[#0E202B]/75 backdrop-blur-md border border-dashed border-[#1E4357]/70 rounded-2xl">
              <Compass className="w-10 h-10 text-[#C5A869]/50 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#FAF6EC]">
                No destinations returned for &quot;{searchQuery}&quot;
              </h3>
              <p className="text-xs text-[#8BA59B] mt-1 max-w-md mx-auto">
                You can still plan a direct route to this location by clicking below.
              </p>
              <button
                onClick={() =>
                  onPlanTripToPlace(
                    userLocation.trim() || 'Nearest Transit Station',
                    searchQuery.trim()
                  )
                }
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A869] text-[#0A1C16] font-bold text-xs shadow-md border border-[#C5A869] cursor-pointer"
              >
                <Route className="w-4 h-4 text-[#0A1C16]" />
                <span>Show routes to &quot;{searchQuery}&quot;</span>
              </button>
            </div>
          ) : (
            places.map((place) => (
              <div
                key={place.id}
                className="bg-[#0E202B]/75 backdrop-blur-md border border-[#1E4357]/70 rounded-2xl p-5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-[#C5A869]/50 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C5A869]/15 text-[#DFCCA3] border border-[#C5A869]/30">
                        {place.category}
                      </span>
                      <h3 className="text-lg font-bold text-[#FAF6EC] mt-1.5 group-hover:text-[#DFCCA3] transition-colors">
                        {place.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-[#C5A869] flex items-center gap-1 justify-end">
                        <MapPin className="w-3 h-3 text-[#C5A869]" />
                        {place.city}{place.state ? `, ${place.state}` : ''}
                      </span>
                      <span className="text-[10px] text-[#DFCCA3] font-medium block mt-0.5">
                        {place.co2SavingsPreview}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#8BA59B] leading-relaxed mb-3">{place.description}</p>

                  {/* Transit Highlight Pill */}
                  <div className="p-2.5 rounded-xl bg-[#0A1C16]/75 backdrop-blur-xs border border-[#1E3F32]/75 flex items-start gap-2 text-xs text-[#D1DCD9] mb-4">
                    <Train className="w-4 h-4 text-[#C5A869] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#FAF6EC]">Transit Route: </span>
                      <span className="text-[#8BA59B]">{place.highlightTransit}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {place.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#16352B]/75 text-[#B5C7C1] border border-[#204537]/75"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* One-Click Plan Button */}
                <div className="pt-3 border-t border-[#1E4537]/75 flex items-center justify-between">
                  <div className="text-[11px] text-[#8BA59B]">
                    From: <span className="text-[#B5C7C1]">{userLocation || place.sampleFrom}</span>
                  </div>

                  <button
                    id={`plan-btn-${place.id}`}
                    onClick={() => {
                      const fromLoc = userLocation.trim() || place.sampleFrom;
                      onPlanTripToPlace(fromLoc, `${place.name}, ${place.city}`);
                    }}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] hover:brightness-110 text-[#0A1C16] px-4 py-2 rounded-xl font-bold text-xs shadow-md border border-[#C5A869] cursor-pointer transition-all active:scale-95"
                  >
                    <Route className="w-3.5 h-3.5 text-[#0A1C16]" />
                    <span>Show routes</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

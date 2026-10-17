/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header.tsx';
import { SearchBox } from './components/SearchBox.tsx';
import { TripPlannerBox } from './components/TripPlannerBox.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ExplorePlacesView } from './components/ExplorePlacesView.tsx';
import { RouteCard } from './components/RouteCard.tsx';
import { ImpactSummary } from './components/ImpactSummary.tsx';
import { ItineraryModal } from './components/ItineraryModal.tsx';
import { InfoModals } from './components/InfoModals.tsx';
import type {
  RoutePlanResult,
  RouteOption,
  TravelPreference,
  AppTab,
  SavedCommute,
} from './types.ts';
import { getTabFromPathname, syncUrlForTab } from './utils/navigation.ts';
import { AlertCircle, Leaf, Sparkles, Compass } from 'lucide-react';
import enhancedPapercraftBg from './assets/images/blue_sky_bg_1788460246700-Picsart-AiImageEnhancer.jpg';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPathname(window.location.pathname);
    }
    return 'quick_planner';
  });

  // Navigate tab and sync URL & title
  const handleSelectTab = (tab: AppTab, replace: boolean = false) => {
    setCurrentTab(tab);
    setError(null);
    syncUrlForTab(tab, replace);
  };

  // Sync initial URL on mount and listen to browser Back / Forward (popstate)
  useEffect(() => {
    // Initial mount sync: if user navigates directly to /trip-planner, /dashboard, etc.
    const initialTab = getTabFromPathname(window.location.pathname);
    setCurrentTab(initialTab);
    syncUrlForTab(initialTab, true);

    const handlePopState = () => {
      const popTab = getTabFromPathname(window.location.pathname);
      setCurrentTab(popTab);
      syncUrlForTab(popTab, true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Route Planning Inputs (shared or per tab)
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [travelDate, setTravelDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [passengerCount, setPassengerCount] = useState(1);
  const [departureTime, setDepartureTime] = useState('Now / Immediate');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<RoutePlanResult | null>(null);
  const [selectedPreference, setSelectedPreference] = useState<TravelPreference>('all');
  const [activeModalRoute, setActiveModalRoute] = useState<RouteOption | null>(null);
  const [infoModal, setInfoModal] = useState<'about' | 'impact' | null>(null);

  // User saved commutes for Dashboard (persisted locally, starting without precoded history)
  const [savedCommutes, setSavedCommutes] = useState<SavedCommute[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('unigo_saved_commutes');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Remove any legacy mock commute entries
            return parsed.filter(
              (c: SavedCommute) =>
                c.id && !['commute-1', 'commute-2', 'commute-3'].includes(c.id)
            );
          }
        }
      } catch {
        // Ignore fallback
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('unigo_saved_commutes', JSON.stringify(savedCommutes));
      } catch {
        // Ignore
      }
    }
  }, [savedCommutes]);

  // Handle swapping locations
  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  // Submit route search
  const handleSearch = async (
    customFrom?: string,
    customTo?: string,
    customDate?: string,
    customPax?: number,
    customTime?: string
  ) => {
    const origin = (customFrom !== undefined ? customFrom : from).trim();
    const destination = (customTo !== undefined ? customTo : to).trim();

    if (!origin || !destination) {
      setError('Please enter both origin and destination locations to plan a route.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const dateVal = customDate || travelDate;
    const paxVal = customPax || passengerCount;
    const timeVal = customTime || departureTime;

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: origin,
          to: destination,
          travelDate: dateVal,
          passengerCount: paxVal,
          departureTime: timeVal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Request failed with status ${response.status}`);
      }

      const data: RoutePlanResult = await response.json();
      setCurrentPlan(data);
      setSelectedPreference('all');

      // Automatically register in dashboard if user planned a route
      if (data.routes && data.routes.length > 0) {
        const topRoute = data.routes[0];
        const newCommute: SavedCommute = {
          id: `commute-auto-${Date.now()}`,
          from: data.resolvedFrom || origin,
          to: data.resolvedTo || destination,
          date: dateVal || new Date().toISOString().split('T')[0],
          mode: topRoute.categoryLabel,
          distanceKm: Number(topRoute.distanceKm) || 12,
          co2SavedKg: Number(topRoute.co2SavedKg) || 1.8,
          passengers: paxVal,
        };
        setSavedCommutes((prev) => [newCommute, ...prev.slice(0, 19)]);
      }
    } catch (err: any) {
      console.error('Failed to plan sustainable routes:', err);
      setError(
        err?.message ||
          'Failed to connect to the transit planning service. Please verify your connection or try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Explore Places "Plan Itinerary in 1 Click"
  const handlePlanFromExplore = (fromLoc: string, destLoc: string) => {
    setFrom(fromLoc);
    setTo(destLoc);
    handleSelectTab('quick_planner');
    handleSearch(fromLoc, destLoc);
  };

  // Filter routes based on selected preference tab
  const displayedRoutes = currentPlan
    ? currentPlan.routes.filter((route) => {
        if (selectedPreference === 'all') return true;
        return route.priorityCategory === selectedPreference;
      })
    : [];

  return (
    <div className="relative min-h-screen w-full text-[#E2E8F0] font-sans antialiased selection:bg-[#C5A869]/30 selection:text-[#FAF6EC] overflow-x-hidden">
      {/* Scenic Papercraft Nature Background with vibrant blue sky, rolling hills & river */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
        style={{
          backgroundImage: `url(${enhancedPapercraftBg})`,
        }}
        aria-hidden="true"
      >
        {/* Soft atmospheric gradient wash: keeps the blue sky and paper clouds radiant while ensuring cards remain sharp and readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-[#040E0A]/40" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        {/* Navigation Header with 4 distinct tabs */}
        <Header
          currentTab={currentTab}
          onSelectTab={(tab) => handleSelectTab(tab)}
          onOpenAbout={() => setInfoModal('about')}
          onOpenImpact={() => setInfoModal('impact')}
        />

        {/* Main Container */}
        <main className="flex-1 flex flex-col items-center px-4 sm:px-8 md:px-12 py-8 pb-12 max-w-7xl mx-auto w-full">
          {/* Error notification banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-4xl mb-6 p-4 bg-[#231212]/85 backdrop-blur-md border border-[#7F1D1D] rounded-xl text-xs text-[#FCA5A5] flex items-start gap-3 shadow-lg shadow-black/40 gpu-smooth"
              >
                <AlertCircle className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-[#FEE2E2]">Transit Notification</p>
                  <p className="mt-0.5 text-[#FCA5A5]">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-[#F87171] hover:text-[#FEE2E2] font-bold cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        {/* Dynamic Tab Switcher with GPU Smooth Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="w-full flex flex-col items-center gpu-smooth"
          >
            {/* TAB 1: QUICK PLANNER (Current Clean Experience) */}
            {currentTab === 'quick_planner' && (
              <>
                <SearchBox
                  from={from}
                  to={to}
                  onChangeFrom={setFrom}
                  onChangeTo={setTo}
                  onSwap={handleSwap}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  isLoading={isLoading}
                />

                {/* Results Section */}
                {currentPlan && currentPlan.routes.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="w-full flex flex-col items-center"
                  >
                    {/* Parent Tile Enclosing Journey Info, Impact Summary, and Suggested Route Plans */}
                    <section className="w-full max-w-5xl bg-[#132E3F]/75 backdrop-blur-md rounded-2xl border border-[#1E4357]/70 p-6 sm:p-8 mb-8 shadow-xl shadow-black/50 relative z-10">
                      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#C5A869]/35 to-transparent" />

                      {/* Journey and Impact Information */}
                      <ImpactSummary
                        plan={currentPlan}
                        selectedPreference={selectedPreference}
                        onSelectPreference={setSelectedPreference}
                      />

                      {/* Subtle Internal Divider */}
                      <div className="h-px bg-[#1E4537]/60 my-6" />

                      {/* Suggested Plans Grid */}
                      <div
                        id="routes-results-grid"
                        className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        {displayedRoutes.map((route) => (
                          <RouteCard
                            key={route.id}
                            route={route}
                            onSelect={(r) => setActiveModalRoute(r)}
                            originWeather={currentPlan.originWeather}
                            destinationWeather={currentPlan.destinationWeather}
                            originName={currentPlan.from}
                            destinationName={currentPlan.to}
                          />
                        ))}
                      </div>
                    </section>
                  </motion.div>
                ) : !isLoading ? (
                  <div className="w-full max-w-4xl my-8 p-8 rounded-2xl bg-[#11261F]/75 backdrop-blur-md border border-[#1E4537]/75 text-center shadow-xl shadow-black/30 flex flex-col items-center relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#0A1C16]/75 backdrop-blur-sm border border-[#C5A869]/50 flex items-center justify-center mb-4 shadow-md shadow-black/50">
                      <Leaf className="w-6 h-6 text-[#C5A869]" />
                    </div>
                    <h2 className="text-lg font-extrabold text-[#FAF6EC] mb-2">
                      Plan Your Sustainable Commute
                    </h2>
                    <p className="text-xs text-[#8BA59B] max-w-lg leading-relaxed mb-6">
                      Enter origin and destination locations across India to generate real-world transit itineraries with carbon, time, and cost savings.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl text-left">
                      <div className="bg-[#0A1C16]/75 backdrop-blur-sm p-3 rounded-xl border border-[#1E4537]/75">
                        <span className="text-[10px] font-bold text-[#C5A869] uppercase tracking-wider block">Metro & Rail</span>
                        <p className="text-xs text-[#FAF6EC] font-semibold mt-1">Solar Powered</p>
                        <p className="text-[10px] text-[#8BA59B] mt-0.5">High frequency transit</p>
                      </div>
                      <div className="bg-[#0A1C16]/75 backdrop-blur-sm p-3 rounded-xl border border-[#1E4537]/75">
                        <span className="text-[10px] font-bold text-[#5EEAD4] uppercase tracking-wider block">Smart Cycles</span>
                        <p className="text-xs text-[#FAF6EC] font-semibold mt-1">PBS Docks</p>
                        <p className="text-[10px] text-[#8BA59B] mt-0.5">Zero direct emissions</p>
                      </div>
                      <div className="bg-[#0A1C16]/75 backdrop-blur-sm p-3 rounded-xl border border-[#1E4537]/75">
                        <span className="text-[10px] font-bold text-[#93C5FD] uppercase tracking-wider block">EV Autos</span>
                        <p className="text-xs text-[#FAF6EC] font-semibold mt-1">E-Rickshaw Feeders</p>
                        <p className="text-[10px] text-[#8BA59B] mt-0.5">Last-mile connectors</p>
                      </div>
                      <div className="bg-[#0A1C16]/75 backdrop-blur-sm p-3 rounded-xl border border-[#1E4537]/75">
                        <span className="text-[10px] font-bold text-[#D5BE8A] uppercase tracking-wider block">Electric Buses</span>
                        <p className="text-xs text-[#FAF6EC] font-semibold mt-1">Clean Public Fleets</p>
                        <p className="text-[10px] text-[#8BA59B] mt-0.5">DTC, BMTC, BEST</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* TAB 2: TRIP PLANNER (With Date & Number of Passengers) */}
            {currentTab === 'trip_planner' && (
              <>
                <TripPlannerBox
                  from={from}
                  to={to}
                  travelDate={travelDate}
                  passengerCount={passengerCount}
                  departureTime={departureTime}
                  onChangeFrom={setFrom}
                  onChangeTo={setTo}
                  onChangeTravelDate={setTravelDate}
                  onChangePassengerCount={setPassengerCount}
                  onChangeDepartureTime={setDepartureTime}
                  onSwap={handleSwap}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  isLoading={isLoading}
                />

                {/* Results Section for Trip Planner */}
                {currentPlan && currentPlan.routes.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="w-full flex flex-col items-center"
                  >
                    {/* Parent Tile Enclosing Group Info, Impact Summary, and Suggested Route Plans */}
                    <section className="w-full max-w-5xl bg-[#132E3F]/75 backdrop-blur-md rounded-2xl border border-[#1E4357]/70 p-6 sm:p-8 mb-8 shadow-xl shadow-black/50 relative z-10">
                      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#C5A869]/35 to-transparent" />

                      {/* Group Multi-Passenger Summary Banner */}
                      <div className="w-full mb-5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#8BA59B] bg-[#07161F]/90 backdrop-blur-sm px-4 py-3 rounded-xl border border-transparent gap-2">
                        <span className="text-[#FAF6EC]">
                           Trip for <strong>{passengerCount} passenger(s)</strong> scheduled on{' '}
                           <strong>{travelDate}</strong> ({departureTime})
                        </span>
                        <span className="text-[#C5A869] font-bold">
                          Total Group Carbon Savings Multiplied
                        </span>
                      </div>

                      {/* Journey and Impact Information */}
                      <ImpactSummary
                        plan={currentPlan}
                        selectedPreference={selectedPreference}
                        onSelectPreference={setSelectedPreference}
                      />

                      {/* Subtle Internal Divider */}
                      <div className="h-px bg-[#1E4537]/60 my-6" />

                      {/* Suggested Plans Grid */}
                      <div
                        id="routes-results-grid-trip"
                        className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        {displayedRoutes.map((route) => (
                          <RouteCard
                            key={route.id}
                            route={route}
                            onSelect={(r) => setActiveModalRoute(r)}
                            originWeather={currentPlan.originWeather}
                            destinationWeather={currentPlan.destinationWeather}
                            originName={currentPlan.from}
                            destinationName={currentPlan.to}
                          />
                        ))}
                      </div>
                    </section>
                  </motion.div>
                ) : !isLoading ? (
                  <div className="w-full max-w-4xl my-6 p-8 rounded-2xl bg-[#11261F]/75 backdrop-blur-md border border-[#1E4537]/75 text-center shadow-xl shadow-black/30 flex flex-col items-center relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#0A1C16]/75 backdrop-blur-sm border border-[#C5A869]/50 flex items-center justify-center mb-4">
                      <Compass className="w-6 h-6 text-[#C5A869]" />
                    </div>
                    <h2 className="text-lg font-extrabold text-[#FAF6EC] mb-2">
                      Plan Group & Scheduled Eco Trips
                    </h2>
                    <p className="text-xs text-[#8BA59B] max-w-md leading-relaxed">
                      Select your travel date, departure window, and number of passengers above. UniGo customizes multi-passenger fares, electric cab pooling, and rail timetables.
                    </p>
                  </div>
                ) : null}
              </>
            )}

            {/* TAB 3: DASHBOARD (Carbon reduced, distance travelled, trees, fuel) */}
            {currentTab === 'dashboard' && (
              <DashboardView
                savedCommutes={savedCommutes}
                onAddCommute={(item) => setSavedCommutes((prev) => [item, ...prev])}
                onNavigateToPlanner={(orig, dest) => {
                  if (orig) setFrom(orig);
                  if (dest) setTo(dest);
                  handleSelectTab('quick_planner');
                  if (orig && dest) handleSearch(orig, dest);
                }}
              />
            )}

            {/* TAB 4: EXPLORE PLACES (Input location + Go, suggestions, 1-click Plan Itinerary) */}
            {currentTab === 'explore_places' && (
              <ExplorePlacesView onPlanTripToPlace={handlePlanFromExplore} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer in Light Blue Styled Tile */}
        <footer className="w-full max-w-5xl mt-auto bg-[#0F222B]/75 backdrop-blur-md rounded-2xl border border-[#1E4154]/70 p-5 sm:px-8 shadow-xl shadow-black/40 flex flex-col sm:flex-row justify-between items-center text-xs text-[#8EAEC0] font-medium gap-3 relative z-10">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/25 to-transparent" />
          <span className="text-[#E0F2FE]">
            UniGo • Multi-Modal Sustainable Transit Engine for Indian Metros
          </span>
          <div className="flex gap-4">
            <button
              onClick={() => setInfoModal('impact')}
              className="text-[#BAE6FD] hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              Carbon Methodology
            </button>
            <button
              onClick={() => setInfoModal('about')}
              className="text-[#BAE6FD] hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              About UniGo
            </button>
          </div>
        </footer>
      </main>
    </div>

      {/* Itinerary Details Modal */}
      <AnimatePresence>
        {activeModalRoute && currentPlan && (
          <ItineraryModal
            key="itinerary-modal"
            route={activeModalRoute}
            plan={currentPlan}
            onClose={() => setActiveModalRoute(null)}
          />
        )}
      </AnimatePresence>

      {/* Information Modals */}
      <AnimatePresence>
        {infoModal && (
          <InfoModals
            key="info-modal"
            isOpen={Boolean(infoModal)}
            onClose={() => setInfoModal(null)}
            type={infoModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

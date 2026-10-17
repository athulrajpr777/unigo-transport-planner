import React, { useState, useRef, useEffect } from 'react';
import { Leaf, Zap, BarChart3, Compass, Menu, X, HelpCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { AppTab } from '../types.ts';
import { TAB_ROUTES } from '../utils/navigation.ts';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenAbout: () => void;
  onOpenImpact: () => void;
}

interface NavItem {
  id: AppTab;
  path: string;
  buttonId: string;
  label: string;
  badge: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'quick_planner',
    path: TAB_ROUTES.quick_planner.path,
    buttonId: 'tab-quick-planner',
    label: 'Quick Planner',
    badge: 'Fast Route',
    description: 'Instant multimodal route search with live transit modes',
    icon: Zap,
  },
  {
    id: 'trip_planner',
    path: TAB_ROUTES.trip_planner.path,
    buttonId: 'tab-trip-planner',
    label: 'Trip Planner',
    badge: 'Schedule',
    description: 'Custom travel date, time, and passenger group routing',
    icon: Compass,
  },
  {
    id: 'dashboard',
    path: TAB_ROUTES.dashboard.path,
    buttonId: 'tab-dashboard',
    label: 'Dashboard',
    badge: 'Telemetry',
    description: 'CO₂ telemetry, commute logs & tree equivalence',
    icon: BarChart3,
  },
  {
    id: 'explore_places',
    path: TAB_ROUTES.explore_places.path,
    buttonId: 'tab-explore-places',
    label: 'Explore Places',
    badge: 'Transit Grids',
    description: 'Indian city transit grids, metro lines & cycle docks',
    icon: Leaf,
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenAbout,
  onOpenImpact,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeItem = NAV_ITEMS.find((item) => item.id === currentTab) || NAV_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  const handleSelectTab = (tab: AppTab) => {
    onSelectTab(tab);
    setIsOpen(false);
  };

  return (
    <header className="flex justify-between items-center px-4 sm:px-8 lg:px-12 py-3.5 bg-[#0D221B]/75 backdrop-blur-md border-b border-[#1E4537]/75 sticky top-0 z-40 shadow-lg shadow-black/40">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div
          id="app-brand-logo"
          className="w-10 h-10 bg-[#071712]/80 rounded-xl border border-[#C5A869] flex items-center justify-center shadow-md shadow-black/50 shrink-0 backdrop-blur-xs"
        >
          <Leaf className="w-5 h-5 text-[#C5A869]" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#FAF6EC] leading-tight">
            Uni<span className="text-[#C5A869]">Go</span>
          </h1>
          <p className="text-[11px] text-[#8BA59B] hidden sm:block">
            Multimodal clean transit across Indian cities
          </p>
        </div>
      </div>

      {/* Right Controls: Active Tab Indicator & Three-Line Menu Button */}
      <div className="flex items-center gap-2.5">
        {/* Active Tab indicator badge */}
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#081813]/75 backdrop-blur-sm border border-[#1E4537]/75 text-xs text-[#FAF6EC] cursor-pointer hover:border-[#C5A869]/40 transition-all select-none"
          title="Click to open menu"
        >
          <div className="w-2 h-2 rounded-full bg-[#C5A869] animate-pulse" />
          <ActiveIcon className="w-3.5 h-3.5 text-[#C5A869]" />
          <span className="font-semibold text-[#DFCCA3]">{activeItem.label}</span>
        </div>

        {/* Three Line Menu Button (Hamburger Button) */}
        <button
          id="main-menu-button"
          ref={buttonRef}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="Navigation Menu"
          className={`flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer shadow-md shadow-black/30 ${
            isOpen
              ? 'bg-[#C5A869] text-[#0A1C16] border-[#C5A869]'
              : 'bg-[#11261F]/75 backdrop-blur-sm text-[#FAF6EC] border-[#1E4537]/75 hover:bg-[#16352B]/80 hover:border-[#C5A869]/50'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            {isOpen ? (
              <X className="w-5 h-5 text-current stroke-[2.5]" />
            ) : (
              <Menu className="w-5 h-5 text-current stroke-[2.5]" />
            )}
          </div>
          <span className="text-xs font-bold hidden md:inline">
            {isOpen ? 'Close' : 'Menu'}
          </span>
        </button>
      </div>

      {/* Dropdown Menu Modal / Drawer with all Tabs */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Dropdown Container */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-4 sm:right-8 lg:right-12 top-16 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-[#0D221B]/95 backdrop-blur-xl border border-[#235040]/75 rounded-2xl p-4 shadow-2xl shadow-black/80 z-50 gpu-smooth"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E4537]/75 mb-3">
                <div className="flex items-center gap-2">
                  <Menu className="w-4 h-4 text-[#C5A869]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#C5A869]">
                    Navigation Tabs
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-[#8BA59B] hover:text-[#FAF6EC] hover:bg-[#16352B] transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List of Navigation Tabs */}
              <div className="space-y-1.5 mb-3">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <a
                      key={item.id}
                      id={item.buttonId}
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectTab(item.id);
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer border no-underline block active:scale-[0.99] ${
                        isActive
                          ? 'bg-[#16352B]/80 border-[#C5A869] text-[#FAF6EC] shadow-md shadow-black/30'
                          : 'bg-[#081813]/75 backdrop-blur-sm border-[#1E4537]/75 text-[#8BA59B] hover:bg-[#11261F]/75 hover:text-[#FAF6EC] hover:border-[#C5A869]/40'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                          isActive
                            ? 'bg-[#C5A869] text-[#0A1C16] border-[#C5A869]'
                            : 'bg-[#0E261E]/75 text-[#C5A869] border-[#1E4537]/75'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-sm font-bold truncate ${
                              isActive ? 'text-[#FAF6EC]' : 'text-[#DFCCA3]'
                            }`}
                          >
                            {item.label}
                          </span>
                          {!isActive && (
                            <span className="text-[10px] font-medium text-[#738E83] bg-[#0E261E]/75 px-1.5 py-0.5 rounded shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8BA59B] mt-0.5 line-clamp-1 leading-snug">
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 self-center transition-transform ${
                          isActive ? 'text-[#C5A869] translate-x-0.5' : 'text-[#4A645A]'
                        }`}
                      />
                    </a>
                  );
                })}
              </div>

              {/* Subtle Divider */}
              <div className="pt-2 border-t border-[#1E4537]/75 flex items-center justify-between gap-2 text-xs">
                <button
                  id="nav-impact-btn"
                  onClick={() => {
                    onOpenImpact();
                    setIsOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#1E4537]/75 bg-[#081813]/75 backdrop-blur-sm hover:bg-[#16352B]/75 hover:border-[#C5A869]/40 text-[#DFCCA3] transition-all cursor-pointer font-medium active:scale-[0.98]"
                >
                  <Leaf className="w-3.5 h-3.5 text-[#C5A869]" />
                  <span>Impact Logic</span>
                </button>

                <button
                  id="nav-about-btn"
                  onClick={() => {
                    onOpenAbout();
                    setIsOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#1E4537]/75 bg-[#081813]/75 backdrop-blur-sm hover:bg-[#16352B]/75 hover:border-[#C5A869]/40 text-[#DFCCA3] transition-all cursor-pointer font-medium active:scale-[0.98]"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#C5A869]" />
                  <span>About</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};


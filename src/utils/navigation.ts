import type { AppTab } from '../types.ts';

export const TAB_ROUTES: Record<AppTab, { path: string; label: string; pageTitle: string }> = {
  quick_planner: {
    path: '/quick-planner',
    label: 'Quick Planner',
    pageTitle: 'UniGo • Sustainable Transport Planner',
  },
  trip_planner: {
    path: '/trip-planner',
    label: 'Trip Planner',
    pageTitle: 'Trip Planner • UniGo',
  },
  dashboard: {
    path: '/dashboard',
    label: 'Dashboard',
    pageTitle: 'Transit Dashboard & CO₂ Telemetry • UniGo',
  },
  explore_places: {
    path: '/explore-places',
    label: 'Explore Places',
    pageTitle: 'Explore Transit Networks • UniGo',
  },
};

export function getTabFromPathname(pathname: string): AppTab {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (cleanPath === '/trip-planner' || cleanPath === '/tripplanner' || cleanPath === '/trip') {
    return 'trip_planner';
  }
  if (cleanPath === '/dashboard') {
    return 'dashboard';
  }
  if (cleanPath === '/explore-places' || cleanPath === '/explore' || cleanPath === '/places') {
    return 'explore_places';
  }
  return 'quick_planner';
}

export function syncUrlForTab(tab: AppTab, replace: boolean = false) {
  if (typeof window === 'undefined') return;
  const info = TAB_ROUTES[tab];
  if (!info) return;

  const currentPath = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  // If user is at root / and selects quick_planner, or already on the path
  if (currentPath !== info.path) {
    if (replace) {
      window.history.replaceState({ tab }, '', info.path);
    } else {
      window.history.pushState({ tab }, '', info.path);
    }
  }

  document.title = info.pageTitle;
}

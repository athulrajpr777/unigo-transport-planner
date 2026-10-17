export type AppTab = 'quick_planner' | 'trip_planner' | 'dashboard' | 'explore_places';

export type TravelPreference = 'all' | 'eco_friendly' | 'efficient' | 'cheapest' | 'convenient';

export type TransportMode =
  | 'metro'
  | 'bus'
  | 'bicycle'
  | 'walking'
  | 'train'
  | 'ev_ridepool'
  | 'ev_auto'
  | 'ferry';

export interface TransitSegment {
  id: string;
  mode: TransportMode;
  modeLabel: string;
  title: string;
  detail: string;
  durationMinutes: number;
  distanceKm: number;
  co2Grams: number;
  badgeCode: string; // 'M' for Metro, 'B' for Bike/Bus, 'C' for Carpool, 'W' for Walk, etc.
  colorVariant: 'emerald' | 'blue' | 'amber' | 'purple' | 'cyan' | 'gray';
  notes?: string;
}

export interface RouteOption {
  id: string;
  priorityCategory: 'eco_friendly' | 'efficient' | 'cheapest' | 'convenient';
  categoryLabel: string;
  subtitle: string;
  isRecommended: boolean; // Recommended option (defaulted to Cheapest)
  durationMinutes: number;
  durationFormatted: string;
  distanceKm: number;
  co2SavedKg: number;
  co2EmittedKg: number;
  co2SavingsPercent: number;
  estimatedCostInr: number;
  transfersCount: number;
  primaryModes: TransportMode[];
  segments: TransitSegment[];
  highlights: string[];
}

export interface PlaceSuggestion {
  id: string;
  primary: string;
  secondary: string;
  type: 'transit' | 'station' | 'airport' | 'landmark' | 'locality' | 'tech_park' | 'commercial';
  categoryLabel: string;
  city?: string;
  state?: string;
}

export interface WeatherCondition {
  temperature: number; // Current temperature in °C directly from Open-Meteo
  conditionText: string; // Current weather condition (e.g. Clear, Cloudy, Rain, Drizzle, Thunderstorm)
  weatherCode?: number; // Open-Meteo WMO weather code
  locationName?: string;
  latitude?: number;
  longitude?: number;
  // Optional metadata
  apparentTemperature?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  cloudCover?: number;
  isDay?: boolean;
  advisory?: string;
  iconType?: string;
  source?: string;
  timestamp?: number;
}

export interface RoutePlanResult {
  from: string;
  to: string;
  resolvedFrom: string;
  resolvedTo: string;
  cityOrRegion: string;
  distanceEstimateKm: number;
  baselineSoloCarCo2Kg: number;
  baselineSoloCarDurationMinutes: number;
  baselineSoloCarCostInr: number;
  routes: RouteOption[];
  sustainabilityInsight: string;
  timestamp: number;
  // Optional travel metadata for trip planner
  travelDate?: string;
  passengerCount?: number;
  departureTime?: string;
  // Live weather conditions for source and destination
  originWeather?: WeatherCondition;
  destinationWeather?: WeatherCondition;
}

export interface ExploreDestination {
  id: string;
  name: string;
  city: string;
  state: string;
  category: string;
  description: string;
  highlightTransit: string;
  sampleFrom: string;
  co2SavingsPreview: string;
  tags: string[];
}

export interface SavedCommute {
  id: string;
  from: string;
  to: string;
  date: string;
  mode: string;
  distanceKm: number;
  co2SavedKg: number;
  passengers: number;
}

import React from 'react';
import type { WeatherCondition } from '../types.ts';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Snowflake,
  RotateCw,
  MapPin,
  Compass,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getWeatherIconCategory } from '../services/weatherService.ts';

interface WeatherWidgetProps {
  originWeather?: WeatherCondition | null;
  destinationWeather?: WeatherCondition | null;
  originName: string;
  destinationName: string;
  variant?: 'modal' | 'banner' | 'tile';
  onRefreshWeather?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  originWeather,
  destinationWeather,
  originName,
  destinationName,
  variant = 'modal',
  onRefreshWeather,
  isRefreshing = false,
  isLoading = false,
  error = null,
}) => {
  // Render condition icon based on conditionText and weatherCode, sensitive to daylight
  const renderWeatherIcon = (
    code?: number,
    conditionText?: string,
    className: string = 'w-6 h-6',
    isDay: boolean = true
  ) => {
    const text = (conditionText || '').toLowerCase();

    if (text.includes('thunder') || text.includes('lightning') || text.includes('storm')) {
      return <CloudLightning className={`${className} text-[#F59E0B]`} />;
    }
    if (text.includes('snow') || text.includes('hail')) {
      return <Snowflake className={`${className} text-[#E0F2FE]`} />;
    }
    if (text.includes('heavy rain') || text.includes('downpour')) {
      return <CloudRain className={`${className} text-[#38BDF8]`} />;
    }
    if (text.includes('rain') || text.includes('shower')) {
      return <CloudRain className={`${className} text-[#38BDF8]`} />;
    }
    if (text.includes('drizzle')) {
      return <CloudDrizzle className={`${className} text-[#67E8F9]`} />;
    }
    if (text.includes('fog') || text.includes('mist') || text.includes('haze')) {
      return <CloudFog className={`${className} text-[#CBD5E1]`} />;
    }
    if (text.includes('overcast') || (text.includes('cloudy') && !text.includes('partly'))) {
      return <Cloud className={`${className} text-[#94A3B8]`} />;
    }
    if (text.includes('partly') || text.includes('mostly') || text.includes('scattered')) {
      return isDay ? (
        <CloudSun className={`${className} text-[#FCD34D]`} />
      ) : (
        <CloudMoon className={`${className} text-[#93C5FD]`} />
      );
    }
    // Sunny (Day) or Clear Sky (Night)
    return isDay ? (
      <Sun className={`${className} text-[#FBBF24]`} />
    ) : (
      <Moon className={`${className} text-[#93C5FD]`} />
    );
  };

  // Compact Itinerary Tile Variant (directly embedded inside RouteCard)
  if (variant === 'tile') {
    if (!originWeather && !destinationWeather) return null;

    return (
      <div
        className="mb-3.5 bg-[#07161F]/90 rounded-xl px-3 py-2 border border-[#1E4357]/60 flex items-center justify-between gap-2 text-xs"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] uppercase font-bold text-[#8BA59B] shrink-0">Start:</span>
          {originWeather ? (
            <div className="flex items-center gap-1 min-w-0 text-[#FAF6EC] font-semibold">
              {renderWeatherIcon(originWeather.weatherCode, originWeather.conditionText, 'w-3.5 h-3.5', originWeather.isDay !== false)}
              <span className="text-xs font-bold text-[#FAF6EC]">{originWeather.temperature}°C</span>
              <span className="text-[11px] text-[#DFCCA3] truncate hidden sm:inline">
                ({originWeather.conditionText})
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-[#8BA59B]">--</span>
          )}
        </div>

        <span className="text-[#1E4357] font-bold shrink-0">➜</span>

        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="text-[10px] uppercase font-bold text-[#C5A869] shrink-0">End:</span>
          {destinationWeather ? (
            <div className="flex items-center gap-1 min-w-0 text-[#FAF6EC] font-semibold">
              {renderWeatherIcon(destinationWeather.weatherCode, destinationWeather.conditionText, 'w-3.5 h-3.5', destinationWeather.isDay !== false)}
              <span className="text-xs font-bold text-[#FAF6EC]">{destinationWeather.temperature}°C</span>
              <span className="text-[11px] text-[#DFCCA3] truncate hidden sm:inline">
                ({destinationWeather.conditionText})
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-[#8BA59B]">--</span>
          )}
        </div>
      </div>
    );
  }

  // Compact Banner Variant (displayed on route summaries)
  if (variant === 'banner') {
    if (!originWeather && !destinationWeather && !isLoading) return null;

    return (
      <div
        id="live-weather-banner"
        className="w-full bg-[#07161F]/85 backdrop-blur-md rounded-xl p-3 border border-[#1E4357]/70 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
          <span className="font-bold text-[11px] uppercase tracking-wider text-[#C5A869]">
            Live Weather
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-[#8BA59B]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A869]" />
            <span>Fetching live weather...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-1.5 text-xs text-[#F87171]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {originWeather && (
              <div className="flex items-center gap-1.5 font-medium text-[#FAF6EC]">
                <span className="text-[#8BA59B] text-[11px]">Departure:</span>
                {renderWeatherIcon(originWeather.weatherCode, originWeather.conditionText, 'w-4 h-4', originWeather.isDay !== false)}
                <span className="font-bold">{originWeather.temperature}°C</span>
                <span className="text-[#DFCCA3]">({originWeather.conditionText})</span>
              </div>
            )}

            {originWeather && destinationWeather && (
              <span className="text-[#1E4357] font-bold">➜</span>
            )}

            {destinationWeather && (
              <div className="flex items-center gap-1.5 font-medium text-[#FAF6EC]">
                <span className="text-[#8BA59B] text-[11px]">Arrival:</span>
                {renderWeatherIcon(destinationWeather.weatherCode, destinationWeather.conditionText, 'w-4 h-4', destinationWeather.isDay !== false)}
                <span className="font-bold">{destinationWeather.temperature}°C</span>
                <span className="text-[#DFCCA3]">({destinationWeather.conditionText})</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Modal Variant: Displays strictly the 2 values (Temperature in °C and Condition)
  return (
    <div id="itinerary-weather-section" className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0A1C16] border border-[#C5A869]/40 flex items-center justify-center text-[#C5A869]">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-[#C5A869]">
            Current Weather
          </h4>
          <span className="bg-[#10B981]/15 text-[#6EE7B7] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#10B981]/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            Live
          </span>
        </div>

        {onRefreshWeather && (
          <button
            type="button"
            onClick={onRefreshWeather}
            disabled={isRefreshing || isLoading}
            aria-label="Refresh current weather"
            className="flex items-center gap-1.5 text-[11px] text-[#8BA59B] hover:text-[#FAF6EC] px-2.5 py-1 rounded-lg border border-[#1E4537]/75 hover:border-[#C5A869]/50 hover:bg-[#142F25] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3 h-3 ${isRefreshing || isLoading ? 'animate-spin text-[#C5A869]' : ''}`} />
            <span>{isRefreshing || isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* Weather Cards Grid: Origin and Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Origin / Departure Weather Card */}
        <div
          id="origin-weather-card"
          className="bg-[#0A1C16]/80 backdrop-blur-sm p-4 rounded-xl border border-[#1E4537]/80 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#FBBF24]/5 rounded-full blur-xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5EEAD4] flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Departure
              </span>
            </div>

            <p className="font-bold text-sm text-[#FAF6EC] line-clamp-1 mb-2.5">
              {originWeather?.locationName || originName}
            </p>

            {isLoading || isRefreshing ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#8BA59B]">
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A869]" />
                <span>Loading current weather...</span>
              </div>
            ) : originWeather ? (
              <div className="flex items-center gap-3 bg-[#07161F]/60 p-3 rounded-lg border border-[#1E4357]/50">
                <div className="p-2 rounded-xl bg-[#0B1E18] border border-[#C5A869]/30 shrink-0">
                  {renderWeatherIcon(originWeather.weatherCode, originWeather.conditionText, 'w-7 h-7', originWeather.isDay !== false)}
                </div>
                <div>
                  <div className="text-2xl font-black text-[#FAF6EC] tracking-tight">
                    {originWeather.temperature}°C
                  </div>
                  <div className="text-xs font-semibold text-[#DFCCA3]">
                    {originWeather.conditionText}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 flex items-center justify-center gap-1.5 text-xs text-[#8BA59B]">
                <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Weather data unavailable for this location</span>
              </div>
            )}
          </div>
        </div>

        {/* Destination Weather Card */}
        <div
          id="destination-weather-card"
          className="bg-[#0A1C16]/80 backdrop-blur-sm p-4 rounded-xl border border-[#1E4537]/80 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#38BDF8]/5 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C5A869] flex items-center gap-1">
                <Compass className="w-3 h-3" />
                Destination
              </span>
            </div>

            <p className="font-bold text-sm text-[#FAF6EC] line-clamp-1 mb-2.5">
              {destinationWeather?.locationName || destinationName}
            </p>

            {isLoading || isRefreshing ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#8BA59B]">
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A869]" />
                <span>Loading current weather...</span>
              </div>
            ) : destinationWeather ? (
              <div className="flex items-center gap-3 bg-[#07161F]/60 p-3 rounded-lg border border-[#1E4357]/50">
                <div className="p-2 rounded-xl bg-[#0B1E18] border border-[#C5A869]/30 shrink-0">
                  {renderWeatherIcon(destinationWeather.weatherCode, destinationWeather.conditionText, 'w-7 h-7', destinationWeather.isDay !== false)}
                </div>
                <div>
                  <div className="text-2xl font-black text-[#FAF6EC] tracking-tight">
                    {destinationWeather.temperature}°C
                  </div>
                  <div className="text-xs font-semibold text-[#DFCCA3]">
                    {destinationWeather.conditionText}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 flex items-center justify-center gap-1.5 text-xs text-[#8BA59B]">
                <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Weather data unavailable for this location</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

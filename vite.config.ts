import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import dotenv from 'dotenv';
import {planSustainableRoute} from './src/server/routePlanner.ts';
import {getPlaceSuggestions, getExploreDestinations} from './src/server/places.ts';
import {getWeatherForLocation, getRouteWeather, fetchCurrentWeather} from './src/server/weather.ts';

dotenv.config();

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'sustainable-transit-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', 'http://localhost:3000');

        if (url.pathname === '/api/places/autocomplete' && req.method === 'GET') {
          try {
            const q = url.searchParams.get('q') || '';
            const suggestions = await getPlaceSuggestions(q);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ suggestions }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ suggestions: [], error: err?.message }));
          }
          return;
        }

        if (url.pathname === '/api/places/explore' && req.method === 'GET') {
          try {
            const loc = url.searchParams.get('location') || url.searchParams.get('q') || '';
            const destinations = await getExploreDestinations(loc);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ destinations }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ destinations: [], error: err?.message }));
          }
          return;
        }

        if (url.pathname === '/api/weather' && req.method === 'GET') {
          try {
            const loc = url.searchParams.get('location') || url.searchParams.get('q') || '';
            const from = url.searchParams.get('from') || '';
            const to = url.searchParams.get('to') || '';
            const latStr = url.searchParams.get('latitude') || url.searchParams.get('lat');
            const lonStr = url.searchParams.get('longitude') || url.searchParams.get('lon');

            if (latStr && lonStr) {
              const lat = Number(latStr);
              const lon = Number(lonStr);
              if (!isNaN(lat) && !isNaN(lon)) {
                const weather = await fetchCurrentWeather(lat, lon, loc || 'Selected Location');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ weather }));
                return;
              }
            }

            if (from && to) {
              const routeWeather = await getRouteWeather(from, to);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(routeWeather));
              return;
            }

            if (!loc) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Location parameter or coordinates (lat, lon) required' }));
              return;
            }

            const weather = await getWeatherForLocation(loc);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ weather }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Failed to fetch weather' }));
          }
          return;
        }

        if (url.pathname === '/api/routes' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const from = String(parsed.from || '').trim();
              const to = String(parsed.to || '').trim();
              const travelDate = parsed.travelDate ? String(parsed.travelDate).trim() : undefined;
              const passengerCount = parsed.passengerCount ? Number(parsed.passengerCount) : undefined;
              const departureTime = parsed.departureTime ? String(parsed.departureTime).trim() : undefined;
              if (!from || !to) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Both "from" and "to" locations are required.' }));
                return;
              }
              const plan = await planSustainableRoute({ from, to, travelDate, passengerCount, departureTime });
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(plan));
            } catch (err: any) {
              console.error('API Error in Vite dev server:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Failed to plan route' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

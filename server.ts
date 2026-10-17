import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { planSustainableRoute } from './src/server/routePlanner.ts';
import { getPlaceSuggestions, getExploreDestinations } from './src/server/places.ts';
import { getWeatherForLocation, getRouteWeather, fetchCurrentWeather } from './src/server/weather.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/places/autocomplete', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const suggestions = await getPlaceSuggestions(q);
    return res.json({ suggestions });
  } catch (err: any) {
    console.error('Error fetching place suggestions:', err);
    return res.status(500).json({ suggestions: [], error: err?.message });
  }
});

app.get('/api/places/explore', async (req, res) => {
  try {
    const loc = String(req.query.location || req.query.q || '').trim();
    const destinations = await getExploreDestinations(loc);
    return res.json({ destinations });
  } catch (err: any) {
    console.error('Error fetching explore destinations:', err);
    return res.status(500).json({ destinations: [], error: err?.message });
  }
});

app.get('/api/weather', async (req, res) => {
  try {
    const loc = String(req.query.location || req.query.q || '').trim();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();
    const latStr = req.query.latitude || req.query.lat;
    const lonStr = req.query.longitude || req.query.lon;

    if (latStr && lonStr) {
      const lat = Number(latStr);
      const lon = Number(lonStr);
      if (!isNaN(lat) && !isNaN(lon)) {
        const weather = await fetchCurrentWeather(lat, lon, loc || 'Selected Location');
        return res.json({ weather });
      }
    }

    if (from && to) {
      const routeWeather = await getRouteWeather(from, to);
      return res.json(routeWeather);
    }

    if (!loc) {
      return res.status(400).json({ error: 'Location parameter or coordinates (lat, lon) required' });
    }

    const weather = await getWeatherForLocation(loc);
    return res.json({ weather });
  } catch (err: any) {
    console.error('Error in /api/weather:', err);
    return res.status(500).json({ error: err?.message || 'Failed to fetch weather' });
  }
});

app.post('/api/routes', async (req, res) => {
  try {
    const { from, to, travelDate, passengerCount, departureTime } = req.body || {};
    if (!from || !to) {
      return res.status(400).json({ error: 'Both "from" and "to" locations are required.' });
    }
    const result = await planSustainableRoute({
      from: String(from).trim(),
      to: String(to).trim(),
      travelDate: travelDate ? String(travelDate).trim() : undefined,
      passengerCount: passengerCount ? Number(passengerCount) : undefined,
      departureTime: departureTime ? String(departureTime).trim() : undefined,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('Error planning route:', err);
    return res.status(500).json({ error: err?.message || 'Failed to plan route' });
  }
});

// Serve static assets from Vite build in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`UniGo server running on port ${port}`);
});

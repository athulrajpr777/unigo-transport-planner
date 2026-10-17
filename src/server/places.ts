import { GoogleGenAI, Type } from '@google/genai';
import { POPULAR_INDIAN_PLACES } from '../data/indianPlaces.ts';
import type { PlaceSuggestion, ExploreDestination } from '../types.ts';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function getPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    // Return empty so no locations are preloaded when input is empty
    return [];
  }

  // 1. Direct search against verified transit dataset
  const localMatches = POPULAR_INDIAN_PLACES.filter((place) => {
    const p = place.primary.toLowerCase();
    const s = place.secondary.toLowerCase();
    const c = (place.city || '').toLowerCase();
    const st = (place.state || '').toLowerCase();
    return p.includes(q) || s.includes(q) || c.includes(q) || st.includes(q);
  });

  if (localMatches.length >= 4 || q.length < 3) {
    return localMatches.slice(0, 7);
  }

  // 2. If fewer than 4 matches and query has 3+ chars, enhance with Gemini for Google Maps realism
  try {
    const ai = getGenAI();
    if (ai) {
      const prompt = `You are the Google Maps Places Autocomplete API for India.
The user typed: "${query}".
Provide up to 5 realistic, accurate place suggestions in India matching or related to this query.
Each suggestion must look exactly like Google Maps autocomplete:
- "primary": specific place name or station name or landmark (e.g. "Indiranagar 100ft Road", "Sector 18 Metro Station", "Salt Lake Sector V")
- "secondary": neighborhood, city, state and PIN/landmark details (e.g. "HAL 2nd Stage, Bengaluru, Karnataka", "Noida, Uttar Pradesh 201301")
- "type": one of ["transit", "station", "airport", "landmark", "locality", "tech_park", "commercial"]
- "categoryLabel": short 2-3 word category (e.g. "Metro Station", "Tech Park", "Heritage Site", "Neighborhood")
- "city": city name
- "state": Indian state or UT`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                type: {
                  type: Type.STRING,
                  enum: ['transit', 'station', 'airport', 'landmark', 'locality', 'tech_park', 'commercial'],
                },
                categoryLabel: { type: Type.STRING },
                city: { type: Type.STRING },
                state: { type: Type.STRING },
              },
              required: ['primary', 'secondary', 'type', 'categoryLabel'],
            },
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const aiSuggestions: PlaceSuggestion[] = parsed.map((item, idx) => ({
            id: `ai-${Date.now()}-${idx}`,
            primary: item.primary,
            secondary: item.secondary,
            type: item.type || 'locality',
            categoryLabel: item.categoryLabel || 'Location',
            city: item.city,
            state: item.state,
          }));

          // Merge local and AI matches, removing duplicates by primary name
          const combined = [...localMatches];
          const seen = new Set(localMatches.map((m) => m.primary.toLowerCase()));
          for (const item of aiSuggestions) {
            if (!seen.has(item.primary.toLowerCase())) {
              seen.add(item.primary.toLowerCase());
              combined.push(item);
            }
          }
          return combined.slice(0, 7);
        }
      }
    }
  } catch (err) {
    console.warn('Gemini autocomplete fallback error:', err);
  }

  return localMatches.slice(0, 7);
}

// Curated verified eco-friendly destinations across India
export const CURATED_EXPLORE_DATABASE: ExploreDestination[] = [
  // Delhi
  {
    id: 'exp-del-1',
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
    id: 'exp-del-2',
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
    id: 'exp-del-3',
    name: 'Humayun’s Tomb & Sunder Nursery',
    city: 'New Delhi',
    state: 'Delhi',
    category: 'Botanical Heritage & Mughal Gardens',
    description:
      '90-acre heritage ecological park with 300+ tree species, restored waterworks, and bird habitat accessible via Pink Line metro.',
    highlightTransit: 'JLN Stadium Metro (Violet Line) or Hazrat Nizamuddin (Pink Line)',
    sampleFrom: 'Central Secretariat, Delhi',
    co2SavingsPreview: '2.4 kg CO₂ saved',
    tags: ['Ecological Park', 'Violet Line', 'Heritage Corridor'],
  },

  // Bengaluru
  {
    id: 'exp-blr-1',
    name: 'Cubbon Park & Vidhana Soudha',
    city: 'Bengaluru',
    state: 'Karnataka',
    category: 'Botanical Green Heart',
    description:
      '300 acres of lush botanical canopy in the heart of Bengaluru, connected directly at the station exit with zero fossil traffic on weekends.',
    highlightTransit: 'Cubbon Park Metro Station (Namma Metro Purple Line Exit A)',
    sampleFrom: 'Indiranagar, Bengaluru',
    co2SavingsPreview: '2.8 kg CO₂ saved',
    tags: ['Purple Line Metro', 'SmartBike Share', 'Pedestrian Haven'],
  },
  {
    id: 'exp-blr-2',
    name: 'Lalbagh Botanical Garden & Glass House',
    city: 'Bengaluru',
    state: 'Karnataka',
    category: 'Historic Botanical Sanctuary',
    description:
      '240 acres of century-old flora and iconic glass pavilion, directly linked to Namma Metro Green Line with shaded pedestrian gates.',
    highlightTransit: 'Lalbagh Metro Station (Namma Metro Green Line)',
    sampleFrom: 'Majestic Bus Stand, Bengaluru',
    co2SavingsPreview: '2.5 kg CO₂ saved',
    tags: ['Green Line Metro', 'Botanical Trail', 'Electric Shuttle'],
  },

  // Mumbai
  {
    id: 'exp-mum-1',
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
    id: 'exp-mum-2',
    name: 'Sanjay Gandhi National Park & Kanheri Caves',
    city: 'Mumbai',
    state: 'Maharashtra',
    category: 'Protected Urban Forest & Ancient Caves',
    description:
      'Sprawling urban wilderness with 2000-year-old Buddhist rock caves, accessed via Western Line suburban train and clean EV park shuttles.',
    highlightTransit: 'Borivali Railway Station (Western Line) + BEST Electric AC Bus 298',
    sampleFrom: 'Dadar, Mumbai',
    co2SavingsPreview: '5.6 kg CO₂ saved',
    tags: ['Suburban Rail', 'EV Park Safari', 'Nature Corridor'],
  },

  // Kolkata
  {
    id: 'exp-kol-1',
    name: 'Howrah Bridge & Victoria Memorial',
    city: 'Kolkata',
    state: 'West Bengal',
    category: 'Iconic Riverfront & Classical Grandeur',
    description:
      'Historic riverfront vistas accessible via the underwater Green Line metro beneath the Hooghly River and historic electric trams.',
    highlightTransit: 'Howrah underwater Metro (Green Line) / Esplanade interchange',
    sampleFrom: 'Salt Lake Sector V, Kolkata',
    co2SavingsPreview: '3.4 kg CO₂ saved',
    tags: ['Underwater Metro', 'Electric Tram', 'Hooghly River Ferry'],
  },

  // Hyderabad
  {
    id: 'exp-hyd-1',
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

  // Ahmedabad
  {
    id: 'exp-ahd-1',
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

  // Jaipur
  {
    id: 'exp-jai-1',
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
  {
    id: 'exp-jai-2',
    name: 'Hawa Mahal & City Palace Precinct',
    city: 'Jaipur',
    state: 'Rajasthan',
    category: 'Royal Architecture & Walled City',
    description:
      'Pink honeycomb facade and royal palace courtyards in the UNESCO World Heritage walled city, completely walkable with electric feeder autos.',
    highlightTransit: 'Badi Chaupar Metro Station (Pink Line Exit 2 - 200m walk)',
    sampleFrom: 'Sindhi Camp Bus Stand, Jaipur',
    co2SavingsPreview: '2.2 kg CO₂ saved',
    tags: ['Metro Direct', 'Pedestrian Heritage Zone', 'E-Rickshaw Feeder'],
  },

  // Kochi / Kerala
  {
    id: 'exp-koc-1',
    name: 'Fort Kochi Beach & Chinese Fishing Nets',
    city: 'Kochi',
    state: 'Kerala',
    category: 'Colonial Heritage & Coastal Estuary',
    description:
      'Historic maritime enclave with giant cantilevers fishing nets, reached via the world’s first integrated zero-emission Water Metro electric hybrid ferries.',
    highlightTransit: 'Kochi Water Metro from High Court Jetty to Fort Kochi',
    sampleFrom: 'Ernakulam South Railway Station',
    co2SavingsPreview: '4.2 kg CO₂ saved',
    tags: ['Electric Water Metro', 'Solar Ferry', 'Coastal Walkway'],
  },

  // Varanasi
  {
    id: 'exp-var-1',
    name: 'Dashashwamedh Ghat & Kashi Vishwanath Corridor',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    category: 'Spiritual Riverfront & Ancient Temples',
    description:
      'Sacred riverfront ghats famous for evening Ganga Aarti, connected via solar-powered electric boats and designated pedestrian heritage lanes.',
    highlightTransit: 'Varanasi Cantt Station + Clean E-Bus to Godowlia + Pedestrian Corridor',
    sampleFrom: 'Varanasi Junction',
    co2SavingsPreview: '2.7 kg CO₂ saved',
    tags: ['Solar E-Boat', 'E-Bus Transit', 'Sacred Pedestrian Walk'],
  },

  // Goa
  {
    id: 'exp-goa-1',
    name: 'Basilica of Bom Jesus & Old Goa Heritage',
    city: 'Old Goa',
    state: 'Goa',
    category: 'UNESCO Baroque Architecture',
    description:
      '16th-century Jesuit churches surrounded by coconut groves and Mandovi riverfront, served by Kadamba zero-emission electric buses.',
    highlightTransit: 'KTC Electric AC Bus from Panaji Central Bus Stand to Old Goa',
    sampleFrom: 'Panaji Bus Terminus, Goa',
    co2SavingsPreview: '3.1 kg CO₂ saved',
    tags: ['Kadamba EV Bus', 'Mandovi Ferry', 'Heritage Walk'],
  },

  // Agra
  {
    id: 'exp-agr-1',
    name: 'Taj Mahal & Mehtab Bagh Gardens',
    city: 'Agra',
    state: 'Uttar Pradesh',
    category: 'UNESCO World Wonder',
    description:
      'White marble mausoleum and sunset river gardens located inside the 500-meter Taj Trapezium Zone where only electric golf carts and battery rickshaws operate.',
    highlightTransit: 'Agra Metro (Taj East Gate Station) + Battery EV Shuttle',
    sampleFrom: 'Agra Cantt Railway Station',
    co2SavingsPreview: '3.5 kg CO₂ saved',
    tags: ['Agra Metro', 'Battery Cart Feeder', 'Pollution-Free Zone'],
  },

  // Chennai
  {
    id: 'exp-chn-1',
    name: 'Marina Beach Promenade & San Thome Cathedral',
    city: 'Chennai',
    state: 'Tamil Nadu',
    category: 'Urban Beach & Historic Basilica',
    description:
      'Second longest urban beach in the world, served directly by Chennai MRTS elevated electric rail and MTC electric low-floor buses.',
    highlightTransit: 'Light House MRTS Station / Chennai Metro AG-DMS + E-Bus',
    sampleFrom: 'Chennai Central Railway Station',
    co2SavingsPreview: '2.9 kg CO₂ saved',
    tags: ['MRTS Electric Rail', 'Beach Promenade', 'MTC Electric Bus'],
  },
];

export async function getExploreDestinations(query: string): Promise<ExploreDestination[]> {
  const q = (query || '').trim();
  if (!q) {
    return CURATED_EXPLORE_DATABASE.slice(0, 8);
  }

  // 1. Try Gemini API to discover authentic attractions near any location entered by user
  try {
    const ai = getGenAI();
    if (ai) {
      const prompt = `You are an expert sustainable travel and eco-tourism guide.
The user wants to explore attractions in or near: "${q}".
Identify 4 to 6 authentic, popular or scenic attractions, parks, historic monuments, cultural centers, or eco-tourism landmarks located in or nearest to "${q}".
For each attraction, provide practical, low-carbon public transit connectivity (such as local metro/suburban rail, electric city bus, electric auto-rickshaw feeder, cycling paths, or walking corridors).
Return a JSON array of objects with the following exact properties:
- "name": Exact attraction name
- "city": City or district
- "state": State or region
- "category": Short 2-4 word category (e.g. "UNESCO World Heritage", "Scenic Botanical Reserve", "Historic Royal Fort", "Waterfront Promenade", "Eco-Park & Sanctuary")
- "description": 2-3 engaging sentences describing the landmark's appeal, history, and why visiting sustainably is rewarding.
- "highlightTransit": Real transit connectivity (e.g. "Metro Line X to Station Y + 500m shaded walkway", "Electric City Bus Route 12 + Shared E-Auto")
- "sampleFrom": A well-known departure hub or central transit terminal in that area (e.g. "Central Railway Station", "City Center", "Airport")
- "co2SavingsPreview": Realistic estimated CO2 savings compared to a private car (e.g. "3.4 kg CO₂ saved")
- "tags": 3 concise transit/eco tags (e.g. ["Electric Rail", "E-Bus Feeder", "Pedestrian Zone"])`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                city: { type: Type.STRING },
                state: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                highlightTransit: { type: Type.STRING },
                sampleFrom: { type: Type.STRING },
                co2SavingsPreview: { type: Type.STRING },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'name',
                'city',
                'state',
                'category',
                'description',
                'highlightTransit',
                'sampleFrom',
                'co2SavingsPreview',
                'tags',
              ],
            },
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: `gemini-exp-${Date.now()}-${idx}`,
            name: item.name,
            city: item.city || q,
            state: item.state || '',
            category: item.category || 'Scenic Landmark',
            description: item.description,
            highlightTransit: item.highlightTransit,
            sampleFrom: item.sampleFrom || `${q} Central`,
            co2SavingsPreview: item.co2SavingsPreview || '2.8 kg CO₂ saved',
            tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : ['Clean Transit', 'Eco Tourism'],
          }));
        }
      }
    }
  } catch (err) {
    console.warn('Gemini explore attractions error, falling back to database/generator:', err);
  }

  // 2. Fallback: Check if matching places exist in curated database
  const qLower = q.toLowerCase();
  const matchedCurated = CURATED_EXPLORE_DATABASE.filter(
    (item) =>
      item.city.toLowerCase().includes(qLower) ||
      item.state.toLowerCase().includes(qLower) ||
      item.name.toLowerCase().includes(qLower) ||
      item.description.toLowerCase().includes(qLower)
  );

  if (matchedCurated.length > 0) {
    return matchedCurated;
  }

  // 3. Dynamic generator for any user-provided location name so search is never empty
  const formattedLoc = q.charAt(0).toUpperCase() + q.slice(1);
  return [
    {
      id: `gen-1-${Date.now()}`,
      name: `${formattedLoc} Heritage Quarter & Old Town Vista`,
      city: formattedLoc,
      state: 'Regional Heritage',
      category: 'Historical Core & Architecture',
      description: `Historic core of ${formattedLoc} featuring centuries of vernacular architecture, bustling pedestrian lanes, and artisan cultural landmarks.`,
      highlightTransit: `Central Metro / Local Station + 400m shaded pedestrian heritage walkway`,
      sampleFrom: `${formattedLoc} Railway Station`,
      co2SavingsPreview: '3.1 kg CO₂ saved',
      tags: ['Pedestrian Zone', 'Electric Feeder', 'Heritage Corridor'],
    },
    {
      id: `gen-2-${Date.now()}`,
      name: `${formattedLoc} Botanical Gardens & Eco-Park`,
      city: formattedLoc,
      state: 'Urban Green Canopy',
      category: 'Botanical Reserve & Lake',
      description: `Lush urban bio-reserve and natural green lung in ${formattedLoc} featuring native tree trails, butterfly conservatories, and solar-lit boardwalks.`,
      highlightTransit: `City Electric AC Bus Route + Dedicated municipal bicycle track`,
      sampleFrom: `${formattedLoc} City Center`,
      co2SavingsPreview: '2.5 kg CO₂ saved',
      tags: ['Electric Bus', 'Bike Share Dock', 'Zero Emission Zone'],
    },
    {
      id: `gen-3-${Date.now()}`,
      name: `${formattedLoc} Waterfront Promenade & Cultural Plaza`,
      city: formattedLoc,
      state: 'Scenic Riverfront',
      category: 'Waterfront Public Space',
      description: `Scenic landscaped promenade along the water in ${formattedLoc}, offering open-air amphitheaters, pedestrian bridges, and tranquil sunset overlooks.`,
      highlightTransit: `Rapid Transit Line + Shared Electric Auto / Rickshaw`,
      sampleFrom: `${formattedLoc} Central Bus Terminus`,
      co2SavingsPreview: '3.7 kg CO₂ saved',
      tags: ['Clean Transit', 'Waterfront Trail', 'E-Rickshaw'],
    },
    {
      id: `gen-4-${Date.now()}`,
      name: `${formattedLoc} Hilltop Overlook & Nature Sanctuary`,
      city: formattedLoc,
      state: 'Ecological Reserve',
      category: 'Scenic Viewpoint & Forest Trail',
      description: `Panoramic vantage point overlooking ${formattedLoc} and surrounding green hills, preserved with strict conservation rules and clean public transit access.`,
      highlightTransit: `Express Transit Shuttle to base + Scenic electric cable car / walking trail`,
      sampleFrom: `${formattedLoc} Inter-State Transit Hub`,
      co2SavingsPreview: '4.2 kg CO₂ saved',
      tags: ['Eco Shuttle', 'Walking Trail', 'Panoramic Vista'],
    },
  ];
}


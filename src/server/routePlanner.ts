import { GoogleGenAI, Type } from '@google/genai';
import type { RoutePlanResult, RouteOption, TransitSegment, TransportMode } from '../types.ts';
import { getRouteWeather } from './weather.ts';

interface PlanRouteParams {
  from: string;
  to: string;
  travelDate?: string;
  passengerCount?: number;
  departureTime?: string;
}

async function enrichWithWeather(result: RoutePlanResult): Promise<RoutePlanResult> {
  try {
    const weather = await getRouteWeather(
      result.resolvedFrom || result.from,
      result.resolvedTo || result.to
    );
    return {
      ...result,
      originWeather: weather.originWeather,
      destinationWeather: weather.destinationWeather,
    };
  } catch (err) {
    console.warn('[Weather Service] Could not enrich routes with weather:', err);
    return result;
  }
}

// Intelligent fallback generator when API key is unavailable or external service errors
function generateFallbackRoutes(from: string, to: string): RoutePlanResult {
  const cleanFrom = from.trim() || 'Starting Point';
  const cleanTo = to.trim() || 'Destination';
  const queryLower = `${cleanFrom} ${cleanTo}`.toLowerCase();

  // Determine city context and realistic transit routing
  const isDelhi =
    queryLower.includes('delhi') ||
    queryLower.includes('gurugram') ||
    queryLower.includes('gurgaon') ||
    queryLower.includes('noida') ||
    queryLower.includes('hauz khas') ||
    queryLower.includes('connaught') ||
    queryLower.includes('rajiv chowk') ||
    queryLower.includes('cyber hub') ||
    queryLower.includes('saket') ||
    queryLower.includes('dwarka') ||
    queryLower.includes('chandni chowk');

  const isMumbai =
    queryLower.includes('mumbai') ||
    queryLower.includes('bandra') ||
    queryLower.includes('andheri') ||
    queryLower.includes('csmt') ||
    queryLower.includes('churchgate') ||
    queryLower.includes('bkc') ||
    queryLower.includes('dadar') ||
    queryLower.includes('colaba') ||
    queryLower.includes('nariman');

  const isBengaluru =
    queryLower.includes('bengaluru') ||
    queryLower.includes('bangalore') ||
    queryLower.includes('indiranagar') ||
    queryLower.includes('koramangala') ||
    queryLower.includes('whitefield') ||
    queryLower.includes('majestic') ||
    queryLower.includes('electronic city') ||
    queryLower.includes('mg road') ||
    queryLower.includes('kempegowda');

  const isHyderabad =
    queryLower.includes('hyderabad') ||
    queryLower.includes('hitec') ||
    queryLower.includes('gachibowli') ||
    queryLower.includes('secunderabad') ||
    queryLower.includes('ameerpet') ||
    queryLower.includes('charminar');

  const isKochi =
    queryLower.includes('kochi') ||
    queryLower.includes('cochin') ||
    queryLower.includes('ernakulam') ||
    queryLower.includes('edappally') ||
    queryLower.includes('lulu') ||
    queryLower.includes('infopark') ||
    queryLower.includes('kakkanad') ||
    queryLower.includes('vyttila') ||
    queryLower.includes('kaloor') ||
    queryLower.includes('aluva');

  let cityName = 'India Urban Transit Grid';
  let distanceKm = 14.5;
  let carDuration = 45;
  let ecoTransitTitle = 'Electric Metro Rail';
  let ecoTransitDetail = `Transit corridor between ${cleanFrom} and ${cleanTo}`;
  let ecoTransitNotes = '100% solar & regenerative braking powered rail';
  let metroLineName = 'Electric Metro Line';
  let busFleet = 'State Electric Transit Bus';
  let cycleSystem = 'SmartBike / Yulu Pedal Hub';

  if (isKochi) {
    cityName = 'Kochi Multimodal Grid (Metro & Feeders)';
    distanceKm = queryLower.includes('lulu') && queryLower.includes('infopark') ? 11.2 : 12.0;
    carDuration = 32;
    metroLineName = 'Kochi Metro Line 1 & Feeder';
    ecoTransitTitle = 'Kochi Metro Line 1 + Electric Feeder';
    ecoTransitDetail = 'Kochi Metro from Edappally to Palarivattom + Electric Feeder Bus via Seaport-Airport Rd to Infopark Kakkanad';
    ecoTransitNotes = '100% solar-assisted metro with zero-emission feeder';
    busFleet = 'Kochi City Bus (Direct via Seaport-Airport Rd / Edappally Toll)';
    cycleSystem = 'Kochi Metro Public Cycle Share Dock';
  } else if (isDelhi) {
    cityName = 'Delhi NCR Transit Grid (DMRC / DTC)';
    distanceKm = 16.0;
    carDuration = 50;
    metroLineName = 'Delhi Metro Yellow Line';
    ecoTransitTitle = 'Delhi Metro (Yellow Line)';
    ecoTransitDetail = 'Direct high-frequency electric rail via Rajiv Chowk / Central Secretariat';
    ecoTransitNotes = 'Powered by Rewa Ultra Mega Solar Project';
    busFleet = 'DTC Low-Floor Electric AC Bus (Route 502/620)';
    cycleSystem = 'Yulu Miracle / DMRC Smart Bike Dock';
  } else if (isMumbai) {
    cityName = 'Mumbai Multimodal Transit (Suburban / Metro)';
    distanceKm = 15.0;
    carDuration = 55;
    metroLineName = 'Western Railway Local & Metro Line 1';
    ecoTransitTitle = 'Suburban EMU Local & Metro';
    ecoTransitDetail = 'Western Line Fast Local towards Churchgate / Dadar Interchange';
    ecoTransitNotes = 'High-frequency electric 12-car local train';
    busFleet = 'BEST Electric AC Bus Route (Chalo App feeder)';
    cycleSystem = 'MYBYK Station Hub';
  } else if (isBengaluru) {
    cityName = 'Bengaluru Namma Metro & BMTC';
    distanceKm = 15.5;
    carDuration = 60;
    metroLineName = 'Namma Metro Purple Line';
    ecoTransitTitle = 'Namma Metro (Purple Line)';
    ecoTransitDetail = 'Direct metro transit via Nadaprabhu Kempegowda Majestic Interchange';
    ecoTransitNotes = 'Solar-powered BMRCL electric train corridor';
    busFleet = 'BMTC Vajra Electric AC Transit (Route 500D / G4)';
    cycleSystem = 'Yulu Move Station';
  } else if (isHyderabad) {
    cityName = 'Hyderabad Metro & TSRTC';
    distanceKm = 14.0;
    carDuration = 40;
    metroLineName = 'Hyderabad Metro Blue Line';
    ecoTransitTitle = 'Hyderabad Metro (Blue Line)';
    ecoTransitDetail = 'Direct transit via Ameerpet Interchange towards Raidurg / Hitec City';
    ecoTransitNotes = 'Regenerative braking energy-efficient fleet';
    busFleet = 'TSRTC Pushpak Electric Airport & City Express';
    cycleSystem = 'SmartBike Hub';
  }

  const carCo2Baseline = Number(((distanceKm * 155) / 1000).toFixed(2));
  const carFuelCost = Math.round(distanceKm * 11);

  const ecoSegments: TransitSegment[] = [
    {
      id: 'seg-eco-1',
      mode: 'bicycle',
      modeLabel: 'Smart Cycle Share',
      title: cycleSystem,
      detail: `First-mile bike dock at ${cleanFrom} to closest metro concourse`,
      durationMinutes: 7,
      distanceKm: 1.5,
      co2Grams: 0,
      badgeCode: 'B',
      colorVariant: 'emerald',
      notes: 'Designated non-motorized transport lane',
    },
    {
      id: 'seg-eco-2',
      mode: 'metro',
      modeLabel: metroLineName,
      title: ecoTransitTitle,
      detail: ecoTransitDetail,
      durationMinutes: Math.round((distanceKm * 0.8) / 0.55),
      distanceKm: Number((distanceKm * 0.85).toFixed(1)),
      co2Grams: Math.round(distanceKm * 0.85 * 20),
      badgeCode: 'M',
      colorVariant: 'emerald',
      notes: ecoTransitNotes,
    },
    {
      id: 'seg-eco-3',
      mode: 'walking',
      modeLabel: 'Pedestrian Walk',
      title: 'Pedestrian Footpath Walk',
      detail: `Exit station gate and walk 400m to destination at ${cleanTo}`,
      durationMinutes: 5,
      distanceKm: 0.4,
      co2Grams: 0,
      badgeCode: 'W',
      colorVariant: 'emerald',
      notes: 'Paved sidewalk',
    },
  ];

  const ecoTotalDuration = ecoSegments.reduce((acc, s) => acc + s.durationMinutes, 0);
  const ecoCo2Emitted = Number(
    (ecoSegments.reduce((acc, s) => acc + s.co2Grams, 0) / 1000).toFixed(2)
  );

  const ecoOption: RouteOption = {
    id: 'opt-eco',
    priorityCategory: 'eco_friendly',
    categoryLabel: 'Eco-Friendly',
    subtitle: 'Zero tailpipe fossil-fuel emissions',
    isRecommended: false,
    durationMinutes: ecoTotalDuration,
    durationFormatted: `${ecoTotalDuration} min`,
    distanceKm: distanceKm,
    co2EmittedKg: ecoCo2Emitted,
    co2SavedKg: Number((carCo2Baseline - ecoCo2Emitted).toFixed(2)),
    co2SavingsPercent: Math.round(((carCo2Baseline - ecoCo2Emitted) / carCo2Baseline) * 100),
    estimatedCostInr: isMumbai ? 25 : 40,
    transfersCount: 1,
    primaryModes: ['bicycle', 'metro', 'walking'],
    segments: ecoSegments,
    highlights: [
      `${Math.round(((carCo2Baseline - ecoCo2Emitted) / carCo2Baseline) * 100)}% lower emissions than private car`,
      'Electrified rail avoids road congestion',
      'Active mobility with pedal bike first-mile',
    ],
  };

  const efficientSegments: TransitSegment[] = [
    {
      id: 'seg-eff-1',
      mode: 'ev_ridepool',
      modeLabel: 'EV Shared Cab / Ridepool',
      title: 'Shared Electric Ride (BluSmart / Quick Ride)',
      detail: `Doorstep EV pickup at ${cleanFrom} to express rail hub`,
      durationMinutes: 9,
      distanceKm: 2.8,
      co2Grams: 80,
      badgeCode: 'C',
      colorVariant: 'blue',
      notes: '100% electric fleet',
    },
    {
      id: 'seg-eff-2',
      mode: 'metro',
      modeLabel: metroLineName,
      title: ecoTransitTitle,
      detail: `Express sector connection towards ${cleanTo}`,
      durationMinutes: Math.round((distanceKm * 0.8) / 0.6),
      distanceKm: Number((distanceKm * 0.85).toFixed(1)),
      co2Grams: Math.round(distanceKm * 0.85 * 20),
      badgeCode: 'M',
      colorVariant: 'blue',
      notes: 'High frequency service every 3-4 minutes',
    },
  ];

  const effTotalDuration = efficientSegments.reduce((acc, s) => acc + s.durationMinutes, 0);
  const effCo2Emitted = Number(
    (efficientSegments.reduce((acc, s) => acc + s.co2Grams, 0) / 1000).toFixed(2)
  );

  const efficientOption: RouteOption = {
    id: 'opt-eff',
    priorityCategory: 'efficient',
    categoryLabel: 'Fastest',
    subtitle: 'Fastest door-to-destination transit balance',
    isRecommended: false,
    durationMinutes: effTotalDuration,
    durationFormatted: `${effTotalDuration} min`,
    distanceKm: distanceKm,
    co2EmittedKg: effCo2Emitted,
    co2SavedKg: Number((carCo2Baseline - effCo2Emitted).toFixed(2)),
    co2SavingsPercent: Math.round(((carCo2Baseline - effCo2Emitted) / carCo2Baseline) * 100),
    estimatedCostInr: 80,
    transfersCount: 1,
    primaryModes: ['ev_ridepool', 'metro'],
    segments: efficientSegments,
    highlights: [
      'Shortest total commute time',
      'Doorstep electric pickup eliminates walking in heat',
      'High-speed dedicated rail corridor',
    ],
  };

  const cheapestSegments: TransitSegment[] = [
    {
      id: 'seg-chp-1',
      mode: 'walking',
      modeLabel: 'Walk',
      title: 'Walk to Bus Stand',
      detail: `Walk 300m from ${cleanFrom} to nearest transit shelter`,
      durationMinutes: 4,
      distanceKm: 0.3,
      co2Grams: 0,
      badgeCode: 'W',
      colorVariant: 'amber',
    },
    {
      id: 'seg-chp-2',
      mode: 'bus',
      modeLabel: 'Electric City Bus',
      title: busFleet,
      detail: `Direct electric transit bus route towards ${cleanTo}`,
      durationMinutes: Math.round(distanceKm * 2.6),
      distanceKm: distanceKm,
      co2Grams: Math.round(distanceKm * 25),
      badgeCode: 'B',
      colorVariant: 'amber',
      notes: 'Subsidized state electric bus fleet',
    },
    {
      id: 'seg-chp-3',
      mode: 'walking',
      modeLabel: 'Walk',
      title: 'Walk to Destination',
      detail: `Alight at bus stop and walk to ${cleanTo}`,
      durationMinutes: 4,
      distanceKm: 0.3,
      co2Grams: 0,
      badgeCode: 'W',
      colorVariant: 'amber',
    },
  ];

  const chpTotalDuration = cheapestSegments.reduce((acc, s) => acc + s.durationMinutes, 0);
  const chpCo2Emitted = Number(
    (cheapestSegments.reduce((acc, s) => acc + s.co2Grams, 0) / 1000).toFixed(2)
  );

  const cheapestOption: RouteOption = {
    id: 'opt-cheapest',
    priorityCategory: 'cheapest',
    categoryLabel: 'Cheapest',
    subtitle: 'Maximum savings with public electric transit',
    isRecommended: true,
    durationMinutes: chpTotalDuration,
    durationFormatted: `${chpTotalDuration} min`,
    distanceKm: distanceKm,
    co2EmittedKg: chpCo2Emitted,
    co2SavedKg: Number((carCo2Baseline - chpCo2Emitted).toFixed(2)),
    co2SavingsPercent: Math.round(((carCo2Baseline - chpCo2Emitted) / carCo2Baseline) * 100),
    estimatedCostInr: 15,
    transfersCount: 0,
    primaryModes: ['walking', 'bus'],
    segments: cheapestSegments,
    highlights: [
      'Most affordable fare at only ₹15',
      'Direct route with zero transfers',
      'Zero emissions electric transit fleet',
    ],
  };

  const convenientSegments: TransitSegment[] = [
    {
      id: 'seg-conv-1',
      mode: 'ev_auto',
      modeLabel: 'Shared Electric Auto / E-Rickshaw',
      title: 'Shared E-Auto Feeder',
      detail: `Pickup outside ${cleanFrom} to metro entrance`,
      durationMinutes: 7,
      distanceKm: 2.0,
      co2Grams: 70,
      badgeCode: 'E',
      colorVariant: 'purple',
    },
    {
      id: 'seg-conv-2',
      mode: 'metro',
      modeLabel: metroLineName,
      title: ecoTransitTitle,
      detail: `Direct metro ride towards destination station for ${cleanTo}`,
      durationMinutes: Math.round((distanceKm * 0.8) / 0.55),
      distanceKm: Number((distanceKm * 0.85).toFixed(1)),
      co2Grams: Math.round(distanceKm * 0.85 * 20),
      badgeCode: 'M',
      colorVariant: 'purple',
    },
  ];

  const convTotalDuration = convenientSegments.reduce((acc, s) => acc + s.durationMinutes, 0);
  const convCo2Emitted = Number(
    (convenientSegments.reduce((acc, s) => acc + s.co2Grams, 0) / 1000).toFixed(2)
  );

  const convenientOption: RouteOption = {
    id: 'opt-conv',
    priorityCategory: 'convenient',
    categoryLabel: 'Convenient',
    subtitle: 'Doorstep pickup with minimal walking',
    isRecommended: false,
    durationMinutes: convTotalDuration,
    durationFormatted: `${convTotalDuration} min`,
    distanceKm: distanceKm,
    co2EmittedKg: convCo2Emitted,
    co2SavedKg: Number((carCo2Baseline - convCo2Emitted).toFixed(2)),
    co2SavingsPercent: Math.round(((carCo2Baseline - convCo2Emitted) / carCo2Baseline) * 100),
    estimatedCostInr: 45,
    transfersCount: 1,
    primaryModes: ['ev_auto', 'metro'],
    segments: convenientSegments,
    highlights: [
      'Door-to-station e-rickshaw avoids walking',
      'Direct, air-conditioned rapid transit',
      'Smooth station concourse access',
    ],
  };

  return {
    from: cleanFrom,
    to: cleanTo,
    resolvedFrom: cleanFrom,
    resolvedTo: cleanTo,
    cityOrRegion: cityName,
    distanceEstimateKm: distanceKm,
    baselineSoloCarCo2Kg: carCo2Baseline,
    baselineSoloCarDurationMinutes: carDuration,
    baselineSoloCarCostInr: carFuelCost,
    routes: [cheapestOption, ecoOption, efficientOption, convenientOption],
    sustainabilityInsight: `Choosing the recommended Cheapest transit route saves money (fare of only ₹${cheapestOption.estimatedCostInr}) and avoids ${cheapestOption.co2SavedKg} kg of CO2 compared to private driving.`,
    timestamp: Date.now(),
  };
}

export async function planSustainableRoute(params: PlanRouteParams): Promise<RoutePlanResult> {
  const { from, to } = params;
  const apiKey = process.env.GEMINI_API_KEY || process.env.CUSTOM_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('[Sustainable Transit Planner] GEMINI_API_KEY not configured or placeholder, using fallback route model');
    const fallback = generateFallbackRoutes(from, to);
    return await enrichWithWeather({
      ...fallback,
      travelDate: params.travelDate,
      passengerCount: params.passengerCount,
      departureTime: params.departureTime,
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const travelMetadataPrompt = params.travelDate || params.passengerCount
      ? `\nTRAVEL CONTEXT:\n- Target Date: ${params.travelDate || 'Today'}\n- Departure Time: ${params.departureTime || 'Immediate'}\n- Passengers: ${params.passengerCount || 1} person(s). Adjust total cost and passenger capacity accordingly.`
      : '';

    const prompt = `You are a real-world Sustainable Transit Planning Specialist with comprehensive knowledge of India's transit infrastructure.
The user wants to travel:
- ORIGIN: "${from}"
- DESTINATION: "${to}"${travelMetadataPrompt}

CRITICAL FACTUAL AND GEOGRAPHICAL RULES:
1. ACCURATE CITY & DISTANCE DETECTION:
   - Identify the exact geographic locations. If ORIGIN and DESTINATION are in two different cities/towns (> 50 km apart, e.g. Delhi to Jaipur, Mumbai to Pune, Bengaluru to Chennai, Agra to Delhi):
     DO NOT hallucinate an intra-city Metro rail! You MUST prescribe Indian Railways (Vande Bharat Express, Shatabdi, Superfast Mail/Express, or EMU Suburban) or state intercity electric/AC express buses (e.g. UPSRTC, KSRTC, MSRTC Shivneri).
   - If they are in the same urban agglomeration (e.g. Delhi NCR, Mumbai MMR, Bengaluru, Hyderabad, Kolkata, Chennai, Pune, Ahmedabad, Kochi, Lucknow, Jaipur, etc.), use the ACTUAL operational transit networks of that city.

2. FACTUAL TRANSIT OPERATORS, LINES & INTERCHANGES (AVOID MISTAKES & HALLUCINATIONS):
   - FOR KOCHI (Kerala):
     * KSRTC-SWIFT MISTAKE BAN: "KSRTC-SWIFT" (or SWIFT) is strictly Kerala's long-distance, inter-district and interstate highway bypass coach network. It NEVER operates local urban intra-city routes within Kochi (such as LuLu Mall to Infopark Kakkanad, or Edappally to Fort Kochi). You MUST NEVER prescribe KSRTC-SWIFT for local city commutes within Kochi!
     * For intra-city bus transit within Kochi, prescribe: "Kochi Private City Bus" (via Seaport-Airport Road / Edappally Toll), "KSRTC Ordinary / City Circular", or "Kochi Metro Feeder Electric Bus".
     * KOCHI METRO ACCURACY: Kochi Metro Line 1 (Blue Line from Aluva to Thripunithura via Kalamassery, Edappally / LuLu Mall, Palarivattom, JLN Stadium, MG Road, Ernakulam South, Vyttila Hub) is OPERATIONAL.
     * CRITICAL: Kochi Metro Phase 2 (Pink Line to Kakkanad / Infopark) is UNDER CONSTRUCTION and NOT YET OPERATIONAL. DO NOT claim there is an operational metro station directly at Kakkanad or Infopark!
     * To travel from LuLu Mall (Edappally) to Infopark Kakkanad (~11 km):
       - Option 1 (Metro + Feeder): Take Kochi Metro Line 1 from Edappally Station to Palarivattom Station (or JLN Stadium), then take an Electric Feeder Bus / E-Auto / City Bus directly along Seaport-Airport Road to Infopark Kakkanad.
       - Option 2 (Direct City Bus): Direct Kochi City Bus (Private bus / KSRTC Ordinary) from Edappally Toll to Infopark (~25-30 min, ₹15-20).
       - Option 3 (Direct Electric Ride): Shared Electric Auto / EV Cab via Seaport-Airport Road (~20-25 min).
       - Note: Kochi Water Metro runs from Vyttila Mobility Hub to Kakkanad Jetty (Chittethukara near Infopark Phase 2).
   - FOR BENGALURU:
     * City buses are STRICTLY "BMTC" (Bangalore Metropolitan Transport Corporation, e.g. BMTC Electric Vajra / Route 500D). NEVER use Karnataka KSRTC (which is strictly intercity/interstate).
     * Namma Metro: Purple Line & Green Line. Real interchange: Nadaprabhu Kempegowda Station Majestic.
   - FOR MUMBAI MMR:
     * City buses are STRICTLY "BEST" (Brihanmumbai Electric Supply and Transport) in Mumbai, "TMT" in Thane, "NMMT" in Navi Mumbai. NEVER suggest MSRTC (MSRTC Shivneri/ST is for intercity Maharashtra travel).
     * Suburban Railway: Western Line (Churchgate-Virar), Central Line (CSMT-Kalyan), Harbour Line.
   - FOR DELHI NCR:
     * City buses are STRICTLY "DTC" (Delhi Transport Corporation) or DIMTS Cluster electric buses. NEVER suggest UPSRTC or Haryana Roadways for local city transit within Delhi.
     * Metro: Delhi Metro (DMRC) lines, Gurugram Rapid Metro, Noida Aqua Line. Real transfer hubs: Rajiv Chowk, Kashmere Gate, Hauz Khas, Mandi House, Sikanderpur, Botanical Garden.
   - FOR CHENNAI:
     * City buses are STRICTLY "MTC" (Metropolitan Transport Corporation). NEVER suggest SETC (which is long-distance express).
     * Rail: Chennai Metro (CMRL), Chennai Suburban Railway (Southern Railway), MRTS.
   - FOR PUNE:
     * City buses are STRICTLY "PMPML" (Pune Mahanagar Parivahan Mahamandal Ltd). NEVER suggest MSRTC for local Pune trips.
     * Pune Metro: Purple Line & Aqua Line.
   - FOR HYDERABAD:
     * City buses: "TSRTC City Ordinary / Metro Express / Pushpak e-bus".
     * Rail: Hyderabad Metro (Red, Blue, Green lines). Real interchange: Ameerpet.
   - FOR KOLKATA:
     * City transit: WBTC buses, Kolkata Metro (Blue Line, Green Line underwater tunnel between Howrah & Esplanade, Purple Line, Orange Line), and historic electric Trams.
   - FOR AHMEDABAD:
     * AMTS city buses, Janmarg BRTS corridors, Ahmedabad Metro.

3. REALISTIC PHYSICS & TIMINGS:
   - Metro average speed including station dwell times: 32 km/h (~15 km in 28 mins).
   - City bus in traffic: 15-20 km/h.
   - Walking speed: 4.5-5 km/h (500 meters is ~6 mins; do NOT suggest walking more than 1.5 km as a transit transfer).
   - Cycling speed: 12-14 km/h (1.5 km is ~7 mins).
   - Local EMU train: 35-40 km/h.
   - Indian Railways Express: 60-90 km/h.

4. REALISTIC INDIAN PRICING (INR):
   - Metro fare: ₹10 to ₹60.
   - Suburban local train / EMU: ₹5 to ₹20.
   - City electric bus: ₹10 to ₹40.
   - Shared e-auto / e-rickshaw feeder: ₹10 to ₹30.
   - Bicycle share (Yulu / SmartBike / MYBYK): ₹5 to ₹15.
   - Private car driving baseline cost: ~₹11-13 per km for petrol/diesel.

5. EXACTLY FOUR DISTINCT OPTIONS:
   - Option 1: "cheapest" (RECOMMENDED). Most economical public transit (e.g. electric city bus or suburban EMU local train) with lowest fare in INR.
   - Option 2: "eco_friendly". Minimum CO2 emissions. Combines electrified rail (Metro/EMU) with active pedal cycle share or walking.
   - Option 3: "efficient" (label: "Fastest"). Fastest travel time with minimal transfers and clean transit (e.g. Express Rail + EV ridepool/feeder).
   - Option 4: "convenient". Doorstep pickup (shared e-auto/e-rickshaw) to reduce walking effort in urban heat.

Ensure every segment has an accurate, non-fictional title and detail referencing real places, verified lines, and correct local bus operators.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resolvedFrom: { type: Type.STRING },
            resolvedTo: { type: Type.STRING },
            cityOrRegion: { type: Type.STRING },
            distanceEstimateKm: { type: Type.NUMBER },
            baselineSoloCarCo2Kg: { type: Type.NUMBER },
            baselineSoloCarDurationMinutes: { type: Type.NUMBER },
            baselineSoloCarCostInr: { type: Type.NUMBER },
            sustainabilityInsight: { type: Type.STRING },
            routes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  priorityCategory: {
                    type: Type.STRING,
                    description: "Must be one of: 'eco_friendly', 'efficient', 'cheapest', 'convenient'",
                  },
                  categoryLabel: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  isRecommended: { type: Type.BOOLEAN },
                  durationMinutes: { type: Type.NUMBER },
                  durationFormatted: { type: Type.STRING },
                  distanceKm: { type: Type.NUMBER },
                  co2SavedKg: { type: Type.NUMBER },
                  co2EmittedKg: { type: Type.NUMBER },
                  co2SavingsPercent: { type: Type.NUMBER },
                  estimatedCostInr: { type: Type.NUMBER },
                  transfersCount: { type: Type.NUMBER },
                  primaryModes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  highlights: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  segments: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        mode: { type: Type.STRING },
                        modeLabel: { type: Type.STRING },
                        title: { type: Type.STRING },
                        detail: { type: Type.STRING },
                        durationMinutes: { type: Type.NUMBER },
                        distanceKm: { type: Type.NUMBER },
                        co2Grams: { type: Type.NUMBER },
                        badgeCode: {
                          type: Type.STRING,
                          description:
                            "Strictly a 1-character uppercase letter: 'M' for Metro, 'B' for Bus, 'T' for Train, 'W' for Walk, 'C' for Carpool/Cab, 'E' for E-Rickshaw/Auto, 'S' for Smart Cycle. Do NOT use snake_case like cus_ksrtc or rail_train.",
                        },
                        colorVariant: { type: Type.STRING },
                        notes: { type: Type.STRING },
                      },
                      required: [
                        'mode',
                        'modeLabel',
                        'title',
                        'detail',
                        'durationMinutes',
                        'distanceKm',
                        'co2Grams',
                        'badgeCode',
                        'colorVariant',
                      ],
                    },
                  },
                },
                required: [
                  'priorityCategory',
                  'categoryLabel',
                  'subtitle',
                  'isRecommended',
                  'durationMinutes',
                  'durationFormatted',
                  'distanceKm',
                  'co2SavedKg',
                  'co2EmittedKg',
                  'co2SavingsPercent',
                  'estimatedCostInr',
                  'transfersCount',
                  'segments',
                  'highlights',
                ],
              },
            },
          },
          required: [
            'resolvedFrom',
            'resolvedTo',
            'cityOrRegion',
            'distanceEstimateKm',
            'baselineSoloCarCo2Kg',
            'baselineSoloCarDurationMinutes',
            'baselineSoloCarCostInr',
            'routes',
            'sustainabilityInsight',
          ],
        },
      },
    });

    const rawText = response.text?.trim() || '';
    const parsed = JSON.parse(rawText);

    const fullQuery = `${from} ${to} ${parsed.cityOrRegion || ''}`.toLowerCase();
    const isKochi =
      fullQuery.includes('kochi') ||
      fullQuery.includes('cochin') ||
      fullQuery.includes('ernakulam') ||
      fullQuery.includes('edappally') ||
      fullQuery.includes('infopark') ||
      fullQuery.includes('kakkanad');
    const isIntraCity = (Number(parsed.distanceEstimateKm) || 15) <= 35;

    const cleanTransitText = (text: string): string => {
      if (!text) return text;
      let str = text;

      // Clean raw technical snake_case words like cus_ksrtc, rail_train, etc.
      str = str.replace(/\bcus_ksrtc\b/gi, 'KSRTC City Bus');
      str = str.replace(/\bbus_ksrtc\b/gi, 'KSRTC Bus');
      str = str.replace(/\brail_train\b/gi, 'Train');
      str = str.replace(/\btrain_rail\b/gi, 'Train');
      str = str.replace(/\bmetro_rail\b/gi, 'Metro');
      str = str.replace(/\bwalk_foot\b/gi, 'Walk');
      str = str.replace(/\bauto_rickshaw\b/gi, 'Auto Rickshaw');
      str = str.replace(/\bcab_car\b/gi, 'Shared Cab');

      // Kochi SWIFT mistake cleanup: KSRTC SWIFT never operates local city routes
      if (isKochi || isIntraCity) {
        str = str.replace(/KSRTC[- ]?SWIFT/gi, 'Kochi City Bus (Private / KSRTC Ordinary)');
        str = str.replace(/KSRTC Swift Bus/gi, 'Kochi City Bus');
        str = str.replace(/\bSWIFT Bus\b/gi, 'City Bus');
      }

      // Kochi Metro Kakkanad / Infopark under-construction correction
      if (isKochi) {
        str = str.replace(/Edappally to Kakkanad\/Infopark/gi, 'Edappally to Palarivattom (transfer to Feeder to Infopark)');
        str = str.replace(/Metro to Kakkanad\/Infopark/gi, 'Metro to Palarivattom + Feeder to Infopark');
        str = str.replace(/Kochi Metro.*?Infopark terminal/gi, 'Kochi Metro Line 1 to Palarivattom + Feeder to Infopark');
      }

      return str;
    };

    const sanitizeBadgeCode = (
      badge?: string,
      mode?: string,
      title?: string,
      label?: string
    ): string => {
      const combined = `${badge || ''} ${mode || ''} ${title || ''} ${label || ''}`.toLowerCase();
      if (combined.includes('metro')) return 'M';
      if (combined.includes('train') || combined.includes('rail') || combined.includes('emu') || combined.includes('express'))
        return 'T';
      if (
        combined.includes('bus') ||
        combined.includes('ksrtc') ||
        combined.includes('bmtc') ||
        combined.includes('dtc') ||
        combined.includes('best') ||
        combined.includes('cus')
      )
        return 'B';
      if (combined.includes('cycle') || combined.includes('bike') || combined.includes('pedal'))
        return 'S';
      if (combined.includes('rickshaw') || combined.includes('auto') || combined.includes('erick'))
        return 'E';
      if (combined.includes('car') || combined.includes('cab') || combined.includes('pool') || combined.includes('taxi'))
        return 'C';
      if (combined.includes('walk') || combined.includes('foot') || combined.includes('pedestrian'))
        return 'W';

      if (badge && badge.trim().length === 1 && /^[A-Z0-9]$/i.test(badge.trim())) {
        return badge.trim().toUpperCase();
      }
      return 'B';
    };

    // Identify cheapest route index
    const cheapestIdx = (parsed.routes || []).findIndex(
      (r: any) => r.priorityCategory === 'cheapest'
    );

    // Sanitize and format the response
    const routes: RouteOption[] = (parsed.routes || []).map((r: any, idx: number) => {
      const isCheapest = r.priorityCategory === 'cheapest' || (cheapestIdx === -1 && idx === 0);
      return {
        id: `opt-${r.priorityCategory || idx}-${Date.now()}`,
        priorityCategory: r.priorityCategory || (idx === 0 ? 'cheapest' : 'eco_friendly'),
        categoryLabel: cleanTransitText(
          r.categoryLabel?.toLowerCase() === 'efficient'
            ? 'Fastest'
            : r.categoryLabel ||
              (isCheapest
                ? 'Cheapest'
                : r.priorityCategory === 'eco_friendly'
                ? 'Eco-Friendly'
                : r.priorityCategory === 'efficient'
                ? 'Fastest'
                : r.priorityCategory === 'convenient'
                ? 'Convenient'
                : 'Alternative Route')
        ),
        subtitle: cleanTransitText(r.subtitle || 'Optimized multimodal transit route'),
        isRecommended: isCheapest, // First preference strictly to cheapest
        durationMinutes: Number(r.durationMinutes) || 30,
        durationFormatted: r.durationFormatted || `${r.durationMinutes || 30} min`,
        distanceKm: Number(r.distanceKm) || parsed.distanceEstimateKm || 12,
        co2SavedKg: Number(r.co2SavedKg) || 1.8,
        co2EmittedKg: Number(r.co2EmittedKg) || 0.3,
        co2SavingsPercent: Number(r.co2SavingsPercent) || 85,
        estimatedCostInr: Number(r.estimatedCostInr) || 20,
        transfersCount: Number(r.transfersCount) || 1,
        primaryModes: (r.primaryModes as TransportMode[]) || ['bus', 'metro'],
        highlights: Array.isArray(r.highlights)
          ? r.highlights.map((h: string) => cleanTransitText(h))
          : ['Most economical fare', 'Low emissions shared transit'],
        segments: (r.segments || []).map((s: any, segIdx: number) => ({
          id: `seg-${segIdx}-${Date.now()}`,
          mode: (s.mode as TransportMode) || 'bus',
          modeLabel: cleanTransitText(s.modeLabel || 'Transit'),
          title: cleanTransitText(s.title || 'Transit Segment'),
          detail: cleanTransitText(s.detail || ''),
          durationMinutes: Number(s.durationMinutes) || 10,
          distanceKm: Number(s.distanceKm) || 2,
          co2Grams: Number(s.co2Grams) || 0,
          badgeCode: sanitizeBadgeCode(s.badgeCode, s.mode, s.title, s.modeLabel),
          colorVariant: s.colorVariant || 'amber',
          notes: s.notes ? cleanTransitText(s.notes) : undefined,
        })),
      };
    });

    // Make sure cheapest option is always at index 0 (first preference / recommended)
    routes.sort((a, b) => {
      if (a.priorityCategory === 'cheapest' || a.isRecommended) return -1;
      if (b.priorityCategory === 'cheapest' || b.isRecommended) return 1;
      return 0;
    });

    // Ensure exactly the first route is marked as recommended
    if (routes.length > 0) {
      routes[0].isRecommended = true;
      for (let i = 1; i < routes.length; i++) {
        routes[i].isRecommended = false;
      }
    }

    return await enrichWithWeather({
      from,
      to,
      resolvedFrom: parsed.resolvedFrom || from,
      resolvedTo: parsed.resolvedTo || to,
      cityOrRegion: parsed.cityOrRegion || 'India Transit Region',
      distanceEstimateKm: Number(parsed.distanceEstimateKm) || 12,
      baselineSoloCarCo2Kg: Number(parsed.baselineSoloCarCo2Kg) || 2.4,
      baselineSoloCarDurationMinutes: Number(parsed.baselineSoloCarDurationMinutes) || 45,
      baselineSoloCarCostInr: Number(parsed.baselineSoloCarCostInr) || 150,
      routes: routes.length > 0 ? routes : generateFallbackRoutes(from, to).routes,
      sustainabilityInsight:
        parsed.sustainabilityInsight ||
        `The recommended Cheapest transit route maximizes commuter budget savings while substantially reducing carbon footprint compared to solo driving.`,
      timestamp: Date.now(),
      travelDate: params.travelDate,
      passengerCount: params.passengerCount,
      departureTime: params.departureTime,
    });
  } catch (err) {
    console.error('[Sustainable Transit Planner] Gemini API call failed:', err);
    const fallback = generateFallbackRoutes(from, to);
    return await enrichWithWeather({
      ...fallback,
      travelDate: params.travelDate,
      passengerCount: params.passengerCount,
      departureTime: params.departureTime,
    });
  }
}

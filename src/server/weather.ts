import type { WeatherCondition } from '../types.ts';
import {
  fetchCurrentWeatherFromOpenMeteo,
  getWeatherConditionFromCode,
} from '../services/weatherService.ts';

// Comprehensive Indian landmark, transit hub, and neighborhood centroid database
// Ensures pinpoint accuracy for all prominent Indian multimodal transit locations
const KNOWN_INDIAN_LOCATIONS: Record<string, { lat: number; lon: number; name: string }> = {
  // Delhi NCR
  'delhi': { lat: 28.6139, lon: 77.209, name: 'Delhi NCR' },
  'new delhi': { lat: 28.6139, lon: 77.209, name: 'New Delhi' },
  'hauz khas': { lat: 28.5494, lon: 77.2001, name: 'Hauz Khas, South Delhi' },
  'connaught place': { lat: 28.6328, lon: 77.2197, name: 'Connaught Place (Rajiv Chowk), New Delhi' },
  'rajiv chowk': { lat: 28.6328, lon: 77.2197, name: 'Connaught Place (Rajiv Chowk), New Delhi' },
  'new delhi railway station': { lat: 28.6427, lon: 77.2205, name: 'New Delhi Railway Station (NDLS)' },
  'ndls': { lat: 28.6427, lon: 77.2205, name: 'New Delhi Railway Station (NDLS)' },
  'delhi airport': { lat: 28.5562, lon: 77.1000, name: 'Indira Gandhi International Airport (DEL)' },
  'igi airport': { lat: 28.5562, lon: 77.1000, name: 'Indira Gandhi International Airport (DEL)' },
  'cyber hub': { lat: 28.4952, lon: 77.0890, name: 'Cyber Hub, Gurugram' },
  'cyber city': { lat: 28.4952, lon: 77.0890, name: 'Cyber City, Gurugram' },
  'gurugram': { lat: 28.4595, lon: 77.0266, name: 'Gurugram, Haryana' },
  'gurgaon': { lat: 28.4595, lon: 77.0266, name: 'Gurugram, Haryana' },
  'noida sector 62': { lat: 28.6256, lon: 77.3653, name: 'Sector 62, Noida' },
  'noida sector 18': { lat: 28.5708, lon: 77.3261, name: 'Sector 18 (Atta Market), Noida' },
  'noida': { lat: 28.5355, lon: 77.391, name: 'Noida, Uttar Pradesh' },
  'india gate': { lat: 28.6129, lon: 77.2295, name: 'India Gate, New Delhi' },
  'chandni chowk': { lat: 28.6560, lon: 77.2307, name: 'Chandni Chowk, Old Delhi' },
  'saket': { lat: 28.5284, lon: 77.2185, name: 'Saket, South Delhi' },
  'anand vihar': { lat: 28.6468, lon: 77.3156, name: 'Anand Vihar ISBT & Terminal, Delhi' },
  'dwarka': { lat: 28.5921, lon: 77.0460, name: 'Dwarka, South West Delhi' },
  'kashmere gate': { lat: 28.6675, lon: 77.2285, name: 'Kashmere Gate ISBT, Delhi' },
  'nehru place': { lat: 28.5491, lon: 77.2528, name: 'Nehru Place, South Delhi' },
  'karol bagh': { lat: 28.6514, lon: 77.1907, name: 'Karol Bagh, Central Delhi' },

  // Mumbai & MMR
  'mumbai': { lat: 19.076, lon: 72.8777, name: 'Mumbai, Maharashtra' },
  'marine drive': { lat: 18.9432, lon: 72.8230, name: 'Marine Drive & Nariman Point, Mumbai' },
  'nariman point': { lat: 18.9265, lon: 72.8228, name: 'Nariman Point, South Mumbai' },
  'churchgate': { lat: 18.9322, lon: 72.8264, name: 'Churchgate, South Mumbai' },
  'csmt': { lat: 18.9398, lon: 72.8355, name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)' },
  'cst': { lat: 18.9398, lon: 72.8355, name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)' },
  'bandra': { lat: 19.0596, lon: 72.8295, name: 'Bandra West, Mumbai' },
  'bandra west': { lat: 19.0596, lon: 72.8295, name: 'Bandra West, Mumbai' },
  'bandra kurla complex': { lat: 19.0662, lon: 72.8688, name: 'Bandra Kurla Complex (BKC), Mumbai' },
  'bkc': { lat: 19.0662, lon: 72.8688, name: 'Bandra Kurla Complex (BKC), Mumbai' },
  'dadar': { lat: 19.0178, lon: 72.8478, name: 'Dadar Central & Western Interchange, Mumbai' },
  'andheri': { lat: 19.1197, lon: 72.8464, name: 'Andheri Metro & Station, Mumbai' },
  'mumbai airport': { lat: 19.0896, lon: 72.8656, name: 'Chhatrapati Shivaji Maharaj Airport (BOM)' },
  'bom airport': { lat: 19.0896, lon: 72.8656, name: 'Chhatrapati Shivaji Maharaj Airport (BOM)' },
  'powai': { lat: 19.1245, lon: 72.9051, name: 'Powai (Hiranandani & IIT Bombay), Mumbai' },
  'colaba': { lat: 18.9220, lon: 72.8347, name: 'Colaba & Gateway of India, Mumbai' },
  'gateway of india': { lat: 18.9220, lon: 72.8347, name: 'Gateway of India, Colaba, Mumbai' },
  'lower parel': { lat: 18.9953, lon: 72.8302, name: 'Lower Parel Financial District, Mumbai' },
  'juhu': { lat: 19.0988, lon: 72.8264, name: 'Juhu Beach & Vile Parle, Mumbai' },
  'thane': { lat: 19.2183, lon: 72.9781, name: 'Thane, MMR' },
  'navi mumbai': { lat: 19.0330, lon: 73.0297, name: 'Navi Mumbai, Maharashtra' },
  'vashi': { lat: 19.0771, lon: 72.9986, name: 'Vashi, Navi Mumbai' },
  'borivali': { lat: 19.2288, lon: 72.8541, name: 'Borivali, Western Mumbai' },
  'ghatkopar': { lat: 19.0856, lon: 72.9082, name: 'Ghatkopar Metro Interchange, Mumbai' },

  // Bengaluru
  'bengaluru': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru, Karnataka' },
  'bangalore': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru, Karnataka' },
  'majestic': { lat: 12.9779, lon: 77.5724, name: 'Majestic (Kempegowda Interchange), Bengaluru' },
  'koramangala': { lat: 12.9352, lon: 77.6245, name: 'Koramangala, Bengaluru' },
  'indiranagar': { lat: 12.9784, lon: 77.6408, name: 'Indiranagar 100ft Road, Bengaluru' },
  'whitefield': { lat: 12.9698, lon: 77.7500, name: 'Whitefield (ITPL), Bengaluru' },
  'electronic city': { lat: 12.8452, lon: 77.6602, name: 'Electronic City, Bengaluru' },
  'mg road': { lat: 12.9756, lon: 77.6097, name: 'MG Road & Church Street, Bengaluru' },
  'church street': { lat: 12.9756, lon: 77.6097, name: 'Church Street, Bengaluru' },
  'bengaluru airport': { lat: 13.1986, lon: 77.7066, name: 'Kempegowda International Airport (BLR)' },
  'blr airport': { lat: 13.1986, lon: 77.7066, name: 'Kempegowda International Airport (BLR)' },
  'hsr layout': { lat: 12.9121, lon: 77.6446, name: 'HSR Layout, Bengaluru' },
  'bellandur': { lat: 12.9304, lon: 77.6784, name: 'Bellandur & ORR IT Corridor, Bengaluru' },
  'jayanagar': { lat: 12.9308, lon: 77.5838, name: 'Jayanagar, South Bengaluru' },
  'malleshwaram': { lat: 13.0031, lon: 77.5702, name: 'Malleshwaram, Bengaluru' },
  'hebbal': { lat: 13.0358, lon: 77.5970, name: 'Hebbal Flyover & Outer Ring Road, Bengaluru' },

  // Kochi & Kerala
  'kochi': { lat: 9.9312, lon: 76.2673, name: 'Kochi, Kerala' },
  'cochin': { lat: 9.9312, lon: 76.2673, name: 'Kochi, Kerala' },
  'ernakulam': { lat: 9.9816, lon: 76.2999, name: 'Ernakulam, Kochi' },
  'fort kochi': { lat: 9.9658, lon: 76.2421, name: 'Fort Kochi Heritage Zone, Kochi' },
  'ernakulam south': { lat: 9.9688, lon: 76.2892, name: 'Ernakulam South (Junction) Station, Kochi' },
  'ernakulam north': { lat: 9.9922, lon: 76.2885, name: 'Ernakulam North (Town) Station, Kochi' },
  'marine drive kochi': { lat: 9.9806, lon: 76.2758, name: 'Marine Drive & Rainbow Bridge, Kochi' },
  'edappally': { lat: 10.0261, lon: 76.3086, name: 'Edappally Metro Hub (Lulu), Kochi' },
  'kakkanad': { lat: 10.0159, lon: 76.3634, name: 'Kakkanad & Infopark IT Hub, Kochi' },
  'infopark': { lat: 10.0159, lon: 76.3634, name: 'Infopark Kakkanad, Kochi' },
  'vyttila': { lat: 9.9682, lon: 76.3214, name: 'Vyttila Integrated Mobility Hub, Kochi' },
  'aluva': { lat: 10.1076, lon: 76.3534, name: 'Aluva Metro Terminal & Riverbank, Kochi' },
  'cochin airport': { lat: 10.1518, lon: 76.4019, name: 'Cochin International Airport (COK)' },
  'cok airport': { lat: 10.1518, lon: 76.4019, name: 'Cochin International Airport (COK)' },
  'thiruvananthapuram': { lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram, Kerala' },
  'trivandrum': { lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram, Kerala' },
  'kozhikode': { lat: 11.2588, lon: 75.7804, name: 'Kozhikode (Calicut), Kerala' },

  // Hyderabad
  'hyderabad': { lat: 17.385, lon: 78.4867, name: 'Hyderabad, Telangana' },
  'hitec city': { lat: 17.4474, lon: 78.3762, name: 'Hitec City & Cyber Towers, Hyderabad' },
  'gachibowli': { lat: 17.4401, lon: 78.3489, name: 'Gachibowli Stadium & IT Corridor, Hyderabad' },
  'secunderabad': { lat: 17.4399, lon: 78.4983, name: 'Secunderabad Junction, Hyderabad' },
  'charminar': { lat: 17.3616, lon: 78.4747, name: 'Charminar & Old City, Hyderabad' },
  'banjara hills': { lat: 17.4156, lon: 78.4350, name: 'Banjara Hills, Hyderabad' },
  'jubilee hills': { lat: 17.4319, lon: 78.4073, name: 'Jubilee Hills, Hyderabad' },
  'hyderabad airport': { lat: 17.2403, lon: 78.4294, name: 'Rajiv Gandhi International Airport (HYD)' },

  // Chennai
  'chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai, Tamil Nadu' },
  'chennai central': { lat: 13.0823, lon: 80.2755, name: 'Puratchi Thalaivar Dr. MGR Central (MAS), Chennai' },
  'chennai egmore': { lat: 13.0792, lon: 80.2612, name: 'Chennai Egmore Station, Chennai' },
  't nagar': { lat: 13.0418, lon: 80.2340, name: 'T. Nagar (Thyagaraya Nagar), Chennai' },
  'guindy': { lat: 13.0067, lon: 80.2126, name: 'Guindy Multimodal Hub, Chennai' },
  'omr': { lat: 12.9352, lon: 80.2355, name: 'Old Mahabalipuram Road (OMR IT Expressway), Chennai' },
  'chennai airport': { lat: 12.9941, lon: 80.1709, name: 'Chennai International Airport (MAA)' },
  'marina beach': { lat: 13.0544, lon: 80.2825, name: 'Marina Beach & Santhome, Chennai' },
  'coimbatore': { lat: 11.0168, lon: 76.9558, name: 'Coimbatore, Tamil Nadu' },

  // Kolkata
  'kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata, West Bengal' },
  'howrah': { lat: 22.5857, lon: 88.3426, name: 'Howrah Junction & Underwater Metro, Kolkata' },
  'sealdah': { lat: 22.5675, lon: 88.3712, name: 'Sealdah Station & Metro Hub, Kolkata' },
  'park street': { lat: 22.5535, lon: 88.3518, name: 'Park Street & Chowringhee, Kolkata' },
  'salt lake sector v': { lat: 22.5760, lon: 88.4344, name: 'Salt Lake Sector V IT Hub, Kolkata' },
  'salt lake': { lat: 22.5855, lon: 88.4126, name: 'Salt Lake (Bidhannagar), Kolkata' },
  'kolkata airport': { lat: 22.6547, lon: 88.4467, name: 'Netaji Subhash Chandra Bose Airport (CCU)' },

  // Pune
  'pune': { lat: 18.5204, lon: 73.8567, name: 'Pune, Maharashtra' },
  'pune junction': { lat: 18.5284, lon: 73.8744, name: 'Pune Junction Railway Station' },
  'shivajinagar': { lat: 18.5314, lon: 73.8526, name: 'Shivajinagar Metro & Station, Pune' },
  'hinjewadi': { lat: 18.5913, lon: 73.7389, name: 'Hinjewadi Rajiv Gandhi Infotech Park, Pune' },
  'koregaon park': { lat: 18.5362, lon: 73.8938, name: 'Koregaon Park, Pune' },
  'pune airport': { lat: 18.5822, lon: 73.9197, name: 'Pune International Airport (PNQ)' },

  // Additional NCR & UP Cities
  'faridabad': { lat: 28.4089, lon: 77.3178, name: 'Faridabad, Haryana' },
  'ghaziabad': { lat: 28.6692, lon: 77.4538, name: 'Ghaziabad, Uttar Pradesh' },

  // Other Major Cities Across India
  'ahmedabad': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad, Gujarat' },
  'jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur, Rajasthan' },
  'chandigarh': { lat: 30.7333, lon: 76.7794, name: 'Chandigarh' },
  'lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow, Uttar Pradesh' },
  'kanpur': { lat: 26.4499, lon: 80.3319, name: 'Kanpur, Uttar Pradesh' },
  'nagpur': { lat: 21.1458, lon: 79.0882, name: 'Nagpur, Maharashtra' },
  'varanasi': { lat: 25.3176, lon: 82.9739, name: 'Varanasi, Uttar Pradesh' },
  'goa': { lat: 15.2993, lon: 74.1240, name: 'Goa' },
  'panaji': { lat: 15.4909, lon: 73.8278, name: 'Panaji, Goa' },
  'mysuru': { lat: 12.2958, lon: 76.6394, name: 'Mysuru, Karnataka' },
  'mysore': { lat: 12.2958, lon: 76.6394, name: 'Mysuru, Karnataka' },
  'guwahati': { lat: 26.1445, lon: 91.7362, name: 'Guwahati, Assam' },
  'indore': { lat: 22.7196, lon: 75.8577, name: 'Indore, Madhya Pradesh' },
  'bhopal': { lat: 23.2599, lon: 77.4126, name: 'Bhopal, Madhya Pradesh' },
  'bhubaneswar': { lat: 20.2961, lon: 85.8245, name: 'Bhubaneswar, Odisha' },
  'patna': { lat: 25.5941, lon: 85.1376, name: 'Patna, Bihar' },
  'surat': { lat: 21.1702, lon: 72.8311, name: 'Surat, Gujarat' },
  'vadodara': { lat: 22.3072, lon: 73.1812, name: 'Vadodara, Gujarat' },
  'visakhapatnam': { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam, Andhra Pradesh' },
  'vizag': { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam, Andhra Pradesh' },
  'agra': { lat: 27.1767, lon: 78.0081, name: 'Agra, Uttar Pradesh' },
  'amritsar': { lat: 31.6340, lon: 74.8723, name: 'Amritsar, Punjab' },
  'ludhiana': { lat: 30.9010, lon: 75.8573, name: 'Ludhiana, Punjab' },
  'nashik': { lat: 19.9975, lon: 73.7898, name: 'Nashik, Maharashtra' },
  'rajkot': { lat: 22.3039, lon: 70.8022, name: 'Rajkot, Gujarat' },
  'prayagraj': { lat: 25.4358, lon: 81.8463, name: 'Prayagraj (Allahabad), Uttar Pradesh' },
  'allahabad': { lat: 25.4358, lon: 81.8463, name: 'Prayagraj (Allahabad), Uttar Pradesh' },
  'ranchi': { lat: 23.3441, lon: 85.3096, name: 'Ranchi, Jharkhand' },
  'jodhpur': { lat: 26.2389, lon: 73.0243, name: 'Jodhpur, Rajasthan' },
  'madurai': { lat: 9.9252, lon: 78.1198, name: 'Madurai, Tamil Nadu' },
  'raipur': { lat: 21.2514, lon: 81.6296, name: 'Raipur, Chhattisgarh' },
  'kota': { lat: 25.2138, lon: 75.8648, name: 'Kota, Rajasthan' },
  'dehradun': { lat: 30.3165, lon: 78.0322, name: 'Dehradun, Uttarakhand' },
  'shimla': { lat: 31.1048, lon: 77.1734, name: 'Shimla, Himachal Pradesh' },
  'mangaluru': { lat: 12.9141, lon: 74.8560, name: 'Mangaluru, Karnataka' },
  'mangalore': { lat: 12.9141, lon: 74.8560, name: 'Mangaluru, Karnataka' },
  'srinagar': { lat: 34.0837, lon: 74.7973, name: 'Srinagar, Jammu and Kashmir' },
  'vijayawada': { lat: 16.5062, lon: 80.6480, name: 'Vijayawada, Andhra Pradesh' },
  'thrissur': { lat: 10.5276, lon: 76.2144, name: 'Thrissur, Kerala' },
};

// Known Indian cities for context matching
const INDIAN_CITY_CONTEXTS: { key: string; lat: number; lon: number; name: string }[] = [
  { key: 'delhi', lat: 28.6139, lon: 77.209, name: 'Delhi NCR' },
  { key: 'mumbai', lat: 19.076, lon: 72.8777, name: 'Mumbai' },
  { key: 'bengaluru', lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
  { key: 'bangalore', lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
  { key: 'kochi', lat: 9.9312, lon: 76.2673, name: 'Kochi' },
  { key: 'ernakulam', lat: 9.9816, lon: 76.2999, name: 'Ernakulam, Kochi' },
  { key: 'chennai', lat: 13.0827, lon: 80.2707, name: 'Chennai' },
  { key: 'hyderabad', lat: 17.385, lon: 78.4867, name: 'Hyderabad' },
  { key: 'kolkata', lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
  { key: 'pune', lat: 18.5204, lon: 73.8567, name: 'Pune' },
  { key: 'gurugram', lat: 28.4595, lon: 77.0266, name: 'Gurugram' },
  { key: 'noida', lat: 28.5355, lon: 77.391, name: 'Noida' },
  { key: 'ahmedabad', lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
  { key: 'jaipur', lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
  { key: 'chandigarh', lat: 30.7333, lon: 76.7794, name: 'Chandigarh' },
  { key: 'lucknow', lat: 26.8467, lon: 80.9462, name: 'Lucknow' },
  { key: 'varanasi', lat: 25.3176, lon: 82.9739, name: 'Varanasi' },
  { key: 'goa', lat: 15.2993, lon: 74.124, name: 'Goa' },
  { key: 'coimbatore', lat: 11.0168, lon: 76.9558, name: 'Coimbatore' },
  { key: 'mysuru', lat: 12.2958, lon: 76.6394, name: 'Mysuru' },
  { key: 'thiruvananthapuram', lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram' },
  { key: 'indore', lat: 22.7196, lon: 75.8577, name: 'Indore' },
  { key: 'bhopal', lat: 23.2599, lon: 77.4126, name: 'Bhopal' },
  { key: 'guwahati', lat: 26.1445, lon: 91.7362, name: 'Guwahati' },
  { key: 'surat', lat: 21.1702, lon: 72.8311, name: 'Surat' },
  { key: 'visakhapatnam', lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam' },
];

// In-memory weather cache (TTL: 8 minutes)
interface CacheEntry {
  data: WeatherCondition;
  expiresAt: number;
}
const weatherCache = new Map<string, CacheEntry>();

// In-memory geocode cache
const geocodeCache = new Map<string, { lat: number; lon: number; resolvedName: string }>();

/**
 * Clean user search input down to searchable terms
 */
function cleanSearchQuery(query: string): string[] {
  // Remove brackets, metro line notes, bullet points, postal codes
  const stripped = query
    .replace(/\(.*?\)/g, '')
    .replace(/•.*$/g, '')
    .replace(/\b\d{6}\b/g, '')
    .replace(/terminal\s+\d+/gi, '')
    .replace(/,\s*india$/gi, '')
    .trim();

  const candidates: string[] = [];
  if (stripped) candidates.push(stripped);

  // If contains commas (e.g. "Sector 17, Chandigarh" or "Hauz Khas Metro Station, South Delhi, Delhi")
  if (stripped.includes(',')) {
    const parts = stripped.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts[0]) {
      candidates.push(parts[0]);
      // Remove common transit suffixes for better geocoding recognition
      const simplified = parts[0]
        .replace(/\b(metro station|station|junction|bus terminal|isbt|railway station|railway|airport|terminal)\b/gi, '')
        .trim();
      if (simplified && simplified.length >= 3 && simplified !== parts[0]) {
        candidates.push(simplified);
      }
    }
    // Also include the city/district part (e.g. "Chandigarh", "Noida", "Kolkata")
    if (parts.length > 1) {
      const cityPart = parts[parts.length - 1];
      if (cityPart && cityPart.length >= 3) {
        candidates.push(cityPart);
      }
      candidates.push(`${parts[0]} ${cityPart}`);
    }
  }

  // Also check if any known city name is mentioned in the query
  for (const city of INDIAN_CITY_CONTEXTS) {
    const regex = new RegExp(`\\b${city.key}\\b`, 'i');
    if (regex.test(stripped) && !candidates.includes(city.name)) {
      candidates.push(city.name);
    }
  }

  return Array.from(new Set(candidates));
}

/**
 * Resolve location name to accurate coordinates
 */
export async function geocodeLocation(
  locationQuery: string
): Promise<{ lat: number; lon: number; resolvedName: string } | null> {
  const clean = locationQuery.trim();
  if (!clean) return null;

  const cacheKey = clean.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  const normalized = clean.toLowerCase();

  // 1. Direct exact match in our high-accuracy landmark database
  if (KNOWN_INDIAN_LOCATIONS[normalized]) {
    const loc = KNOWN_INDIAN_LOCATIONS[normalized];
    const result = { lat: loc.lat, lon: loc.lon, resolvedName: loc.name };
    geocodeCache.set(cacheKey, result);
    return result;
  }

  // 2. Word-boundary match in known landmarks (sorted by length descending for precision)
  const sortedLandmarks = Object.keys(KNOWN_INDIAN_LOCATIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedLandmarks) {
    if (key.length >= 4) {
      const escaped = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (wordRegex.test(normalized)) {
        const loc = KNOWN_INDIAN_LOCATIONS[key];
        const result = { lat: loc.lat, lon: loc.lon, resolvedName: loc.name };
        geocodeCache.set(cacheKey, result);
        return result;
      }
    }
  }

  // Detect if query mentions a known Indian city to use as context
  let cityContext = INDIAN_CITY_CONTEXTS.find((c) => {
    const regex = new RegExp(`\\b${c.key}\\b`, 'i');
    return regex.test(normalized);
  });

  // 3. Perform Geocoding search using Open-Meteo Geocoding API
  const queriesToTry = cleanSearchQuery(clean);
  for (const q of queriesToTry) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q
      )}&count=10&language=en&format=json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'UniGo-Transit-App' } });
      if (!res.ok) continue;

      const data: any = await res.json();
      if (Array.isArray(data?.results) && data.results.length > 0) {
        // Filter for India results first
        const indianResults = data.results.filter(
          (r: any) => r.country_code === 'IN' || r.country?.toLowerCase() === 'india'
        );

        if (indianResults.length > 0) {
          // If a city context was detected (e.g. Mumbai, Delhi), prioritize match in that city/district
          let bestMatch = indianResults[0];
          if (cityContext) {
            const contextMatch = indianResults.find((r: any) => {
              const fullText = `${r.name} ${r.admin1 || ''} ${r.admin2 || ''} ${r.admin3 || ''}`.toLowerCase();
              return fullText.includes(cityContext!.key);
            });
            if (contextMatch) bestMatch = contextMatch;
          }

          const resolvedName = [bestMatch.name, bestMatch.admin1, bestMatch.country]
            .filter(Boolean)
            .join(', ');

          const result = {
            lat: Number(bestMatch.latitude),
            lon: Number(bestMatch.longitude),
            resolvedName: resolvedName || bestMatch.name,
          };
          geocodeCache.set(cacheKey, result);
          return result;
        }

        // If no India results, but foreign locations were returned (e.g. intentional search)
        if (data.results.length > 0) {
          const foreignMatch = data.results[0];
          const resolvedName = [foreignMatch.name, foreignMatch.admin1, foreignMatch.country]
            .filter(Boolean)
            .join(', ');

          const result = {
            lat: Number(foreignMatch.latitude),
            lon: Number(foreignMatch.longitude),
            resolvedName: resolvedName || foreignMatch.name,
          };
          geocodeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn(`[Geocoding] Search error for "${q}":`, err);
    }
  }

  // 4. Fallback to matched city context if present
  if (cityContext) {
    const cityResult = {
      lat: cityContext.lat,
      lon: cityContext.lon,
      resolvedName: `${clean} (${cityContext.name})`,
    };
    geocodeCache.set(cacheKey, cityResult);
    return cityResult;
  }

  // Return null if location could not be accurately resolved (prevents wrong location weather)
  return null;
}

/**
 * Fetch current real-time meteorological data for given coordinates
 * Requests ONLY: current=temperature_2m,weather_code and timezone=auto
 */
export async function fetchCurrentWeather(
  lat: number,
  lon: number,
  locationName: string
): Promise<WeatherCondition | null> {
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLon = Math.round(lon * 1000) / 1000;
  const cacheKey = `${roundedLat},${roundedLon}`;

  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return { ...cached.data, locationName };
  }

  try {
    const data = await fetchCurrentWeatherFromOpenMeteo(roundedLat, roundedLon, locationName);

    const condition: WeatherCondition = {
      locationName,
      temperature: data.temperature,
      conditionText: data.conditionText,
      weatherCode: data.weatherCode,
      isDay: data.isDay,
      apparentTemperature: data.apparentTemperature,
      precipitation: data.precipitation,
      humidity: data.humidity,
      windSpeed: data.windSpeed,
      cloudCover: data.cloudCover,
      latitude: roundedLat,
      longitude: roundedLon,
      source: 'Open-Meteo',
      timestamp: Date.now(),
    };

    weatherCache.set(cacheKey, {
      data: condition,
      expiresAt: Date.now() + 8 * 60 * 1000, // 8 minutes cache
    });

    return condition;
  } catch (err) {
    console.error(`Failed to fetch weather for ${locationName}:`, err);
    return null;
  }
}

/**
 * Given a location string, accurately geocode and fetch current live weather
 */
export async function getWeatherForLocation(locationString: string): Promise<WeatherCondition | null> {
  const geo = await geocodeLocation(locationString);
  if (!geo) return null;
  return fetchCurrentWeather(geo.lat, geo.lon, geo.resolvedName || locationString.trim());
}

/**
 * Fetch weather for both origin (source) and destination concurrently
 */
export async function getRouteWeather(
  fromLocation: string,
  toLocation: string
): Promise<{ originWeather?: WeatherCondition; destinationWeather?: WeatherCondition }> {
  const [originResult, destResult] = await Promise.allSettled([
    getWeatherForLocation(fromLocation),
    getWeatherForLocation(toLocation),
  ]);

  return {
    originWeather: originResult.status === 'fulfilled' && originResult.value ? originResult.value : undefined,
    destinationWeather: destResult.status === 'fulfilled' && destResult.value ? destResult.value : undefined,
  };
}

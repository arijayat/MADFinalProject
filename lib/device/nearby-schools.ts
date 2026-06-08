import type { SchoolLocation } from '@/types/firestore';

export type NearbySchool = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
};

const NOMINATIM_HEADERS = { 'User-Agent': 'STEM-Learning-Lab/1.0 (expo-mobile)' };

export async function searchNearbySchools(
  latitude: number,
  longitude: number,
  radiusMeters = 8000,
): Promise<NearbySchool[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="school"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="school"](around:${radiusMeters},${latitude},${longitude});
    );
    out center 30;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error('Could not load nearby schools. Try again or enter your school manually.');
  }

  const payload = (await response.json()) as {
    elements?: {
      id: number;
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: { name?: string; 'addr:street'?: string; 'addr:city'?: string };
    }[];
  };

  const seen = new Set<string>();
  const schools: NearbySchool[] = [];

  for (const element of payload.elements ?? []) {
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    const name = element.tags?.name?.trim();
    if (lat == null || lon == null || !name) continue;

    const key = `${name.toLowerCase()}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const street = element.tags?.['addr:street'];
    const city = element.tags?.['addr:city'];
    const address = [street, city].filter(Boolean).join(', ') || null;

    schools.push({
      id: `${element.type}-${element.id}`,
      name,
      latitude: lat,
      longitude: lon,
      address,
    });
  }

  schools.sort((a, b) => a.name.localeCompare(b.name));
  return schools;
}

export async function geocodeSchoolName(
  name: string,
  nearLat?: number,
  nearLng?: number,
): Promise<SchoolLocation | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    q: trimmed,
    format: 'json',
    limit: '1',
  });
  if (nearLat != null && nearLng != null) {
    params.set('lat', String(nearLat));
    params.set('lon', String(nearLng));
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: NOMINATIM_HEADERS,
  });

  if (!response.ok) return null;

  const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
  const match = results[0];
  if (!match) return null;

  return {
    latitude: Number(match.lat),
    longitude: Number(match.lon),
    label: trimmed,
  };
}

export function nearbySchoolToLocation(school: NearbySchool): SchoolLocation {
  return {
    latitude: school.latitude,
    longitude: school.longitude,
    label: school.address ? `${school.name}, ${school.address}` : school.name,
  };
}

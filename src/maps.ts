import { nearbySearchClient } from './clients';
import type { LatLng } from './types.ts';

type SearchNearbyOptions = LatLng & {
	types: string[];
	radius?: number;
};

async function searchNearby({ lat, lng, types, radius = 500 }: SearchNearbyOptions) {
	const { places } = await nearbySearchClient<{
		places: {
			types: string[];
			rating: number;
			userRatingCount: number;
			displayName: { text: string };
		}[];
	}>('', {
		body: {
			includedTypes: types,
			maxResultCount: 5,
			locationRestriction: {
				circle: {
					center: {
						latitude: lat,
						longitude: lng,
					},
					radius, // in meters
				},
			},
		},
	});
	return places;
}

export async function findPointOfInterests({ lat, lng }: LatLng) {
	const [foodDrink, shops, commute] = await Promise.all([
		searchNearby({
			lat: lat,
			lng: lng,
			types: ['vegan_restaurant', 'restaurant', 'pub', 'bar'],
		}),
		searchNearby({
			lat: lat,
			lng: lng,
			types: ['market', 'grocery_store'],
		}),
		searchNearby({
			lat: lat,
			lng: lng,
			types: ['subway_station', 'bus_stop'],
			radius: 1000,
		}),
	]);
	return { foodDrink, shops, commute };
}

export function getMapsUrl({ lat, lng }: LatLng) {
	return `https://www.google.com/maps/search/?q=${lat},${lng}`;
}

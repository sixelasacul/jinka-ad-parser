import haversineDistance from 'haversine-distance';
import { nearbySearchClient } from './clients';
import type { LatLng } from './types.ts';

type SearchNearbyOptions = LatLng & {
	types: string[];
	radius?: number;
};
type SearchNearbyResponse = {
	places: {
		types: string[];
		rating?: number;
		userRatingCount?: number;
		googleMapsUri: string;
		location: LatLng;
		displayName: { text: string };
	}[];
};

const IGNORED_GENERIC_TYPES = ['establishment', 'point_of_interest', 'locality', 'restaurant', 'food'];
function ignoreGenericTypes(type: string) {
	return !IGNORED_GENERIC_TYPES.includes(type);
}

async function searchNearby({ lat, lng, types, radius = 500 }: SearchNearbyOptions) {
	const { places } = await nearbySearchClient<SearchNearbyResponse>('', {
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
	return places.map((place) => {
		const distance = Math.ceil(haversineDistance({ lat, lng }, place.location));
		return {
			name: place.displayName.text,
			mapsLink: place.googleMapsUri,
			rating: place.rating && `${place.rating} (${place.userRatingCount})`,
			distance: `${distance} m`,
			types: place.types.filter(ignoreGenericTypes).join(', '),
		};
	});
}

function unwrap<T>(promise: PromiseSettledResult<T>, type: string) {
	if (promise.status === 'rejected') {
		return {
			error: `Could not retrieve ${type} point of interests`,
		};
	}
	return promise.value;
}

export async function findPointOfInterests({ lat, lng }: LatLng) {
	const [food, drink, bakery, shop, commute] = await Promise.allSettled([
		searchNearby({
			lat: lat,
			lng: lng,
			types: ['vegetarian_restaurant', 'vegan_restaurant', 'restaurant'],
		}),
		searchNearby({
			lat: lat,
			lng: lng,
			types: ['pub', 'bar', 'cafe'],
		}),
		searchNearby({
			lat: lat,
			lng: lng,
			types: ['bakery'],
		}),
		searchNearby({
			lat: lat,
			lng: lng,
			types: ['supermarket', 'grocery_store'],
		}),
		searchNearby({
			lat: lat,
			lng: lng,
			types: ['subway_station', 'bus_stop'],
			radius: 1000,
		}),
	]);

	return {
		food: unwrap(food, 'food'),
		drink: unwrap(drink, 'drink'),
		bakery: unwrap(bakery, 'bakery'),
		shop: unwrap(shop, 'shop'),
		commute: unwrap(commute, 'commute'),
	};
}

export function getMapsUrl({ lat, lng }: LatLng) {
	return `https://www.google.com/maps/search/?q=${lat},${lng}`;
}

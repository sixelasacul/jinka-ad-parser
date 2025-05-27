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

const IGNORED_GENERIC_TYPES = ['establishment', 'point_of_interest', 'locality', 'restaurant', 'food', 'store'];
function ignoreGenericTypes(type: string) {
	return !IGNORED_GENERIC_TYPES.includes(type);
}
function shortenTypes(type: string) {
	return type.replace(/(_(store|restaurant|station|stop|shop))/gi, '');
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
	// could be moved to view?
	return places.map((place) => {
		const distance = Math.ceil(haversineDistance({ lat, lng }, place.location));
		return {
			name: place.displayName.text,
			mapsLink: place.googleMapsUri,
			rating: place.rating ? `${place.rating} (${place.userRatingCount})` : 'no rating',
			distance: `${distance} m`,
			types: place.types.filter(ignoreGenericTypes).map(shortenTypes).join(', '),
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
	const [food, drink, bakery, shop, commute, skatepark] = await Promise.allSettled([
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
		searchNearby({
			lat: lat,
			lng: lng,
			types: ['skateboard_park'],
			radius: 2000,
		}),
	]);

	return {
		food: unwrap(food, 'food'),
		drink: unwrap(drink, 'drink'),
		bakery: unwrap(bakery, 'bakery'),
		shop: unwrap(shop, 'shop'),
		commute: unwrap(commute, 'commute'),
		skatepark: unwrap(skatepark, 'skatepark'),
	};
}

export type Place = Awaited<ReturnType<typeof searchNearby>>[number];
export type POIs = Awaited<ReturnType<typeof findPointOfInterests>>;

export function getMapsUrl({ lat, lng }: LatLng) {
	return `https://www.google.com/maps/search/?q=${lat},${lng}`;
}

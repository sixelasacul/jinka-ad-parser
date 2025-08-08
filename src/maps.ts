import haversineDistance from 'haversine-distance';
import { nearbySearchClient, routeClient } from './clients';
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
type Step =
	| { travelMode: 'WALK' }
	| {
			travelMode: 'TRANSIT';
			transitDetails: {
				transitLine: { nameShort: string; vehicle: { type: string } };
			};
	  };
type RouteResponse = {
	routes: {
		legs: {
			steps: Step[];
		}[];
		localizedValues: {
			duration: {
				text: string;
			};
		};
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

function getNextMondayAt9() {
	const date = new Date();
	// https://stackoverflow.com/questions/33078406/getting-the-date-of-next-monday
	date.setUTCDate(date.getDate() + ((1 + 7 - date.getDay()) % 7));
	date.setUTCHours(7); // utc + 2
	date.setUTCMinutes(0);
	date.setUTCSeconds(0);
	return date;
}

export async function routeToWork(origin: LatLng) {
	const destination = { lat: +process.env.WORK_LAT, lng: +process.env.WORK_LNG };
	const arrivalTime = getNextMondayAt9();

	const { routes } = await routeClient<RouteResponse>('', {
		body: {
			origin: {
				location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
			},
			destination: {
				location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
			},
			travelMode: 'TRANSIT',
			units: 'METRIC',
			arrivalTime: arrivalTime.toISOString(),
		},
	});

	const travelModes = new Set<string>();

	for (const leg of routes[0].legs) {
		for (const step of leg.steps) {
			if (step.travelMode === 'TRANSIT') {
				const { nameShort, vehicle } = step.transitDetails.transitLine;
				travelModes.add(`${vehicle.type} ${nameShort}`);
			} else {
				travelModes.add(step.travelMode);
			}
		}
	}

	return {
		travelModes: [...travelModes],
		duration: routes[0].localizedValues.duration.text,
		direction: getDirectionUrl(origin, destination),
	};
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

export type Place = Awaited<ReturnType<typeof searchNearby>>[number];
export type POIs = Awaited<ReturnType<typeof findPointOfInterests>>;
export type Route = Awaited<ReturnType<typeof routeToWork>>;

export function getMapsUrl({ lat, lng }: LatLng) {
	return `https://www.google.com/maps/search/?q=${lat},${lng}`;
}

export function getDirectionUrl(origin: LatLng, destination: LatLng) {
	const params = new URLSearchParams({
		origin: `${origin.lat},${origin.lng}`,
		destination: `${destination.lat},${destination.lng}`,
		travelmode: 'transit',
	});
	return `https://www.google.com/maps/dir/?${params}`;
}

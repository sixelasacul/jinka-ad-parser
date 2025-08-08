import OpenAI from 'openai';
import { ofetch } from 'ofetch';
import { inspect } from 'util';

export const openAiClient = new OpenAI({
	apiKey: process.env.OPEN_API_KEY,
});

const ofetchWithError = ofetch.create({
	onResponseError(response) {
		console.error('Error:', response);
		console.error('Details:', inspect(response.response._data, { depth: null }));
	},
});

export const geocodeClient = ofetchWithError.create({
	baseURL: 'https://maps.googleapis.com/maps/api/geocode/json',
	query: {
		key: process.env.GCP_APIS_KEY,
	},
});

export const nearbySearchClient = ofetchWithError.create({
	baseURL: 'https://places.googleapis.com/v1/places:searchNearby',
	method: 'POST',
	headers: {
		'X-Goog-Api-Key': process.env.GCP_APIS_KEY,
		'Content-Type': 'application/json',
		'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.types,places.googleMapsUri,places.location',
	},
});

export const routeClient = ofetchWithError.create({
	baseURL: 'https://routes.googleapis.com/directions/v2:computeRoutes',
	method: 'POST',
	headers: {
		'X-Goog-Api-Key': process.env.GCP_APIS_KEY,
		'Content-Type': 'application/json',
		'X-Goog-FieldMask':
			'routes.localizedValues.duration,routes.legs.steps.travelMode,routes.legs.steps.transitDetails.transitLine.nameShort,routes.legs.steps.transitDetails.transitLine.vehicle.type',
	},
});

export const jinkaClient = ofetch.create({
	baseURL: `https://api.jinka.fr/apiv2/alert/${process.env.JINKA_TOKEN}`,
});
export const jinkaSourceClient = ofetch.create({
	baseURL: `https://api.jinka.fr/alert_result_view_ad`,
	query: {
		alert_token: process.env.JINKA_TOKEN,
	},
});

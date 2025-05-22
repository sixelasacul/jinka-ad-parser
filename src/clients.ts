import OpenAI from 'openai';
import { ofetch } from 'ofetch';

export const openAiClient = new OpenAI({
	apiKey: process.env.OPEN_API_KEY,
});

export const geocodeClient = ofetch.create({
	baseURL: 'https://maps.googleapis.com/maps/api/geocode/json',
	query: {
		key: process.env.GEOCODING_KEY,
	},
});

export const nearbySearchClient = ofetch.create({
	baseURL: 'https://places.googleapis.com/v1/places:searchNearby',
	method: 'POST',
	headers: {
		'X-Goog-Api-Key': process.env.NEARBY_SEARCH_KEY,
		'Content-Type': 'application/json',
		'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.types,places.googleMapsUri,places.location',
	},
	onResponseError(response) {
		console.error('Error:', response);
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

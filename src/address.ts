import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import { geocodeClient, jinkaSourceClient, openAiClient } from './clients';
import type { Ad } from './types';

type GeocodeResponse = {
	results: {
		geometry: {
			location: {
				lat: number;
				lng: number;
			};
		};
	}[];
};

async function searchWithGeocodeApi(address: string) {
	const { results } = await geocodeClient<GeocodeResponse>('', {
		query: { address },
	});
	return results[0]!.geometry.location;
}

const addressSchema = z.object({
	address: z.string().describe('The address of the property'),
	pointOfInterests: z.array(z.string()).describe('The point of interests of the property'),
});

async function getAddressFromResponse(ad: Ad) {
	const response = await openAiClient.responses.create({
		model: 'gpt-4.1-nano',
		instructions:
			'You will be given a JSON response from an rent ad API. Its content is in french. Use this information to extract the address of the property. If it contains point of interets in the description, return them in the pointOfInterests array. If you cannot have a more precise address than a postal code, return an empty string for the address.',
		input: JSON.stringify(ad),
		text: {
			format: zodTextFormat(addressSchema, 'address_schema'),
		},
	});

	return addressSchema.parse(JSON.parse(response.output_text));
}

async function getAddressFromSource(ad: Ad) {
	const sourceAd = await jinkaSourceClient<string>('', {
		query: { ad: ad.id },
	});

	const response = await openAiClient.responses.create({
		model: 'gpt-4.1-nano',
		instructions:
			'You will be given an HTML content from an rent ad website. Its content is in french. Based on the user-readable description of the property, extract the address of the property. You will discard any information regarding the website itself, the person or the company that is offering the property, which can appear in the HTML content. If you cannot have a more precise address than a postal code, return an empty string for the address.',
		input: sourceAd,
		text: {
			format: zodTextFormat(addressSchema, 'address_schema'),
		},
	});

	return addressSchema.parse(JSON.parse(response.output_text));
}

export async function getAdLatLng(ad: Ad) {
	if (ad.lat && ad.lng) {
		return { lat: ad.lat, lng: ad.lng };
	}

	const { address, pointOfInterests } = await getAddressFromResponse(ad);

	if (!!address) {
		return await searchWithGeocodeApi(address);
	}
	if (!!pointOfInterests[0]) {
		return await searchWithGeocodeApi(pointOfInterests[0]);
	}

	const { address: sourceAddress, pointOfInterests: sourcePointOfInterests } = await getAddressFromSource(ad);

	if (!!sourceAddress) {
		return await searchWithGeocodeApi(sourceAddress);
	}
	if (!!sourcePointOfInterests[0]) {
		return await searchWithGeocodeApi(sourcePointOfInterests[0]);
	}

	return null;
}

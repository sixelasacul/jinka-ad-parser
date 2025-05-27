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
		types: string[];
	}[];
};

export async function searchWithGeocodeApi(address: string) {
	const { results } = await geocodeClient<GeocodeResponse>('', {
		query: { address },
	});

	// no result or not precise enough (might happen when GPT returns just the
	// city even though it's asked not to)
	if (results.length === 0 || results[0].types[0] === 'postal_code') {
		return null;
	}

	return results[0].geometry.location;
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
	const { lat, lng, quartier_name, city } = ad;
	if (lat && lng) {
		return { lat, lng };
	}

	const { address, pointOfInterests } = await getAddressFromResponse(ad);

	if (!!address) {
		const position = await searchWithGeocodeApi(address);
		if (position) return position;
	}
	if (pointOfInterests.length > 0) {
		const position = await searchWithGeocodeApi(pointOfInterests[0]);
		if (position) return position;
	}
	if (quartier_name && city) {
		const position = await searchWithGeocodeApi(`${quartier_name}, ${city}`);
		if (position) return position;
	}

	try {
		const { address: sourceAddress, pointOfInterests: sourcePointOfInterests } = await getAddressFromSource(ad);

		if (!!sourceAddress) {
			const position = await searchWithGeocodeApi(sourceAddress);
			if (position) return position;
		}
		if (sourcePointOfInterests.length > 0) {
			const position = await searchWithGeocodeApi(sourcePointOfInterests[0]);
			if (position) return position;
		}
	} catch (e) {
		// getting 403 because of cors when trying to access the source, but not every time
		console.error(e);
		return null;
	}

	return null;
}

import { jinkaClient } from './clients';
import { Ad } from './types';

export async function getJinkaAd(adId: string) {
	try {
		const { ad } = await jinkaClient<{ ad: Ad }>(`/ad/${adId}`);
		return ad;
	} catch (error) {
		return null;
	}
}

export function extractAdIdFromUrl(_url: string) {
	try {
		const url = new URL(_url);
		return url.searchParams.get('ad');
	} catch (error) {
		return null;
	}
}

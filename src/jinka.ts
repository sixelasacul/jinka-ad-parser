import { jinkaClient } from './clients';
import { Ad } from './types';

export async function getJinkaAd(adId: string) {
	const { ad } = await jinkaClient<{ ad: Ad }>(`/ad/${adId}`);
	return ad;
}

export function extractAdIdFromUrl(_url: string) {
	const url = new URL(_url);
	return url.searchParams.get('ad');
}

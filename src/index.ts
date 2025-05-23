import { getAdLatLng } from './address';
import { findPointOfInterests, getMapsUrl } from './maps';
import { extractAdIdFromUrl, getJinkaAd } from './jinka';
import { renderError, renderHtml } from './views/utils';
import { searchView } from './views/search';
import { renderResultView } from './views/result';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const jinkaUrl = new URL(request.url).searchParams.get('jinkaUrl');
		if (!jinkaUrl) {
			return renderHtml(searchView);
		}

		const adId = extractAdIdFromUrl(jinkaUrl);
		if (!adId) {
			return renderError('Could not extract ad ID from URL');
		}

		const ad = await getJinkaAd(adId);
		if (!ad) {
			return renderError('Could not find this Jinka ad');
		}

		const position = await getAdLatLng(ad);
		if (!position) {
			return renderError('Could not get the address');
		}

		const mapsUrl = getMapsUrl(position);
		const pois = await findPointOfInterests(position);

		return renderHtml(renderResultView(mapsUrl, pois));
	},
} satisfies ExportedHandler<Env>;

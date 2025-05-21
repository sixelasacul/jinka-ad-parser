import { getAdLatLng } from './address';
import { findPointOfInterests, getMapsUrl } from './maps';
import { getJinkaAd } from './jinka';

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// note: `ad` is the query param of the jinka url. since the jinka url is
		// passed as path param, not encoded, `ad` can be retrieved directly from
		// the request URL
		// jinkaUrl is passed as a path param so that it can be easily used between
		// jinka and worker
		const adId = new URL(request.url).searchParams.get('ad');
		if (!adId) {
			return new Response('No ad id provided', { status: 400 });
		}

		const ad = await getJinkaAd(adId);
		const position = await getAdLatLng(ad);
		if (!position) {
			throw new Error('Could not get the address');
		}

		const mapsUrl = getMapsUrl(position);
		const pois = await findPointOfInterests(position);

		return new Response(JSON.stringify({ mapsUrl, ...pois }), { headers: { 'Content-Type': 'application/json' } });
	},
} satisfies ExportedHandler<Env>;

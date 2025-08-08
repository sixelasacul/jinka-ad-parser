import { Hono } from 'hono';
import { getAdLatLng, searchWithGeocodeApi } from './address';
import { findPointOfInterests, getMapsUrl, routeToWork } from './maps';
import { extractAdIdFromUrl, getJinkaAd } from './jinka';
import { renderer } from './renderer';
import { Search } from './views/search';
import { Result } from './views/result';
import { Error } from './views/error';

// based on hono's cloudflare-workers template:
// https://github.com/honojs/starter/tree/main/templates/cloudflare-workers
// might move to vite if I want a prettier front-end, but not needed for jsx

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

app.get('/', (c) => {
	return c.render(<Search />);
});

app.get('/jinkaAd', async (c) => {
	const url = new URL(c.req.url);
	const jinkaUrl = url.searchParams.get('q');

	if (!jinkaUrl) {
		return c.redirect('/');
	}

	const adId = extractAdIdFromUrl(jinkaUrl);
	if (!adId) {
		return c.render(<Error error="Could not extract ad ID from URL" />);
	}

	const ad = await getJinkaAd(adId);
	if (!ad) {
		return c.render(<Error error="Could not find this Jinka ad" />);
	}

	const position = await getAdLatLng(ad);
	if (!position) {
		return c.render(<Error error="Could not get the address" />);
	}

	const route = await routeToWork(position);

	const mapsUrl = getMapsUrl(position);
	const pois = await findPointOfInterests(position);

	return c.render(<Result mapsUrl={mapsUrl} pois={pois} route={route} />);
});

app.get('/address', async (c) => {
	const url = new URL(c.req.url);
	const address = url.searchParams.get('q');

	if (!address) {
		return c.redirect('/');
	}

	const position = await searchWithGeocodeApi(address);
	if (!position) {
		return c.render(<Error error="Could not get the address" />);
	}

	const route = await routeToWork(position);

	const mapsUrl = getMapsUrl(position);
	const pois = await findPointOfInterests(position);

	return c.render(<Result mapsUrl={mapsUrl} pois={pois} route={route} />);
});

export default app;

import { Place, POIs } from '../maps';
import { renderBaseView } from './base';

function renderPlaceArtifact({ distance, mapsLink, name, rating, types }: Place) {
	return `
    <div>
      <a href="${mapsLink}" target="_blank"><h3>${name}</h3></a>
      <p>${distance} - ${rating}, ${types}</p>
    </div>
  `;
}

function renderPlaceGroupArtifact(groupName: string, pois: POIs[keyof POIs]) {
	const renderedPlaces = 'error' in pois ? pois.error : pois.map(renderPlaceArtifact).join('');
	return `
    <div>
      <h2>Category: ${groupName}</h2>
      ${renderedPlaces}
    </div>
  `;
}

export function renderResultView(mapsUrl: string, pois: POIs) {
	const renderedPois = Object.entries(pois)
		.map(([groupName, groupPois]) => renderPlaceGroupArtifact(groupName, groupPois))
		.join('');
	return renderBaseView(`
    <a href="${mapsUrl}" target="_blank">${mapsUrl}</a>
		${renderedPois}
  `);
}

import { POIs, Route } from '../maps';

type ResultProps = {
	mapsUrl: string;
	pois: POIs;
	route: Route;
};

export function Result({ mapsUrl, pois, route }: ResultProps) {
	const { direction, duration, travelModes } = route;
	return (
		<>
			<p>
				<span>Location:</span>{' '}
				<a href={mapsUrl} target="_blank">
					{mapsUrl}
				</a>
			</p>
			<p>
				<span>Route to work:</span>{' '}
				<a href={direction} target="_blank">
					{travelModes.join(', ')} ({duration})
				</a>
			</p>
			{Object.entries(pois).map(([groupName, groupPois]) => {
				return (
					<div>
						<h2>Category: {groupName}</h2>
						{'error' in groupPois ? (
							<p>{groupPois.error}</p>
						) : (
							groupPois.map(({ mapsLink, name, distance, rating, types }) => (
								<div>
									<a href={mapsLink} target="_blank">
										<h3>{name}</h3>
									</a>
									<p>
										{distance} - {rating}, {types}
									</p>
								</div>
							))
						)}
					</div>
				);
			})}
		</>
	);
}

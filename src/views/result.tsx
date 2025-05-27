import { POIs } from '../maps';

type ResultProps = {
	mapsUrl: string;
	pois: POIs;
};

export function Result({ mapsUrl, pois }: ResultProps) {
	return (
		<>
			<a href={mapsUrl} target="_blank">
				{mapsUrl}
			</a>
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

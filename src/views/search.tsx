export function Search() {
	return (
		<>
			<form method="get" action="/jinkaAd">
				<label>
					Jinka ad link:
					<input type="search" name="q" />
				</label>
				<button type="submit">Search</button>
			</form>
			<p>OR</p>
			<form method="get" action="/address">
				<label>
					Search by address:
					<input type="search" name="q" />
				</label>
				<button type="submit">Search</button>
			</form>
		</>
	);
}

export function Error({ error }: { error: string }) {
	return (
		<>
			<h2>An error occurred: </h2>
			<pre>
				<code>${error}</code>
			</pre>
		</>
	);
}

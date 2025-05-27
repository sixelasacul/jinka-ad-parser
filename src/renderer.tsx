import { jsxRenderer } from 'hono/jsx-renderer';

export const renderer = jsxRenderer(({ children }) => {
	return (
		<html>
			<head></head>
			<body>
				<a href="/">
					<h1>Jinka ad parser</h1>
				</a>
				{children}
			</body>
		</html>
	);
});

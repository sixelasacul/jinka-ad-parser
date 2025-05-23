import { renderBaseView } from './base';

export function renderErrorView(error: string) {
	return renderBaseView(`
    <h2>An error occurred: </h2>
    <pre><code>${error}</code></pre>
  `);
}

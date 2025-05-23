import { renderErrorView } from './error';

export function renderHtml(html: string, init?: ResponseInit) {
	return new Response(html, { ...init, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

export function renderError(error: string) {
	return renderHtml(renderErrorView(error), { status: 400 });
}

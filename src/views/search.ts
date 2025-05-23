import { renderBaseView } from './base';

export const searchView = renderBaseView(`
  <form method="GET" action="/">
    <label>
      Jinka ad link:
      <input type="search" name="jinkaUrl">
    </label>
    <button type="submit">Search</button>
  </form>
`);

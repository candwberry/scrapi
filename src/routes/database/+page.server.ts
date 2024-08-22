import type { PageLoad } from "./$types";

/**
 * Load function for a SvelteKit page that fetches product data with prices from an API endpoint.
 *
 * @type {PageLoad}
 * @param {object} context - The context object provided by SvelteKit.
 * @param {Record<string, string>} context.params - The route parameters.
 * @param {(input: RequestInfo, init?: RequestInit) => Promise<Response>} context.fetch - The fetch function provided by SvelteKit for making requests.
 * 
 * @returns {Promise<{ props: { data: any } }>} - An object containing the fetched data as a prop.
 */
export const load: PageLoad = async ({ params, fetch }) => {
  const resp = await fetch("/api/db/productsWithPrices");
  const data = await resp.json();
  return { props: { data: data } };
};

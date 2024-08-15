import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const resp = await fetch("/api/db/productsWithPrices?limit=10");
  const data = await resp.json();
  return { props: { data: data } };
};

import type { RequestHandler } from "@sveltejs/kit";
import { db, ok } from "$lib/database";

export const GET: RequestHandler = async ({ request, url }) => {
  const domain = url.searchParams.get("domain") || "";
  if (domain.trim() === "") return ok({ error: "No domain provided" });

  // so we want to get the object from "shops" with domain = domain.
  const query = db.query(`
    SELECT * FROM shops WHERE url = '${domain}';
    `);

  try {
    const result = query.all();
    if (result.length === 0)
      return ok({ error: "No shop found with that domain" });

    // we only expect one result
    // so take that first one, and get its "priceJSON", and JSON parse it, and return it
    const lastUsed = result[0].lastUsed;
    const regex = result[0].shop;
    const date = result[0].date;
    return ok({
      lastUsed,
      regex,
      date,
    });
  } catch (e: any) {
    return ok({ error: e.message });
  }
};

export const PUT: RequestHandler = async ({ request, url, params }) => {
  const body = await request.json();
  const domain = body.domain;
  const lastUsed = body.lastUsed;
  const name = body.shop;

  if (domain == undefined || lastUsed == undefined || name == undefined) {
    console.error("Invalid request", JSON.stringify(request.json()));
    return ok({
      error: "Invalid request. Please provide domain, lastUsed, and name",
    });
  }

  const query = db.query(`
        INSERT INTO shops (url, lastUsed, name)
        VALUES ('${domain}', '${lastUsed}', '${name}') 
        ON CONFLICT (url) DO UPDATE SET lastUsed = excluded.lastUsed, name = shops.name;
    `);

  try {
    query.run();
    return ok({ message: "Shop inserted successfully" });
  } catch (e: any) {
    return ok({ error: e.message });
  }
};

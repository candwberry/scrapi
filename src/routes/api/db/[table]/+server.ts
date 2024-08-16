import type { RequestHandler } from "@sveltejs/kit";
import { db, ok } from "$lib/database";
import { writable } from "svelte/store";

export const GET: RequestHandler = async ({ request, url, params }) => {
  const table: string = params.table ?? "sqlite_master";
  const orderby: string = url.searchParams.get("orderby") ?? "";
  const order: string = url.searchParams.get("order") ?? "asc";
  const limit: number = parseInt(url.searchParams.get("limit") ?? "-1"); // -1 means no limit for just SQLite but to be safe we will just check.

  if (table === "productsWithPrices") {
    try {
      const result = db
        .query(
          `
SELECT p.*,
       e.date as e_date, a.date as a_date,
       e.price as e_price, a.price as a_price,
       e.shipping as e_ship, a.shipping as a_ship,
       e.href as e_href, a.href as a_href,
       e.json as e_json, a.json as a_json,
       g.date1 as g_date1, g.date2 as g_date2, g.date3 as g_date3,
       g.price1 as g_price1, g.price2 as g_price2, g.price3 as g_price3,
       g.shipping1 as g_ship1, g.shipping2 as g_ship2, g.shipping3 as g_ship3,
       g.href1 as g_href1, g.href2 as g_href2, g.href3 as g_href3,
       g.json1 as g_json1, g.json2 as g_json2, g.json3 as g_json3
FROM products p
LEFT JOIN (
    SELECT *
    FROM prices
    WHERE shop = 'ebay'
    GROUP BY berry
    HAVING date = MAX(date)
) e ON e.berry = p.berry
LEFT JOIN (
    SELECT *
    FROM prices
    WHERE shop = 'amazon'
    GROUP BY berry
    HAVING date = MAX(date)
) a ON a.berry = p.berry
LEFT JOIN (
    SELECT 
        berry,
        MAX(CASE WHEN rn = 1 THEN date END) as date1,
        MAX(CASE WHEN rn = 2 THEN date END) as date2,
        MAX(CASE WHEN rn = 3 THEN date END) as date3,
        MAX(CASE WHEN rn = 1 THEN price END) as price1,
        MAX(CASE WHEN rn = 2 THEN price END) as price2,
        MAX(CASE WHEN rn = 3 THEN price END) as price3,
        MAX(CASE WHEN rn = 1 THEN shipping END) as shipping1,
        MAX(CASE WHEN rn = 2 THEN shipping END) as shipping2,
        MAX(CASE WHEN rn = 3 THEN shipping END) as shipping3,
        MAX(CASE WHEN rn = 1 THEN href END) as href1,
        MAX(CASE WHEN rn = 2 THEN href END) as href2,
        MAX(CASE WHEN rn = 3 THEN href END) as href3,
        MAX(CASE WHEN rn = 1 THEN json END) as json1,
        MAX(CASE WHEN rn = 2 THEN json END) as json2,
        MAX(CASE WHEN rn = 3 THEN json END) as json3
    FROM (
        SELECT *,
               ROW_NUMBER() OVER (PARTITION BY berry ORDER BY date DESC) as rn
        FROM prices
        WHERE shop = 'google'
    ) subq
    WHERE rn <= 3
    GROUP BY berry
) g ON g.berry = p.berry LIMIT ${limit}`,
        )
        .all();
      return ok(result);
    } catch (e: any) {
      console.error(e, table, orderby, order, limit);
      return ok({ error: e.message });
    }
  }

  try {
    const result = db
      .query(
        `
            SELECT * FROM ${table} ${orderby === "" ? "" : `ORDER BY ${orderby} ${order}`} ${limit < 0 ? "" : `LIMIT ${limit}`}
        `,
      )
      .all();
    return ok(result);
  } catch (e: any) {
    console.error(e, table, orderby, order, limit);
    return ok({ error: e.message });
  }
};

export const PUT: RequestHandler = async ({ request, url, params }) => {
  const table: string = params.table ?? "sqlite_master";
  const body = await request.json();

  if (table === "products" && Array.isArray(body)) {
    const total = body.length;
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < body.length; i++) {
      const product = body[i];
      try {
        if (product.berry === undefined || product.berry.trim().length === 0)
          continue;
        db.run(
          `
                            INSERT OR REPLACE INTO products (
                                berry, barcode, supplierCode, supplier, description, image, 
                                amazonLast, ebayLast, googleLast, asin, asin_validated, json
                            )
                            VALUES (
                                $berry,
                                COALESCE($barcode, (SELECT barcode FROM products WHERE berry = $berry)),
                                COALESCE($supplierCode, (SELECT supplierCode FROM products WHERE berry = $berry)),
                                COALESCE($supplier, (SELECT supplier FROM products WHERE berry = $berry), 'N/A'),
                                COALESCE($description, (SELECT description FROM products WHERE berry = $berry)),
                                COALESCE($image, (SELECT image FROM products WHERE berry = $berry)),
                                COALESCE($amazonLast, (SELECT amazonLast FROM products WHERE berry = $berry), $now),
                                COALESCE($ebayLast, (SELECT ebayLast FROM products WHERE berry = $berry), $now),
                                COALESCE($googleLast, (SELECT googleLast FROM products WHERE berry = $berry), $now),
                                COALESCE($asin, (SELECT asin FROM products WHERE berry = $berry), ''),
                                COALESCE($asin_validated, (SELECT asin_validated FROM products WHERE berry = $berry), false),
                                COALESCE($json, (SELECT json FROM products WHERE berry = $berry), '{}')
                            );
                        `,
          {
            // @ts-ignore
            $berry: product.berry,
            $barcode: product.barcode,
            $supplierCode: product.supplierCode,
            $supplier: product.supplier,
            $description: product.description,
            $image: product.image,
            $amazonLast: product.amazonLast,
            $ebayLast: product.ebayLast,
            $googleLast: product.googleLast,
            $asin: product.asin,
            $asin_validated: product.asin_validated,
            $json: product.json,
            $now: now,
          },
        );
      } catch (error) {
        console.error(error);
      }
    }

    return ok({});
  } else if (table === "prices" && Array.isArray(body)) {
    for (const price of body) {
      try {
        db.run(
          `
                    INSERT INTO prices (
                        berry, price, shipping, date, shop, image, href, json
                    )
                    VALUES (
                        $berry, $price, $shipping, $date, $shop, $image, $href, $json
                    );
                `,
          {
            // @ts-ignore
            $berry: price.berry,
            $price: price.price,
            $shipping: price.shipping,
            $date: price.date,
            $shop: price.shop,
            $image: price.image,
            $href: price.href,
            $json: price.json,
          },
        );
      } catch (error) {
        console.error(error);
      }
    }
  } else if (table === "suppliers" && Array.isArray(body)) {
    for (const supplier of body) {
      try {
        db.run(
          `
                    INSERT INTO suppliers (
                        supplier, json
                    )
                    VALUES (
                        $supplier, $json
                    );
                `,
          {
            // @ts-ignore
            $supplier: supplier.supplier,
            $json: supplier.json,
          },
        );
      } catch (error) {
        console.error(error);
      }
    }
  } else if (table === "shops" && Array.isArray(body)) {
    for (const shop of body) {
      try {
        db.run(
          `
                    INSERT INTO shops (
                        URL, name, regex, lastUsed, date, json
                    )
                    VALUES (
                        $URL, $name, $regex, $lastUsed, $date, $json
                    );
                `,
          {
            // @ts-ignore
            $URL: shop.URL,
            $name: shop.name,
            $regex: shop.regex,
            $lastUsed: shop.lastUsed,
            $date: shop.date,
            $json: shop.json,
          },
        );
      } catch (error) {
        console.error(error);
      }
    }
  } else {
    return ok({ error: "Invalid table" });
  }

  return ok({});
};

export const DELETE: RequestHandler = async({ request, url, params }) => {
  const table: string = params.table ?? "sqlite_master";

  if (table === "products") {
    try {
      db.run(
        `
            DELETE FROM products
        `);
    } catch (error) {
      console.error(error);
    }

    finally {
      return ok({});
    }
  }

  return ok({ error: "Invalid table" });
};
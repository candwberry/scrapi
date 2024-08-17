import type { RequestHandler } from "@sveltejs/kit";
import { ok, db } from "$lib/database";

function epochToDate(epoch: number) {
  if (typeof(epoch) === 'number' && epoch && !isNaN(epoch)) {
    return new Date(epoch).toISOString();
  }
  return epoch;
}

export const GET: RequestHandler = async ({ request, url, fetch }) => {
  const exportType = url.searchParams.get("type");

  const resp = await fetch(`/api/db/${exportType}`);
  const res = await resp.json();

  if (res === undefined) {
    return ok({ error: "An error occurred" });
  } else if (res.length === 0) {
    return ok({ error: "No data found" });
  }

  const result = res.map(row => {
    const newRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase().includes('last') || key.toLowerCase().includes('date')) {
        newRow[key] = epochToDate(value);
      } else {
        newRow[key] = value;
      }
    }
    return newRow;
  });


  // Convert to CSV.
  const head = Object.keys(result[0] as Object);

  const csv = [
    head.join(","),
    ...result.map((row) => head.map((key) => row[key]).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const headers = new Headers({
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename=${exportType}-${new Date().toISOString()}.csv`,
  });

  return new Response(blob, { status: 200, headers });
};

export const POST: RequestHandler = async ({ request, url, fetch }) => {
  const body = await request.json();
  const exportType = body.type;
  const berryList = body.array;

  const res = db.query(`
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
) g ON g.berry = p.berry
WHERE p.berry IN (${berryList.map((b) => `'${b}'`).join(",")})`).all();


  if (res === undefined) {
    return ok({ error: "An error occurred" });
  } else if (res.length === 0) {
    return ok({ error: "No data found" });
  }

  const result = res.map(row => {
    const newRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase().includes('last') || key.toLowerCase().includes('date')) {
        newRow[key] = epochToDate(value);
      } else {
        newRow[key] = value;
      }
    }
    return newRow;
  });
  // Convert to CSV.
  const head = Object.keys(result[0] as Object);


  const csv = [
    head.join(","),
    ...result.map((row) => head.map((key) => row[key]).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const headers = new Headers({
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename=${exportType}-${new Date().toISOString()}.csv`,
  });

  return new Response(blob, { status: 200, headers });
}
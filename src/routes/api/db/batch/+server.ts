import type { RequestHandler } from "@sveltejs/kit";
import { ok, db } from "$lib/database";

const query = db.query(`
    CREATE TABLE IF NOT EXISTS batches (
        name TEXT NOT NULL,
        date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        batch TEXT NOT NULL
    );
`);

export const GET: RequestHandler = async ({ request, url, fetch }) => {
  const name = url.searchParams.get("name") || "";
  if (name == "")
    return ok(db.query(`SELECT * FROM batches ORDER BY next ASC`).all());
  else 
    return ok(db.query(`SELECT * FROM batches WHERE name = ?`).all(name));
  
};

export const POST: RequestHandler = async ({ request, url, fetch }) => {
  const body = await request.json();
  let batch: unknown[] = [];

  if (body.name !== undefined) {
    batch = [db.query(`SELECT * FROM batches WHERE name = ?`).all(body.name)];
  } else if (body.batch !== undefined) {
    // Expecting comma separated brefs.
    batch = db
      .query(
        `SELECT * FROM products WHERE berry IN (${body.batch
          .split(",")
          .map(() => "?")
          .join(",")})`,
      )
      .all(body.batch.split(","));
  }
  if (body.get) return ok(batch);

  // If not "get" then DO the batch. This means calling POST to /api/google, /api/amazon, /api/ebay with body=JSON.stringify(batch)
  //const google = fetch('/api/google', { method: 'POST', body: JSON.stringify(batch) });
  const ebay = await fetch("/api/ebay", {
    method: "POST",
    body: JSON.stringify(batch),
  });
  
  const amazon = await fetch("/api/amazon", {
    method: "POST",
    body: JSON.stringify(batch),
  });
  const manomano = await fetch("/api/manomano", {
    method: "POST",
    body: JSON.stringify(batch),
  });
  const google = await fetch("/api/google", {
    method: "POST",
    body: JSON.stringify(batch),
  });

  let amazonJSON;
  let ebayJSON;
  let googleJSON;
  let manoJSON;

  try {
    amazonJSON = await amazon.json();
  } catch (err) {
    console.error("Amazon error:", err);
    amazonJSON = [];
  }
  try {
    ebayJSON = await ebay.json();
  } catch (err) {
    console.error("Ebay error:", err);
    ebayJSON = [];
  }
  try {
    googleJSON = await google.json();
  } catch (err) {
    console.error("Google error:", err);
    googleJSON = [];
  }
  try {
    manoJSON = await manomano.json();
  } catch (err) {
    console.error("Manomano error:", err);
    manoJSON = [];
  }

  console.log(ebay, amazon, google, manomano);
  console.log(ebayJSON, amazonJSON, googleJSON , manoJSON);
  return ok({
    amazon: amazonJSON,
    ebay: ebayJSON,
    google: googleJSON,
    manomano: manoJSON,
  });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();

  db.run(
    `INSERT OR REPLACE INTO batches (
        name, batch, frequency, date, last, next
    ) VALUES (
        $name,
        COALESCE($batch, (SELECT batch FROM batches WHERE name = $name)),
        COALESCE($frequency, (SELECT frequency FROM batches WHERE name = $name)),
        COALESCE($date, (SELECT date FROM batches WHERE name = $name)),
        COALESCE($last, (SELECT last FROM batches WHERE name = $name)),
        COALESCE($next, (SELECT next FROM batches WHERE name = $name))
    )`,
    {
      // @ts-ignore
      $name: body.name,
      $batch: body.batch,
      $frequency: body.frequency,
      $date: body.date,
      $last: body.last,
      $next: body.next,
    },
  );

  return ok({});
};

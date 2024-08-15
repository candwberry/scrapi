import type { RequestHandler } from "@sveltejs/kit";
import { db, ok } from "$lib/database";

const init = db.query(`
    SELECT name FROM sqlite_master WHERE type='table';
`);

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const result = init.all();

    for (let i = 0; i < result.length; i++) {
      const name = result[i].name;
      const count = db.query(`SELECT COUNT(*) FROM ${name}`).get();
      result[i].count = count["COUNT(*)"];
    }

    return ok(result);
  } catch (e: any) {
    return ok({ error: e.message });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { query } = await request.json();
    const result = db.query(query).all();

    return ok(result);
  } catch (e: any) {
    return ok({ error: e.message });
  }
};

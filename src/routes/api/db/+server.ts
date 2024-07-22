import type { RequestHandler } from "@sveltejs/kit";

// @ts-expect-error - Only exists at runtime, if we force bun --bun
import { Database } from "bun:sqlite";
const db = new Database("./mydb.sqlite");

export const GET: RequestHandler = async ({ request, url }) => {
    // since this is local only, we will allow any query.
    const query = url.searchParams.get("query") ?? "";

    const result = await db.query(query).get();
    console.log(result);
    
    return new Response(JSON.stringify(result), {
        headers: {
            "content-type": "application/json"
        }
    });
};


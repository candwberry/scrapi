import type { RequestHandler } from "@sveltejs/kit";
import { db, ok, err } from "../db";


export const GET: RequestHandler = async ({ request, url }) => {
    const domain = url.searchParams.get("domain") || "";
    if (domain.trim() === "") return err("Invalid domain", "Domain is required");

    // so we want to get the object from "shops" with domain = domain.
    const query = db.query(`
    SELECT * FROM shops WHERE url = '${domain}';
    `);

    try {
        const result = query.all();
        if (result.length === 0) return err("No results", "No results found for this domain");
        // we only expect one result
        // so take that first one, and get its "priceJSON", and JSON parse it, and return it
        const priceJSON = result[0].priceJSON;
        return ok(JSON.parse(priceJSON));
    } catch (e: any) {
        return err("Invalid SQL", e.message);
    };

};
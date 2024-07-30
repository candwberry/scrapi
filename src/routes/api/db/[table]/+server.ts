import type { RequestHandler } from "@sveltejs/kit";
import type { Table, Parameter } from "../sql";
import { PARAMETERS, TABLES, isProduct, isPrice, isSupplier, isShop } from "../sql";
import { db, ok, err, ERR_INVALID_SELECT_PARAM, ERR_INVALID_TABLE, PRODUCTS, PRICES, SUPPLIERS, SHOPS } from "../db";

export const GET: RequestHandler = async ({ request, url, params }) => {
    const table: string = params.table ?? "sqlite_master";
    const productPrices: string = url.searchParams.get("berry") || "";

    if (productPrices.trim() !== "") {
        // So this will be a berry code. 
        // We will need to find the most recent price for this berry code from both amazon and eBay, and return them.

        /*
        SELECT * FROM (
            SELECT * FROM prices 
            WHERE berry = ? AND shop = 'ebay'
            ORDER BY date DESC
            LIMIT 1
        ) AS ebay_price
        UNION ALL
        SELECT * FROM (
            SELECT * FROM prices 
            WHERE berry = ? AND shop = 'amazon'
            ORDER BY date DESC
            LIMIT 1
        ) AS amazon_price
        */

        try {
            const result = db.query(`
                SELECT p.*, pr.title FROM (
                    SELECT * FROM (
                        SELECT * FROM prices WHERE berry = ? AND shop = 'ebay' ORDER BY date DESC LIMIT 1
                    ) AS ebay_price
                    UNION ALL
                    SELECT * FROM (
                        SELECT * FROM prices WHERE berry = ? AND shop = 'amazon' ORDER BY date DESC LIMIT 1
                    ) AS amazon_price
                ) p
                JOIN products pr ON p.berry = pr.berry
            `).all(productPrices, productPrices);            return ok(result);
        } catch (e: any) {
            return err("Invalid SQL?", e.message); // now i think thats not a good or accurate error message.
        };
    }

    const select: string = url.searchParams.get("s") || "*";
    const orderby: string = url.searchParams.get("orderby") || "";
    const order: string = url.searchParams.get("order") || "asc";
    const limit: number = parseInt(url.searchParams.get("limit") || "100");

    if (!(PARAMETERS.includes(select as Parameter)))
        return err(ERR_INVALID_SELECT_PARAM, `Valid select parameters are: ${PARAMETERS.join(", ")}`);

    if (!(TABLES).includes(table as Table))
        return err(ERR_INVALID_TABLE, `Valid tables are: ${TABLES.join(", ")}`);

    try {
        const result = db.query(`SELECT ${select} FROM ${table};` + (orderby ? ` ORDER BY ${orderby} ${order};` : "")).all().slice(0, limit);
        return ok(result);
    } catch (e: any) {
        return err("Invalid SQL", e.message);
    };
};

export const PUT: RequestHandler = async ({ request, url, params }) => {
    const table: string = params.table ?? "sqlite_master";
    const bodyArray = await request.json();

    if (!(TABLES).includes(table as Table))
        return err(ERR_INVALID_TABLE, `Valid tables are: ${TABLES.join(", ")}`);

    let results: any[] = [];

    if (!Array.isArray(bodyArray)) {
        return err("Invalid body", "Body must be an array of valid product, price, supplier or shop objects");
    }

    for (const body of bodyArray) {
        console.log(JSON.stringify(body));
        let result: any;
        try {
            if (isProduct(body)) {
                result = PRODUCTS.all(body.berry, body.barcode, body.supplierCode, body.supplier, body.title, body.amazonLast, body.ebayLast, body.googleLast);
                console.log("IS A PRODUCT>.> ", result);   
            }
            else if (isPrice(body))
                result = PRICES.all(body.berry, body.price, body.shipping, body.date, body.shop, body.href);
            else if (isSupplier(body))
                result = SUPPLIERS.all(body.name);
            else if (isShop(body))
                result = SHOPS.all(body.name, body.url);
            else {
                result = err("Invalid body", "Body must be a valid product, price, supplier or shop object");
                console.error(result);
                console.error(body);
            }
        } catch (e: any) {
            result =  err("Invalid SQL", e.message);
        };
        
        console.log(result);
        console.log("PUTTING:");
        console.log(body.berry, body.barcode, body.supplierCode, body.supplier, body.title, body.amazonLast, body.ebayLast, body.googleLast)
        results.push(result);
    }

    return ok(results);
}

export const DELETE: RequestHandler = async ({ request, url, params }) => {
    return new Response("Not implemented", { status: 501 });
    const table: string = params.table ?? "sqlite_master";
    let lastUpdated = url.searchParams.get("lastUpdated") || "";
    console.log(request);

    let query = `DELETE FROM ${table}`;
    if (lastUpdated.length > 0 && table === "products") {
        query += ` WHERE ebayLast < ${lastUpdated};`; // we will use EBAYLAST as the DELETE reference.
    }

    if (!(TABLES).includes(table as Table))
        return err(ERR_INVALID_TABLE, `Valid tables are: ${TABLES.join(", ")}`);

    try {
        const result = db.query(`${query}`).all();
        return ok(result);
    } catch (e: any) {
        return err("Invalid SQL", e.message);
    };
}
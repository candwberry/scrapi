import type { RequestHandler } from "@sveltejs/kit";
import type { Table, Parameter } from "../sql";
import { PARAMETERS, TABLES, isProduct, isPrice, isSupplier, isShop } from "../sql";
import { db, ok, err, ERR_INVALID_SELECT_PARAM, ERR_INVALID_TABLE, PRODUCTS, PRICES, SUPPLIERS, SHOPS } from "../db";

export const GET: RequestHandler = async ({ request, url, params }) => {
    const table: string = params.table ?? "sqlite_master";
    const select: string = url.searchParams.get("s") || "*";

    if (!(PARAMETERS.includes(select as Parameter)))
        return err(ERR_INVALID_SELECT_PARAM, `Valid select parameters are: ${PARAMETERS.join(", ")}`);

    if (!(TABLES).includes(table as Table))
        return err(ERR_INVALID_TABLE, `Valid tables are: ${TABLES.join(", ")}`);

    try {
        const result = db.query(`SELECT ${select} FROM ${table};`).all();
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
        let result: any;
        try {
            if (isProduct(body))
                result = PRODUCTS.all(body.berry, body.barcode, body.supplierCode, body.supplier, body.title);
            else if (isPrice(body))
                result = PRICES.all(body.price, body.shipping, body.date, body.shop, body.href);
            else if (isSupplier(body))
                result = SUPPLIERS.all(body.name);
            else if (isShop(body))
                result = SHOPS.all(body.name, body.url);
            else
                result = err("Invalid body", "Body must be a valid product, price, supplier or shop object");
        } catch (e: any) {
            result =  err("Invalid SQL", e.message);
        };
        
        results.push(result);
    }

    return ok(results);
}
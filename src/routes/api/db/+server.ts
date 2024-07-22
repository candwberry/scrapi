import type { RequestHandler } from "@sveltejs/kit";
import { Database } from "bun:sqlite";
const db = new Database("./mydb.sqlite");

const createProductsTable = `CREATE TABLE IF NOT EXISTS products (
    berry TEXT PRIMARY KEY,
    barcode TEXT,
    supplierCode TEXT,
    supplier TEXT,
    title TEXT
);`;
const createPricesTable = `CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY,
    price REAL,
    shipping REAL,
    date TEXT,
    shop TEXT,
    href TEXT
);`;
const createSupplierTable = `CREATE TABLE IF NOT EXISTS suppliers (
    name TEXT PRIMARY KEY
);`;
const createShopTable = `CREATE TABLE IF NOT EXISTS shops (
    name TEXT PRIMARY KEY,
    url TEXT
);`;

// Create tables.
db.run("DROP TABLE IF EXISTS test");
db.run(createProductsTable); db.run(createPricesTable); db.run(createSupplierTable); db.run(createShopTable);

export const GET: RequestHandler = async ({ request, url }) => {
    console.log(url);
    const query = url.searchParams.get("query") ?? "";
    const tables = url.searchParams.get("tables") ?? "";

    console.log(query);
    console.log(tables);
    let result;
    try {
        if (tables === "get") {
            result = await db.query(`SELECT name FROM sqlite_master WHERE type='table'`).all();
            return new Response(JSON.stringify(result), {
                headers: {
                    "content-type": "application/json"
                }
            });
        } else if (tables !== "") {
            result = await db.query(`SELECT * FROM ${tables}`).all();
            return new Response(JSON.stringify(result), {
                headers: {
                    "content-type": "application/json"
                }
            });
        }

        result = await db.query(query).all();
        console.log(result);
        
        return new Response(JSON.stringify(result), {
            headers: {
                "content-type": "application/json"
            }
        });
    } catch (error) {
        console.error(error.message);
        return new Response(JSON.stringify({error: error.message}), {
            headers: {
                "content-type": "application/json"
            }
        });
    }
};


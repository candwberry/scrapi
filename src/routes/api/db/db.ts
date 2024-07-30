import { Database } from "bun:sqlite";

import { createProductsTable, createPricesTable, createSupplierTable, createShopTable } from "./sql";
const db = new Database("mydb.sqlite");

// DROP prices table 
//db.run(`DROP TABLE IF EXISTS prices;`);
db.run(createProductsTable);
db.run(createPricesTable);
db.run(createSupplierTable);
db.run(createShopTable);

const err = (error: string, info: string) => {
    console.error(`${error}: ${info}`);

    return new Response(
        JSON.stringify({ error, info }),
        { headers: { "content-type": "application/json" } }
    );
};

const ok = (data: unknown) => {
    console.log(JSON.stringify(data) + "\nEOD");

    return new Response(
        JSON.stringify(data),
        { headers: { "content-type": "application/json" } }
    );
}

const ERR_INVALID_SELECT_PARAM = "Invalid select parameter";
const ERR_INVALID_TABLE = "Invalid table";

const PRODUCTS = db.query(`
    INSERT INTO products (berry, barcode, supplierCode, supplier, title, amazonLast, ebayLast, googleLast)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    ON CONFLICT(berry) DO UPDATE SET
    berry = excluded.berry,
    barcode = excluded.barcode,
    supplierCode = excluded.supplierCode,
    supplier = excluded.supplier,
    title = excluded.title,
    amazonLast = excluded.amazonLast,
    ebayLast = excluded.ebayLast,
    googleLast = excluded.googleLast;
`);

const PRICES = db.query(`
    INSERT INTO prices (berry, price, shipping, date, shop, href)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
`);

const SUPPLIERS = db.query(`
    INSERT INTO suppliers (name)
    VALUES (?1)
`);

const SHOPS = db.query(`
    INSERT INTO shops (name, url)
    VALUES (?1, ?2)
    ON CONFLICT(name) DO UPDATE SET
    name = excluded.name,
    url = excluded.url;
`);

export { db, err, ok, ERR_INVALID_SELECT_PARAM, ERR_INVALID_TABLE, PRODUCTS, PRICES, SUPPLIERS, SHOPS };

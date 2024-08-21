import { Database } from "bun:sqlite";
// check if mydb.sqlite exists:
import fs from "fs";
let db: Database;
if (!fs.existsSync("mydb.sqlite")) {
    console.log("TEMP DB IN MEMORY.")
    db = new Database(":memory:"); // this is for fixing build process bull.
} else {
    db = new Database("mydb.sqlite");
}
db.exec('PRAGMA journal_mode=WAL');

const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
        berry TEXT PRIMARY KEY,
        barcode TEXT,
        supplierCode TEXT,
        supplier TEXT,
        description TEXT,
        image TEXT,
        amazonLast INTEGER,
        ebayLast INTEGER,
        googleLast INTEGER,
        manoLast INTEGER,
        asin TEXT,
        asin_validated INTEGER NOT NULL DEFAULT 0,
        json TEXT
    );
`; //// asin_validated can be 0 if not, epoch time if yes.

const createShopsTable = `
    CREATE TABLE IF NOT EXISTS shops (
        URL TEXT PRIMARY KEY,
        name TEXT,
        regex TEXT,
        lastUsed TEXT,
        date INTEGER,
        json TEXT
    );
`;

const createSuppliersTable = `
    CREATE TABLE IF NOT EXISTS suppliers (
        name TEXT PRIMARY KEY,
        json TEXT
    )  ;
`;

const createPricesTable = `
    CREATE TABLE IF NOT EXISTS prices (
        berry TEXT,
        price REAL,
        shipping REAL,
        date INTEGER,
        shop TEXT,
        image TEXT,
        href TEXT,
        json TEXT
    );
`;

const createBatchesTable = `
CREATE TABLE IF NOT EXISTS batches (
        name TEXT PRIMARY KEY,
        date INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last INTEGER NOT NULL DEFAULT 0,
        frequency INTEGER NOT NULL,
        batch TEXT NOT NULL,
        next INTEGER NOT NULL DEFAULT 0
    );
`; // if next is 0, then this batch is OFF.

/* 
db.run(`DROP TABLE IF EXISTS products`);
db.run(`DROP TABLE IF EXISTS shops`);
db.run(`DROP TABLE IF EXISTS suppliers`);
db.run(`DROP TABLE IF EXISTS prices`);
db.run(`DROP TABLE IF EXISTS batches`);
/* */

db.run(createProductsTable);
db.run(createShopsTable);
db.run(createSuppliersTable);
db.run(createPricesTable);
db.run(createBatchesTable);

export function ok(body: any) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
    },
  });
}

export { db };
import { Database } from "bun:sqlite";
import { createProductsTable, createShopsTable, createSuppliersTable, createPricesTable, createBatchesTable } from '$lib/schema';
import fs from "fs";

let db: Database;

if (!fs.existsSync("mydb.sqlite")) {
    // This is necessary for the build process, otherwise it will create a new 'mydb.sqlite' and persistence will fail.
    console.log("Creating temp database in memory.")
    db = new Database(":memory:"); 
} else {
    db = new Database("mydb.sqlite");
}

// WAL mode is faster read and writes, requires mydb.sqlite-wal and mydb.sqlite-shm files.
db.exec('PRAGMA journal_mode=WAL');

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

/**
 * Creates a JSON response with the provided body.
 * 
 * @param {any} body - The body of the response to be returned.
 * @returns {Response} - A Response object containing the JSON stringified body.
 */
function ok(body: any): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
    },
  });
}

export { db, ok };

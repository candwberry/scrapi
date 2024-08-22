/**
 * This file contains the schema/structure of the database, i.e., the SQL commands
 * to create all tables and their respective columns.
 */

/**
 * SQL command to create the `products` table.
 * This table stores product information including identifiers, descriptions, 
 * and the last time prices were checked on various platforms.
 *
 * Columns:
 * - berry: Unique identifier for the product (Primary Key).
 * - barcode: Barcode of the product.
 * - supplierCode: Code used by the supplier to identify the product.
 * - supplier: Name of the supplier.
 * - description: Description of the product.
 * - image: URL or path to the product image.
 * - amazonLast, ebayLast, googleLast, manoLast: Timestamps of the last price check on respective platforms.
 * - asin: Amazon Standard Identification Number (ASIN) for the product.
 * - asin_validated: Indicates whether the ASIN has been validated (0 = not validated, anything else = the date of validation).
 * - json: A JSON field for storing additional product data.
 */
const createProductsTable: string = `
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
`;

/**
 * SQL command to create the `shops` table.
 * This table stores information about different shops where products can be found.
 *
 * Columns:
 * - URL: The shop's URL (Primary Key).
 * - name: Name of the shop.
 * - regex: A regular expression used for matching product data on the shop's website.
 * - lastUsed: The last time this shop was used for a search.
 * - date: Timestamp of the last update.
 * - json: A JSON field for storing additional shop-related data.
 */
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

/**
 * SQL command to create the `suppliers` table.
 * This table stores information about different suppliers providing products.
 *
 * Columns:
 * - name: The name of the supplier (Primary Key).
 * - json: A JSON field for storing additional supplier-related data.
 */
const createSuppliersTable = `
    CREATE TABLE IF NOT EXISTS suppliers (
        name TEXT PRIMARY KEY,
        json TEXT
    );
`;

/**
 * SQL command to create the `prices` table.
 * This table records the prices of products at different shops along with other relevant details.
 *
 * Columns:
 * - berry: The product identifier, linking to the `products` table.
 * - price: The price of the product.
 * - shipping: The shipping cost for the product.
 * - date: Timestamp when the price was recorded.
 * - shop: The name of the shop where the price was found.
 * - image: URL or path to the product image from the shop.
 * - href: The hyperlink to the product page on the shop's website.
 * - json: A JSON field for storing additional price-related data.
 */
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

/**
 * SQL command to create the `batches` table.
 * This table manages batches of product updates, controlling when products should be checked for price updates.
 *
 * Columns:
 * - name: Unique identifier for the batch (Primary Key).
 * - date: Timestamp when the batch was created.
 * - last: Timestamp of the last execution of this batch.
 * - frequency: The frequency (in seconds) at which this batch should run.
 * - batch: JSON data containing details about the batch.
 * - next: Timestamp indicating when the next execution should occur.
 */
const createBatchesTable = `
CREATE TABLE IF NOT EXISTS batches (
        name TEXT PRIMARY KEY,
        date INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last INTEGER NOT NULL DEFAULT 0,
        frequency INTEGER NOT NULL,
        batch TEXT NOT NULL,
        next INTEGER NOT NULL DEFAULT 0
    );
`;

export { createProductsTable, createShopsTable, createSuppliersTable, createPricesTable, createBatchesTable };

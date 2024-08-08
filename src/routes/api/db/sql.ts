type Product = {
    berry: string,
    barcode: string,
    supplierCode: string,
    supplier: string,
    title: string,
    amazonLast: number,
    ebayLast: number,
    googleLast: number,
    amazonJSON: string
}; 

type Price = {
    berry: string,
    price: string,
    shipping: string,
    date: string,
    shop: string,
    href: string
};

type Supplier = {
    name: string
};

type Shop = {
    name: string,
    url: string,
    regex: string,
    lastUsed: string,
    date: string,
    json: string
};

function isProduct(obj: any): obj is Product {
    return (
        typeof obj.berry === 'string' &&
        typeof obj.barcode === 'string' &&
        typeof obj.supplierCode === 'string' &&
        typeof obj.supplier === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.amazonLast === 'number' &&
        typeof obj.ebayLast === 'number' &&
        typeof obj.googleLast === 'number' &&
        typeof obj.amazonJSON === 'string'
    );
}

function isPrice(obj: any): obj is Price {
    return (
        typeof obj.berry === 'string' &&
        typeof obj.price === 'string' &&
        typeof obj.shipping === 'string' &&
        typeof obj.date === 'number' &&
        typeof obj.shop === 'string' &&
        typeof obj.href === 'string'
    );
}

function isSupplier(obj: any): obj is Supplier {
    return typeof obj.name === 'string';
}

function isShop(obj: any): obj is Shop {
    return (
        typeof obj.name === 'string' &&
        typeof obj.url === 'string' &&
        typeof obj.regex === 'string' &&
        typeof obj.lastUsed === 'string' &&
        typeof obj.date === 'string' &&
        typeof obj.json === 'string'
    );
}

type Table = "products" | "prices" | "suppliers" | "shops" | "sqlite_master";
type Parameter = "berry" | "barcode" | "supplierCode" | "supplier" | "title" | "price" | "shipping" | "date" | "shop" | "href" | "amazonLast" | "ebayLast" | "googleLast" | "name" | "url" | "*";
const TABLES: Table[] = ["products", "prices", "suppliers", "shops", "sqlite_master"];
const PARAMETERS: Parameter[] = ["berry", "barcode", "supplierCode", "supplier", "title", "price", "shipping", "date", "shop", "href", "name", "url", "*"];

const createProductsTable = `CREATE TABLE IF NOT EXISTS products (
    berry TEXT PRIMARY KEY,
    barcode TEXT,
    supplierCode TEXT,
    supplier TEXT,
    title TEXT,
    amazonLast INTEGER,
    ebayLast INTEGER,
    googleLast INTEGER,
    amazonJSON TEXT
);`;

const createPricesTable = `CREATE TABLE IF NOT EXISTS prices (
    berry TEXT,
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
    url TEXT PRIMARY KEY,
    name TEXT,
    regex TEXT,
    lastUsed TEXT,
    date TEXT,
    json TEXT
);`;

export type {
    Product,
    Price,
    Supplier,
    Shop,
    Table,
    Parameter
}

export {
    createProductsTable,
    createPricesTable,
    createSupplierTable,
    createShopTable,
    TABLES,
    PARAMETERS,
    isProduct,
    isPrice,
    isSupplier,
    isShop
}
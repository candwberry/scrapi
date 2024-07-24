type Product = {
    berry: string,
    barcode: string,
    supplierCode: string,
    supplier: string,
    title: string
}; 

type Price = {
    id: number,
    price: number,
    shipping: number,
    date: string,
    shop: string,
    href: string
};

type Supplier = {
    name: string
};

type Shop = {
    name: string,
    url: string
};

function isProduct(obj: any): obj is Product {
    return (
        typeof obj.berry === 'string' &&
        typeof obj.barcode === 'string' &&
        typeof obj.supplierCode === 'string' &&
        typeof obj.supplier === 'string' &&
        typeof obj.title === 'string'
    );
}

function isPrice(obj: any): obj is Price {
    return (
        typeof obj.id === 'number' &&
        typeof obj.price === 'number' &&
        typeof obj.shipping === 'number' &&
        typeof obj.date === 'string' &&
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
        typeof obj.url === 'string'
    );
}

type Table = "products" | "prices" | "suppliers" | "shops" | "sqlite_master";
type Parameter = "berry" | "barcode" | "supplierCode" | "supplier" | "title" | "price" | "shipping" | "date" | "shop" | "href" | "name" | "url" | "*";
const TABLES: Table[] = ["products", "prices", "suppliers", "shops", "sqlite_master"];
const PARAMETERS: Parameter[] = ["berry", "barcode", "supplierCode", "supplier", "title", "price", "shipping", "date", "shop", "href", "name", "url", "*"];

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
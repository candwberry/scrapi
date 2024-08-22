import { writable, type Writable } from "svelte/store";

/**
 * A writable store that manages the current mode of operation.
 * 
 * @type {Writable<string>}
 * @default "ebay"
 */
export const mode: Writable<string> = writable("ebay");

/**
 * A writable store that contains the full list of rows (e.g., product data).
 * 
 * @type {Writable<any[]>}
 */
export const rows: Writable<any[]> = writable([]);

/**
 * A writable store that contains the list of filtered rows based on some criteria.
 * 
 * @type {Writable<any[]>}
 */
export const filteredRows: Writable<any[]> = writable([]);

/**
 * A writable store that holds the list of columns or properties that are currently hidden.
 * 
 * @type {Writable<string[]>}
 */
export const hidden: Writable<string[]> = writable([]);

/**
 * A writable store that holds information about a product, with various properties representing different aspects of the product.
 * 
 * @type {Writable<Object>}
 * 
 * @property {string} berry - Unique identifier for the product.
 * @property {string} barcode - Barcode of the product.
 * @property {string} supplierCode - Code used by the supplier to identify the product.
 * @property {string} supplier - Name of the supplier.
 * @property {string} description - Description of the product.
 * @property {string} image - URL or path to the product image (defaults to "no-image.png").
 * @property {string} amazonLast - Last updated timestamp for Amazon prices.
 * @property {string} ebayLast - Last updated timestamp for eBay prices.
 * @property {string} googleLast - Last updated timestamp for Google prices.
 * @property {string} e_date - Date related to eBay data.
 * @property {string} a_date - Date related to Amazon data.
 * @property {string} m_date - Date related to ManoMano data.
 * @property {string} a_href - URL link for Amazon product.
 * @property {string} e_href - URL link for eBay product.
 * @property {string} m_href - URL link for ManoMano product.
 * @property {string} e_json - JSON data for eBay product.
 * @property {string} a_json - JSON data for Amazon product.
 * @property {string} m_json - JSON data for ManoMano product.
 * @property {string} g_date1 - First date field for Google product data.
 * @property {string} g_date2 - Second date field for Google product data.
 * @property {string} g_date3 - Third date field for Google product data.
 * @property {string} g_href1 - First URL link for Google product.
 * @property {string} g_href2 - Second URL link for Google product.
 * @property {string} g_href3 - Third URL link for Google product.
 * @property {string} g_json1 - First JSON data field for Google product.
 * @property {string} g_json2 - Second JSON data field for Google product.
 * @property {string} g_json3 - Third JSON data field for Google product.
 * @property {string} e_price - Price for the product on eBay.
 * @property {string} a_price - Price for the product on Amazon.
 * @property {string} m_price - Price for the product on ManoMano.
 * @property {string} e_ship - Shipping cost for the product on eBay.
 * @property {string} a_ship - Shipping cost for the product on Amazon.
 * @property {string} m_ship - Shipping cost for the product on ManoMano.
 * @property {string} g_price1 - First price field for Google product.
 * @property {string} g_price2 - Second price field for Google product.
 * @property {string} g_price3 - Third price field for Google product.
 * @property {string} g_ship1 - First shipping cost field for Google product.
 * @property {string} g_ship2 - Second shipping cost field for Google product.
 * @property {string} g_ship3 - Third shipping cost field for Google product.
 */
export const berry: Writable<{
  berry: string;
  barcode: string;
  supplierCode: string;
  supplier: string;
  description: string;
  image: string;
  amazonLast: string;
  ebayLast: string;
  googleLast: string;
  e_date: string;
  a_date: string;
  m_date: string;
  a_href: string;
  e_href: string;
  m_href: string;
  e_json: string;
  a_json: string;
  m_json: string;
  g_date1: string;
  g_date2: string;
  g_date3: string;
  g_href1: string;
  g_href2: string;
  g_href3: string;
  g_json1: string;
  g_json2: string;
  g_json3: string;
  e_price: string;
  a_price: string;
  m_price: string;
  e_ship: string;
  a_ship: string;
  m_ship: string;
  g_price1: string;
  g_price2: string;
  g_price3: string;
  g_ship1: string;
  g_ship2: string;
  g_ship3: string;
}> = writable({
  berry: "berry",
  barcode: "barcode",
  supplierCode: "supplierCode",
  supplier: "supplier",
  description: "description",
  image: "no-image.png",
  amazonLast: "amazonLast",
  ebayLast: "ebayLast",
  googleLast: "googleLast",
  e_date: "e_date",
  a_date: "a_date",
  m_date: "m_date",
  a_href: "a_href",
  e_href: "e_href",
  m_href: "m_href",
  e_json: "e_json",
  a_json: "a_json",
  m_json: "m_json",
  g_date1: "g_date1",
  g_date2: "g_date2",
  g_date3: "g_date3",
  g_href1: "g_href1",
  g_href2: "g_href2",
  g_href3: "g_href3",
  g_json1: "g_json1",
  g_json2: "g_json2",
  g_json3: "g_json3",
  e_price: "e_price",
  a_price: "a_price",
  m_price: "m_price",
  e_ship: "e_ship",
  a_ship: "a_ship",
  m_ship: "m_ship",
  g_price1: "g_price1",
  g_price2: "g_price2",
  g_price3: "g_price3",
  g_ship1: "g_ship1",
  g_ship2: "g_ship2",
  g_ship3: "g_ship3",
});

/**
 * An array of column names that should be automatically hidden when displaying data.
 * This is used to set the `hidden` store's value when `rows` changes.
 * 
 * @type {string[]}
 * @default A predefined list of column names to hide
 */
const autoHide: string[] = [
  "g_ship1",
  "g_ship2",
  "g_ship3",
  "image",
  "amazonLast",
  "ebayLast",
  "googleLast",
  "manoLast",
  "asin_validated",
  "json",
  "e_date",
  "a_date",
  "a_href",
  "e_href",
  "e_json",
  "a_json",
  "g_href1",
  "g_href2",
  "g_href3",
  "g_json1",
  "g_json2",
  "g_json3",
  "g_date1",
  "g_date2",
  "g_date3",
  "supplier",
  "supplierCode",
  "barcode",
  "m_date",
  "m_href",
  "m_json",
];

/**
 * Subscribes to changes in the `rows` store and updates the `hidden` store
 * with the list of columns to automatically hide.
 * 
 * @param {any[]} rows - The current value of the rows store.
 */
rows.subscribe((rows) => {
  hidden.set(autoHide);
});

import { writable, type Writable, get } from "svelte/store";

export const mode = writable("ebay");

export const rows: Writable<any[]> = writable([]);
export const filteredRows: Writable<any[]> = writable([]);
export const hidden: Writable<string[]> = writable([]);
export const limit: Writable<number> = writable(10);
export const berry = writable({
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

//SELECT p.*, e.*, e.date as e_date, a.*, a.date as a_date, e.price as ebay_price, a.price as amazon_price, e.shipping as ebay_ship, a.shipping as amazon_ship

const autoHide = [
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
rows.subscribe((rows) => {
  hidden.set(autoHide);
});

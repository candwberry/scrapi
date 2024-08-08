import { error } from '@sveltejs/kit';

export async function load({ fetch }) {
  // Fetch the product fields from the database
  const productFieldsResponse = await fetch(`/api/db?query=${encodeURIComponent('SELECT name FROM PRAGMA_TABLE_INFO("products")')}`);
  let productFields = await productFieldsResponse.json();

  // Filter and map fields
  productFields = productFields
    .filter((field: { name: string }) => !["ebayLast", "amazonLast", "googleLast", "supplier", "berry"].includes(field.name))
    .map((field: { name: any }) => field.name);

  // Check the batch status for eBay, Amazon, Google
  let ebay, amazon, google;
  try {
    const ebayResponse = await fetch("/api/ebay?batch=check");
    ebay = (await ebayResponse.json())["isBatchProcessing"];

    const amazonResponse = await fetch("/api/amazon?batch=check");
    amazon = (await amazonResponse.json())["isBatchProcessing"];

    const googleResponse = await fetch("/api/google?batch=check");
    google = (await googleResponse.json())["isBatchProcessing"];
  } catch (err) {
    throw error(500, 'Failed to check batch status');
  }

  return {
    productFields,
  };
}

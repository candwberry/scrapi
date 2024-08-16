import type { RequestHandler } from "@sveltejs/kit";
import {
  getDecentTime,
  initBrowser,
  consolelog,
  consoleerror,
  ok,
  err,
} from "$lib/utils";
import type { Browser, HTTPRequest } from "puppeteer";

// Amazon Batch API Status.
const isBatchProcessing: {
  status: boolean;
  total: number;
  processed: number;
  logs: { error: string; info: string }[];
  estimatedTime: string;
} = {
  status: false,
  total: 0,
  processed: 0,
  logs: [],
  estimatedTime: "0s",
};

// Shortcuts for logging to server AND client.
function clog(msg: string) {
  consolelog(msg, isBatchProcessing);
}
function cerr(msg: string, error: any) {
  consoleerror(msg, error, isBatchProcessing);
}

let browser: Browser | undefined;

async function amazon(query: string, asin?: string) {
  let page;
  try {
    if (!browser || !browser.connected) {
      browser = await initBrowser(isBatchProcessing);

      // await a promise that resolves on browser.connected OR 5 seconds
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject("Timeout"), 1000);
        if (!browser) return reject("Browser is undefined");
        browser.once("disconnected", () => reject("Disconnected"));
        browser.once("connected", () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      }).catch((err) => cerr("Error connecting to browser.", err));
    }
    if (browser === undefined) {
      cerr("Browser is undefined", "Cannot launch.");
      return [];
    }

    clog("Opening new page...");
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(1000);

    // This blocks requests to unnecessary resources, e.g. images, stylesheets, to speed up loading of the page.
    clog("Setting request interception...");
    await page.setRequestInterception(true);
    page.on("request", (req: HTTPRequest) => {
      const resourceType = req.resourceType();
      const url = req.url();
      if (
        ["image", "stylesheet", "font", "media", "websocket"].includes(
          resourceType,
        ) ||
        url.startsWith("https://www.google-analytics.com") ||
        url.startsWith("https://www.googletagmanager.com") ||
        url.startsWith("https://www.facebook.com") ||
        url.startsWith("https://connect.facebook.net")
      )
        req.abort();
      else req.continue();
    });

    // If the product has a validated ASIN, we can skip the Amazon search, and jump straight to the product page.
    if (asin) {
      clog(`Using ASIN: ${asin}.`);
      await page.goto(`https://www.amazon.co.uk/dp/${asin}`, {
        waitUntil: "domcontentloaded",
      });

      let title = "";
      let price = "0";
      let shipping = "0";
      let thumbnail = "";
      let href = "";

      try {
        title = await page.$eval(
          "#productTitle",
          (node) => node?.textContent?.trim() || "",
        );
      } catch (error) {
        clog("Error fetching title.");
      }

      try {
        price = await page.$eval(".a-price", (node) => {
          let priceText = node.textContent || "0";
          return priceText
            .replace("..", ".")
            .replaceAll("£", "")
            .slice(priceText.length / 2 - 1);
        });
      } catch (error) {
        clog("Error fetching price.");
      }

      try {
        shipping = await page.$eval(
          "#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE",
          (node) => node?.textContent?.trim() ?? "",
        );
      } catch (error) {
        clog("Error fetching shipping.");
      }

      try {
        thumbnail = await page.$eval(
          "#imgTagWrapperId",
          (node: Element) => (node.children[0] as HTMLImageElement)?.src || "",
        );
      } catch (error) {
        clog("Error fetching thumbnail.");
      }

      if (shipping.toLowerCase().includes("free delivery")) shipping = "0";
      href = page.url();

      return [
        {
          asin,
          title,
          price,
          shipping,
          thumbnail,
          href,
        },
      ];
    }

    clog(`Searching for: ${query}`);
    await page.goto(
      `https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss_2`,
      { waitUntil: "domcontentloaded" },
    );
    const results = await page.$$(
      "[data-asin][data-component-type='s-search-result']",
    );

    const items = [];
    for (let i = 0; i < results.length; i++) {
      try {
        try{
          let sponsored = await results[i].$eval(
            ".puis-sponsored-label-info-icon",
            (node) => node.textContent,
          );
          if (sponsored) continue;
        } catch (err) {
          // element doesn't exist thats expected for a non-sponseored item
        }

        let asin =
          (await results[i].evaluate((el) => el.getAttribute("data-asin"))) ||
          "";
        let title =
          (await results[i].$eval(
            ".a-text-normal",
            (node) => node.textContent,
          )) ?? "";
        let price =
          (await results[i].$eval(".a-price", (node) => node.textContent)) ??
          "";
        let shipping = "-1";

        try {
          shipping =
            (await results[i].$eval(
              "[aria-label*='delivery' i]",
              (node) => node.textContent,
            )) ?? "";
        } catch (err) {
          cerr("Error getting shipping.", err);
        }

        let thumbnail =
          (await results[i].$eval("img.s-image", (node) => node.src)) ?? "";
        let href =
          (await results[i].$eval("a.a-link-normal", (node) => node.href)) ??
          "";
        clog(price);

        if (shipping.toLowerCase().includes("free delivery")) shipping = "0.00";
        price = price
          .replace("..", ".")
          .replaceAll("£", "")
          .slice(price.length / 2 - 1);
        let priceSplit = price.split(".");
        if (priceSplit.length > 1) if (priceSplit[1].length === 1) price += "0";
        items.push({
          asin: asin.slice(-10),
          title,
          price,
          shipping,
          thumbnail,
          href,
        });
      } catch (err) {
        cerr(`Error processing item ${i}.`, err);
      }
    }

    clog(`Found ${items.length} items.`);
    return items;
  } catch (err) {
    cerr(`Error in amazon function for query "${query}".`, err);
    return [];
  } finally {
    if (page)
      await page.close().catch((err) => cerr("Error closing page.", err));
  }
}

export const GET: RequestHandler = async ({ request, url }) => {
  const query = url.searchParams.get("query") ?? "";
  const batch = url.searchParams.get("batch") ?? "false";

  if (batch === "stop") {
    isBatchProcessing.status = false;
    return ok({ isBatchProcessing });
  }
  if (batch === "check") {
    return ok({ isBatchProcessing });
  }

  try {
    if (query.trim().length === 0) {
      return err("No query provided", { error: "No query provided" });
    }

    const items = await amazon(query);
    const firstItem = items.length > 0 ? items[0] : null;
    const otherItems = items.slice(1);

    return ok({ first: firstItem, others: otherItems });
  } catch (error) {
    cerr("Error in GET handler.", error);
    return err("An error occurred while processing your request.", { error });
  } finally {
    if (browser)
      await browser
        .close()
        .catch((error) => cerr("Error closing browser.", error));
  }
};

export const POST: RequestHandler = async ({ request, url }) => {
  if (isBatchProcessing.status)
    return err("Batch processing is already in progress.", {
      error: "Batch processing is already in progress.",
    });
  const body = await request.json();
  const baseUrl = url.origin;
  let products = [];

  if (Array.isArray(body)) products = body;
  else
    products = await fetch(
      `${baseUrl}/api/db/products?orderby=amazonLast&order=asc`,
    ).then((resp) => resp.json());

  const result: { berry: any; price: any; shipping: any; href: any }[] = [];

  try {
    const startTime = Date.now();
    isBatchProcessing.status = true;
    isBatchProcessing.total = products.length ?? 0;
    isBatchProcessing.processed = 0;
    isBatchProcessing.logs = [];

    // Don't increase this. It makes the browser open 90 pages at once, I need to fix this before increasing. TODO.
    const batchSize = 1;
    const totalProducts = products.length;
    const numBatches = Math.ceil(totalProducts / batchSize);
    for (let i = 0; i < numBatches; i++) {
      const currentTime = Date.now();
      const timeElapsed = currentTime - startTime;
      const timePerItem = timeElapsed / (isBatchProcessing.processed + 0.1);
      const timeRemaining =
        timePerItem * (totalProducts - isBatchProcessing.processed);
      isBatchProcessing.estimatedTime = getDecentTime(timeRemaining);

      if (!isBatchProcessing.status) return ok(isBatchProcessing);

      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, totalProducts);
      const batchProducts = products.slice(start, end);
      isBatchProcessing.processed += batchProducts.length;

      const batchPromises = batchProducts.map(
        async (product: {
          asin: any;
          asin_validated: any;
          json: string;
          barcode: string;
          description: string;
          berry: any;
          supplierCode: any;
        }) => {
          try {
            let asin = product.asin ?? "";
            let asin_validated = product.asin_validated;

            let query = (product.barcode && product.barcode !== null && product.barcode.replaceAll("null", "").replaceAll(" ", "").length > 0) 
            ? product.barcode :
            (product.description && product.description !== null && product.description.replaceAll("null", "").replaceAll(" ", "").length > 0) 
            ? product.description : 
            (product.supplierCode && product.supplierCode !== null && product.supplierCode.replaceAll("null", "").replaceAll(" ", "").length > 0)
            ? product.supplierCode : null;

            let items = [];
            if (asin_validated !== 0)
              items = await amazon(
                query,
                asin,
              );
            else
              items = await amazon(
                query
              );

            if (!(items.length > 0 && items[0].price !== "0")) { 
                if (query == product.barcode) {
                  query = product.description;
                  items = await amazon(
                    query
                  );
                }
            }
            if (items.length > 0 && items[0].price !== "0") { 
              const item = items[0];
              const price = item.price;
              let shipping = item.shipping;
              const href = item.href;

              if (shipping.includes("£")) {
                shipping = shipping.split("£")[1].split(" ")[0];
              }

              const now = Date.now();
              const thisResult = {
                berry: product.berry,
                price,
                shipping,
                href,
              };

              //// VALIDATION: Here we could do validation that the product is anywhere close.


              //

              await fetch(`${baseUrl}/api/db/prices`, {
                method: "PUT",
                body: JSON.stringify([
                  {
                    berry: product.berry,
                    price,
                    shipping,
                    date: now,
                    shop: "amazon",
                    image: item.thumbnail,
                    href,
                  },
                ]),
                headers: {
                  "Content-Type": "application/json",
                },
              });

              await fetch(`${baseUrl}/api/db/products`, {
                method: "PUT",
                body: JSON.stringify([
                  {
                    berry: product.berry,
                    amazonLast: now,
                    asin: item.asin,
                    asin_validated: asin !== item.asin ? 0 : asin_validated,
                  },
                ]),
                headers: {
                  "Content-Type": "application/json",
                },
              });

              result.push(thisResult);
            }
          } catch (err) {
            cerr(`Error processing product ${product.berry}.`, err);
          }
        },
      );

      await Promise.all(batchPromises);
    }

    return ok(result);
  } catch (error) {
    cerr("Error in batch processing:", error);
  } finally {
    isBatchProcessing.status = false;
    return ok(result);
  }
};

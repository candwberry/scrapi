import type { RequestHandler } from "@sveltejs/kit";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import { initBrowser } from "$lib/utils";
import { db } from "$lib/database";
puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin());

let browser: Browser | undefined;
let page: Page | undefined;

async function initializePage(
  asin: string,
  title: string,
  supplier: string,
  supplierCode: string,
) {
  try {
    if (browser === undefined) browser = await initBrowser(undefined, true);
    if (browser === undefined) throw new Error("Browser not initialized");
    if (page === undefined) page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    page.evaluate(() => {
      document.body.style.zoom = "0.5";
    });
    let url = `https://www.amazon.co.uk/dp/${asin}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function getScreenshot() {
  return await page.screenshot({ encoding: "base64" });
}

async function getTitle() {
  if (!page) throw new Error("Page not initialized");
  return await page.title();
}

async function performMouseAction(
  x: number,
  y: number,
  action: "move" | "click",
) {
  if (!page) throw new Error("Page not initialized");
  await page.mouse.move(x, y);
  if (action === "click") {
    await page.mouse.click(x, y);
  }
  return await getScreenshot();
}

async function performKeyboardAction(text: string) {
  if (!page) throw new Error("Page not initialized");
  await page.keyboard.type(text);
  return await getScreenshot();
}

export const GET: RequestHandler = async ({ url }) => {
  const title = url.searchParams.get("title") || "";
  const supplier = url.searchParams.get("supplier") || "";
  const supplierCode = url.searchParams.get("supplierCode") || "";
  const getImage = url.searchParams.get("getImage") === "true";
  const berry = url.searchParams.get("berry") || "";
  let asin = url.searchParams.get("asin") || "";

  let result = null;
  if (berry === "next") {
    // find a berry that needs validation. if there are none, just error.
    result = db
      .query(`SELECT * FROM products WHERE asin_validated = 0 LIMIT 1`)
      .all();
    if (result.length === 0) {
      console.error("No berries to validate");
      return new Response("No berries to validate", { status: 404 });
    }
  }
  try {
    if (result == null)
      result = db.query(`SELECT * FROM products WHERE berry = $1`).all(berry);
    if (asin === "") asin = result[0].asin;
    if (page === undefined) {
      await initializePage(asin, title, supplier, supplierCode);
    } else {
      await page.goto(`https://www.amazon.co.uk/dp/${asin}`, {
        waitUntil: "domcontentloaded",
      });
    }

    if (getImage) {
      const screenshot = await getScreenshot();

      // also get the product with the asin and return those details.
      /*
                            their_description = details.their_description || '';
                our_description = details.our_description || '';
                supplierCode = details.supplierCode || '';
                supplier = details.supplier || '';
                barcode = details.barcode || '';
*/

      return new Response(
        JSON.stringify({
          screenshot,
          details: {
            our_description: result[0].description || "",
            supplierCode: result[0].supplierCode || "",
            supplier: result[0].supplier || "",
            barcode: result[0].barcode || "",
            asin,
            berry: result[0].berry || "",
            their_description: await getTitle(),
          },
        }),
        {
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Other GET logic (if needed)
    return new Response("Page initialized", { status: 200 });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  // body should have body.asin, body.berry. So validate the
  db.query(
    `UPDATE products SET asin = $1, asin_validated = ${Date.now()} WHERE berry = $2`,
  ).all(body.asin, body.berry);
  return new Response("Updated", { status: 200 });
};

// on sigkill, close the browser
process.on("SIGINT", async () => {
  if (browser) {
    await browser.close();
  }
});

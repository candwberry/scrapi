import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { Browser, HTTPRequest } from 'puppeteer';
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";

puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
}));

let browser: Browser;
const isBatchProcessing = {
    status: false,
    total: 0,
    processed: 0,
    errorArray: [
    ],
};


async function initBrowser() {
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 1000000
        });
    } catch (err) {
        console.error("Failed to launch browser:", err);
        throw err;
    }
}

async function amazon(query: string) {
    let page;
    try {
        if (!browser || !browser.connected) {
            await initBrowser();
        }

        page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', (req: HTTPRequest) => {
            const resourceType = req.resourceType();
            const url = req.url();
            if (['image', 'stylesheet', 'font', 'media', 'websocket'].includes(resourceType) ||
                url.startsWith('https://www.google-analytics.com') ||
                url.startsWith('https://www.googletagmanager.com') ||
                url.startsWith('https://www.facebook.com') ||
                url.startsWith('https://connect.facebook.net'))
                req.abort();
            else
                req.continue();
        });

        await page.goto(`https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss_2`, { waitUntil: "domcontentloaded" });
        const results = await page.$$("[data-asin][data-component-type='s-search-result']");

        const items = [];
        for (let i = 0; i < results.length; i++) {
            try {
                let title = await results[i].$eval('.a-text-normal', node => node.textContent) ?? "NOT FOUND";
                let price = await results[i].$eval('.a-price', node => node.textContent) ?? "-1";
                //let decimal = await results[i].$eval('.a-price-fraction', node => node.textContent) ?? "00";
                let shipping = "-1";
                try{
                    shipping = await results[i].$eval("[aria-label*='delivery' i]", node => node.textContent) ?? "-1";
                }catch(err){
                    console.error("Error getting shipping", err);
                }
                let thumbnail = await results[i].$eval('img.s-image', node => node.src) ?? "berry.png";
                let href = await results[i].$eval('a.a-link-normal', node => node.href) ?? "about:blank";
                console.log(price);

                // Validation.
                if (shipping.toLowerCase().includes("free delivery")) shipping = "0.00";

                items.push({ title, price: `${price}`.replace("..", ".").replaceAll('£', '').slice(price.length / 2 - 1), shipping, thumbnail, href });
            } catch (err) {
                console.error(`Error processing item ${i}:`, err);
            }
        }

        return items;
    } catch (err) {
        console.error(`Error in amazon function for query "${query}":`, err);
        return [];
    } finally {
        if (page) {
            await page.close().catch(err => console.error("Error closing page:", err));
        }
    }
}

export const GET: RequestHandler = async ({ request, url }) => {
    const baseUrl = url.origin;
    const query = url.searchParams.get("query") ?? "";
    const batch = url.searchParams.get("batch") ?? "false";

    if (batch === "stop") {
        isBatchProcessing.status = false;
        return new Response(JSON.stringify({ isBatchProcessing }), {
            headers: {
                "content-type": "application/json"
            }
        });
    }
    if (batch === "check") {
        //console.log(isBatchProcessing);
        return new Response(JSON.stringify({ isBatchProcessing }), {
            headers: {
                "content-type": "application/json"
            }
        });
    }
    
    try {
        if (batch === "true") {
                try {
                const resp = await fetch(`${baseUrl}/api/db/products?orderby=lastUpdated&order=desc`);
                const products = await resp.json();
                isBatchProcessing.status = true;
                isBatchProcessing.total = products.length;
                isBatchProcessing.processed = 0;
                isBatchProcessing.errorArray = [];
    
                const batchSize = 1; // increasing this makes
                // the browser available check fail for whatever number that is, so youll get N browsers opening at once
                // we can prevent this by checking if a browser is loading, but its just easier to do this anyway i would think.
                const totalProducts = products.length;
                const numBatches = Math.ceil(totalProducts / batchSize);

                for (let i = 0; i < numBatches; i++) {
                    if (!isBatchProcessing.status) {
                        return new Response(JSON.stringify({ isBatchProcessing }), {
                            headers: {
                                "content-type": "application/json"
                            }
                        });
                    }
                    const start = i * batchSize;
                    const end = Math.min((i + 1) * batchSize, totalProducts);
                    const batchProducts = products.slice(start, end);
                    isBatchProcessing.processed += batchProducts.length;

                    const batchPromises = batchProducts.map(async (product: { berry: string; title: string; barcode: string; supplierCode: string; supplier: string; }) => {
                        try {
                            const items = await amazon(product.barcode === "" ? product.title : product.barcode);
                            console.log(items);

                            if (items.length > 0) {
                                const item = items[0];
                                const price = item.price;
                                const shipping = item.shipping;
                                const href = item.href;
                                const body = JSON.stringify([{ berry: product.berry, price, shipping, date: Date.now(), shop: "amazon", href }]);

                                await fetch(`${baseUrl}/api/db/prices`, {
                                    method: "PUT",
                                    body: body,
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                });
                                await fetch(`${baseUrl}/api/db/products`, {
                                    method: "PUT",
                                    body: JSON.stringify([{
                                        berry: product.berry,
                                        barcode: product.barcode,
                                        supplierCode: product.supplierCode,
                                        supplier: product.supplier,
                                        title: product.title,
                                        lastUpdated: Date.now()
                                    }]),
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                });
                            }
                        } catch (err) {
                            console.error(`Error processing product ${product.berry}:`, err);
                        }
                    });

                    await Promise.all(batchPromises);
                }

                return new Response(JSON.stringify({ message: "Batch processing completed" }), {
                    headers: {
                        "content-type": "application/json"
                    }
                });
            } catch (err) {
                console.error("Error in batch processing:", err);
                return new Response(JSON.stringify({ error: "An error occurred while processing your request" }), {
                    status: 500,
                    headers: {
                        "content-type": "application/json"
                    }
                });
            } finally {
                isBatchProcessing.status = false;
            }
        }

        if (query.trim().length === 0) {
            error(400, "No query provided");
        }

        const items = await amazon(query);
        
        const firstItem = items.length > 0 ? items[0] : null;
        const otherItems = items.slice(1);

        return new Response(JSON.stringify({ first: firstItem, others: otherItems }), {
            headers: {
                'content-type': 'application/json'
            }
        });
    } catch (err) {
        console.error("Error in GET handler:", err);
        return new Response(JSON.stringify({ error: "An error occurred while processing your request" }), {
            status: 500,
            headers: {
                'content-type': 'application/json'
            }
        });
    } finally {
        if (browser) {
            await browser.close().catch(err => console.error("Error closing browser:", err));
        }
    }
};
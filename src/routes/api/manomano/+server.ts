import type { RequestHandler } from '@sveltejs/kit';
import type { Browser, HTTPRequest, Page } from 'puppeteer';
import {
    getDecentTime,
    initBrowser,
    consolelog,
    consoleerror,
    ok,
    err
} from '$lib/utils';

// Our API Status
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
    estimatedTime: '0s',
};

// Browser instance
let browser: Browser | undefined;

// Shortcuts for logging to server and client.
function clog(msg: string) { consolelog(msg, isBatchProcessing); }
function cerr(msg: string, error: any) { consoleerror(msg, error, isBatchProcessing); }

async function manomano(query: string) {
    let page: Page | undefined;
    try {
        if (!browser || !browser.connected) {
            browser = await initBrowser(isBatchProcessing);

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
    } catch (error) {
        cerr('Error connecting to browser', error);
    }

    if (browser === undefined) {
        cerr("Browser is undefined", "Cannot launch.");
        return [];
    }

    try {
        clog('Launching page...');
        page = await browser.newPage();
        page.setDefaultNavigationTimeout(5000);

        clog('Setting request interception...');
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

        clog(`Searching for query: ${query}`);
        page.goto(`https://www.manomano.co.uk/search/${encodeURIComponent(query)}`, {
            waitUntil: "domcontentloaded",
        });

        // Results are the anchor children of the first child of the fourth child of #listing-layout
        await page.waitForSelector('#listing-layout');
        
        const results = await page.evaluate(() => {
            const listingLayout = document.querySelector('#listing-layout');
            if (!listingLayout) return [];

            const firstFirstChild = listingLayout.children[0];
            if (!firstFirstChild) return [];

            const fourthChild = firstFirstChild.children[3];
            if (!fourthChild) return [];

            const firstChild = fourthChild.children[0];
            if (!firstChild) return [];

            const anchors = firstChild.querySelectorAll('a');
            return Array.from(anchors).map((anchor) => {
                try {
                    // Ignore those with style.includes display: none
                    if (anchor.style.display.includes('none')) return {
                        title: '',
                        price: '0',
                        shipping: '-1',
                        href: '',
                        thumbnail: '',
                    };

                    const title = anchor.getAttribute('title') ?? '';
                    const href = anchor.getAttribute('href') ?? '';
                    const thumbnail = anchor.querySelector('img')?.getAttribute('src') ?? '';

                    // Price is 'data-testid="price=main"', returns as whole£decimal.
                    let price = anchor.querySelector('[data-testid="price-main"]')?.textContent ?? '0';
                    price = price.replace('£', '.').replace(',', '');

                    // Shipping is either free or you have to go into the product.
                    const shipping = anchor.querySelector('[data-testid="free-delivery-label"]') ? '0' : '-1'; 

                    return { title, price, shipping, href: `https://www.manomano.co.uk${href}`, thumbnail };
                } catch (error) {
                    return {
                        title: '',
                        price: '0',
                        shipping: '-1',
                        href: '',
                        thumbnail: '',
                    }
                }
            });
        })

        clog(`Found ${results.length} results.`);
        return results;
    } catch (error) {
        cerr('Error processing query', error);
        return [];
    } finally {
        //if (page) await page.close().then(() => clog('Page closed.')).catch((err) => cerr('Error closing page', err));
    }
}

export const GET: RequestHandler = async ({ request, url }) => {
    const batch = url.searchParams.get('batch') ?? '';

    if (batch === 'stop') {
        isBatchProcessing.status = false;
        const isBatchProcessingCopy = { ...isBatchProcessing };
        isBatchProcessing.logs = [];
        return ok({ isBatchProcessingCopy });
    }

    if (batch === 'check') {
        const isBatchProcessingCopy = { ...isBatchProcessing };
        isBatchProcessing.logs = [];
        return ok({ isBatchProcessingCopy });
    }

    return err('Invalid request', { error: 'Invalid request' });
}

export const POST: RequestHandler = async ({ request, url }) => {
    if (isBatchProcessing.status)
        return err('Batch processing is already in progress.', {
            error: 'Batch processing is already in progress.',
        });

    const body = await request.json();
    let products = [];

    if (Array.isArray(body)) products = body;
    else products = await fetch(`${url.origin}/api/db/products?orderby=manoLast&order=asc`)
        .then((res) => res.json())

    const result: { berry: any; price: any; shipping: any; href: any; }[] = [];

    try {
        // Get current time for working out estimates.
        const start = Date.now();

        // Setup status for client
        const totalProducts = products.length;
        isBatchProcessing.status = true;
        isBatchProcessing.total = totalProducts;
        isBatchProcessing.processed = 0;
        isBatchProcessing.logs = [];

        const batchSize = 1;
        const numBatches = Math.ceil(totalProducts / batchSize);

        for (let i = 0; i < numBatches; i++) {
            // Get time estimate.
            const now = Date.now();
            const elapsed = now - start;
            const timePerItem = elapsed / (isBatchProcessing.processed + 0.1);
            const timeRemaining = timePerItem * (totalProducts - i);
            isBatchProcessing.estimatedTime = getDecentTime(timeRemaining);

            if (!isBatchProcessing.status) { return ok({}); }

            const begin = i * batchSize;
            const end = Math.min((i + 1) * batchSize, totalProducts);
            const batch = products.slice(begin, end);
            isBatchProcessing.processed += batch.length;

            const promises = batch.map(async (product: { barcode: string, description: string, supplierCode: string, berry: string }) => {
                try {
                    let query = (product.barcode && product.barcode !== null && product.barcode.replaceAll('null', '').replaceAll(' ', '').length > 0)
                        ? product.barcode :
                        (product.description && product.description !== null && product.description.replaceAll('null', '').replaceAll(' ', '').length > 0)
                            ? product.description :
                            (product.supplierCode && product.supplierCode !== null && product.supplierCode.replaceAll('null', '').replaceAll(' ', '').length > 0)
                                ? product.supplierCode : null;

                    if (!query) return;
                    let items: { price: any; shipping: any; title: any; href: any; thumbnail: any; }[] = [];
                    items = await manomano(query);

                    if (!(items.length > 0 && items[0].price !== '0')) {
                        if (query == product.barcode) {
                            query = product.description;
                            items = await manomano(
                                query
                            );
                        }
                    }
                    
                    // Remove bad items.
                    while (items.length > 0 && items[0].price === '0') {
                        items.shift();
                    }
                    
                    if (items.length > 0) {
                        const item = items[0];
                        const price = item.price;
                        const shipping = item.shipping;
                        const title = item.title;
                        const href = item.href;

                        // Validate and clean these values.

                        result.push({
                            berry: product.berry,
                            price: price,
                            shipping: shipping,
                            href: item.href,
                        });

                        await fetch(`${url.origin}/api/db/prices`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify([{
                                berry: product.berry,
                                price,
                                shipping,
                                date: now,
                                shop: 'manomano',
                                image: item.thumbnail,
                                href
                            }])
                        });

                        await fetch(`${url.origin}/api/db/products`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify([
                                {
                                    berry: product.berry,
                                    manoLast: now,
                                },
                            ])
                        });
                    }
                } catch (error) {
                    cerr('Error processing product', error);
                }
            });

            await Promise.all(promises);
        }

        isBatchProcessing.status = false;
        return ok(result);
    } catch (error) {
        cerr('Error processing products', error);
    } finally {
        isBatchProcessing.status = false;
        if (browser) await browser.close().then(() => clog('Browser closed.')).catch((err) => cerr('Error closing browser', err));
        return ok(result);
    }
}
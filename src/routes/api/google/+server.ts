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
    estimatedTime: "0s"
};

function getDecentTime(time: number, regex?: string) {
    if (time < 1000) return `${time.toFixed(0)}ms`;
    if (time < 60000) return `${(time / 1000).toFixed(0)}s`;
    if (time < 3600000) return `${(time / 60000).toFixed(0)}m`;
    return `${(time / 3600000).toFixed(0)}h`;
}

async function findPrice(page: Page, validatedRegex?: string): Promise<{ price: string; priceFound: string; }> {
    let price: string = "99999";
    // (regex || schema || meta || class || selector || none)
    let priceFound = "none";

    if (validatedRegex) {
        if (validatedRegex.startsWith("regex:")) {
            validatedRegex = validatedRegex.replace("regex:", "");
            // Its ACTUALLY a regex.
            const regex = new RegExp(validatedRegex);
            const content = await page.content();
            const match = content.match(regex);
            if (match && match[1]) {
                price = match[1];
                priceFound = "regex";
            }
        } else {
            // Its a selector.
            const priceElement = await page.$(validatedRegex);
            if (priceElement) {
                const textContent = await priceElement.evaluate((el: Element) => el.textContent);
                if (textContent) {
                    price = textContent.replace(/[^0-9.,]/g, '');
                    priceFound = "selector";
                }
            }
        }
    };

    const scripts: ElementHandle<Element>[] = await page.$$("script[type='application/ld+json']");
    for (const script of scripts) {
        const content: string | null = await script.evaluate(el => el.textContent);
        if (!content) continue;
        try {
            const jsonData = JSON.parse(content);

            const findProduct = (obj: any): any => {
                if (obj['@type'] !== undefined && obj['@type'].toLowerCase() === 'product') {
                    return obj;
                }
                if (typeof obj === 'object' && obj !== null) {
                    for (const value of Object.values(obj)) {
                        const result = findProduct(value);
                        if (result) return result;
                    }
                }
                return null;
            };

            const productEntity = findProduct(jsonData);
            if (productEntity) {
                if (productEntity.price) {
                    price = productEntity.price.toString(); // just being safe.
                    console.log("HELLO");
                    console.log(price);
                    priceFound = "schema";
                }
                if (productEntity.offers?.price) {
                    price = productEntity.offers.price.toString(); // just being safe.
                    console.log("HELLO");
                    console.log(price);
                    priceFound = "schema";
                }
                // else offers is an array
                else if (Array.isArray(productEntity.offers)) {
                    const cheapest = Math.min(...productEntity.offers.map((offer: any) => parseFloat(offer.price) || 99999));
                    price = cheapest.toString();
                    console.log("HELLO");
                    console.log(price);
                    priceFound = "schema";
                }
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }

        if (price === "99999") {
            // First fallback: "price": NUMBER
            const priceRegex = /"price"\s*:\s*("?\d+(?:\.\d+)?"?)/;
            const priceMatch = content?.match(priceRegex);
            if (priceMatch && priceMatch[1]) {
                price = priceMatch[1].replace(/"/g, '');
                priceFound = "schema";
            } else {
                // Second fallback: "raw":{"withTax":NUMBER}
                const rawWithTaxRegex = /"raw"\s*:\s*{\s*"withTax"\s*:\s*(\d+(?:\.\d+)?)/;
                const rawWithTaxMatch = content?.match(rawWithTaxRegex);
                if (rawWithTaxMatch && rawWithTaxMatch[1]) {
                    price = rawWithTaxMatch[1];
                    priceFound = "schema";
                }
            }
        } 
        }

        //

    // if it is 99999 then look for <meta property="product:price:amount" content=PRICE>
    if (price === undefined || price == null) price = "99999";
    if (price === "99999") {
        const metas: ElementHandle<Element>[] = await page.$$("meta[property='product:price:amount']");
        for (let meta of metas) {
            const metaPrice = await meta.evaluate((el: Element) => (el as HTMLMetaElement).content);
            if (metaPrice) {
                price = metaPrice;
                priceFound = "meta";
                break;
            }
        }
    }

    if (price === "99999") {
        // last chance, look for <element class="<ANYCHARACTERS>price<ANYCHARACTERS>">
        const prices: ElementHandle<Element>[] = await page.$$('*[class*="price" i], *[id*="price" i]');
        let expensivest: number = -99999;
        
        for (let priceElement of prices) {
            const textContent = await priceElement.evaluate((el: Element) => el.textContent);
            if (!textContent) continue;
            const num = textContent.replace(/[£\s]/g, "");
            if (num === "") continue;
            try {
                if (parseFloat(num) > expensivest) {
                    expensivest = parseFloat(num);
                    price = num;
                    priceFound = "class";
                    break; // let's actually just do the first element instead of the expensivest.
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    price = price.replace(/[^0-9.,]/g, '');
    price = isNaN(parseFloat(price)) ? "99999" : parseFloat(price).toFixed(2);

    return {
        price,
        priceFound
    };
}

async function initBrowser() {
    try {
        browser = await puppeteer.launch({
            //executablePath: '/usr/bin/chromium',
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            timeout: 30000
        });
    } catch (err) {
        console.error("Failed to launch browser:", err);
        throw err;
    };
};

function extractDomain(url) {
    url = url.replace(/^(https?:\/\/)?/, '').replace(".co.uk", ".couk");

    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (ipv4Regex.test(url) || ipv6Regex.test(url)) {
        return url; 
    }

    url = url.replace(/^www\./, '');

    const parts = url.split('.');

    if (parts.length > 2 && /^(com|org|net|edu|gov|co)$/.test(parts[parts.length - 1])) {
        return parts[parts.length - 3];
    }
    else if (parts.length >= 3) {
        return parts[parts.length - 2];
    }
    else if (parts.length === 2) {
        return parts[0];
    }
    else {
        return parts[0];
    }
}
async function google(query: string, baseUrl: string) {
    let page;
    try {
        if (!browser || !browser.connected ) 
            await initBrowser();

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

        await page.goto(`https://www.google.com/search?q=${query}`, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => document.body.style.zoom = "25%");
        const searchResults: ElementHandle[] = await page.$$("div[jscontroller='SC7lYd']"); // NOTE: This selector may change.
        console.log(searchResults.length);
        const items: { title: any, price: any, href: any; domain: any}[] = [];

        for (let i = 0; i < searchResults.length; i++) {
            let href;
            let title;
            let domain;
            let price;

            try {
                href = await page.evaluate((el) => el.children[0].children[0].children[0].children[0].children[0].children[0].href, searchResults[i]);
                title = await page.evaluate((el) => el.querySelector('h3')?.textContent, searchResults[i]);
                domain = await page.evaluate((el) => el.children[0].children[0].children[0].children[0].children[0].children[0].children[2].children[0].children[1].children[1].children[0].textContent, searchResults[i]);
                price = await page.evaluate((el) => el.children[0].getElementsByClassName('ChPIuf')[0].children[0].textContent, searchResults[i]);
            } catch (e) {
                // Search result is bugged, not my problem.
            }

            if (price == null || price === undefined || price.includes("rating")) price = "99999";
            if (domain == null || domain === undefined) title = "CNF";
            if (title == null || title === undefined) title = "CNF";
            domain = domain.split(" ")[0].replace("https://", "").replace("www.", "");

            const titleIgnores = ["ebay", "amazon", "cwberry"]; // we don't want our results either.
            for (let ignore of titleIgnores) {
                if (domain.toLowerCase().includes(ignore)) {
                    continue;
                    domain = "\x1b[31m" + domain + " / PRICE: " + price + "\x1b[0m";
                    price = "__IGNORE__";
                }
            }

            price = price.replace("£", "");
            items.push( { title, price, href, domain });
        }

        items.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        for (let item of items) {
            // First let us see if there is a validatedRegex in the database.
            console.log(Date.now());
            const resp = await fetch(`${baseUrl}/api/db/getGoogleRegex?domain=${item.domain}`);
            const body = await resp.json();
            if (body.error && body.error === "No results") {
                // then let us call PUT to getGoogleRegex with the domain, and let us get the shop name by stripping domain from punctuation
                const shop = extractDomain(item.domain);
                const domain = item.domain;
                console.log("So lets put this in the database: " + domain + " " + shop);

                await fetch(`${baseUrl}/api/db/getGoogleRegex`, {
                    method: "PUT",
                    body: JSON.stringify({ domain, shop, lastUsed: 'none' }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                
            }
            /* this is {
            regex: 'regex',
            lastUsed: 'regex' (regex || schema || meta || class || selector)
            
            }*/
            const page2 = await browser.newPage();
            await page2.goto(item.href, { waitUntil: "domcontentloaded" });
            
            let result = {}
            if (body.regex) {
                result = await findPrice(page2, body.regex);
            } else {
              result = await findPrice(page2);
            } 
            page2.close();

            let ourPrice = result.price;
            let priceFound = result.priceFound;

            // okay so with this, we should compare with resp.lastUsed and update DB if different
            if (body.lastUsed !== priceFound) {
                await fetch(`${baseUrl}/api/db/getGoogleRegex`, {
                    method: "PUT",
                    body: JSON.stringify({ domain: item.domain, shop: extractDomain(item.domain), lastUsed: priceFound }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            }

            // if one of them is 1.2 * the other, then we give the vat EXC one theek hai.
            if (ourPrice === "99999") {
                ourPrice = item.price;
            } else if (
                parseFloat(ourPrice).toFixed(2) === (1.2 * parseFloat(item.price)).toFixed(2)
            ) {
                item.price = parseFloat(ourPrice).toFixed(2);
            } else if (
                parseFloat(item.price).toFixed(2) === (1.2 * parseFloat(ourPrice)).toFixed(2)
            ) {
                item.price = (parseFloat(ourPrice) / 1.2).toFixed(2);
            }
        }
        return items;
    } catch (err) {
        console.error(`Error in google function for query "${query}":`, err);
        return [];
    } finally {
        if (page) {
            await page.close().catch(err => console.error("Error closing page:", err));
        }
    };

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
                const startTime = Date.now();
                const resp = await fetch(`${baseUrl}/api/db/products?orderby=googleLast&order=desc`);
                const products = await resp.json();
                isBatchProcessing.status = true;
                isBatchProcessing.total = products.length;
                isBatchProcessing.processed = 0;
                isBatchProcessing.errorArray = [];
    
                const batchSize = 1; 
                const totalProducts = products.length;
                const numBatches = Math.ceil(totalProducts / batchSize);

                for (let i = 0; i < numBatches; i++) {
                    const currentTime = Date.now();
                    const timeElapsed = currentTime - startTime;
                    const timePerItem = timeElapsed / (isBatchProcessing.processed + 0.1);
                    const timeRemaining = timePerItem * (totalProducts - isBatchProcessing.processed);
                    isBatchProcessing.estimatedTime = getDecentTime(timeRemaining);

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

                    const batchPromises = batchProducts.map(async (product: { barcode: string; title: string; berry: any; supplierCode: any; supplier: any; amazonLast: any; ebayLast: any; amazonJSON: any; }) => {
                        try {
                            const items = await google(product.barcode === "" ? product.title : product.barcode, baseUrl);
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
                                        amazonLast: product.amazonLast,
                                        ebayLast: product.ebayLast,
                                        googleLast: Date.now(),
                                        amazonJSON: product.amazonJSON
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

        const itemsitems = await google(query, baseUrl);
        
        const firstItem = itemsitems.length > 0 ? itemsitems[0] : null;
        const otherItems = itemsitems.slice(1);

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
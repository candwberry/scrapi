import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { HTTPRequest } from 'puppeteer';
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";

puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
}));

// check platform is windows
const isWindows = process.platform === 'win32';

let browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 10000
    });

export const GET: RequestHandler = async ({ request, url }) => {
    console.log(request);
    console.log(url.searchParams);
    console.log(url);
    const query = url.searchParams.get("query") ?? "";
    if (query.trim().length === 0) {
        error(400, "No query provided");
    }

    if (browser.connected === false) {
        browser = await puppeteer.launch({
            headless: true
        });
    }
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req: HTTPRequest) => {
        const resourceType: "image" | "stylesheet" | "font" | "media" | "websocket" | "script" | "document" | "texttrack" | "xhr" | "fetch" | "prefetch" | "eventsource" | "manifest" | "signedexchange" | "ping" | "cspviolationreport" | "preflight" | "other" = req.resourceType();
        const url: string = req.url();
        if (['image', 'stylesheet', 'font', 'media', 'websocket'].includes(resourceType) ||
            url.startsWith('https://www.google-analytics.com') ||
            url.startsWith('https://www.googletagmanager.com') ||
            url.startsWith('https://www.facebook.com') ||
            url.startsWith('https://connect.facebook.net'))
            req.abort();
        else
            req.continue();
    });
    await page.goto(`https://www.amazon.co.uk/s?k=${query}&ref=nb_sb_noss_2`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('div[data-asin]');
    const items = await page.evaluate(() => {
        const items = [];
        for (const item of document.querySelectorAll('div[data-asin]')) {
            const title = item.querySelector('span.a-text-normal')?.textContent ?? "Not found";
            const price = item.querySelector('span.a-price-whole')?.textContent ?? "-1";
            const shipping = item.querySelector('span.a-text-bold')?.textContent ?? "-1";
            const thumbnail = item.querySelector('img.s-image')?.src ?? "berry.png";
            const href = item.querySelector('a.a-link-normal')?.href ?? "about:blank";
            items.push({ title, price, shipping, thumbnail, href });
        }
        console.log(items);
        return items;
    });
    await browser.close();

    const firstItem = items.length > 0 ? items[0] : null;
    const otherItems = items.slice(1);

    return new Response(JSON.stringify({ first: firstItem, others: otherItems }), {
        headers: {
            'content-type': 'application/json'
        }
    });
};
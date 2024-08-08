import type { RequestHandler } from '@sveltejs/kit';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import { initBrowser } from '$lib/utils';
puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin());

let browser: Browser | undefined;

async function loadAsin(asin: string, title: string, supplier: string, supplierCode: string) {
    let page: Page | undefined;
    try {
        browser = await initBrowser(undefined, true);
        page = await browser.newPage();
        let url = `https://www.amazon.co.uk/dp/${asin}`;

        // Set up a promise that will resolve when we get the data
        const dataPromise = new Promise((resolve) => {
            page.on('console', (msg) => {
                if (msg.text().startsWith('{"asinFoundForScrapi":')) {
                    resolve(JSON.parse(msg.text()).asinFoundForScrapi);
                }
            });
        });

        // Inject script as soon as possible
        await page.evaluateOnNewDocument((passedTitle, passedSupplier, passedSupplierCode) => {
            function updateTitleAndAsin() {
                const titleElement = document.querySelector('#productTitle');
                const amazonTitle = titleElement ? titleElement.textContent.trim() : 'Title not found';
                let asin = window.location.pathname.split('/')[2];
                if (asin === 'dp') asin = window.location.pathname.split('/')[3];

                const titleDiv = document.getElementById('title-scrapi');
                const asinDiv = document.getElementById('asin-scrapi');
                const supplierDiv = document.getElementById('supplier-scrapi');
                const passedTitleDiv = document.getElementById('passed-title-scrapi');

                if (titleDiv) titleDiv.textContent = amazonTitle;
                if (asinDiv) asinDiv.textContent = asin;
                if (supplierDiv) supplierDiv.textContent = passedSupplier + ' (' + passedSupplierCode + ')';
                if (passedTitleDiv) passedTitleDiv.textContent = passedTitle;
            }

            function injectFloatingBox() {
                if (document.getElementById('scrapi-floating-box')) return;

                const floatingBox = document.createElement('div');
                floatingBox.id = 'scrapi-floating-box';
                floatingBox.style.cssText = `
                    position: fixed;
                    padding: 15px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    bottom: 20px;
                    right: 20px;
                    min-width: 330px;
                    z-index: 100000;
                    border-radius: 10px;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                `;
                floatingBox.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div>
                            <div>Amazon Title:</div>
                            <div id="title-scrapi" style="font-size: 0.9em; margin-bottom: 5px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>
                            <div>Passed Title:</div>
                            <div id="passed-title-scrapi" style="font-size: 0.9em; margin-bottom: 5px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>
                            <div>ASIN:</div>
                            <div id="asin-scrapi" style="font-size: 1.2em; font-weight: bold;"></div>
                            <br>
                            <div id="supplier-scrapi" style="font-size: 1.2em; margin-bottom: 5px; font-weight: bold"></div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button id="confirm-scrapi" style="padding: 8px 15px; font-size: 1em; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 5px;">Confirm</button>
                            <button id="stop-scrapi" style="padding: 8px 15px; font-size: 1em; cursor: pointer; background-color: #f44336; color: white; border: none; border-radius: 5px;">Stop looking</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(floatingBox);

                document.getElementById('confirm-scrapi').addEventListener('click', () => {
                    const amazonTitle = document.getElementById('title-scrapi').textContent;
                    const asin = document.getElementById('asin-scrapi').textContent;
                    console.log(JSON.stringify({
                        asinFoundForScrapi: { amazonTitle, asin }
                    }));
                });
                document.getElementById('stop-scrapi').addEventListener('click', () => {
                    window.close();
                });
            }

            // Run as soon as possible and then every 500ms
            const updateInterval = setInterval(updateTitleAndAsin, 500);
            const injectInterval = setInterval(() => {
                if (document.body) {
                    injectFloatingBox();
                    clearInterval(injectInterval);
                }
            }, 10);

            // Ensure everything is set up when the page loads
            window.addEventListener('load', () => {
                updateTitleAndAsin();
                injectFloatingBox();
            });
        }, title, supplier, supplierCode);

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Wait for the data promise to resolve
        const result = await dataPromise;

        return result;
    } catch (e) {
        console.error(e);
        throw e;
    } finally {
        if (page) await page.close();
    }
}

export const GET: RequestHandler = async ({ url, request }) => {
    let asin = url.searchParams.get('asin') || '';
    let title = url.searchParams.get('title') || '';
    let supplier = url.searchParams.get('supplier') || '';
    let supplierCode = url.searchParams.get('supplierCode') || '';
    console.log(url);
    if (asin === '') {
        return new Response('ASIN is required', { status: 400 });
    }
    console.log("Hello");

    try {
        asin = (asin);
    } catch (e) {
        return new Response('Invalid ASIN', { status: 400 });
    }
    console.log("Hello");


    let berry = url.searchParams.get('berry') || '';
    if (berry === '') {
        return new Response('Berry is required', { status: 400 });
    }
    console.log("Hello");

    try {
        const result = await loadAsin(asin, title, supplier, supplierCode);
        console.log(result);
        
        if ((result as { asin: string }).asin) {
            // Call /api/db/products/{berry}/amazonJSON/{JSON.stringify(result)}
            console.log("CALLING");
            let asin = result as { asin: string };
            console.log("ASIN: " + asin.asin);
            const newUrl = `/api/db/products/${encodeURIComponent(berry)}/amazonJSON?value=${encodeURIComponent(asin)}`;
            const resp = await fetch(request.url.replace(url.pathname, newUrl));
            console.log("????");
            console.log(resp);
        };

        return new Response(JSON.stringify(result), {
            headers: {
                'content-type': 'application/json'
            }
        }); 
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
}
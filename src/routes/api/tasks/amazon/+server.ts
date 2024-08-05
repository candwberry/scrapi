import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";

puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin());

let browser;

async function initBrowser() {
    if (!browser || !browser.isConnected()) {
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: false,
            timeout: 30000
        });
    }
}

async function loadAsin(asin: string) {
    let page;
    try {
        await initBrowser();
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
        await page.evaluateOnNewDocument(() => {
            function updateTitleAndAsin() {
                const titleElement = document.querySelector('#productTitle');
                const title = titleElement ? titleElement.textContent.trim() : 'Title not found';
                let asin = window.location.pathname.split('/')[2];
                if (asin === 'dp') asin = window.location.pathname.split('/')[3];

                const titleDiv = document.getElementById('title-scrapi');
                const asinDiv = document.getElementById('asin-scrapi');

                if (titleDiv) titleDiv.textContent = title;
                if (asinDiv) asinDiv.textContent = asin;
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
                            <div id="title-scrapi" style="font-size: 0.9em; margin-bottom: 5px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>
                            <div id="asin-scrapi" style="font-size: 1.2em; font-weight: bold;"></div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button id="confirm-scrapi" style="padding: 8px 15px; font-size: 1em; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 5px;">Confirm</button>
                            <button id="stop-scrapi" style="padding: 8px 15px; font-size: 1em; cursor: pointer; background-color: #f44336; color: white; border: none; border-radius: 5px;">Stop looking</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(floatingBox);

                document.getElementById('confirm-scrapi').addEventListener('click', () => {
                    const title = document.getElementById('title-scrapi').textContent;
                    const asin = document.getElementById('asin-scrapi').textContent;
                    console.log(JSON.stringify({
                        asinFoundForScrapi: { title, asin }
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
        });

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
        const result = await loadAsin(asin);
        console.log(result);

        if ((result as { asin: string }).asin) {
            // Call /api/db/products/{berry}/amazonJSON/{JSON.stringify(result)}
            console.log("CALLING");
            const newUrl = `/api/db/products/${encodeURIComponent(berry)}/amazonJSON?value=${encodeURIComponent(result.asin)}`;
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
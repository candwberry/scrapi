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
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }
}

async function handleManualSelection(url: string) {
    let page;
    try {
        await initBrowser();
        page = await browser.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const clickPromise = new Promise(resolve => {
            console.log('Waiting for click event...');
            page.on('console', msg => console.log('PAGE LOG:', msg.text()));
            page.exposeFunction('onElementClicked', data => {
                console.log('Element clicked:', data);
                resolve(data);
            });
        });
        
        await page.evaluate(() => {
            window.addEventListener('elementClicked', (event) => {
                window.onElementClicked(event.detail);
            });
                    document.body.style.cursor = 'pointer';

            // Create floating box
            const floatingBox = document.createElement('div');
            floatingBox.style.cssText = `
                position: fixed;
                padding: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border-radius: 5px;
                font-size: 14px;
                pointer-events: none;
                z-index: 9999;
                max-width: 200px;
                word-wrap: break-word;
            `;
            document.body.appendChild(floatingBox);

            document.addEventListener('mousemove', event => {
                floatingBox.style.left = `${event.clientX + 15}px`;
                floatingBox.style.top = `${event.clientY + 15}px`;
            });

            document.addEventListener('mouseover', event => {
                event.target.style.border = '2px solid red';
                floatingBox.textContent = event.target.textContent.trim().substring(0, 100);
                floatingBox.style.display = 'block';
            }, false);

            document.addEventListener('mouseout', event => {
                event.target.style.border = '';
                floatingBox.style.display = 'none';
            }, false);

            document.addEventListener('click', event => {
                event.preventDefault();
                const element = event.target;
                const selector = getUniqueSelector(element);
                const textContent = element.textContent.trim();
                console.log('Clicked element:', { selector, textContent });
                
                // Emit a custom event
                window.dispatchEvent(new CustomEvent('elementClicked', { 
                    detail: { selector, textContent } 
                }));
            }, false);
            
            
            function getUniqueSelector(el, isLast = true) {
                if (el.tagName.toLowerCase() === 'html')
                    return 'HTML';
                
                let str = el.tagName;
                
                if (isLast && el.className) {
                    const classes = el.className.split(/\s/).filter(Boolean).filter(cls => {
                        // Ignore Tailwind utility classes
                        return !(
                            /^(sm|md|lg|xl|2xl):/.test(cls) || // Responsive prefixes
                            /^(hover|focus|active|group-hover):/.test(cls) || // State variants
                            /^(p|m|w|h|text|bg|border|flex|grid|col|row|gap|space|divide|place|items|content|justify|self|order|float|clear|object|box|overflow|overscroll|z|opacity|transition|ease|duration|delay|animate|transform|scale|rotate|translate|skew|origin|accent|appearance|cursor|outline|pointer|resize|select|sr|ring|shadow|blur|brightness|contrast|drop|grayscale|hue|invert|saturate|sepia|backdrop)/.test(cls) // Utility classes
                        );
                    });
                    str += classes.map(cls => `.${cls}`).join('');
                }
                
                return el.parentElement ? getUniqueSelector(el.parentElement, false) + ' > ' + str : str;
            }
        });
        // Wait for the click to occur
        console.log("UFF");

    } catch (err) {
        console.error('Error in handleManualSelection:', err);
        throw err;
    } finally {
        if (page) {
            await page.close().catch(err => console.error('Error closing page:', err));
        }
    }
}

export const GET: RequestHandler = async ({ url }) => {
    let pageUrl = url.searchParams.get('url');
    pageUrl = "https://www.cwberry.com/40mm-down-mot-limestone";

    if (!pageUrl) {
        throw error(400, 'No URL provided');
    }

    try {
        const result = await handleManualSelection(pageUrl);

        return new Response(JSON.stringify(result), {
            headers: { 'content-type': 'application/json' }
        });
    } catch (err) {
        console.error('Error in GET handler:', err);
        return new Response('An error occurred while processing your request', {
            status: 500,
            headers: { 'content-type': 'text/plain' }
        });
    } finally {
        if (browser) {
            await browser.close().catch(err => console.error('Error closing browser:', err));
        }
    }
};
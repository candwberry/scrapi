import type { Browser } from 'puppeteer';
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer';
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Puppeteer Setup
puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
}));

// console.log Function that pipes output to client.
function consolelog(msg: string, isBatchProcessing: { errorArray: { error: string; info: string; }[]; }) {
    console.log(msg);
    isBatchProcessing.errorArray.push({
        error: "INFO",
        info: msg
    });
};

// console.error Function that pipes error to client.
function consoleerror(msg: string, error: any, isBatchProcessing: { errorArray: { error: string; info: string; }[]; }) {
    console.error(error);
    isBatchProcessing.errorArray.push({
        error: msg,
        info: JSON.stringify(error)
    });
};

async function initBrowser(isBatchProcessing?: { errorArray: { error: string; info: string; }[]; }, headless?: boolean): Promise<Browser | undefined> {
    if (!isBatchProcessing) isBatchProcessing = { errorArray: [] };
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium',
            headless: headless || true,
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
        consolelog("Browser launched successfully.", isBatchProcessing);
    } catch (err) {
        consoleerror("Failed to launch browser:", err, isBatchProcessing);
        throw err;
    } finally {
        return browser;
    }
};

function getDecentTime(time: number) {
    if (time < 1000) return `${time.toFixed(0)}ms`;
    if (time < 60000) return `${(time / 1000).toFixed(0)}s`;
    if (time < 3600000) return `${(time / 60000).toFixed(0)}m`;
    return `${(time / 3600000).toFixed(0)}h`;
};

function extractDomain(url: string) {
    url = url.replace(/^www\./, '');
    const parts = url.split('.');
    parts.pop();
    let name = parts.reduce((a: string, b: string) => a.length > b.length ? a : b);
    if (name) name = name.charAt(0).toUpperCase() + name.slice(1);
    return name || "unknown";
}

function ok (body: any) {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

function err (msg: string, body: any) {
    return new Response(JSON.stringify(body), {
        status: 400,
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export { ok, err, extractDomain, getDecentTime, initBrowser, consolelog, consoleerror };
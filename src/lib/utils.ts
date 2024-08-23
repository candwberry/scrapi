import type { Browser } from "puppeteer";
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from "puppeteer";
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Log } from '$lib/types';

// Puppeteer Setup
puppeteer.use(StealthPlugin());
puppeteer.use(
  AdBlockerPlugin({
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  }),
);


// Type definition for batch processing
interface BatchProcessing {
  logs: Log[];
}

/**
 * Logs messages to the console and pushes them to the client's logs array.
 *
 * @param {string} msg - The message to log.
 * @param {BatchProcessing} isBatchProcessing - Object containing an array of log objects.
 */
function consolelog(
  msg: string,
  isBatchProcessing: BatchProcessing,
): void {
  console.log(msg);
  isBatchProcessing.logs.push({
    error: "INFO",
    info: msg,
  });
}

/**
 * Logs errors to the console and pushes them to the client's logs array.
 *
 * @param {string} msg - The error message to log.
 * @param {any} error - The error object to log.
 * @param {BatchProcessing} isBatchProcessing - Object containing an array of log objects.
 */
function consoleerror(
  msg: string,
  error: any,
  isBatchProcessing: BatchProcessing,
): void {
  console.error(error);
  isBatchProcessing.logs.push({
    error: msg,
    info: JSON.stringify(error),
  });
}

/**
 * Initializes and launches a Puppeteer browser instance with specific configurations.
 *
 * @param {BatchProcessing} [isBatchProcessing] - Optional object to store logs.
 * @param {boolean} [headless] - Optional flag to run the browser in headless mode.
 * @returns {Promise<Browser | undefined>} - The launched Puppeteer Browser instance or undefined if an error occurs.
 */
async function initBrowser(
  isBatchProcessing?: BatchProcessing,
  headless?: boolean,
): Promise<Browser | undefined> {
  if (!isBatchProcessing) isBatchProcessing = { logs: [] };
  let browser: Browser | undefined;
  try {
    browser = await puppeteer.launch({
      //executablePath: "/usr/bin/chromium",
      headless: "shell",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-features=TranslateUI',
        '--disable-field-trial-config',
        '--disable-features=InterestFeedContentSuggestions',
        '--disable-features=AutofillServerCommunication',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--disable-breakpad',
        '--enable-async-dns',
        '--enable-simple-cache-backend',
        '--no-default-browser-check',
        '--js-flags=--expose-gc',
      ],
      defaultViewport: {
        width: 1280,
        height: 720,
      },
      timeout: 30000,
    });
    consolelog("Browser launched successfully.", isBatchProcessing);
  } catch (err) {
    consoleerror("Failed to launch browser:", err, isBatchProcessing);
    throw err;
  } finally {
    return browser;
  }
}

/**
 * Converts a time value in milliseconds to a human-readable format.
 *
 * @param {number} time - The time in milliseconds.
 * @returns {string} - The time in a human-readable format (e.g., "200ms", "3s", "5m", "2h").
 */
function getDecentTime(time: number): string {
  if (time < 1000) return `${time.toFixed(0)}ms`;
  if (time < 60000) return `${(time / 1000).toFixed(0)}s`;
  if (time < 3600000) return `${(time / 60000).toFixed(0)}m`;
  return `${(time / 3600000).toFixed(0)}h`;
}

/**
 * Extracts the domain name from a given URL.
 *
 * @param {string} url - The URL to extract the domain name from.
 * @returns {string} - The extracted domain name with the first letter capitalized, or "unknown" if extraction fails.
 */
function extractDomain(url: string): string {
  url = url.replaceAll(/^www\./, "");
  const parts = url.split(".");
  parts.pop();
  let name = parts.reduce((a: string, b: string) =>
    a.length > b.length ? a : b,
  );
  if (name) name = name.charAt(0).toUpperCase() + name.slice(1);
  return name || "unknown";
}

/**
 * Creates a successful HTTP response with a JSON body.
 *
 * @param {any} body - The body of the response.
 * @returns {Response} - The successful HTTP response.
 */
function ok(body: any): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Creates an error HTTP response with a JSON body.
 *
 * @param {string} msg - The error message to include in the response.
 * @param {any} body - The body of the response.
 * @returns {Response} - The error HTTP response.
 */
function err(msg: string, body: any): Response {
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export {
  ok,
  err,
  extractDomain,
  getDecentTime,
  initBrowser,
  consolelog,
  consoleerror,
};

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

/**
 * Clean string from rubbish
 */
function cleanString(str: string) {
  if (!str) return 'empty_string';
  const deleteafterwords = ["To Order", "must be paired with"]
// for each deleteafterwords, remove all text after and including occurance
deleteafterwords.forEach((word) => {
  str = str.replace(new RegExp(word + '.*'), '');
});
const deletewords = ["Pre-Finished", "Pre-Fin", "Per", "c/w", "- Only", "Mtr", "CHECK STOCK"]
// for each deletewords, remove all occurance
deletewords.forEach((word) => {
  str = str.replace(new RegExp(word, 'g'), '');
});

// remove "To Order"
str = str.replace(/To Order/g, '');
// remove "inc."
str = str.replace(/inc\./g, '');
// remove "&,  and asterisk and ; and ,
str = str.replace(/&/g, '');
str = str.replace(/\*/g, '');
str = str.replace(/;/g, '');
str = str.replace(/,/g, '');
// replace + with ' +' so that whole words arent ignored by search engines
// we dont want to remove since + could be a different product
str = str.replace(/\+/g, ' +');
// remove speach marks if at start and end
str = str.replace(/^"/, '');
str = str.replace(/"$/, '');
// remove mm from <number>mm and m from <number>m and cm, M from <number>cm
str = str.replace(/(\d+)mtr/g, '$1');
str = str.replace(/(\d+)mm/g, '$1');
str = str.replace(/(\d+)m/g, '$1');
str = str.replace(/(\d+)cm/g, '$1');

// replace <number>x<number> with <number> x <number>
str = str.replace(/(\d+)x(\d+)/g, '$1 x $2');
str = str.replace(/(\d+)x(\d+)/g, '$1 x $2');

// remove any non-ascii
str = str.replace(/[^\x20-\x7E]/g, '');
// remove power 2 character
str = str.replace(/²/g, '');
// replace double speech marks with single
str = str.replace(/""/g, '"');
// replace /pk with empty string
str = str.replace(/\/pk/g, '');
// replace / with space
str = str.replace(/\//g, ' ');
// replace - Order with empty string
str = str.replace(/- Order/g, '');
// replace - with space
str = str.replace(/-/g, ' ');
// replace double spaces with single
str = str.replaceAll('  ', ' ');
str = str.replaceAll('  ', ' ');
// remove any leading or trailing spaces
str = str.trim();
return str;
}


/**
 * Calculate the Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string) {
  // If either string is empty, distance is just the length of the other
  if (!str1) return str2.length;
  if (!str2) return str1.length;
  
  // Create distance matrix
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Initialize the first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the distance matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity score based on Levenshtein distance
 */
function getStringSimilarity(title1: string, title2: string) {
  // 1) Normalize the strings by trimming and converting to lowercase
  if (!title1 || !title2) return 0.5; //? 
  const str1 = title1.trim().toLowerCase();
  const str2 = title2.trim().toLowerCase();
  
  // 2) Compute the Levenshtein distance
  const distance = levenshteinDistance(str1, str2);
  
  // 3) Convert distance to a similarity score between 0 and 1
  const maxLen = Math.max(str1.length, str2.length);
  
  // Edge case: if both are empty strings, return 1
  if (maxLen === 0) return 1;
  
  // Similarity = 1 - (distance / max possible difference)
  const similarity = 1 - distance / maxLen;
  return similarity;
}

export function similar(a: string, b: string): boolean {
  // if strings empty or null or undefined, assume true
  if (!a || !b) return true;
  if (a.trim() === "" || b.trim() === "") return true;

  return getStringSimilarity(a, cleanString(b)) > 0.4;
}


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
  if (isBatchProcessing.logs.length > 1000) {
    isBatchProcessing.logs.shift();
  }
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
  if (isBatchProcessing.logs.length > 1000) {
    isBatchProcessing.logs.shift();
  }
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
  // lets wait half a  second so any extra browsers can be cleaned up 
  await new Promise((resolve) => setTimeout(resolve, 500));
  try {
    browser = await puppeteer.launch({
      executablePath: "/usr/bin/google-chrome",
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--enable-async-dns',
        '--enable-simple-cache-backend',
        '--no-default-browser-check',
        '--js-flags=--expose-gc',
      ],
      defaultViewport: {
        width: 1280,
        height: 720,
      },
      timeout: 5000,
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
 * Extracts the domain name from a given URL. Test
 *
 * @param {string} url - The URL to extract the domain name from.
 * @returns {string} - The extracted domain name with the first letter capitalized, or "unknown" if extraction fails.
 */
function extractDomain(url: string): string {
  url = url.replace(/^www\./, "");
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

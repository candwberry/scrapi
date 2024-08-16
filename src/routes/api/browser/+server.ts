import type { RequestHandler } from '@sveltejs/kit';
import type { Browser, HTTPRequest, Page, ElementHandle } from 'puppeteer';
import { initBrowser } from '$lib/utils';

/*
This is where, we will receive URL, we will go to URL, and find the price. 
*/

import OpenAi from "openai";
import { JSDOM } from "jsdom";
const openai = new OpenAi({
    apiKey: process.env.OPENAI_API_KEY ?? "HELLO",
  });

async function findPrice(
    page: Page,
    validatedRegex?: string,
  ): Promise<{ price: string; priceFound: string }> {
    let price: string = "99999";
    let priceFound: string = "none";
  
    if (validatedRegex) {
      if (validatedRegex.startsWith("regex:")) {
        validatedRegex = validatedRegex.replace("regex:", "");
  
        // It's ACTUALLY a regex pattern.
        const regex = new RegExp(validatedRegex);
        const content = await page.content();
        const match = content.match(regex);
        if (match && match[1]) {
          price = match[1];
          priceFound = "regex";
        }
      } else {
        // It's a HTML query selector.
        const priceElement = await page.$(validatedRegex);
        if (priceElement) {
          const textContent = await priceElement.evaluate(
            (el: Element) => el.textContent,
          );
          if (textContent) {
            price = textContent.replace(/[^0-9.,]/g, "");
            priceFound = "selector";
          }
        }
      }
    }
  
    const scripts: ElementHandle<Element>[] = await page.$$(
      "script[type='application/ld+json']",
    );
    for (const script of scripts) {
      const content: string | null = await script.evaluate(
        (el) => el.textContent.toLowerCase()
      );
      if (!content) continue;
      try {
        const jsonData = JSON.parse(content);
  
        const findProduct = (obj: any): any => {
          console.log(obj);
          console.log(obj["@type"]);
          if (
            obj["@type"] !== undefined &&
            obj["@type"].toString().toLowerCase() === "product"
          ) {
            return obj;
          }
          if (typeof obj === "object" && obj !== null) {
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
            priceFound = "schema";
          }
          if (productEntity.offers?.price) {
            price = productEntity.offers.price.toString(); // just being safe.
            priceFound = "schema";
          }
          // else offers is an array
          else if (Array.isArray(productEntity.offers)) {
            const cheapest = Math.min(
              ...productEntity.offers.map(
                (offer: any) => parseFloat(offer.price) || 99999,
              ),
            );
            price = cheapest.toString();
            priceFound = "schema";
          }
        }
      } catch (error) {
      }
  
      if (price === "99999") {
        // First fallback: "price": NUMBER
        const priceRegex = /"price"\s*:\s*("?\d+(?:\.\d+)?"?)/;
        const priceMatch = content?.match(priceRegex);
        if (priceMatch && priceMatch[1]) {
          price = priceMatch[1].replace(/"/g, "");
          priceFound = "schema";
        } else {
          // Second fallback: "raw":{"withTax":NUMBER}
          const rawWithTaxRegex =
            /"raw"\s*:\s*{\s*"withTax"\s*:\s*(\d+(?:\.\d+)?)/;
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
      const metas: ElementHandle<Element>[] = await page.$$(
        "meta[property='product:price:amount']",
      );
      for (let meta of metas) {
        const metaPrice = await meta.evaluate(
          (el: Element) => (el as HTMLMetaElement).content,
        );
        if (metaPrice) {
          price = metaPrice;
          priceFound = "meta";
          break;
        }
      }
    }
  
    if (price === "99999") {
      // last chance, look for <element class="<ANYCHARACTERS>price<ANYCHARACTERS>">
      const prices: ElementHandle<Element>[] = await page.$$(
        '*[class*="price" i], *[id*="price" i]',
      );
      let expensivest: number = -99999;
  
      for (let priceElement of prices) {
        const textContent = await priceElement.evaluate(
          (el: Element) => el.textContent,
        );
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
        }
      }
    }
  
    price = price.replace(/[^0-9.,]/g, "");
    price = isNaN(parseFloat(price)) ? "99999" : parseFloat(price).toFixed(2);
  
    if (price === "99999") {
      // Then we result to GPT-4o-mini to find it.
      const textContent = await page.evaluate(() => document.body.textContent);
      const dom = new JSDOM(textContent); //oh..
  
      const { document } = dom.window;
  
      // Remove all script tags
      const scriptTags = document.querySelectorAll("script");
      scriptTags.forEach((scriptTag) => scriptTag.remove());
  
      // Remove the style attribute from all elements
      const elementsWithStyle = document.querySelectorAll("[style]");
      elementsWithStyle.forEach((element) => element.removeAttribute("style"));
  
      // Remove all img, svg, and picture tags
      const imgTags = document.querySelectorAll("img");
      imgTags.forEach((imgTag) => imgTag.remove());
  
      const svgTags = document.querySelectorAll("svg");
      svgTags.forEach((svgTag) => svgTag.remove());
  
      const pictureTags = document.querySelectorAll("picture");
      pictureTags.forEach((pictureTag) => pictureTag.remove());
  
      // Remove anchor links
      const anchorTags = document.querySelectorAll("a");
      anchorTags.forEach((anchorTag) => anchorTag.remove());
  
      // Remove iframes
      const iframeTags = document.querySelectorAll("iframe");
      iframeTags.forEach((iframeTag) => iframeTag.remove());
  
      // Remove any childrenless elements with no textContent
      const emptyElements = Array.from(document.querySelectorAll("*")).filter(
        (element) =>
          element.children.length === 0 && element.textContent.trim() === "",
      );
      emptyElements.forEach((emptyElement) => emptyElement.remove());
  
      // remove any childrenless elements with textContent larger than 100 characters
      const largeTextElements = Array.from(document.querySelectorAll("*")).filter(
        (element) =>
          element.children.length === 0 && element.textContent.length > 50,
      );
      largeTextElements.forEach((largeTextElement) => largeTextElement.remove());
  
      // Remove all comments and whitespace
      document.querySelectorAll("*").forEach((element) => {
        for (let i = element.childNodes.length - 1; i >= 0; i--) {
          const child = element.childNodes[i];
          if (
            child.nodeType === 8 ||
            (child.nodeType === 3 && !/\S/.test(child.nodeValue))
          ) {
            // 8 is comment, 3 is text, cool,.
            element.removeChild(child);
          }
        }
      });
  
      // Get the modified HTML content
      const modifiedContent = dom.serialize();
  
      // Now let us call gpt-4o-mini
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
                      Respond with just the price of this product in this format: 
                      
                      { price: "<price>", incVAT: "<'true'_or_'false'>"
  
                      If you cannot find either of the two based on the information given below (the clues are in the HTML), then just give your best guess, based only on the information below, and put "?" after it. Don't assume that it's including tax since this industry includes wholesale.
                  `,
          },
          { role: "user", content: modifiedContent },
        ],
      });
  
      console.log(completion.data.choices[0].message.content);
      const result = completion.data.choices[0].message.content;
      // it should be JSON format
      let incVat = "false";
      try {
        const json = JSON.parse(result);
        price = json.price.replaceAll("£", "").replaceAll("?", "");
        incVat = json.incVAT.replaceAll("£", "").replaceAll("?", "");
        if (incVat === "false") price = (parseFloat(price) * 1.2).toFixed(2);
        priceFound = "gpt";
      } catch (e) {
        // parse it using regex, find the first number.
        // and find "true" OR "false"
        const priceRegex = /\d+(?:\.\d+)?/;
        const vatRegex = /true|false/;
        const priceMatch = result.match(priceRegex);
        const vatMatch = result.match(vatRegex);
        if (priceMatch) price = priceMatch[0];
        if (vatMatch) incVat = vatMatch[0];
        if (incVat === "false") price = (parseFloat(price) * 1.2).toFixed(2);
        priceFound = "gpt";
      }
    }
  
    return {
      price,
      priceFound,
    };
  }

export const GET: RequestHandler = async ({ request, url }) => {
    try {
        const URL = url.searchParams.get('url') || '';
        if (!URL) return new Response('URL not provided', { status: 400 });
        
        const browser = await initBrowser(undefined, true);
        
        const page = await browser?.newPage();
        page?.setViewport({ width: 1920, height: 1080 });
        await page?.goto(URL, { waitUntil: 'domcontentloaded' });
        if (!page) return new Response('Failed to load page', { status: 500 });
        
        // So now we call our trusty "findPrice" function, and this should find the price.
        try {
            const { price, priceFound } = await findPrice(page);
            // we also get a screenshot of the page.
            const screenshot = await page?.screenshot({ encoding: 'base64' });
            return new Response(JSON.stringify({ price, priceFound, screenshot }), { status: 200 });
    
        } catch (e) {     return new Response('Failed to find price', { status: 500 }); }
        finally {
            browser?.close();
        }
    } catch (e) {
        return new Response('Something failed');
    }
}
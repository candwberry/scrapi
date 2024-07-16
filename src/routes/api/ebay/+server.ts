import { error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

import eBayApi from "ebay-api";

const eBay = new eBayApi({
    appId: 'CWBerryL-scraper-PRD-a942bf249-55fede6a',
    certId: process.env.EBAY_CERT_ID ? process.env.EBAY_CERT_ID : 'PRD-942bf2490477-ac6e-412c-b3b0-7d97',
    sandbox: false,
    siteId: eBayApi.SiteId.EBAY_GB,
    marketplaceId: eBayApi.MarketplaceId.EBAY_GB,
    acceptLanguage: eBayApi.Locale.en_GB,
    contentLanguage: eBayApi.Locale.en_GB
});

async function ebay(query: string, limit: string, sort: string, filter: string) {
    const items: any = await eBay.buy.browse.search({
        q: query,
        limit: limit,
        sort: sort,
        filter: filter
    });

    return items;
}

export const GET: RequestHandler = async ({ request, url }) => {
    console.log(request);
    console.log(url.searchParams);
    console.log(url);
    const query = url.searchParams.get("query") ?? "";
    if (query.trim().length === 0) {
        error(400, "No query provided");
    }

    const limit = url.searchParams.get("limit") ?? "10";
    const sort = url.searchParams.get("sort") ?? "price";
    const filter = url.searchParams.get("filter") ?? "buyingOptions:{FIXED_PRICE},conditions:{NEW},sellerAccountTypes:{BUSINESS}";

    const items = await ebay(query, limit, sort, filter);
    console.log(items);
    const itemSummaries = items.itemSummaries ?? [];
    
    const cheapestItem = itemSummaries.length > 0 ? itemSummaries[0] : null;
    const href = cheapestItem ? cheapestItem.itemWebUrl : "about:blank"; // Not found.
    const title = cheapestItem ? cheapestItem.title : "Not found";
    const price = cheapestItem ? cheapestItem.price.value : "-1";
    let shipping = "-1";
    let thumbnail = "berry.png";
    if (cheapestItem.thumbnailImages && cheapestItem.thumbnailImages.length > 0) {
        thumbnail = cheapestItem.thumbnailImages[0].imageUrl;
    }

    if (cheapestItem.shippingOptions)
    for (const shippingOption of cheapestItem.shippingOptions) {
        if (shippingOption.shippingCostType === "FIXED") {
            shipping = shippingOption.shippingCost.value;
            break;
        }
    }
    return new Response(JSON.stringify({ title: title, href: href, price: price, shipping: shipping, thumbnail: thumbnail }), {
        headers: {
            "content-type": "application/json"
        }
    });
}
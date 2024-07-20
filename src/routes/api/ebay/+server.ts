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
    
    const formatItem = (item: any) => ({
        title: item.title,
        href: item.itemWebUrl,
        price: item.price.value,
        shipping: item.shippingOptions?.find((option: any) => option.shippingCostType === "FIXED")?.shippingCost.value ?? "-1",
        thumbnail: item.thumbnailImages && item.thumbnailImages.length > 0 ? item.thumbnailImages[0].imageUrl : "berry.png"
    });

    const firstItem = itemSummaries.length > 0 ? formatItem(itemSummaries[0]) : null;
    const otherItems = itemSummaries.slice(1).map(formatItem);

    return new Response(JSON.stringify({ first: firstItem, others: otherItems }), {
        headers: {
            "content-type": "application/json"
        }
    });
}
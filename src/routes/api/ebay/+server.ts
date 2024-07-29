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
};

const isBatchProcessing = {
    status: false,
    total: 0,
    processed: 0,
    errorArray: [
        { error: "ERR-404", info: "This is just a test :)" },
        { error: "ERR-404", info: "This is just a test :)" },
        { error: "ERR-404", info: "This is just a test :)" },
        { error: "ERR-404", info: "This is just a test :)" },
        { error: "ERR-404", info: "This is just a test :)" },
        { error: "ERR-404", info: "This is just a test :)" },
    ],
    limit: 5000,
    remaining: 5000,
};

export const GET: RequestHandler = async ({ request, url }) => {
    //console.log(request);
    //console.log(url.searchParams);
    //console.log(url);

    const baseUrl = url.origin;
    const query = url.searchParams.get("query") ?? "";
    const batch = url.searchParams.get("batch") ?? "false";
    const rateLimit = url.searchParams.get("rateLimit") ?? "false";

    if (batch === "stop") {
        checkRateLimits();
        isBatchProcessing.status = false;
        return new Response(JSON.stringify({ isBatchProcessing }), {
            headers: {
                "content-type": "application/json"
            }
        });
    }
    if (batch === "check") {
        //console.log(isBatchProcessing);
        return new Response(JSON.stringify({ isBatchProcessing }), {
            headers: {
                "content-type": "application/json"
            }
        });
    }
    
    if (rateLimit === "true") {
        const devApi = await eBay.developer.analytics.getRateLimits("buy", "browse");
        
        return new Response(JSON.stringify(devApi.rateLimits[0].resources[1]), {
            headers: {
                "content-type": "application/json"
            }
        });
    }

    if (batch === "true") {
        checkRateLimits()
        // call /api/db/products to get all products
        const resp = await fetch(`${baseUrl}/api/db/products?orderby=lastUpdated&order=desc&limit=${isBatchProcessing.remaining}`); // 5000 is eBay API call limit.
        const products = await resp.json();
        isBatchProcessing.status = true;
        isBatchProcessing.total = products.length;
        isBatchProcessing.processed = 0;
        isBatchProcessing.errorArray = [];
        const totalProducts = products.length;

        // now loop through, call ebay for each product, and call PUT to /api/db/price to create a price object
        const batchSize = 10;
        const numBatches = Math.ceil(totalProducts / batchSize);

        for (let i = 0; i < numBatches; i++) {
            
            if (!isBatchProcessing.status) {
                return new Response(JSON.stringify({ isBatchProcessing }), {
                    headers: {
                        "content-type": "application/json"
                    }
                });
            }
            isBatchProcessing.processed = i * batchSize;
            const start = i * batchSize;
            const end = Math.min((i + 1) * batchSize, totalProducts);
            const batchProducts = products.slice(start, end);

            const batchPromises = batchProducts.map(async (product: { barcode: string; title: string; berry: any; supplierCode: any; supplier: any; }) => {
                const items = await ebay(product.barcode === "" ? product.title : product.barcode, "1", "price", "buyingOptions:{FIXED_PRICE},conditions:{NEW},sellerAccountTypes:{BUSINESS}");
                const itemSummaries = items.itemSummaries ?? [];
                if (itemSummaries.length > 0) {
                    const item = itemSummaries[0];
                    const price = item.price.value;
                    const shipping = item.shippingOptions?.find((option: any) => option.shippingCostType === "FIXED")?.shippingCost.value ?? "-1";
                    const href = item.itemWebUrl;
                    const body = JSON.stringify([{ berry: product.berry, price, shipping, date: Date.now(), shop: "ebay", href }]);

                    // console.log(body);
                    // console.log(product);
                    await fetch(`${baseUrl}/api/db/prices`, {
                        method: "PUT",
                        body: body,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                    await fetch(`${baseUrl}/api/db/products`, {
                        method: "PUT",
                        body: JSON.stringify([{
                            berry: product.berry,
                            barcode: product.barcode,
                            supplierCode: product.supplierCode,
                            supplier: product.supplier,
                            title: product.title,
                            lastUpdated: Date.now()
                        }]),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                    )
                }
            });

            await Promise.all(batchPromises);
        }

        isBatchProcessing.status = false;
        return new Response(JSON.stringify({ isBatchProcessing }), {
            headers: {
                "content-type": "application/json"
            }
        });
    }

    if (query.trim().length === 0) {
        error(400, "No query provided");
    }

    const limit = url.searchParams.get("limit") ?? "10";
    const sort = url.searchParams.get("sort") ?? "price";
    const filter = url.searchParams.get("filter") ?? "buyingOptions:{FIXED_PRICE},conditions:{NEW},sellerAccountTypes:{BUSINESS}";

    const items = await ebay(query, limit, sort, filter);
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


async function checkRateLimits() {
    const devApi = await eBay.developer.analytics.getRateLimits("buy", "browse");
    const limits =  devApi.rateLimits[0].resources[0].rates[0];
    isBatchProcessing.remaining = limits.remaining;
    isBatchProcessing.limit = limits.limit;
}

checkRateLimits();
// setInterval

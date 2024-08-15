import type { RequestHandler } from "@sveltejs/kit";
import { getDecentTime, consolelog, consoleerror, ok, err } from "$lib/utils";
import eBayApi from "ebay-api";

// eBay Batch API Status.
const isBatchProcessing: {
  status: boolean;
  total: number;
  processed: number;
  logs: any[];
  limit: number;
  remaining: number;
  estimatedTime: string;
} = {
  status: false,
  total: 0,
  processed: 0,
  logs: [],
  limit: 5000,
  remaining: 5000,
  estimatedTime: "1s",
};

// Shortcuts for logging to server AND client.
function clog(msg: string) {
  consolelog(msg, isBatchProcessing);
}
function cerr(msg: string, error: any) {
  consoleerror(msg, error, isBatchProcessing);
}

// Initialize eBay API object.
const eBay = new eBayApi({
  appId: "CWBerryL-scraper-PRD-a942bf249-55fede6a",
  certId: process.env.EBAY_CERT_ID,
  sandbox: false,
  siteId: eBayApi.SiteId.EBAY_GB,
  marketplaceId: eBayApi.MarketplaceId.EBAY_GB,
  acceptLanguage: eBayApi.Locale.en_GB,
  contentLanguage: eBayApi.Locale.en_GB,
});

async function ebay(
  query: string,
  limit: string,
  sort: string,
  filter: string,
) {
  return await eBay.buy.browse.search({
    q: query,
    limit: limit,
    sort: sort,
    filter: filter,
  });
}

export const GET: RequestHandler = async ({ request, url }) => {
  const baseUrl = url.origin;
  const query = url.searchParams.get("query") ?? "";
  const batch = url.searchParams.get("batch") ?? "false";

  if (batch === "stop") {
    isBatchProcessing.status = false;
    checkRateLimits();
    return ok({ isBatchProcessing });
  }

  if (batch === "check") return ok({ isBatchProcessing });

  if (query.trim().length === 0)
    return err("No query provided", { error: "No query provided" });

  const limit = url.searchParams.get("limit") ?? "10";
  const sort = url.searchParams.get("sort") ?? "price";
  const filter =
    url.searchParams.get("filter") ??
    "buyingOptions:{FIXED_PRICE},conditions:{NEW},sellerAccountTypes:{BUSINESS}";

  const items = await ebay(query, limit, sort, filter);
  const itemSummaries = items.itemSummaries ?? [];

  const formatItem = (item: any) => ({
    title: item.title,
    href: item.itemWebUrl,
    price: item.price.value,
    shipping:
      item.shippingOptions?.find(
        (option: any) => option.shippingCostType === "FIXED",
      )?.shippingCost.value ?? "",
    thumbnail:
      item.thumbnailImages && item.thumbnailImages.length > 0
        ? item.thumbnailImages[0].imageUrl
        : "",
  });

  const firstItem =
    itemSummaries.length > 0 ? formatItem(itemSummaries[0]) : null;
  const otherItems = itemSummaries.slice(1).map(formatItem);

  return ok({ first: firstItem, others: otherItems });
};

async function checkRateLimits() {
  const devApi = await eBay.developer.analytics.getRateLimits("buy", "browse");
  const limits = devApi.rateLimits[0].resources[0].rates[0];
  isBatchProcessing.remaining = limits.remaining;
  isBatchProcessing.limit = limits.limit;
}

export const POST: RequestHandler = async ({ request, url }) => {
  if (isBatchProcessing.status)
    return err("Batch processing is already in progress.", {
      error: "Batch processing is already in progress.",
    });

  checkRateLimits();
  const body = await request.json();
  const baseUrl = url.origin;
  let products = [];

  if (Array.isArray(body)) products = body;
  else
    products = await fetch(
      `${baseUrl}/api/db/products?orderby=ebayLast&order=asc&limit=5000`,
    ).then((res) => res.json());

  const result: { berry: any; price: any; shipping: any; href: any }[] = [];
  const startTime = Date.now();
  isBatchProcessing.status = true;
  isBatchProcessing.total = products.length;
  isBatchProcessing.processed = 0;
  isBatchProcessing.logs = [];
  const totalProducts = products.length;

  const batchSize = 10;
  const numBatches = Math.ceil(totalProducts / batchSize);
  for (let i = 0; i < numBatches; i++) {
    try {
      if (!isBatchProcessing.status) return ok({ isBatchProcessing });

      const currentTime = Date.now();
      const timeElapsed = currentTime - startTime;
      const timePerItem = timeElapsed / (isBatchProcessing.processed + 1);
      const timeRemaining =
        timePerItem * (totalProducts - isBatchProcessing.processed);
      isBatchProcessing.estimatedTime = getDecentTime(timeRemaining);
      isBatchProcessing.processed = i * batchSize;
      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, totalProducts);
      const batchProducts = products.slice(start, end);

      const batchPromises = batchProducts.map(
        async (product: {
          berry: any;
          barcode: string;
          title: string;
          supplierCode: any;
          supplier: any;
          amazonLast: any;
          googleLast: any;
          amazonJSON: any;
        }) => {
          clog(`Processing ${product.berry}`);

          const items = await ebay(
            product.barcode === "" ? product.title : product.barcode,
            "1",
            "price",
            "buyingOptions:{FIXED_PRICE},conditions:{NEW},sellerAccountTypes:{BUSINESS}",
          );

          const itemSummaries = items.itemSummaries ?? [];

          if (itemSummaries.length > 0) {
            const item = itemSummaries[0];
            const price = item.price.value;
            const shipping =
              item.shippingOptions?.find(
                (option: any) => option.shippingCostType === "FIXED",
              )?.shippingCost.value ?? "-1";
            const href = item.itemWebUrl;
            const body = JSON.stringify([
              {
                berry: product.berry,
                price,
                shipping,
                date: Date.now(),
                shop: "ebay",
                href,
              },
            ]);

            await fetch(`${baseUrl}/api/db/prices`, {
              method: "PUT",
              body: body,
              headers: {
                "Content-Type": "application/json",
              },
            });

            await fetch(`${baseUrl}/api/db/products`, {
              method: "PUT",
              body: JSON.stringify([
                {
                  berry: product.berry,
                  barcode: product.barcode,
                  supplierCode: product.supplierCode,
                  supplier: product.supplier,
                  title: product.title,
                  amazonLast: product.amazonLast,
                  ebayLast: Date.now(),
                  googleLast: product.googleLast,
                  amazonJSON: product.amazonJSON,
                },
              ]),
              headers: {
                "Content-Type": "application/json",
              },
            });

            const thisResult = {
              berry: product.berry,
              price,
              shipping,
              href,
            };

            result.push(thisResult);
          }
        },
      );

      await Promise.all(batchPromises);
      if (i === numBatches - 1) {
        isBatchProcessing.processed = isBatchProcessing.total;
        checkRateLimits();
      }
    } catch (error) {
      cerr("Error in batch processing", error);
    }
  }

  isBatchProcessing.status = false;
  return ok(result);
};

checkRateLimits();

import eBayApi from "ebay-api";

const eBay = new eBayApi({
    appId: 'CWBerryL-scraper-PRD-a942bf249-55fede6a',
    certId: process.env.EBAY_CERT_ID ? process.env.EBAY_CERT_ID : '',
    sandbox: false,
    siteId: eBayApi.SiteId.EBAY_GB,
    marketplaceId: eBayApi.MarketplaceId.EBAY_GB,
    acceptLanguage: eBayApi.Locale.en_GB,
    contentLanguage: eBayApi.Locale.en_GB
});

interface ebayFilter {
    buyingOptions?: string,
    conditions?: string,
    sellerAccountTypes?: string
}

function ebayFilterToString(filter: ebayFilter): string {
    let filterString = "";
    if (filter.buyingOptions) {
        filterString += `buyingOptions:{${filter.buyingOptions}},`;
    }
    if (filter.conditions) {
        filterString += `conditions:{${filter.conditions}},`;
    }
    if (filter.sellerAccountTypes) {
        filterString += `sellerAccountTypes:{${filter.sellerAccountTypes}},`;
    }
    return filterString.slice(0, -1);
}

export default async function ebay(
    query: string, 
    limit: number=10, 
    sort: string="price",
    filter: ebayFilter={buyingOptions: "FIXED_PRICE", conditions: "NEW", sellerAccountTypes: "BUSINESS"}
) {
    // clean the query
    query = query.trim().replace(/\s+/g, " ");

    try {
        const items: any = await eBay.buy.browse.search({
            q: query,
            limit: limit.toString(),
            sort: sort,
            filter: ebayFilterToString(filter)
        });

        return items;
    } catch (error) {
        console.error(`Error fetching eBay data for query: ${query}, limit: ${limit}, sort: ${sort}, filter: ${ebayFilterToString(filter)}\n${error}`);
    }
    return [];
}

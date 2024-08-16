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

  console.log(await ebay(
    5010559197859,
    "1",
    "price",
    "buyingOptions:{FIXED_PRICE},conditions:{NEW},sellerAccountTypes:{BUSINESS}",
  ));
  
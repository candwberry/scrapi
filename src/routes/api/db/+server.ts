import type { RequestHandler } from "@sveltejs/kit";
import { db, ok, err } from "./db";
const query = db.query(`
SELECT name FROM sqlite_master WHERE type='table';
`);

export const GET: RequestHandler = async ({ request, url }) => {
    const expo = url.searchParams.get("export") || "";
    const q = url.searchParams.get("query") || "";
    console.log(expo, q);

    if (q !== "") {
        try {
            const result = db.query(q).all();
            return ok(result);
        } catch (e: any) {
            return err("Invalid SQL", e.message);
        };
    }

    if (expo === "") {
        try {
            const result = query.all();
            console.log(result);

            for (let i = 0; i < result.length; i++) {
                //@ts-ignore
                const name = result[i].name;
                const count = db.query(`SELECT COUNT(*) FROM ${name}`).get();
                //@ts-ignore
                result[i].count = count["COUNT(*)"];
            }
            console.log(result);

            return ok(result);
        } catch (e: any) {
            return err("Invalid SQL", e.message);
        };
    };

    const EXPOS = [
        "products", "prices", "productsWithLatestPrices"
    ];

    if (!EXPOS.includes(expo))
        return err("Invalid export", `Valid exports are: ${EXPOS.join(", ")}`);

    try {
        let query = `SELECT * FROM ${expo};`;
        if (expo === "productsWithLatestPrices") {
            query = `
            SELECT 
    p.berry,
    e.price AS ebay_price,
    e.date AS ebay_date,
    a.price AS amazon_price,
    a.date AS amazon_date
FROM 
    products p
LEFT JOIN 
    (SELECT berry, price, date
     FROM prices
     WHERE shop = 'ebay'
     AND (berry, date) IN (
         SELECT berry, MAX(date)
         FROM prices
         WHERE shop = 'ebay'
         GROUP BY berry
     )) e ON p.berry = e.berry
LEFT JOIN 
    (SELECT berry, price, date
     FROM prices
     WHERE shop = 'amazon'
     AND (berry, date) IN (
         SELECT berry, MAX(date)
         FROM prices
         WHERE shop = 'amazon'
         GROUP BY berry
     )) a ON p.berry = a.berry;`
      console.log("HI");
        }

        const result: unknown[] = db.query(query).all();

        // Convert to CSV
        const head = Object.keys(result[0] as object);

        const csvContent = [
            head.join(','),
            //@ts-ignore
            ...result.map(row => head.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        // Create a Blob with the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // Create headers for the response
        const headers = new Headers({
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${expo}-${new Date().toISOString()}.csv"`
        });

        // Return the CSV file as a downloadable response
        return new Response(blob, {
            status: 200,
            headers: headers
        });

    } catch (e: any) {
        return err("Invalid SQL", e.message);
    }
};
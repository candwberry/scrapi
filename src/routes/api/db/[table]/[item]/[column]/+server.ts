import type { RequestHandler } from "@sveltejs/kit";
import type { Table } from "../../../sql";
import { TABLES } from "../../../sql";
import { err, ERR_INVALID_TABLE, db, ok } from "../../../db";

const primaryKeyQuery = db.query(`SELECT name FROM pragma_table_info(?1) WHERE pk = 1`);

export const GET: RequestHandler = async ({ request, url, params }) => {
    console.log(url);
    console.log("WE ARE IN THE CALL");
    const table: string = params.table ?? "sqlite_master";
    const q: string = params.item ?? "";
    const column: string = params.column ?? "";
    let value: string = url.searchParams.get("value") ?? "";
    // so we update the field of this item with the new value

    if (value === "") return err("Value is required", "You must provide a value to update the item with");

    if (!(TABLES).includes(table as Table))
        return err(ERR_INVALID_TABLE, `Valid tables are: ${TABLES.join(", ")}`);

    value = decodeURIComponent(value);
    value = JSON.stringify({
        "asin": value,
        "lastUpdated": Date.now(),
        "validated": true,
        "others": []
    });

    try {
        const primaryKey = primaryKeyQuery.all(table)[0].name;
        if (primaryKey)
            db.query(`UPDATE ${table} SET ${column} = '${value}' WHERE ${primaryKey} = '${q}';`).all();
        else return err("No primary key", `Table ${table} has no primary key`);
    } catch (e: any) {
        return err("Invalid SQL", e.message);
    }

    return ok("Updated");
}
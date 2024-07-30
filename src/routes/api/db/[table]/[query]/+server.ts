import type { RequestHandler } from "@sveltejs/kit";
import type { Table } from "../../sql";
import { TABLES } from "../../sql";
import { err, ERR_INVALID_TABLE, db, ok } from "../../db";

const primaryKeyQuery = db.query(`SELECT name FROM pragma_table_info(?1) WHERE pk = 1`);

export const GET: RequestHandler = async ({ request, url, params }) => {
    const table: string = params.table ?? "sqlite_master";
    const q: string = params.query ?? "";

    if (!(TABLES).includes(table as Table))
        return err(ERR_INVALID_TABLE, `Valid tables are: ${TABLES.join(", ")}`);

try {
    const primaryKey = primaryKeyQuery.all(table)[0].name;
    console.log(primaryKey);
    console.log(q);
    console.log(table);

    const result = db.query(`SELECT * FROM ${table} WHERE LOWER(${primaryKey}) LIKE '%${q.toLowerCase()}%';`).all();
    return ok(result);
    } catch (e: any) {
        return err("Invalid SQL", e.message);
    };
}
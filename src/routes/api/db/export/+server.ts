import type { RequestHandler } from "@sveltejs/kit";
import { ok } from "$lib/database";

export const GET: RequestHandler = async ({ request, url, fetch }) => {
  const exportType = url.searchParams.get("type");

  const resp = await fetch(`/api/db/${exportType}`);
  const result = await resp.json();

  if (result === undefined) {
    return ok({ error: "An error occurred" });
  } else if (result.length === 0) {
    return ok({ error: "No data found" });
  }

  // Convert to CSV.
  const head = Object.keys(result[0] as Object);

  const csv = [
    head.join(","),
    ...result.map((row) => head.map((key) => row[key]).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const headers = new Headers({
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename=${exportType}-${new Date().toISOString()}.csv`,
  });

  return new Response(blob, { status: 200, headers });
};

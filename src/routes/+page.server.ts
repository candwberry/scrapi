import type { Load } from "@sveltejs/kit";

interface Details {
  status: boolean;
  total: number;
  processed: number;
  logs: string[];
  limit: number;
  remaining: number;
  estimatedTimes: string;
}

export const load: Load = async ({ fetch }) => {
  const names: string[] = ["ebay", "amazon"];
  const response: Record<string, Details> = {};
  
  for (let i = 0; i < names.length; i++) {
    try {
      const resp: Response = await fetch(`/api/${names[i]}?batch=check`);
      console.log("Response:", resp, names[i]);
      const details: Details = (await resp.json())["isBatchProcessing"];
      response[names[i]] = details;
    } catch (error: any) {
      console.error("Error fetching batch status:", error);
    }
  }


  return {
    props: {
      response,
    },
  };
};

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://majestic-gnat-826.convex.cloud";

export const convexClient = new ConvexHttpClient(convexUrl);
export { api };

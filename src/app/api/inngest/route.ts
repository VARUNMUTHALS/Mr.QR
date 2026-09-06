import { serve } from "inngest/next";
import { inngest } from "@/../inngest/client";
import { processScan } from "@/../inngest/functions/processScan";
import { sendWelcomeEmail } from "@/../inngest/functions/sendWelcomeEmail";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processScan, sendWelcomeEmail],
});

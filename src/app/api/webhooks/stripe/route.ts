import { NextRequest, NextResponse } from "next/server";
import { constructStripeEvent } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  let event;
  try {
    event = constructStripeEvent(body, sig);
  } catch (err: any) {
    console.error("[Stripe Webhook Error]", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const orgId = session.metadata?.organizationId;
      console.log(`[Stripe Webhook] Checkout completed for org: ${orgId}`);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      console.log(`[Stripe Webhook] Subscription update: ${subscription.id}`);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

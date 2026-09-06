import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventType = payload.type;

    console.log(`[Clerk Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } = payload.data;
        const email = email_addresses?.[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(" ");
        console.log(`[Clerk Sync] User: ${id} (${email}) - ${name}`);
        break;
      }
      case "organization.created":
      case "organization.updated": {
        const { id, name, slug } = payload.data;
        console.log(`[Clerk Sync] Org: ${id} (${slug}) - ${name}`);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Clerk Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

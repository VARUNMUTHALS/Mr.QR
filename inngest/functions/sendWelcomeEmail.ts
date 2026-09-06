import { inngest } from "../client";
import { sendTransactionalEmail } from "@/lib/email/resend";

export const sendWelcomeEmail = (inngest as any).createFunction(
  { id: "send-welcome-email", retries: 2 },
  { event: "organization/created" },
  async ({ event, step }: any) => {
    const { email, organizationName } = event.data;

    await step.run("send-email-via-resend", async () => {
      await sendTransactionalEmail({
        to: email,
        subject: `Welcome to Mr.QR Studio — ${organizationName}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #FBF8F2; color: #1F2328; border: 1px solid #E6DFD3; border-radius: 8px;">
            <h1 style="font-size: 28px; margin-bottom: 16px;">Welcome to <span style="color: #C85A32;">Mr.QR</span></h1>
            <p style="font-size: 16px; line-height: 1.6; color: #4A4339;">
              Your dedicated workspace <strong>${organizationName}</strong> is ready. You can now generate dynamic QR codes that you can update anytime post-printing and monitor with sub-millisecond analytics.
            </p>
            <div style="margin-top: 24px;">
              <a href="https://mr-qr.dev" style="background: #1F2328; color: #FBF8F2; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">Open Studio →</a>
            </div>
          </div>
        `,
      });
    });

    return { sent: true };
  }
);

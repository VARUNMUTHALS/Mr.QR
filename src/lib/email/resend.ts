import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const from = params.from || "Mr.QR Studio <notifications@mr-qr.dev>";

  if (!resend) {
    console.log(
      `[Resend Dev Mock] Email to: ${params.to} | Subject: "${params.subject}"`
    );
    return { success: true, id: `mock-${Date.now()}` };
  }

  try {
    const data = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { success: true, id: data.data?.id };
  } catch (err: any) {
    console.error("[Resend Error]", err);
    return { success: false, error: err?.message || "Failed to send email" };
  }
}

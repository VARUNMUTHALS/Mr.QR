import { MutationCtx } from "../_generated/server";

export async function logActivity(
  ctx: MutationCtx,
  params: {
    organizationId: string;
    userId?: string;
    qrId?: string;
    action: string;
    metadata?: Record<string, unknown>;
  }
) {
  await ctx.db.insert("activityLogs", {
    organizationId: params.organizationId,
    userId: params.userId,
    qrId: params.qrId,
    action: params.action,
    metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    createdAt: Date.now(),
  });
}

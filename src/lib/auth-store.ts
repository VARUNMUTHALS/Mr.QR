import bcrypt from "bcryptjs";

export interface DevUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  organizationId: string;
  organizationName: string;
  role: string;
  createdAt: number;
}

// Global in-memory developer store across Next.js reloads
declare global {
  var __devUserStore: Map<string, DevUserRecord> | undefined;
}

const store = global.__devUserStore || new Map<string, DevUserRecord>();
if (process.env.NODE_ENV !== "production") {
  global.__devUserStore = store;
}

export async function findDevUser(email: string): Promise<DevUserRecord | null> {
  const clean = email.toLowerCase().trim();
  return store.get(clean) || null;
}

export async function registerDevUser(params: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<DevUserRecord> {
  const clean = params.email.toLowerCase().trim();
  const id = `usr_${Math.random().toString(36).slice(2, 10)}`;
  const orgId = `org_${Math.random().toString(36).slice(2, 10)}`;

  const record: DevUserRecord = {
    id,
    email: clean,
    name: params.name,
    passwordHash: params.passwordHash,
    organizationId: orgId,
    organizationName: `${params.name}'s Studio`,
    role: "OWNER",
    createdAt: Date.now(),
  };

  store.set(clean, record);
  return record;
}

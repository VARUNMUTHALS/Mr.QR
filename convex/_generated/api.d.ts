/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as analytics from "../analytics.js";
import type * as billing from "../billing.js";
import type * as destinations from "../destinations.js";
import type * as helpers_audit from "../helpers/audit.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as helpers_ownership from "../helpers/ownership.js";
import type * as helpers_validation from "../helpers/validation.js";
import type * as organizations from "../organizations.js";
import type * as qrCodes from "../qrCodes.js";
import type * as scans from "../scans.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  analytics: typeof analytics;
  billing: typeof billing;
  destinations: typeof destinations;
  "helpers/audit": typeof helpers_audit;
  "helpers/auth": typeof helpers_auth;
  "helpers/ownership": typeof helpers_ownership;
  "helpers/validation": typeof helpers_validation;
  organizations: typeof organizations;
  qrCodes: typeof qrCodes;
  scans: typeof scans;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

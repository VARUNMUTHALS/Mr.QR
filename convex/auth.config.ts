export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_DOMAIN || "https://clerk.mr-qr.dev",
      applicationID: "convex",
    },
  ],
};

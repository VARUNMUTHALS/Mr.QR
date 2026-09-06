"use client";

import * as React from "react";
import { SignIn, SignUp, useUser } from "@clerk/nextjs";
import { useNav, type ViewState } from "@/lib/nav";
import {
  BotanicalSprig,
  Eyebrow,
  EditorialHeading,
} from "@/components/studio/primitives";

export function SignInView({
  redirectTo,
}: {
  redirectTo?: ViewState;
}) {
  const go = useNav((s) => s.go);
  const { isSignedIn, isLoaded } = useUser();
  const [mode, setMode] = React.useState<"signup" | "signin">("signup");

  // As requested: Once signed up / signed in via Clerk, automatically redirect to main/destination
  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      if (redirectTo) {
        go(redirectTo);
      } else {
        go({ view: "create-dynamic" });
      }
    }
  }, [isLoaded, isSignedIn, redirectTo, go]);

  return (
    <div className="mx-auto max-w-[540px] px-5 py-12 sm:py-16">
      <div className="text-center mb-8">
        <BotanicalSprig className="mx-auto mb-3" />
        <Eyebrow>Account Access</Eyebrow>
        <EditorialHeading className="text-3xl mt-1">
          {mode === "signup" ? "Get Started with Mr.QR" : "Welcome Back"}
        </EditorialHeading>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Create dynamic QR codes with real-time redirects and analytics.
        </p>
      </div>

      <div className="flex justify-center">
        {mode === "signup" ? (
          <SignUp
            routing="hash"
            signInUrl="#signin"
            fallbackRedirectUrl="/"
          />
        ) : (
          <SignIn
            routing="hash"
            signUpUrl="#signup"
            fallbackRedirectUrl="/"
          />
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] underline underline-offset-4 cursor-pointer"
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}

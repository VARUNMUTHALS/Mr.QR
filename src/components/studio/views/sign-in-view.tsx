"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useNav, type ViewState } from "@/lib/nav";
import {
  Eyebrow,
  EditorialHeading,
  InkButton,
  PaperSurface,
  SectionRule,
  BotanicalSprig,
} from "@/components/studio/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, Mail, Lock, User, CheckCircle2 } from "lucide-react";

export function SignInView({
  redirectTo,
}: {
  redirectTo?: ViewState;
}) {
  const go = useNav((s) => s.go);
  const home = useNav((s) => s.home);
  const { toast } = useToast();
  const [mode, setMode] = React.useState<"signin" | "register">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast({
        title: "Missing details",
        description: "Please enter an email and password to continue.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "register" && cleanPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    if (mode === "register") {
      try {
        const regRes = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPassword,
            name: name.trim() || undefined,
          }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          setLoading(false);
          toast({
            title: "Registration failed",
            description: regData?.error || "Could not complete registration.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Studio registered",
          description: "Signing in with your new credentials…",
        });
      } catch {
        setLoading(false);
        toast({
          title: "Network error",
          description: "Could not reach registration server.",
          variant: "destructive",
        });
        return;
      }
    }

    // Explicit credential sign in
    const res = await signIn("credentials", {
      email: cleanEmail,
      password: cleanPassword,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      toast({
        title: "Couldn't sign in",
        description:
          mode === "signin"
            ? "Invalid email or password. Need an account? Switch to 'Create Studio'."
            : "Registration succeeded but automatic sign in failed. Please sign in manually.",
        variant: "destructive",
      });
      if (mode === "register") setMode("signin");
      return;
    }

    toast({
      title: "Welcome to the studio",
      description: "You're securely signed in.",
    });

    if (redirectTo) go(redirectTo);
    else go({ view: "dashboard" });
  };

  return (
    <div className="mx-auto max-w-[1320px] px-5 sm:px-8 pb-24">
      <div className="pt-10 sm:pt-16">
        <button
          onClick={home}
          className="font-sans text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          ← Studio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-10">
        {/* Left: editorial intro */}
        <div className="lg:col-span-7">
          <Eyebrow ink className="mb-6 block">
            Studio · {mode === "signin" ? "Sign in" : "Create Account"}
          </Eyebrow>
          <EditorialHeading as="h1" className="text-[clamp(2.25rem,6vw,4rem)] leading-[0.98]">
            Open the
            <br />
            <span className="italic text-[var(--terracotta)]">scan book.</span>
          </EditorialHeading>
          <p className="mt-6 font-body text-[1.0625rem] leading-[1.65] text-[var(--ink-2)] max-w-lg">
            Dynamic QR codes are secured with organization-scoped authorization.
            Sign in to modify destinations and read your authentic scan telemetry.
          </p>

          <div className="mt-10 hidden lg:block max-w-md">
            <BotanicalSprig variant="center" className="h-28 w-full opacity-70" />
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-5">
          <PaperSurface className="p-7 sm:p-9">
            {/* Mode switch tabs */}
            <div className="flex border-b border-[var(--rule-strong)] mb-6">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`pb-3 font-sans text-xs tracking-wider uppercase transition-colors mr-6 ${
                  mode === "signin"
                    ? "border-b-2 border-[var(--ink)] font-semibold text-[var(--ink)] -mb-px"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`pb-3 font-sans text-xs tracking-wider uppercase transition-colors ${
                  mode === "register"
                    ? "border-b-2 border-[var(--botanical)] font-semibold text-[var(--botanical)] -mb-px"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                Create Studio
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-sans text-[0.8125rem] text-[var(--ink)]">
                    Your Name or Studio Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-muted)]" />
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="pl-9 h-11 bg-[var(--paper-3)] border-[var(--rule-strong)] focus-visible:border-[var(--ink)] font-body"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-sans text-[0.8125rem] text-[var(--ink)]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-muted)]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="pl-9 h-11 bg-[var(--paper-3)] border-[var(--rule-strong)] focus-visible:border-[var(--ink)] font-body"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-sans text-[0.8125rem] text-[var(--ink)]">
                    Password
                  </Label>
                  {mode === "register" && (
                    <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)]">
                      Minimum 8 characters
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-muted)]" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 h-11 bg-[var(--paper-3)] border-[var(--rule-strong)] focus-visible:border-[var(--ink)] font-body"
                  />
                </div>
              </div>

              <InkButton
                type="submit"
                size="lg"
                className="w-full"
                variant={mode === "register" ? "botanical" : "ink"}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />{" "}
                    {mode === "register" ? "Creating Studio…" : "Opening…"}
                  </>
                ) : mode === "register" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Create Studio Account
                  </>
                ) : (
                  <>
                    Enter the studio <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </InkButton>
            </form>

            <div className="mt-6">
              <SectionRule />
            </div>

            <p className="mt-4 text-center font-sans text-xs text-[var(--ink-muted)]">
              {mode === "signin" ? (
                <>
                  Need a workspace?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="font-semibold text-[var(--botanical)] hover:underline"
                  >
                    Create a studio account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="font-semibold text-[var(--ink)] hover:underline"
                  >
                    Sign in to your studio
                  </button>
                </>
              )}
            </p>
          </PaperSurface>
        </div>
      </div>
    </div>
  );
}

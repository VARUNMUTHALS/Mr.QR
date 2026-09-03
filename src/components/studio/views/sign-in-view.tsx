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
import { ArrowRight, Loader2, Mail, Lock, Sparkles } from "lucide-react";

export function SignInView({
  redirectTo,
}: {
  redirectTo?: ViewState;
}) {
  const go = useNav((s) => s.go);
  const home = useNav((s) => s.home);
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing details",
        description: "Enter an email and a password to continue.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast({
        title: "Couldn't sign in",
        description:
          "If you've used this email before, check your password.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Welcome to the studio",
      description: "You're signed in.",
    });
    if (redirectTo) go(redirectTo);
    else go({ view: "dashboard" });
  };

  const fillDemo = () => {
    setEmail("studio@qr.studio");
    setPassword("studio");
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
            Studio · Sign in
          </Eyebrow>
          <EditorialHeading as="h1" className="text-[clamp(2.25rem,6vw,4rem)] leading-[0.98]">
            Open the
            <br />
            <span className="italic text-[var(--terracotta)]">scan book.</span>
          </EditorialHeading>
          <p className="mt-6 font-body text-[1.0625rem] leading-[1.65] text-[var(--ink-2)] max-w-lg">
            Dynamic QR codes live behind a sign-in so you can edit
            destinations and read their scan stories. Sign in to continue —
            or create a studio instantly by entering any email and password.
          </p>

          <div className="mt-10 hidden lg:block max-w-md">
            <BotanicalSprig variant="center" className="h-28 w-full opacity-70" />
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-5">
          <PaperSurface className="p-7 sm:p-9">
            <Eyebrow className="mb-5 block">Continue</Eyebrow>
            <form onSubmit={onSubmit} className="space-y-5">
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
                <Label htmlFor="password" className="font-sans text-[0.8125rem] text-[var(--ink)]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-muted)]" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="pl-9 h-11 bg-[var(--paper-3)] border-[var(--rule-strong)] focus-visible:border-[var(--ink)] font-body"
                  />
                </div>
              </div>
              <InkButton type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Opening…
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

            <button
              onClick={fillDemo}
              className="mt-5 w-full flex items-center justify-center gap-2 h-10 border border-dashed border-[var(--rule-strong)] rounded-[2px] text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition-colors font-sans text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--botanical)]" />
              Fill demo studio credentials
            </button>
            <p className="mt-3 text-center font-sans text-[0.6875rem] text-[var(--ink-muted)]">
              New here? Just enter any email and password to create your studio.
            </p>
          </PaperSurface>
        </div>
      </div>
    </div>
  );
}

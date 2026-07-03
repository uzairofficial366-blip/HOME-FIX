import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { signup, login } from "@/lib/auth.functions";
import { Container } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Hammer, User2, Wrench } from "lucide-react";

const SearchSchema = z.object({ mode: z.enum(["login", "signup"]).catch("login") });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — HomeFixr" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const nav = useNavigate();
  const qc = useQueryClient();
  const doSignup = useServerFn(signup);
  const doLogin = useServerFn(login);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "homeowner" as "homeowner" | "provider",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await doSignup({
          data: {
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            phone: form.phone || undefined,
          },
        });
        toast.success("Account created");
      } else {
        await doLogin({ data: { email: form.email, password: form.password } });
        toast.success("Welcome back");
      }
      await qc.invalidateQueries({ queryKey: ["me"] });
      nav({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-soft min-h-[calc(100vh-4rem)] py-12">
      <Container className="max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-hero text-brand-foreground shadow-soft">
            <Hammer className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold">HomeFixr</span>
        </div>
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>{mode === "signup" ? "Create your account" : "Welcome back"}</CardTitle>
            <CardDescription>
              {mode === "signup"
                ? "Homeowners post jobs, professionals bid on them."
                : "Sign in to your HomeFixr account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <Label className="mb-2 block">I want to</Label>
                    <RadioGroup
                      value={form.role}
                      onValueChange={(v) =>
                        setForm({ ...form, role: v as "homeowner" | "provider" })
                      }
                      className="grid grid-cols-2 gap-3"
                    >
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft">
                        <RadioGroupItem value="homeowner" />
                        <User2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Hire pros</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft">
                        <RadioGroupItem value="provider" />
                        <Wrench className="h-4 w-4" />
                        <span className="text-sm font-medium">Offer services</span>
                      </label>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {mode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="font-medium text-brand hover:underline"
                      onClick={() => nav({ to: "/auth", search: { mode: "login" } })}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    New to HomeFixr?{" "}
                    <button
                      type="button"
                      className="font-medium text-brand hover:underline"
                      onClick={() => nav({ to: "/auth", search: { mode: "signup" } })}
                    >
                      Create an account
                    </button>
                  </>
                )}
              </p>
            </form>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}

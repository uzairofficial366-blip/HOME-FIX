import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { meQueryOptions } from "@/components/nav";
import { listPendingVerifications, adminVerifyProvider } from "@/lib/provider.functions";
import { Container, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — HomeFixr" }] }),
  component: AdminPage,
});

type VerificationDocument = {
  id: number;
  document_type: string;
  original_name: string;
  file_url: string;
};

type PendingVerification = {
  user_id: number;
  name: string;
  email: string;
  verification_status: string;
  verification_notes: string;
  submitted_at?: string;
  documents?: VerificationDocument[];
};

function AdminPage() {
  const userQuery = useQuery(meQueryOptions());
  const qc = useQueryClient();
  const { data: providers = [], isLoading } = useQuery<PendingVerification[]>({
    queryKey: ["pendingVerifications"],
    queryFn: () => listPendingVerifications(),
  });
  const doVerify = useServerFn(adminVerifyProvider);

  if (userQuery.data && userQuery.data.role !== "admin") return <Navigate to="/dashboard" />;

  return (
    <Container>
      <PageHeader
        title="Admin — Verification Queue"
        subtitle="Review and approve or reject provider identity submissions."
        action={<StatusBadge status="pending" />}
      />

      {isLoading ? (
        <p className="my-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : providers.length === 0 ? (
        <div className="my-10 rounded-xl border border-dashed border-border p-12 text-center">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-success" />
          <p className="text-lg font-semibold">All clear</p>
          <p className="text-sm text-muted-foreground">No pending verifications.</p>
        </div>
      ) : (
        <div className="my-6 grid gap-4">
          {providers.map((p) => (
            <VerificationCard
              key={p.user_id}
              provider={p}
              onDecision={async (decision, notes) => {
                try {
                  await doVerify({ data: { providerId: p.user_id, decision, notes } });
                  toast.success(`Provider ${decision}`);
                  qc.invalidateQueries({ queryKey: ["pendingVerifications"] });
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            />
          ))}
        </div>
      )}
    </Container>
  );
}

function VerificationCard({
  provider: p,
  onDecision,
}: {
  provider: PendingVerification;
  onDecision: (decision: "verified" | "rejected", notes?: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = async (decision: "verified" | "rejected") => {
    if (decision === "rejected" && !notes.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    setBusy(true);
    await onDecision(decision, notes || undefined);
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{p.name}</span>
          <StatusBadge status={p.verification_status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Email:</span> {p.email}
          </div>
          <div>
            <span className="text-muted-foreground">Provider ID:</span> {p.user_id}
          </div>
          <div>
            <span className="text-muted-foreground">Submitted:</span>{" "}
            {p.submitted_at ? new Date(p.submitted_at).toLocaleString() : "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Notes submitted:</span>{" "}
            {p.verification_notes || "—"}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Uploaded documents</p>
          {(p.documents ?? []).length > 0 ? (
            <div className="space-y-3">
              {(p.documents ?? []).map((doc) => (
                <div key={doc.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{doc.document_type}</span>
                    <span className="text-muted-foreground">— {doc.original_name}</span>
                  </div>
                  {/* Inline preview for images stored as data URLs */}
                  {doc.file_url.startsWith("data:image") ? (
                    <img
                      src={doc.file_url}
                      alt={doc.document_type}
                      className="mt-2 max-h-48 rounded border border-border object-contain"
                    />
                  ) : doc.file_url.startsWith("data:application/pdf") ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF document (cannot preview inline)
                    </p>
                  ) : (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-brand hover:underline"
                    >
                      <Eye className="h-3 w-3" /> View document
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          )}
        </div>

        <div>
          <Label className="text-xs">Rejection reason (required if rejecting)</Label>
          <Textarea
            rows={2}
            placeholder="e.g. Document is blurry or expired."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button
            disabled={busy}
            onClick={() => handle("verified")}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {busy ? "…" : "Approve"}
          </Button>
          <Button disabled={busy} variant="destructive" onClick={() => handle("rejected")}>
            {busy ? "…" : "Reject"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

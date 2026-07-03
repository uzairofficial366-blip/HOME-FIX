import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { me, logout } from "@/lib/auth.functions";
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import homefixrLogo from "../../public/Home Fixr Icon-128x128.jpg";
import {
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Search,
  UserCircle2,
  Bell,
  BriefcaseBusiness,
} from "lucide-react";

type Notification = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function meQueryOptions() {
  return { queryKey: ["me"], queryFn: () => me(), staleTime: 30_000 };
}

export function Nav() {
  const { data: user } = useQuery(meQueryOptions());
  const doLogout = useServerFn(logout);
  const nav = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  const handleLogout = async () => {
    await doLogout();
    qc.clear();
    await router.invalidate();
    nav({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-hero text-brand-foreground shadow-soft">
            <img src={homefixrLogo} alt="HomeFixr Logo" className="h-full w-full object-contain" />
          </span>
          <span className="text-lg tracking-tight">
            <span className="text-[#1e3a5f]">Home</span>
            <span className="text-[#f97316]">Fixr</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {user && (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              {user.role === "homeowner" && (
                <Link to="/jobs/new">
                  <Button variant="ghost" size="sm">
                    <PlusCircle className="h-4 w-4" />
                    Post a job
                  </Button>
                </Link>
              )}
              {user.role === "provider" && (
                <>
                  <Link to="/browse">
                    <Button variant="ghost" size="sm">
                      <Search className="h-4 w-4" />
                      Browse jobs
                    </Button>
                  </Link>
                  <Link to="/jobs/applied">
                    <Button variant="ghost" size="sm">
                      <BriefcaseBusiness className="h-4 w-4" />
                      Jobs Applied
                    </Button>
                  </Link>
                  <Link to="/provider">
                    <Button variant="ghost" size="sm">
                      <UserCircle2 className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                </>
              )}
              {user.role === "admin" && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {(user.role === "provider" || user.role === "homeowner") && <NotificationBell />}
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name} · <span className="capitalize">{user.role}</span>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "login" }}>
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: count = 0, refetch: refetchCount } = useQuery({
    queryKey: ["notifCount"],
    queryFn: () => unreadCount(),
    refetchInterval: 15_000,
  });
  const { data: notifications = [], refetch: refetchList } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    enabled: open,
    staleTime: 0,
  });

  const doMarkRead = useServerFn(markRead);
  const doMarkAll = useServerFn(markAllRead);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (id: number) => {
    await doMarkRead({ data: { id } });
    qc.invalidateQueries({ queryKey: ["notifCount"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleMarkAll = async () => {
    await doMarkAll();
    qc.invalidateQueries({ queryKey: ["notifCount"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            refetchCount();
            refetchList();
          }
        }}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-background shadow-elevated">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {count > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-brand hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {(notifications as Notification[]).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n: Notification) => (
                <div
                  key={n.id}
                  className={`border-b border-border/50 px-4 py-3 last:border-0 ${!n.is_read ? "bg-brand-soft/30" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="mt-0.5 shrink-0 text-[10px] text-brand hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => {
                        handleMarkRead(n.id);
                        setOpen(false);
                      }}
                      className="mt-1 text-[10px] font-medium text-brand hover:underline"
                    >
                      View →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

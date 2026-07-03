import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { meQueryOptions } from "@/components/nav";
import {
  getDashboardStats,
  getRecentActivity,
} from "@/lib/admin.functions";
import { Container, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — HomeFixr" }] }),
  component: AdminDashboard,
});

type StatCard = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  link?: string;
};

function AdminDashboard() {
  const userQuery = useQuery(meQueryOptions());
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => getDashboardStats(),
  });
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["recentActivity"],
    queryFn: () => getRecentActivity(),
  });

  if (userQuery.data && userQuery.data.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  const statCards: StatCard[] = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-500",
      link: "/admin/users",
    },
    {
      title: "Total Providers",
      value: stats?.totalProviders ?? 0,
      icon: Briefcase,
      color: "text-purple-500",
      link: "/admin/providers",
    },
    {
      title: "Pending Verifications",
      value: stats?.pendingVerifications ?? 0,
      icon: Clock,
      color: "text-yellow-500",
      link: "/admin/verifications",
    },
    {
      title: "Active Jobs",
      value: stats?.activeJobs ?? 0,
      icon: Activity,
      color: "text-green-500",
      link: "/admin/jobs",
    },
    {
      title: "Active Bids",
      value: stats?.activeBids ?? 0,
      icon: TrendingUp,
      color: "text-indigo-500",
      link: "/admin/bids",
    },
    {
      title: "Completed Jobs",
      value: stats?.completedJobs ?? 0,
      icon: CheckCircle,
      color: "text-emerald-500",
      link: "/admin/jobs",
    },
    {
      title: "Escrow Balance",
      value: `$${(stats?.escrowBalance ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-orange-500",
      link: "/admin/payments",
    },
    {
      title: "Revenue",
      value: `$${(stats?.revenue ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-green-600",
      link: "/admin/payments",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_signup":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "job_created":
        return <Briefcase className="h-4 w-4 text-green-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "user_signup":
        return "New user signup";
      case "job_created":
        return "Job created";
      case "payment":
        return "Payment received";
      default:
        return type;
    }
  };

  return (
    <Container>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to HomeFixr Admin Panel"
        action={
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
          </div>
        }
      />

      {statsLoading ? (
        <div className="my-10 text-center">
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card
                key={stat.title}
                className="border-border/50 bg-background/50 backdrop-blur transition-all hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold tracking-tight">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`rounded-lg bg-muted/50 p-3 ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  {stat.link && (
                    <Link to={stat.link} className="mt-4 block">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between"
                      >
                        View details
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="my-6 grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity) => (
                      <div
                        key={`${activity.type}-${activity.id}`}
                        className="flex items-start gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                      >
                        <div className="mt-0.5 rounded-lg bg-muted/50 p-2">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {getActivityLabel(activity.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.name} · {activity.email}
                          </p>
                          {activity.details && (
                            <p className="text-xs text-muted-foreground">
                              {activity.type === "payment"
                                ? `Amount: $${activity.details}`
                                : activity.details}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin/users" className="block">
                  <Card className="border-border/50 transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-500/10 p-3">
                          <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-semibold">Manage Users</p>
                          <p className="text-xs text-muted-foreground">
                            View, edit, suspend, or delete users
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/admin/providers" className="block">
                  <Card className="border-border/50 transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-500/10 p-3">
                          <Briefcase className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-semibold">Manage Providers</p>
                          <p className="text-xs text-muted-foreground">
                            Approve, verify, and manage providers
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/admin/jobs" className="block">
                  <Card className="border-border/50 transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-500/10 p-3">
                          <Activity className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold">Manage Jobs</p>
                          <p className="text-xs text-muted-foreground">
                            View, cancel, and assign jobs
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/admin/settings" className="block">
                  <Card className="border-border/50 transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-orange-500/10 p-3">
                          <TrendingUp className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-semibold">Settings</p>
                          <p className="text-xs text-muted-foreground">
                            Configure site settings and preferences
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </Container>
  );
}
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureSchema, getSql } from "./db.server";
import { hashPassword, verifyPassword, createSession, getSession } from "./auth.server";

const AdminLoginInput = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AdminLoginInput.parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT id, email, role, name, password_hash 
      FROM users 
      WHERE email = ${data.email.toLowerCase()} AND role = 'admin'
    `;
    const u = rows[0] as
      | {
          id: number;
          email: string;
          role: "admin";
          name: string;
          password_hash: string;
        }
      | undefined;
    
    if (!u) throw new Error("Invalid admin credentials");
    
    const ok = await verifyPassword(data.password, u.password_hash);
    if (!ok) throw new Error("Invalid admin credentials");
    
    await createSession({ uid: u.id, role: u.role, email: u.email });
    return { id: u.id, email: u.email, role: u.role, name: u.name };
  });

const CreateAdminInput = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120),
});

export const createAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateAdminInput.parse(d))
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      throw new Error("Unauthorized: Only admins can create other admins");
    }

    await ensureSchema();
    const sql = getSql();
    
    const existing = await sql`SELECT id FROM users WHERE email = ${data.email.toLowerCase()}`;
    if (existing.length > 0) {
      throw new Error("Email already exists");
    }

    const hash = await hashPassword(data.password);
    const rows = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${data.email.toLowerCase()}, ${hash}, ${data.name}, 'admin')
      RETURNING id, email, role, name
    `;
    
    const u = rows[0] as { id: number; email: string; role: "admin"; name: string };
    return u;
  });

export const getAdmins = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, email, name, created_at 
    FROM users 
    WHERE role = 'admin'
    ORDER BY created_at DESC
  `;
  
  return rows as { id: number; email: string; name: string; created_at: string }[];
});

export const deleteAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.number() }))
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      throw new Error("Unauthorized");
    }

    if (data.adminId === session.uid) {
      throw new Error("Cannot delete your own admin account");
    }

    await ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM users WHERE id = ${data.adminId} AND role = 'admin'`;
    return { success: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await ensureSchema();
  const sql = getSql();

  const [
    totalUsers,
    totalProviders,
    pendingVerifications,
    activeJobs,
    activeBids,
    completedJobs,
    escrowBalance,
    revenue,
  ] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM users WHERE role = 'homeowner'`,
    sql`SELECT COUNT(*) as count FROM users WHERE role = 'provider'`,
    sql`SELECT COUNT(*) as count FROM provider_profiles WHERE verification_status = 'pending'`,
    sql`SELECT COUNT(*) as count FROM jobs WHERE status IN ('open', 'in_progress')`,
    sql`SELECT COUNT(*) as count FROM bids WHERE status = 'pending'`,
    sql`SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'`,
    sql`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'held'`,
    sql`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'released'`,
  ]);

  return {
    totalUsers: Number(totalUsers[0].count),
    totalProviders: Number(totalProviders[0].count),
    pendingVerifications: Number(pendingVerifications[0].count),
    activeJobs: Number(activeJobs[0].count),
    activeBids: Number(activeBids[0].count),
    completedJobs: Number(completedJobs[0].count),
    escrowBalance: Number(escrowBalance[0].total),
    revenue: Number(revenue[0].total),
  };
});

export const getRecentActivity = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await ensureSchema();
  const sql = getSql();

  const activities = await sql`
    SELECT 
      'user_signup' as type,
      id,
      name,
      email,
      created_at,
      NULL::text as details
    FROM users
    WHERE role IN ('homeowner', 'provider')
    
    UNION ALL
    
    SELECT 
      'job_created' as type,
      j.id,
      u.name,
      u.email,
      j.created_at,
      j.title as details
    FROM jobs j
    JOIN users u ON j.homeowner_id = u.id
    
    UNION ALL
    
    SELECT 
      'payment' as type,
      p.id,
      u.name,
      u.email,
      p.created_at,
      p.amount::text as details
    FROM payments p
    JOIN jobs j ON p.job_id = j.id
    JOIN users u ON j.homeowner_id = u.id
    
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return activities as {
    type: string;
    id: number;
    name: string;
    email: string;
    created_at: string;
    details: string | null;
  }[];
});
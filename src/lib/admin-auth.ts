import "server-only";

import crypto from "node:crypto";
import path from "node:path";
import { cookies, headers } from "next/headers";
import { readJsonFile, writeJsonFile } from "./json-storage";

const adminsFile = path.join(process.cwd(), "cms", "admins.json");
const cookieName = "ibo_admin_session";
const secret = process.env.ADMIN_SESSION_SECRET ?? "ibo-local-admin-session-secret-change-me";

type AdminUser = {
  email: string;
  salt: string;
  hash: string;
  createdAt: string;
};

async function readAdmins() {
  return readJsonFile<{ admins: AdminUser[] }>(adminsFile);
}

async function writeAdmins(admins: AdminUser[]) {
  await writeJsonFile(adminsFile, { admins });
}

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function createSessionValue(email: string) {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = `${email}|${expires}`;
  return `${payload}|${sign(payload)}`;
}

function readSessionValue(value: string | undefined) {
  if (!value) return null;
  const [email, expiresRaw, signature] = value.split("|");
  const payload = `${email}|${expiresRaw}`;
  if (!email || !expiresRaw || !signature || sign(payload) !== signature) return null;
  if (Number(expiresRaw) < Date.now()) return null;
  return { email };
}

export async function verifyAdmin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const { admins } = await readAdmins();
  const admin = admins.find((item) => item.email.toLowerCase() === normalized);
  if (!admin) return null;

  const attempt = hashPassword(password, admin.salt);
  return safeEqual(attempt, admin.hash) ? admin.email : null;
}

export async function createAdmin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const { admins } = await readAdmins();
  if (admins.some((item) => item.email.toLowerCase() === normalized)) {
    throw new Error("Admin already exists");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  const admin = {
    email: normalized,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  await writeAdmins([...admins, admin]);
  return { email: admin.email, createdAt: admin.createdAt };
}

export async function listAdmins() {
  const { admins } = await readAdmins();
  return admins.map(({ email, createdAt }) => ({ email, createdAt }));
}

export async function deleteAdmin(email: string) {
  const normalized = email.trim().toLowerCase();
  const { admins } = await readAdmins();
  if (admins.length <= 1) throw new Error("Cannot delete the last admin");
  await writeAdmins(admins.filter((item) => item.email.toLowerCase() !== normalized));
}

export async function setAdminSession(email: string) {
  const value = createSessionValue(email);
  const [, expiresRaw] = value.split("|");
  const jar = await cookies();
  jar.set(cookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Number(expiresRaw)),
  });
  return value;
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(cookieName, "", { path: "/", expires: new Date(0) });
}

export async function getAdminSession() {
  const jar = await cookies();
  const cookieSession = readSessionValue(jar.get(cookieName)?.value);
  if (cookieSession) return cookieSession;

  const authorization = (await headers()).get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  return readSessionValue(token);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

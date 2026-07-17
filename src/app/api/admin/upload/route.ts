import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin-auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeName(name: string) {
  const ext = path.extname(name).toLowerCase() || ".png";
  const base = path.basename(name, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base || "image"}-${Date.now().toString(36)}${ext}`;
}

function blobUploadsEnabled() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }

    const filename = safeName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    if (blobUploadsEnabled()) {
      const blob = await put(`uploads/${filename}`, buffer, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: file.type,
      });

      return NextResponse.json({ ok: true, url: blob.url });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}





import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";
import { getItems, saveItems } from "@/lib/data";
import { getCookieName, verifySessionToken } from "@/lib/auth";
import { normalizeCategory } from "@/lib/categories";

export const runtime = "nodejs";

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-");
}

async function saveUploadedFile(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return "";

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}-${sanitizeFileName(file.name || "image.jpg")}`;
  const outputPath = path.join(uploadDir, fileName);
  const data = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(outputPath, data);
  return `/uploads/${fileName}`;
}

function toPrice(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isAuthed(request) {
  const session = request.cookies.get(getCookieName())?.value;
  return !!session && verifySessionToken(session);
}

export async function PUT(request, { params }) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const title = (formData.get("title") || "").toString().trim();
  const link = (formData.get("link") || "").toString().trim();
  const description = (formData.get("description") || "").toString().trim();
  const category = normalizeCategory((formData.get("category") || "").toString().trim());
  const price = toPrice(formData.get("price"));
  const existingMainImage = (formData.get("existingMainImage") || "").toString();
  const existingImagesRaw = (formData.get("existingImages") || "[]").toString();
  const existingQcImagesRaw = (formData.get("existingQcImages") || "[]").toString();
  const mainImageFile = formData.get("mainImage");
  const imagesFiles = formData.getAll("images");
  const qcImagesFiles = formData.getAll("qcImages");

  if (!title || !link || price === null || price < 0) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const items = await getItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let existingImages = [];
  let existingQcImages = [];
  try {
    existingImages = JSON.parse(existingImagesRaw);
    existingQcImages = JSON.parse(existingQcImagesRaw);
  } catch {
    return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
  }

  const uploadedMain = await saveUploadedFile(mainImageFile);
  const uploadedImages = (
    await Promise.all(imagesFiles.map((file) => saveUploadedFile(file)))
  ).filter(Boolean);
  const uploadedQcImages = (
    await Promise.all(qcImagesFiles.map((file) => saveUploadedFile(file)))
  ).filter(Boolean);

  const updatedItem = {
    ...items[index],
    title,
    price,
    link,
    category,
    description: description || "",
    mainImage: uploadedMain || existingMainImage || items[index].mainImage,
    images: uploadedImages.length > 0 ? uploadedImages : existingImages,
    qcImages: uploadedQcImages.length > 0 ? uploadedQcImages : existingQcImages,
  };

  items[index] = updatedItem;
  await saveItems(items);
  return NextResponse.json({ item: updatedItem });
}

export async function DELETE(request, { params }) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const items = await getItems();
  const nextItems = items.filter((item) => item.id !== id);

  if (nextItems.length === items.length) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await saveItems(nextItems);
  return NextResponse.json({ ok: true });
}

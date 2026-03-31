







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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const min = toPrice(searchParams.get("min"));
  const max = toPrice(searchParams.get("max"));
  const sort = searchParams.get("sort");
  const category = searchParams.get("category") || "";

  let items = await getItems();

  items = items.filter((item) => {
    const matchesQuery = !q || item.title.toLowerCase().includes(q);
    const minOk = min === null || Number(item.price) >= min;
    const maxOk = max === null || Number(item.price) <= max;
    const normalizedCategory = normalizeCategory(item.category);
    const categoryOk = !category || normalizedCategory === category;
    return matchesQuery && minOk && maxOk && categoryOk;
  });

  items = items.map((item) => ({
    ...item,
    category: normalizeCategory(item.category),
  }));

  if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") items.sort((a, b) => b.price - a.price);

  return NextResponse.json({ items });
}

export async function POST(request) {
  const session = request.cookies.get(getCookieName())?.value;
  if (!session || !verifySessionToken(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = (formData.get("title") || "").toString().trim();
  const link = (formData.get("link") || "").toString().trim();
  const description = (formData.get("description") || "").toString().trim();
  const category = normalizeCategory((formData.get("category") || "").toString().trim());
  const price = toPrice(formData.get("price"));
  const mainImageFile = formData.get("mainImage");
  const imagesFiles = formData.getAll("images");
  const qcImagesFiles = formData.getAll("qcImages");

  if (!title || !link || price === null || price < 0) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const mainImage = await saveUploadedFile(mainImageFile);
  if (!mainImage) {
    return NextResponse.json({ error: "Main image is required" }, { status: 400 });
  }

  const images = (
    await Promise.all(imagesFiles.map((file) => saveUploadedFile(file)))
  ).filter(Boolean);

  const qcImages = (
    await Promise.all(qcImagesFiles.map((file) => saveUploadedFile(file)))
  ).filter(Boolean);

  const items = await getItems();
  const newItem = {
    id: randomUUID(),
    title,
    price,
    mainImage,
    images,
    qcImages,
    link,
    category,
    description: description || "",
  };

  items.unshift(newItem);
  await saveItems(items);

  return NextResponse.json({ item: newItem }, { status: 201 });
}

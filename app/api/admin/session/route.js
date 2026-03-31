import { NextResponse } from "next/server";
import { getCookieName, verifySessionToken } from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get(getCookieName())?.value;
  return NextResponse.json({ authenticated: !!token && verifySessionToken(token) });
}

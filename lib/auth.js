



import crypto from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "change-me-secret";
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const COOKIE_NAME = "admin_session";

function signValue(value) {
  return crypto.createHmac("sha256", AUTH_SECRET).update(value).digest("hex");
}

export function createSessionToken(username) {
  const payload = `${username}:${Date.now()}`;
  const sig = signValue(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifySessionToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [username, timestamp, sig] = decoded.split(":");
    if (!username || !timestamp || !sig) return false;
    return signValue(`${username}:${timestamp}`) === sig;
  } catch {
    return false;
  }
}

export function getCookieName() {
  return COOKIE_NAME;
}

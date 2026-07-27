import { cookies } from "next/headers";

export const WORK_COOKIE = "digilova_work";

export function getWorkPassword() {
  return process.env.WORK_PASSWORD?.trim() || "preview";
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function workAccessToken() {
  const data = new TextEncoder().encode(`work:${getWorkPassword()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export async function isWorkUnlocked() {
  const jar = await cookies();
  const value = jar.get(WORK_COOKIE)?.value;
  if (!value) return false;
  return value === (await workAccessToken());
}

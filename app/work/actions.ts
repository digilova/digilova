"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  WORK_COOKIE,
  getWorkPassword,
  workAccessToken,
} from "@/lib/work-auth";

export type UnlockWorkState = {
  error?: string;
};

export async function unlockWork(
  _previous: UnlockWorkState,
  formData: FormData,
): Promise<UnlockWorkState> {
  const password = String(formData.get("password") ?? "");
  if (!password || password !== getWorkPassword()) {
    return { error: "Incorrect password" };
  }

  const jar = await cookies();
  jar.set(WORK_COOKIE, await workAccessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/work");
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, SESSION_MAX_AGE, checkPasscode, createSessionToken } from "@/lib/auth";

export async function login(formData: FormData) {
  const passcode = String(formData.get("passcode") || "");
  const next = String(formData.get("next") || "/");

  const ok = await checkPasscode(passcode);
  if (!ok) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createSessionToken();
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  redirect(next && next.startsWith("/") ? next : "/");
}

export async function logout() {
  cookies().delete(AUTH_COOKIE);
  redirect("/login");
}

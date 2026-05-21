import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Use your project's exact server-client path

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after successful sign-in process
  return NextResponse.redirect(new URL("/", request.url));
}

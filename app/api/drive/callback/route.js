// app/api/drive/callback/route.js
// Callback de OAuth 2.0 — intercambia code por tokens

import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.redirect(`${appUrl}?drive_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.json({ error: "No authorization code" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    // Redirect back to app with tokens stored in a secure cookie
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = NextResponse.redirect(`${appUrl}?drive_connected=true`);

    // Store tokens in HttpOnly cookie (secure in production)
    response.cookies.set("drive_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Drive callback error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}?drive_error=${encodeURIComponent(error.message)}`);
  }
}

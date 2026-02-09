// app/api/drive/auth/route.js
// Inicia el flujo OAuth 2.0 con Google Drive

import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Google Drive no está configurado. Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI en las variables de entorno." },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Drive auth error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/drive/status/route.js
// Verifica si el usuario está conectado a Google Drive

import { NextResponse } from "next/server";

export async function GET(request) {
  const tokensCookie = request.cookies.get("drive_tokens");
  const connected = !!tokensCookie?.value;

  const configured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  );

  return NextResponse.json({ connected, configured });
}

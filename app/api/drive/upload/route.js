// app/api/drive/upload/route.js
// Sube el documento .docx generado a Google Drive

import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(request) {
  try {
    // Get tokens from cookie
    const tokensCookie = request.cookies.get("drive_tokens");
    if (!tokensCookie?.value) {
      return NextResponse.json(
        { error: "No está conectado a Google Drive. Conecte su cuenta primero.", needsAuth: true },
        { status: 401 }
      );
    }

    const tokens = JSON.parse(tokensCookie.value);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(tokens);

    // Refresh token if expired
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        return NextResponse.json(
          { error: "Su sesión de Google Drive expiró. Reconecte su cuenta.", needsAuth: true },
          { status: 401 }
        );
      }
    }

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get file data and metadata from request
    const formData = await request.formData();
    const file = formData.get("file");
    const fileName = formData.get("fileName") || "Acta_SAS.docx";
    const folderId = formData.get("folderId"); // Optional: specific folder

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const fileMetadata = {
      name: fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const media = {
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      body: Readable.from(buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink, webContentLink",
    });

    return NextResponse.json({
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
    });
  } catch (error) {
    console.error("Drive upload error:", error);

    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        { error: "Permisos insuficientes. Reconecte Google Drive.", needsAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al subir a Google Drive: " + error.message },
      { status: 500 }
    );
  }
}

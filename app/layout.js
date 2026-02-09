// app/layout.js
import "./globals.css";

export const metadata = {
  title: "Generador de Actas S.A.S. — Due Legal",
  description: "Plataforma para generar actas de asamblea de accionistas de S.A.S. colombianas con inteligencia artificial (LucIA).",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

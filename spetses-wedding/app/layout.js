import { EB_Garamond, Open_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

const display = EB_Garamond({
  subsets: ["latin", "latin-ext", "greek"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Open_Sans({
  subsets: ["latin", "latin-ext", "greek"],
  variable: "--font-body",
});

export const metadata = {
  title: "Mariage à Spetses",
  description: "Site privé — mariage à Spetses",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

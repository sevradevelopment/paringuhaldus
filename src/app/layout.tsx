import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Päringuhaldus.ee – Kõik kliendipäringud ühes kohas",
  description:
    "Lihtne päringuhaldus Eesti ettevõtetele, kes soovivad hoida kliendipäringud, pakkumised ja järeltegevused korras.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="et"
      className={`${plusJakarta.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-[var(--ink)] antialiased">
        {children}
      </body>
    </html>
  );
}

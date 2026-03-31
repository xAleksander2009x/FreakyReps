import { Geist, Geist_Mono } from "next/font/google";




import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Freaky Reps",
  description: "Modern fashion product catalog with admin panel",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <div className="border-b border-zinc-800 bg-zinc-900/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-3 md:px-8">
            <Link href="/" className="text-lg font-semibold text-white">
              Freaky Reps
            </Link>
          </div>
        </div>
        <main>{children}</main>
      </body>
    </html>
  );
}

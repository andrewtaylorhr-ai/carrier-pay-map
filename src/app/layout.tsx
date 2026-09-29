import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { CarrierMapProvider } from "@/lib/carrier-map-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carrier Pay Map — Class A Recruiting",
  description:
    "CDL-A carrier pay comparison and recruiter strategy tool for Class A Recruiting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-row app-dark">
        {/* CarrierMapProvider lives here (not in page.tsx) so the Sidebar can
            also read carrier-map context — it renders the Recruiters panel
            inline below the nav links when on the Dashboard route. */}
        <CarrierMapProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">{children}</div>
        </CarrierMapProvider>
      </body>
    </html>
  );
}

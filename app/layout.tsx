import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Mobile-friendly viewport (沒設的話 iOS Safari 會把頁面當 980px 桌機渲染再 zoom out)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const notoTC = Noto_Sans_TC({
  variable: "--font-noto-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = "https://kidgo.life";
const SITE_NAME = "kidgo";
const TITLE = "kidgo — 全台親子行程，30 秒 AI 規劃";
const DESC =
  "全台 22 縣市親子景點 AI 規劃工具。輸入孩子年齡、預算、想要的氛圍，30 秒生出完整一日/多日行程，含景點與預估費用。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESC,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "kidgo - 全台親子行程 AI 規劃",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/og-image.png"],
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${notoTC.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-sans overflow-x-hidden">
        {children}
        {/* Google Analytics 4 (有設 NEXT_PUBLIC_GA_ID env 才載入) */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { send_page_view: true });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
